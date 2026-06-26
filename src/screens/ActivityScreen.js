// screens/ActivityScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useTheme } from '../theme/ThemeProvider';
import Screen from '../components/Screen';
import Segmented from '../components/Segmented';
import IconChip from '../components/IconChip';
import Badge from '../components/ui/Badge';
import { usePointsHistory } from '../hooks/usePointsHistory';
import { useWeightHistory } from '../hooks/useWeightHistory';
import { parsePointsReason, EVENT_ICONS } from '../utils/pointsFeed';
import { formatWeightValue, unitLabel } from '../utils/formatWeight';

const { width } = Dimensions.get('window');

// Убраны захардкоженные label — теперь через t('types.walk') и т.д.
// Эмодзи питомца по виду (как в Hub/Medical) — для pet-chip на «Сводке».
const SPECIES_EMOJI = {
  dog: '🐶', собака: '🐶', пёс: '🐶', пес: '🐶',
  cat: '🐱', кошка: '🐱', кот: '🐱',
  rabbit: '🐰', кролик: '🐰',
  bird: '🐦', птица: '🐦',
  hamster: '🐹', хомяк: '🐹',
  fish: '🐠', рыба: '🐠', рыбка: '🐠',
  turtle: '🐢', черепаха: '🐢',
  snake: '🐍', змея: '🐍',
};
const speciesEmoji = (s) => SPECIES_EMOJI[(s || '').toString().trim().toLowerCase()] || '🐾';

const ACTIVITY_TYPES = [
  { value: 'walk', icon: 'walk' },
  { value: 'play', icon: 'american-football' },
  { value: 'exercise', icon: 'fitness' },
  { value: 'training', icon: 'school' },
  { value: 'other', icon: 'ellipsis-horizontal' },
];

