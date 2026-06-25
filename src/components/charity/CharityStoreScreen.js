import React, { useState, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useCharity } from '../../hooks/useCharity'; // ✅ ИСПРАВЛЕНО
import { useLoyaltyPoints } from '../../hooks/useLoyaltyPoints'; // ✅ ДОБАВЛЕНО
import ShelterCard from './ShelterCard'; // ✅ ДОБАВЛЕНО
import Screen from '../../components/Screen';
import { useTheme } from '../../theme/ThemeProvider';

export default function CharityStoreScreen({ navigation }) {
  const { points, refreshPoints } = useLoyaltyPoints();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { t } = useTranslation('charity');
  const { shelters, loading, makeDonation, refetch } = useCharity();
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleDonatePress = (shelter, amount) => {
    if (points < amount) {
      Alert.alert(
        t('insufficientTitle'),
        t('insufficientMessage', { have: points, need: amount })
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
        t('voteThanksTitle'),
        t('voteThanksMessage', { amount, shelter: shelter.name, balance: newBalance }),
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(t('errorTitle'), error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>Загрузка приютов...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
    <View style={styles.container}>
      {/* Header с балансом */}
      <View style={styles.balanceHeader}>
        <View style={styles.balanceRow}>
          <MaterialCommunityIcons name="paw" size={24} color={theme.accent} />
          <Text style={styles.balanceText}>Ваш баланс: {points} Paws</Text>
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('CharityHistory')}
        >
          <MaterialCommunityIcons name="history" size={20} color={theme.accent} />
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
          {t('subtitle')}
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
            <MaterialCommunityIcons name="paw-off" size={64} color={theme.hairline} />
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
            <MaterialCommunityIcons name="heart" size={48} color={theme.accent} />
            
            <Text style={styles.modalTitle}>{t('confirmVoteTitle')}</Text>
            
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
                    {t('voteAmount', { amount: selectedDonation.amount })}
                  </Text>
                </View>

                <View style={styles.modalBalanceInfo}>
                  <Text style={styles.modalBalanceLabel}>{t('balanceLabel')}</Text>
                  <Text style={styles.modalBalanceValue}>
                    {t('balanceChange', { from: points, to: points - selectedDonation.amount })}
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
                <Text style={styles.modalButtonTextCancel}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmDonation}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color={theme.onAccent} />
                ) : (
                  <Text style={styles.modalButtonTextConfirm}>{t('confirm')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </Screen>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.t3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.hairline,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 18,
    fontFamily: theme.font.bold,
    color: theme.t1,
    marginLeft: 8,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radii.sm8,
    backgroundColor: theme.surface,
  },
  historyButtonText: {
    fontSize: 14,
    fontFamily: theme.font.semibold,
    color: theme.accent,
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
    fontFamily: theme.font.bold,
    color: theme.t1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.t3,
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
    color: theme.t3,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // theme-neutral scrim
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: theme.radii.r20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: theme.font.bold,
    color: theme.t1,
    marginTop: 16,
    marginBottom: 8,
  },
  modalShelter: {
    fontSize: 16,
    fontFamily: theme.font.semibold,
    color: theme.t2,
    textAlign: 'center',
  },
  modalCity: {
    fontSize: 14,
    color: theme.t3,
    marginBottom: 20,
  },
  modalAmountBox: {
    backgroundColor: theme.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radii.sm12,
    marginBottom: 20,
  },
  modalAmount: {
    fontSize: 28,
    fontFamily: theme.font.bold,
    color: theme.accent,
  },
  modalBalanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalBalanceLabel: {
    fontSize: 14,
    color: theme.t3,
    marginRight: 8,
  },
  modalBalanceValue: {
    fontSize: 16,
    fontFamily: theme.font.semibold,
    color: theme.t1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.radii.sm12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.surface,
  },
  modalButtonConfirm: {
    backgroundColor: theme.accentPress,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontFamily: theme.font.semibold,
    color: theme.t2,
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontFamily: theme.font.semibold,
    color: theme.onAccent,
  },
});
