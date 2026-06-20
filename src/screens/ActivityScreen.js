// screens/ActivityScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// Убраны захардкоженные label — теперь через t('types.walk') и т.д.
const ACTIVITY_TYPES = [
  { value: 'walk', icon: 'walk' },
  { value: 'play', icon: 'american-football' },
  { value: 'exercise', icon: 'fitness' },
  { value: 'training', icon: 'school' },
  { value: 'other', icon: 'ellipsis-horizontal' },
];

export default function ActivityScreen() {
  const { t, i18n } = useTranslation('activity');

  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    week: { count: 0, duration: 0, distance: 0 },
    month: { count: 0, duration: 0, distance: 0 },
  });
  const [chartData, setChartData] = useState({ daily: [], types: [] });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [activityType, setActivityType] = useState('walk');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [activityDate, setActivityDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);


  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    if (selectedPetId) {
      fetchActivities();
    }
  }, [selectedPetId]);

  const fetchPets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user.id)
        .order('name');

      if (error) throw error;

      setPets(data || []);
      if (data && data.length > 0 && !selectedPetId) {
        setSelectedPetId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
      Alert.alert(t('common:error'), t('alerts.errorLoadPets'));
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('pet_id', selectedPetId)
        .order('activity_date', { ascending: false });

      if (error) throw error;

      setActivities(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      Alert.alert(t('common:error'), t('alerts.errorLoadActivities'));
    } finally {
      setLoading(false);
    }
  };

  // Порядок дней недели: 0=Sun,1=Mon,...,6=Sat
  const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  const getDayLabel = (date) => t(`days.${DAY_KEYS[date.getDay()]}`);

  const prepareChartData = (activitiesData) => {
    const now = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayData = activitiesData.filter((a) => {
        const aDate = new Date(a.activity_date);
        return aDate.toDateString() === date.toDateString();
      });

      last7Days.push({
        date,
        duration: dayData.reduce((sum, a) => sum + (a.duration || 0), 0),
        distance: dayData.reduce((sum, a) => sum + (a.distance || 0), 0),
        count: dayData.length,
      });
    }

    const typeStats = {};
    activitiesData.forEach((activity) => {
      const type = activity.activity_type || 'other';
      if (!typeStats[type]) typeStats[type] = { duration: 0, count: 0 };
      typeStats[type].duration += activity.duration || 0;
      typeStats[type].count += 1;
    });

    setChartData({
      daily: last7Days,
      types: Object.entries(typeStats).map(([name, s]) => ({
        name,
        duration: s.duration,
        count: s.count,
      })),
    });
  };

  const calculateStats = (activitiesData) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const calcTotals = (arr) => ({
      count: arr.length,
      duration: arr.reduce((sum, a) => sum + (a.duration || 0), 0),
      distance: arr.reduce((sum, a) => sum + (a.distance || 0), 0),
    });

    setStats({
      week: calcTotals(activitiesData.filter((a) => new Date(a.activity_date) >= weekAgo)),
      month: calcTotals(activitiesData.filter((a) => new Date(a.activity_date) >= monthAgo)),
    });

    prepareChartData(activitiesData);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  }, [selectedPetId]);

  const handleAddActivity = async () => {
    if (!duration || parseInt(duration) <= 0) {
      Alert.alert(t('common:error'), t('alerts.validationDuration'));
      return;
    }

    try {
      const { error } = await supabase.from('activities').insert([
        {
          pet_id: selectedPetId,
          activity_type: activityType,
          duration: parseInt(duration),
          distance: distance ? parseFloat(distance) : null,
          notes: notes || null,
          activity_date: activityDate.toISOString(),
        },
      ]);

      if (error) throw error;

      // Логирование активности баллов не начисляет — только проверяемые события.
      Alert.alert(t('common:ok'), t('alerts.successSimple'));

      setModalVisible(false);
      resetForm();
      fetchActivities();
    } catch (error) {
      console.error('Error adding activity:', error);
      Alert.alert(t('common:error'), t('alerts.errorAdd'));
    }
  };

  const handleDeleteActivity = (activityId) => {
    Alert.alert(
      t('alerts.deleteTitle'),
      t('alerts.deleteMessage'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('common:delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('activities')
                .delete()
                .eq('id', activityId);

              if (error) throw error;
              fetchActivities();
            } catch (error) {
              console.error('Error deleting activity:', error);
              Alert.alert(t('common:error'), t('alerts.errorDelete'));
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setActivityType('walk');
    setDuration('');
    setDistance('');
    setNotes('');
    setActivityDate(new Date());
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return t('dates.today');
    if (date.toDateString() === yesterday.toDateString()) return t('dates.yesterday');

    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getActivityIcon = (type) => {
    const activity = ACTIVITY_TYPES.find((a) => a.value === type);
    return activity ? activity.icon : 'help-circle';
  };

  const getActivityLabel = (type) => {
    // Безопасный fallback если ключ не найден
    return t(`types.${type}`, { defaultValue: type });
  };

  const renderStatCard = (titleKey, period) => {
    const data = stats[period];
    return (
      <View style={styles.statCard}>
        <Text style={styles.statTitle}>{t(`stats.${titleKey}`)}</Text>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={20} color="#6B46C1" />
            <Text style={styles.statValue}>{data.count}</Text>
            <Text style={styles.statLabel}>{t('stats.activities')}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color="#059669" />
            <Text style={styles.statValue}>{data.duration}</Text>
            <Text style={styles.statLabel}>{t('stats.minutes')}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="navigate-outline" size={20} color="#DC2626" />
            <Text style={styles.statValue}>{data.distance.toFixed(1)}</Text>
            <Text style={styles.statLabel}>{t('stats.km')}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={styles.activityTitleRow}>
          <Ionicons
            name={getActivityIcon(item.activity_type)}
            size={24}
            color="#6B46C1"
            style={styles.activityIcon}
          />
          <View style={styles.activityInfo}>
            <Text style={styles.activityType}>
              {getActivityLabel(item.activity_type)}
            </Text>
            <Text style={styles.activityDate}>{formatDate(item.activity_date)}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteActivity(item.id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.activityDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.duration} {t('stats.minutes')}</Text>
        </View>
        {item.distance && (
          <View style={styles.detailItem}>
            <Ionicons name="navigate-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.distance} {t('stats.km')}</Text>
          </View>
        )}
      </View>

      {item.notes && (
        <Text style={styles.activityNotes}>{item.notes}</Text>
      )}
    </View>
  );

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(107, 70, 193, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 70, 193, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#6B46C1' },
  };

  const lineChartData = {
    labels: chartData.daily.map((d) => getDayLabel(d.date)),
    datasets: [{
      data: chartData.daily.length > 0
        ? chartData.daily.map((d) => d.duration || 0.1)
        : [0, 0, 0, 0, 0, 0, 0],
    }],
  };

  const barChartData = {
    labels: chartData.daily.map((d) => getDayLabel(d.date)),
    datasets: [{
      data: chartData.daily.length > 0
        ? chartData.daily.map((d) => d.count || 0)
        : [0, 0, 0, 0, 0, 0, 0],
    }],
  };

  const pieData = chartData.types.slice(0, 5).map((type, index) => {
    const colors = ['#6B46C1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];
    return {
      name: getActivityLabel(type.name),
      duration: type.duration,
      color: colors[index],
      legendFontColor: '#374151',
      legendFontSize: 12,
    };
  });

  return (
    <View style={styles.container}>
      {/* Pet Selector */}
      <View style={styles.petSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {pets.map((pet) => (
            <TouchableOpacity
              key={pet.id}
              style={[
                styles.petButton,
                selectedPetId === pet.id && styles.petButtonActive,
              ]}
              onPress={() => setSelectedPetId(pet.id)}
            >
              <Text
                style={[
                  styles.petButtonText,
                  selectedPetId === pet.id && styles.petButtonTextActive,
                ]}
              >
                {pet.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          {renderStatCard('week', 'week')}
          {renderStatCard('month', 'month')}
        </View>

        {/* Charts */}
        {chartData.daily.length > 0 && (
          <>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t('charts.duration')}</Text>
              <LineChart
                data={lineChartData}
                width={width - 48}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withVerticalLines={false}
              />
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t('charts.count')}</Text>
              <BarChart
                data={barChartData}
                width={width - 48}
                height={200}
                chartConfig={chartConfig}
                style={styles.chart}
                withInnerLines={false}
                showValuesOnTopOfBars={true}
                fromZero={true}
              />
            </View>

            {pieData.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>{t('charts.types')}</Text>
                <PieChart
                  data={pieData}
                  width={width - 48}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="duration"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  style={styles.chart}
                />
              </View>
            )}
          </>
        )}

        {/* History */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{t('history.title')}</Text>
        </View>

        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="walk-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>{t('empty.title')}</Text>
            <Text style={styles.emptySubtext}>{t('empty.subtitle')}</Text>
          </View>
        ) : (
          <FlatList
            data={activities}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('modal.title')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Type */}
              <Text style={styles.label}>{t('modal.typeLabel')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeSelector}
              >
                {ACTIVITY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      activityType === type.value && styles.typeButtonActive,
                    ]}
                    onPress={() => setActivityType(type.value)}
                  >
                    <Ionicons
                      name={type.icon}
                      size={24}
                      color={activityType === type.value ? '#FFFFFF' : '#6B46C1'}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        activityType === type.value && styles.typeButtonTextActive,
                      ]}
                    >
                      {getActivityLabel(type.value)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Date */}
              <Text style={styles.label}>{t('modal.dateLabel')}</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text style={styles.dateButtonText}>
                  {activityDate.toLocaleDateString(
                    i18n.language === 'ru' ? 'ru-RU' : 'en-US'
                  )}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={activityDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) setActivityDate(selectedDate);
                  }}
                  maximumDate={new Date()}
                />
              )}

              {/* Duration */}
              <Text style={styles.label}>{t('modal.durationLabel')}</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder={t('modal.durationPlaceholder')}
                keyboardType="numeric"
              />

              {/* Distance */}
              <Text style={styles.label}>{t('modal.distanceLabel')}</Text>
              <TextInput
                style={styles.input}
                value={distance}
                onChangeText={setDistance}
                placeholder={t('modal.distancePlaceholder')}
                keyboardType="decimal-pad"
              />

              {/* Notes */}
              <Text style={styles.label}>{t('modal.notesLabel')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder={t('modal.notesPlaceholder')}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common:cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddActivity}
              >
                <Text style={styles.saveButtonText}>{t('modal.addButton')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles без изменений — полностью сохранены
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  petSelector: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  petButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  petButtonActive: { backgroundColor: '#6B46C1' },
  petButtonText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  petButtonTextActive: { color: '#FFFFFF' },
  content: { flex: 1 },
  statsContainer: { padding: 16, gap: 12 },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  statLabel: { fontSize: 12, color: '#6B7280' },
  chartCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  chart: { marginVertical: 8, borderRadius: 12 },
  listHeader: { paddingHorizontal: 16, paddingVertical: 12 },
  listTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  activityCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  activityIcon: { marginRight: 12 },
  activityInfo: { flex: 1 },
  activityType: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  activityDate: { fontSize: 14, color: '#6B7280' },
  deleteButton: { padding: 4 },
  activityDetails: { flexDirection: 'row', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 14, color: '#6B7280' },
  activityNotes: { fontSize: 14, color: '#4B5563', marginTop: 8, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', padding: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#9CA3AF', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  modalBody: { padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  typeSelector: { marginBottom: 8 },
  typeButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 8,
    minWidth: 80,
  },
  typeButtonActive: { backgroundColor: '#6B46C1', borderColor: '#6B46C1' },
  typeButtonText: { fontSize: 12, color: '#6B46C1', marginTop: 4, fontWeight: '500' },
  typeButtonTextActive: { color: '#FFFFFF' },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    gap: 8,
  },
  dateButtonText: { fontSize: 16, color: '#1F2937' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: { height: 100, paddingTop: 12 },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#6B46C1',
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