export default function ActivityScreen() {
  const { t, i18n } = useTranslation('activity');
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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
  const [activityView, setActivityView] = useState('tracker'); // 'tracker' | 'summary'

  // Дата-слой «Сводки» (read-only хуки AT-2). Вес per-pet, фид per-account.
  const { history: pointsHistory } = usePointsHistory(30);
  const {
    history: weightRows,
    chart: weightChart,
    trend: weightTrend,
    unit: weightUnit,
  } = useWeightHistory(selectedPetId);

  const [activityType, setActivityType] = useState('walk');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [activityDate, setActivityDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Пагинация по 5 (только отображение): Трекер-история + лента наград Сводки.
  const [visibleCount, setVisibleCount] = useState(5);
  const [visibleFeed, setVisibleFeed] = useState(5);


  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    if (selectedPetId) {
      fetchActivities();
      setVisibleCount(5); // новый питомец — история сначала по 5
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
            <Ionicons name="calendar-outline" size={20} color={theme.accent} />
            <Text style={styles.statValue}>{data.count}</Text>
            <Text style={styles.statLabel}>{t('stats.activities')}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color={theme.accent} />
            <Text style={styles.statValue}>{data.duration}</Text>
            <Text style={styles.statLabel}>{t('stats.minutes')}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="navigate-outline" size={20} color={theme.accent} />
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
            color={theme.accent}
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
          <Ionicons name="trash-outline" size={20} color={theme.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.activityDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={theme.t3} />
          <Text style={styles.detailText}>{item.duration} {t('stats.minutes')}</Text>
        </View>
        {item.distance && (
          <View style={styles.detailItem}>
            <Ionicons name="navigate-outline" size={16} color={theme.t3} />
            <Text style={styles.detailText}>{item.distance} {t('stats.km')}</Text>
          </View>
        )}
      </View>

      {item.notes && (
        <Text style={styles.activityNotes}>{item.notes}</Text>
      )}
    </View>
  );

  const _rgb = (hex) => { const h = (hex || '').replace('#',''); return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) }; };
  const _ac = _rgb(theme.accent);

  const chartConfig = {
    backgroundColor: theme.surface,
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${_ac.r}, ${_ac.g}, ${_ac.b}, ${opacity})`,
    labelColor: () => theme.t3,
    style: { borderRadius: theme.radii.md16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: theme.accent },
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
    const colors = [theme.accent, theme.accent + 'CC', theme.accent + '99', theme.accent + '66', theme.accent + '40'];
    return {
      name: getActivityLabel(type.name),
      duration: type.duration,
      color: colors[index],
      legendFontColor: theme.t2,
      legendFontSize: 12,
    };
  });

  // ═══ СВОДКА: бар-чарт веса + лента наград (эталон) ═══
  const renderSummary = () => {
    const latestRaw = weightRows[0]?.weight;
    const trendUp = weightTrend?.type === 'up';

    return (
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.summaryContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pet-селектор чипами (вес per-pet) */}
        {pets.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.petRow}
            contentContainerStyle={styles.petRowContent}
          >
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[styles.petChip, selectedPetId === pet.id && styles.petChipActive]}
                onPress={() => setSelectedPetId(pet.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.petChipEmoji}>{speciesEmoji(pet.species)}</Text>
                <Text style={[styles.petChipText, selectedPetId === pet.id && styles.petChipTextActive]}>
                  {pet.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Карточка веса */}
        <View style={styles.summaryCard}>
          <View style={styles.weightHead}>
            <View>
              <Text style={styles.weightLabel}>{t('summary.weightLabel')}</Text>
              <Text style={styles.weightValue}>
                {latestRaw != null ? formatWeightValue(latestRaw, weightUnit) : '—'}
                {latestRaw != null && (
                  <Text style={styles.weightUnit}> {unitLabel(weightUnit)}</Text>
                )}
              </Text>
            </View>
            {weightTrend && weightTrend.type !== 'stable' && (
              <Badge tone={trendUp ? 'ok' : 'warn'} icon={trendUp ? 'trending-up' : 'trending-down'}>
                {`${weightTrend.diff > 0 ? '+' : ''}${formatWeightValue(weightTrend.diff, weightUnit)} ${unitLabel(weightUnit)}`}
              </Badge>
            )}
          </View>

          {weightChart ? (
            <View style={styles.weightChartRow}>
              {weightChart.points.map((p, i) => {
                const last = i === weightChart.points.length - 1;
                const h = ((p.value - weightChart.min) / (weightChart.max - weightChart.min)) * 100;
                return (
                  <View key={i} style={styles.weightBarCol}>
                    <Text style={[styles.weightBarValue, last && { color: theme.accentPress }]}>
                      {Math.round(p.value * 10) / 10}
                    </Text>
                    <View style={styles.weightBarTrack}>
                      <View
                        style={[
                          styles.weightBarFill,
                          { height: `${h}%`, backgroundColor: last ? theme.accent : theme.accentTint },
                        ]}
                      />
                    </View>
                    <Text style={styles.weightBarLabel}>{p.label}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.summaryHint}>{t('summary.noWeight')}</Text>
          )}
        </View>

        {/* Лента наград */}
        <Text style={styles.summarySectionTitle}>{t('summary.recentTitle')}</Text>
        {pointsHistory.length === 0 ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryHint}>{t('summary.emptyFeed')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.feedCard}>
              {pointsHistory.slice(0, visibleFeed).map((row, i, arr) => {
                const parsed = parsePointsReason(row);
                const last = i === arr.length - 1;
                const positive = Number(row.points) >= 0;
                const isDon = parsed.kind === 'donation';
                const icon = isDon ? 'heart-outline' : (EVENT_ICONS[parsed.eventKey] || 'paw-outline');
                const title = isDon
                  ? t('feed.donation', { shelter: parsed.shelter })
                  : t(`dashboard:paws.events.${parsed.eventKey}`, { defaultValue: parsed.eventKey });
                return (
                  <View key={`${row.created_at}-${i}`} style={[styles.feedRow, !last && styles.feedRowDivider]}>
                    <IconChip name={icon} color={isDon ? theme.danger : theme.accent} size={17} />
                    <View style={styles.feedText}>
                      <Text style={styles.feedTitle} numberOfLines={1}>{title}</Text>
                    </View>
                    <View style={styles.feedRight}>
                      <Text style={[styles.feedPaws, !positive && styles.feedPawsNeg]}>
                        {`${positive ? '+' : ''}${row.points} 🐾`}
                      </Text>
                      <Text style={styles.feedWhen}>{formatDate(row.created_at)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            {pointsHistory.length > visibleFeed && (
              <TouchableOpacity
                style={styles.showMoreBtn}
                onPress={() => setVisibleFeed((c) => c + 5)}
                activeOpacity={0.7}
              >
                <Text style={styles.showMoreText}>{t('showMore')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    );
  };

  return (
    <Screen>
      <Text style={styles.screenTitle}>{t('title')}</Text>
      <View style={styles.segmentWrap}>
        <Segmented
          options={[
            { k: 'tracker', label: t('segments.tracker') },
            { k: 'summary', label: t('segments.summary') },
          ]}
          value={activityView}
          onChange={setActivityView}
        />
      </View>

      {activityView === 'summary' ? (
        renderSummary()
      ) : (
    <View style={styles.container}>
      {/* Pet Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.petRow}
        contentContainerStyle={styles.petRowContent}
      >
        {pets.map((pet) => (
          <TouchableOpacity
            key={pet.id}
            style={[styles.petChip, selectedPetId === pet.id && styles.petChipActive]}
            onPress={() => setSelectedPetId(pet.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.petChipEmoji}>{speciesEmoji(pet.species)}</Text>
            <Text style={[styles.petChipText, selectedPetId === pet.id && styles.petChipTextActive]}>
              {pet.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
            <Ionicons name="walk-outline" size={64} color={theme.hairline} />
            <Text style={styles.emptyText}>{t('empty.title')}</Text>
            <Text style={styles.emptySubtext}>{t('empty.subtitle')}</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={activities.slice(0, visibleCount)}
              renderItem={renderActivityItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
            {activities.length > visibleCount && (
              <TouchableOpacity
                style={styles.showMoreBtn}
                onPress={() => setVisibleCount((c) => c + 5)}
                activeOpacity={0.7}
              >
                <Text style={styles.showMoreText}>{t('showMore')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color={theme.onAccent} />
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
                <Ionicons name="close" size={24} color={theme.t3} />
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
                      color={activityType === type.value ? theme.onAccent : theme.accent}
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
                <Ionicons name="calendar-outline" size={20} color={theme.t3} />
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
      )}
    </Screen>
  );
}

// Styles без изменений — полностью сохранены
const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  screenTitle: {
    fontSize: 26,
    fontFamily: theme.font.bold,
    color: theme.t1,
    letterSpacing: -0.4,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  segmentWrap: { paddingHorizontal: 16, paddingBottom: 10 },

  // ─── Сводка ───
  summaryContent: { paddingBottom: 32 },
  petRow: { maxHeight: 52, flexGrow: 0 },
  petRowContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  petChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: theme.radii.pill999,
    backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.chipBorder,
  },
  petChipActive: { backgroundColor: theme.accentPress, borderColor: theme.accentPress },
  petChipEmoji: { fontSize: 15 },
  petChipText: { fontSize: 14, fontFamily: theme.font.semibold, color: theme.t2 },
  petChipTextActive: { color: theme.onAccent },

  summaryCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: theme.radii.r20,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weightHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  weightLabel: { fontSize: 12, fontFamily: theme.font.bold, letterSpacing: 0.4, color: theme.t3, textTransform: 'uppercase' },
  weightValue: { fontSize: 30, fontFamily: theme.font.bold, color: theme.t1, lineHeight: 34 },
  weightUnit: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.t3 },
  weightChartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  weightBarCol: { flex: 1, alignItems: 'center', gap: 6 },
  weightBarValue: { fontSize: 10, fontFamily: theme.font.bold, color: theme.t3 },
  weightBarTrack: { height: 100, width: '72%', justifyContent: 'flex-end' },
  weightBarFill: { width: '100%', borderRadius: theme.radii.sm8, minHeight: 8 },
  weightBarLabel: { fontSize: 11, fontFamily: theme.font.semibold, color: theme.t3 },
  summaryHint: { fontSize: 13, color: theme.t3, textAlign: 'center', paddingVertical: 12 },
  summarySectionTitle: { fontSize: 17, fontFamily: theme.font.bold, color: theme.t1, marginHorizontal: 16, marginTop: 4, marginBottom: 12 },
  feedCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.r20,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  feedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  feedRowDivider: { borderBottomWidth: 1, borderBottomColor: theme.hairline },
  feedText: { flex: 1, minWidth: 0 },
  feedTitle: { fontSize: 14, fontFamily: theme.font.bold, color: theme.t1 },
  feedRight: { alignItems: 'flex-end' },
  feedPaws: { fontSize: 13, fontFamily: theme.font.bold, color: theme.accentPress },
  feedPawsNeg: { color: theme.t3 },
  feedWhen: { fontSize: 11, color: theme.t4, marginTop: 1 },

  // Единая кнопка «Показать больше» (Трекер-история + лента Сводки)
  showMoreBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: theme.radii.r14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.hairline,
    alignItems: 'center',
  },
  showMoreText: { fontSize: 14, fontFamily: theme.font.bold, color: theme.accent },
  content: { flex: 1 },
  statsContainer: { padding: 16, gap: 12 },
  statCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radii.sm12,
    padding: 16,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statTitle: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.t1, marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontFamily: theme.font.bold, color: theme.t1 },
  statLabel: { fontSize: 12, color: theme.t3 },
  chartCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: theme.radii.sm12,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.t1, marginBottom: 12 },
  chart: { marginVertical: 8, borderRadius: theme.radii.sm12 },
  listHeader: { paddingHorizontal: 16, paddingVertical: 12 },
  listTitle: { fontSize: 18, fontFamily: theme.font.semibold, color: theme.t1 },
  activityCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: theme.radii.sm12,
    shadowColor: theme.shadow.shadowColor,
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
  activityType: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.t1, marginBottom: 2 },
  activityDate: { fontSize: 14, color: theme.t3 },
  deleteButton: { padding: 4 },
  activityDetails: { flexDirection: 'row', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 14, color: theme.t3 },
  activityNotes: { fontSize: 14, color: theme.t2, marginTop: 8, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', padding: 48 },
  emptyText: { fontSize: 18, fontFamily: theme.font.semibold, color: theme.t3, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: theme.t3, textAlign: 'center', marginTop: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: theme.radii.xl28,
    backgroundColor: theme.accentPress,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // theme-neutral scrim
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: theme.radii.r20,
    borderTopRightRadius: theme.radii.r20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.hairline,
  },
  modalTitle: { fontSize: 20, fontFamily: theme.font.bold, color: theme.t1 },
  modalBody: { padding: 20 },
  label: {
    fontSize: 14,
    fontFamily: theme.font.semibold,
    color: theme.t2,
    marginBottom: 8,
    marginTop: 16,
  },
  typeSelector: { marginBottom: 8 },
  typeButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    borderRadius: theme.radii.sm12,
    borderWidth: 2,
    borderColor: theme.hairline,
    marginRight: 8,
    minWidth: 80,
  },
  typeButtonActive: { backgroundColor: theme.accentPress, borderColor: theme.accentPress },
  typeButtonText: { fontSize: 12, color: theme.accent, marginTop: 4, fontFamily: theme.font.medium },
  typeButtonTextActive: { color: theme.onAccent },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.hairline,
    borderRadius: theme.radii.sm8,
    gap: 8,
  },
  dateButtonText: { fontSize: 16, color: theme.t1 },
  input: {
    borderWidth: 1,
    borderColor: theme.hairline,
    borderRadius: theme.radii.sm8,
    padding: 12,
    fontSize: 16,
    color: theme.t1,
  },
  textArea: { height: 100, paddingTop: 12 },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.hairline,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: theme.radii.sm8,
    borderWidth: 1,
    borderColor: theme.hairline,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.t2 },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: theme.radii.sm8,
    backgroundColor: theme.accentPress,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.onAccent },
});
