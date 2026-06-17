import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCharity } from '../../hooks/useCharity'; // ✅ ИСПРАВЛЕНО
import { useLoyaltyPoints } from '../../hooks/useLoyaltyPoints'; // ✅ ДОБАВЛЕНО
import ShelterCard from './ShelterCard'; // ✅ ДОБАВЛЕНО

export default function CharityStoreScreen({ navigation }) {
  const { points, refreshPoints } = useLoyaltyPoints();
  const { shelters, loading, makeDonation, refetch } = useCharity();
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleDonatePress = (shelter, amount) => {
    if (points < amount) {
      Alert.alert(
        'Недостаточно Paws',
        `У вас ${points} Paws, а нужно ${amount} Paws`
      );
      return;
    }

    setSelectedDonation({ shelter, amount });
  };

  const confirmDonation = async () => {
    if (!selectedDonation) return;

    const { shelter, amount } = selectedDonation;
    setProcessing(true);

    try {
      // RPC make_donation принимает ровно (p_user_id, p_shelter_id, p_points).
      await makeDonation(shelter.id, amount);

      // RPC списывает amount Paws -> новый баланс считаем локально для алерта.
      const newBalance = points - amount;

      setSelectedDonation(null);
      // Сразу обновляем и баланс (user_points), и агрегаты useCharity
      // (shelters.total_donations + donations) — чтобы «Собрано»/суммы
      // по приютам росли вживую, без ухода с экрана и возврата.
      await Promise.all([refreshPoints(), refetch()]);

      Alert.alert(
        '🎉 Спасибо!',
        `Вы пожертвовали ${amount} Paws приюту "${shelter.name}". Ваш новый баланс: ${newBalance} Paws`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Загрузка приютов...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header с балансом */}
      <View style={styles.balanceHeader}>
        <View style={styles.balanceRow}>
          <MaterialCommunityIcons name="paw" size={24} color="#8B5CF6" />
          <Text style={styles.balanceText}>Ваш баланс: {points} Paws</Text>
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('CharityHistory')}
        >
          <MaterialCommunityIcons name="history" size={20} color="#8B5CF6" />
          <Text style={styles.historyButtonText}>История</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Выберите приют для помощи</Text>
        <Text style={styles.subtitle}>
          Ваши Paws помогут бездомным животным в Беларуси
        </Text>

        {shelters.map((shelter) => (
          <ShelterCard
            key={shelter.id}
            shelter={shelter}
            onDonate={handleDonatePress}
            userPoints={points}
          />
        ))}

        {shelters.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="paw-off" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Нет доступных приютов</Text>
          </View>
        )}
      </ScrollView>

      {/* Модальное окно подтверждения */}
      <Modal
        visible={!!selectedDonation}
        transparent
        animationType="fade"
        onRequestClose={() => !processing && setSelectedDonation(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="heart" size={48} color="#EF4444" />
            
            <Text style={styles.modalTitle}>Подтвердите пожертвование</Text>
            
            {selectedDonation && (
              <>
                <Text style={styles.modalShelter}>
                  {selectedDonation.shelter.name}
                </Text>
                <Text style={styles.modalCity}>
                  {selectedDonation.shelter.city}
                </Text>
                
                <View style={styles.modalAmountBox}>
                  <Text style={styles.modalAmount}>
                    {selectedDonation.amount} Paws
                  </Text>
                </View>

                <View style={styles.modalBalanceInfo}>
                  <Text style={styles.modalBalanceLabel}>Ваш баланс:</Text>
                  <Text style={styles.modalBalanceValue}>
                    {points} → {points - selectedDonation.amount} Paws
                  </Text>
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setSelectedDonation(null)}
                disabled={processing}
              >
                <Text style={styles.modalButtonTextCancel}>Отмена</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmDonation}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonTextConfirm}>Подтвердить</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  modalShelter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  modalCity: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  modalAmountBox: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  modalBalanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalBalanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  modalBalanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonConfirm: {
    backgroundColor: '#8B5CF6',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
