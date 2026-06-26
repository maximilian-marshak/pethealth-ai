import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLoyaltyPoints } from '../hooks/useLoyaltyPoints';
import { useCharity } from '../hooks/useCharity';
import { useCharityRanks } from '../hooks/useCharityRanks';
import { usePets } from '../hooks/usePets';
import { useUserProfile } from '../hooks/useUserProfile';
import { useLanguage } from '../hooks/useLanguage';
import { useUnits } from '../hooks/useUnits';
import ProgressBar from '../components/ProgressBar';
import { supabase } from '../utils/supabase';
import { useNotificationPref } from '../hooks/useNotificationPref';
import { requestNotificationPermission, cancelAllScheduled } from '../utils/notificationsSetup';
import { useTheme } from '../theme/ThemeProvider';
import Screen from '../components/Screen';
import GlassCard from '../components/GlassCard';
import Badge from '../components/ui/Badge';

// ─── Language Switcher Component ──────────────────────────────────────────────
const LanguageSwitcher = () => {
  const { currentLanguage, switchLanguage } = useLanguage();
  const { t } = useTranslation('common');
  const { theme } = useTheme();
  const switcherStyles = useMemo(() => makeSwitcherStyles(theme), [theme]);
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (lang) => {
    if (lang === currentLanguage || switching) return;
    try {
      setSwitching(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await switchLanguage(lang);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <View style={switcherStyles.container}>
      <View style={switcherStyles.labelRow}>
        <Ionicons name="language" size={20} color={theme.accent} />
        <Text style={switcherStyles.label}>{t('language')}</Text>
      </View>

      <View style={switcherStyles.toggle}>
        {/* EN кнопка */}
        <TouchableOpacity
          style={[
            switcherStyles.langBtn,
            currentLanguage === 'en' && switcherStyles.langBtnActive,
          ]}
          onPress={() => handleSwitch('en')}
          disabled={switching}
        >
          <Text style={[
            switcherStyles.langText,
            currentLanguage === 'en' && switcherStyles.langTextActive,
          ]}>
            🇬🇧 EN
          </Text>
        </TouchableOpacity>

        {/* RU кнопка */}
        <TouchableOpacity
          style={[
            switcherStyles.langBtn,
            currentLanguage === 'ru' && switcherStyles.langBtnActive,
          ]}
          onPress={() => handleSwitch('ru')}
          disabled={switching}
        >
          <Text style={[
            switcherStyles.langText,
            currentLanguage === 'ru' && switcherStyles.langTextActive,
          ]}>
            🇷🇺 RU
          </Text>
        </TouchableOpacity>
      </View>

      {switching && (
        <ActivityIndicator
          size="small"
          color={theme.accent}
          style={switcherStyles.spinner}
        />
      )}
    </View>
  );
};

const makeSwitcherStyles = (theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: theme.radii.sm12,
    marginBottom: 8,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  label: {
    fontSize: 15,
    color: theme.t1,
    fontFamily: theme.font.medium,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: theme.accentTint,
    borderRadius: theme.radii.r10,
    padding: 3,
    gap: 3,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radii.sm8,
  },
  langBtnActive: {
    backgroundColor: theme.accentPress,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  langText: {
    fontSize: 13,
    fontFamily: theme.font.semibold,
    color: theme.t2,
  },
  langTextActive: {
    color: theme.onAccent,
  },
  spinner: {
    marginLeft: 8,
  },
});

// ─── Units Switcher Component (кг / фунты) ────────────────────────────────────
const UnitsSwitcher = () => {
  const { unit, setUnit } = useUnits();
  const { t } = useTranslation('profile');
  const { theme } = useTheme();
  const switcherStyles = useMemo(() => makeSwitcherStyles(theme), [theme]);

  return (
    <View style={switcherStyles.container}>
      <View style={switcherStyles.labelRow}>
        <Ionicons name="barbell-outline" size={20} color={theme.accent} />
        <Text style={switcherStyles.label}>{t('units.title')}</Text>
      </View>

      <View style={switcherStyles.toggle}>
        {['kg', 'lb'].map((u) => (
          <TouchableOpacity
            key={u}
            style={[switcherStyles.langBtn, unit === u && switcherStyles.langBtnActive]}
            onPress={() => setUnit(u)}
          >
            <Text style={[switcherStyles.langText, unit === u && switcherStyles.langTextActive]}>
              {t(`units.${u}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { enabled: notificationsEnabled, setEnabled: setNotificationsEnabled } = useNotificationPref();
  const { t, i18n } = useTranslation(['profile', 'common', 'pets']);

  // ─── Хуки данных ────────────────────────────────────────
  const { points, loading: loadingPoints, refreshPoints } = useLoyaltyPoints();
  const { totalDonated, lifetimeDonated, shelterCount, loading: loadingCharity, refetch: refetchCharity } = useCharity();
  const { ranks, currentRank, nextRank, progress: rankProgress, remaining: rankRemaining, loading: loadingRanks } = useCharityRanks(lifetimeDonated);
  const { pets, loading: loadingPets, refetch: refetchPets } = usePets();
  const { profile, loading: loadingProfile, updateAvatar, updatePhone, refetch: refetchProfile } = useUserProfile();

  const [refreshing, setRefreshing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [ranksExpanded, setRanksExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ─── Фокус ──────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      Promise.all([
        refetchPets(),
        refetchProfile(),
      ]).catch(err => console.error('❌ Error during focus refresh:', err));
    }, [refetchPets, refetchProfile])
  );

  // ─── Вычисляемые значения ───────────────────────────────
  const currentBalance = points || 0;

  // ─── Ранг: имя реактивно по языку (из raw name_ru/name_en, не из memo) ───
  const _lang = i18n.language || 'en';
  const rankName = (r) => (_lang.startsWith('ru') ? r?.name_ru : r?.name_en) || r?.name_en || r?.name_ru || '';
  const rankAccent = theme.leagueColors[currentRank?.league] || theme.accent;
  const rankPct = nextRank ? rankProgress : 100;
  // ─── Рефетч ─────────────────────────────────────────────
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchPets(),
        refreshPoints(),
        refetchCharity(),
        refetchProfile(),
      ]);
    } catch (error) {
      console.error('❌ Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // ─── Аватар ─────────────────────────────────────────────
  const handleUpdateAvatar = async () => {
    try {
      setUploadingAvatar(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { pickAndUploadUserAvatar } = await import('../services/imageUploadService');
      const newAvatarUrl = await pickAndUploadUserAvatar(user.id, profile?.avatar_url);
      if (newAvatarUrl) {
        await updateAvatar(newAvatarUrl);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t('common:ok'), t('profile:editProfile'));
      }
    } catch (error) {
      console.error('❌ Error updating avatar:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('common:error'), error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ─── Логаут ─────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      t('profile:logout'),
      `${t('profile:logout')}?`,
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('profile:logout'),
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await signOut();
          },
        },
      ]
    );
  };

  // ─── Удаление аккаунта (двойное подтверждение → Edge Function) ───
  const performDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'deletion failed');
      // Успех: signOut → onAuthStateChange уведёт на Login (компонент размонтируется).
      await signOut();
    } catch (e) {
      setDeleting(false);
      Alert.alert(t('profile:deleteConfirm.error'), e?.message || '');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile:deleteConfirm.title'),
      t('profile:deleteConfirm.message'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('profile:deleteConfirm.continue'),
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              t('profile:deleteConfirm.finalTitle'),
              t('profile:deleteConfirm.finalMessage'),
              [
                { text: t('common:cancel'), style: 'cancel' },
                {
                  text: t('profile:deleteConfirm.confirmFinal'),
                  style: 'destructive',
                  onPress: performDeleteAccount,
                },
              ]
            ),
        },
      ]
    );
  };

  // ─── Тумблер уведомлений ───
  const onToggleNotifications = async (value) => {
    if (value) {
      const status = await requestNotificationPermission();
      if (status === 'granted') {
        setNotificationsEnabled(true);
      } else {
        // Нет разрешения ОС — оставляем выкл и подсказываем.
        setNotificationsEnabled(false);
        Alert.alert(t('profile:notifPermDenied.title'), t('profile:notifPermDenied.message'));
      }
    } else {
      setNotificationsEnabled(false);
      await cancelAllScheduled();
    }
  };

  const navigateToSettings = (screen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Coming Soon', `${screen}`);
  };

  const openPhoneModal = () => {
    setPhoneInput(profile?.phone || '');
    setPhoneModalVisible(true);
  };

  const savePhone = async () => {
    setSavingPhone(true);
    try {
      await updatePhone(phoneInput);
      setPhoneModalVisible(false);
    } catch (err) {
      Alert.alert(t('common:ok'), err.message);
    } finally {
      setSavingPhone(false);
    }
  };

  // ─── Имя и аватар ───────────────────────────────────────
  const getUserName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) {
      return user.email.split('@')[0]
        .split(/[._]/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return 'Pet Parent';
  };

  const getAvatarUrl = () => {
    if (profile?.avatar_url) return profile.avatar_url;
    if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || 'User')}&size=200&background=6C63FF&color=fff`;
  };

  // ─── Render ─────────────────────────────────────────────
  return (
    <Screen>
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
      }
    >
      {/* SCREEN TITLE */}
      <Text style={styles.screenTitle}>{t('profile:title')}</Text>

      {/* HEADER (карточка-ряд, эталон) — аватар+edit сохранены */}
      <GlassCard variant="decor" style={styles.userCard} padding={18}>
        <View style={styles.userRow}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: getAvatarUrl() }} style={styles.avatar} />
            <TouchableOpacity
              style={styles.avatarEditButton}
              onPress={handleUpdateAvatar}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar
                ? <ActivityIndicator size="small" color={theme.onAccent} />
                : <Ionicons name="camera" size={13} color={theme.onAccent} />
              }
            </TouchableOpacity>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{getUserName()}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>
      </GlassCard>

      {/* STATS ROW */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: theme.accentTint }]}>
            <Ionicons name="paw" size={24} color={theme.accent} />
          </View>
          <Text style={styles.statValue}>{loadingPoints ? '...' : currentBalance}</Text>
          <Text style={styles.statLabel}>{t('profile:loyalty')}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: theme.accentTint }]}>
            <Ionicons name="heart" size={24} color={theme.accent} />
          </View>
          <Text style={styles.statValue}>{loadingCharity ? '...' : totalDonated}</Text>
          <Text style={styles.statLabel}>{t('profile:totalDonated')}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: theme.accentTint }]}>
            <Ionicons name="home" size={24} color={theme.accent} />
          </View>
          <Text style={styles.statValue}>{loadingCharity ? '...' : shelterCount}</Text>
          <Text style={styles.statLabel}>
            {t('profile:settings')}
          </Text>
        </View>
      </View>

      {/* RANK (компактная карточка, эталон) — chevron раскрывает список рангов */}
      {(loadingRanks || ranks.length > 0) && (
        <View style={styles.section}>
          {loadingRanks ? (
            <View style={styles.rankLoading}>
              <ActivityIndicator size="small" color={theme.accent} />
            </View>
          ) : (
          <GlassCard variant="decor" style={styles.rankCard} radius={theme.radii.r20}>
            <TouchableOpacity style={styles.rankMain} onPress={() => setRanksExpanded((v) => !v)} activeOpacity={0.7}>
              <Text style={styles.rankBadgeIcon}>{currentRank?.icon || '🏅'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rankLabel}>{t('profile:rank.title')}</Text>
                <Text style={styles.rankName} numberOfLines={1}>{rankName(currentRank) || '—'}</Text>
                {currentRank?.league ? (
                  <Badge color={rankAccent} style={styles.rankBadge}>
                    {t(`profile:rank.league.${currentRank.league}`, { defaultValue: currentRank.league })}
                  </Badge>
                ) : null}
              </View>
              <Ionicons name={ranksExpanded ? 'chevron-up' : 'chevron-forward'} size={20} color={theme.t3} />
            </TouchableOpacity>

            <View style={styles.rankProgressRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <ProgressBar current={rankPct} goal={100} height={8} />
              </View>
              <Text style={styles.rankProgressPct}>{rankPct}%</Text>
            </View>
            <Text style={styles.rankToNext}>
              {nextRank ? t('profile:rank.toNext', { remaining: rankRemaining }) : t('profile:rank.max')}
            </Text>

            {ranksExpanded && ranks.map((r) => {
            const accent = theme.leagueColors[r.league] || theme.accent;
            const isCurrent = currentRank && r.rank_no === currentRank.rank_no;
            return (
              <View
                key={r.rank_no ?? r.id}
                style={[styles.rankRow, { borderColor: accent }, isCurrent && { backgroundColor: accent + '14' }]}
              >
                <Text style={styles.rankRowIcon}>{r.icon || '🏅'}</Text>
                <Text style={[styles.rankRowName, isCurrent && styles.rankRowNameCurrent]} numberOfLines={1}>
                  {rankName(r)}
                </Text>
                <Text style={styles.rankRowThreshold}>{t('profile:rank.threshold', { count: r.threshold })}</Text>
              </View>
            );
          })}
          </GlassCard>
          )}
        </View>
      )}

      {/* PETS */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🐾 {t('pets:title')}</Text>
          <TouchableOpacity onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('AddPet');
          }}>
            <Text style={styles.seeAll}>+ {t('pets:addPet')}</Text>
          </TouchableOpacity>
        </View>

        {loadingPets ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={styles.emptyText}>{t('common:loading')}</Text>
          </View>
        ) : pets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🐕</Text>
            <Text style={styles.emptyText}>{t('pets:noPets')}</Text>
            <Text style={styles.emptySubtext}>{t('pets:addPet')}</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petsScroll}>
            {pets.map(pet => {
              const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(pet.name)}&size=200&background=6C63FF&color=fff`;
              return (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.petCard}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('PetDetail', { petId: pet.id });
                  }}
                >
                  <Image source={{ uri: pet.avatar_url || fallbackUrl }} style={styles.petAvatar} />
                  <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
                  <Text style={styles.petBreed} numberOfLines={1}>
                    {pet.breed || pet.species || t('pets:other')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* CHARITY */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💝 {t('profile:totalDonated')}</Text>
          <TouchableOpacity onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('CharityHistory');
          }}>
            <Text style={styles.seeAll}>{t('profile:history')} →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.charityCard}>
          <View style={styles.charityHeader}>
            <Text style={styles.charityTitle}>{t('profile:loyalty')}</Text>
            <Text style={styles.charityGoal}>{currentBalance}/500 Paws</Text>
          </View>
          <ProgressBar current={currentBalance % 500} goal={500} height={12} />
          <Text style={styles.charityHint}>
            {t('dashboard:nextLevel', { points: 500 - (currentBalance % 500) })}
          </Text>
        </View>
      </View>

      {/* SETTINGS */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
          ⚙️ {t('profile:settings')}
        </Text>

        {/* ─── Language Switcher ─── */}
        <LanguageSwitcher />

        {/* ─── Units Switcher ─── */}
        <UnitsSwitcher />

        <TouchableOpacity
          style={styles.settingItem}
          onPress={openPhoneModal}
        >
          <View style={[styles.settingIcon, { backgroundColor: theme.accentTint }]}>
            <Ionicons name="call" size={20} color={theme.accent} />
          </View>
          <Text style={styles.settingText}>{t('profile:phone')}</Text>
          <Text style={styles.settingValue} numberOfLines={1}>{profile?.phone || '—'}</Text>
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={[styles.settingIcon, { backgroundColor: theme.accentTint }]}>
            <Ionicons name="notifications" size={20} color={theme.accent} />
          </View>
          <Text style={styles.settingText}>{t('profile:notifications')}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={onToggleNotifications}
            trackColor={{ true: theme.accent, false: theme.hairline }}
            thumbColor={theme.onAccent}
          />
        </View>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('FAQ')}
        >
          <View style={[styles.settingIcon, { backgroundColor: theme.accentTint }]}>
            <Ionicons name="help-circle" size={20} color={theme.accent} />
          </View>
          <Text style={styles.settingText}>FAQ</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.t4} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <View style={[styles.settingIcon, { backgroundColor: theme.hairline }]}>
            <Ionicons name="log-out" size={20} color={theme.t2} />
          </View>
          <Text style={[styles.settingText, styles.logoutText]}>{t('profile:logout')}</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.t4} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, styles.deleteAccountItem]}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          <View style={[styles.settingIcon, { backgroundColor: theme.danger + '22' }]}>
            {deleting
              ? <ActivityIndicator size="small" color={theme.danger} />
              : <Ionicons name="trash-outline" size={20} color={theme.danger} />}
          </View>
          <Text style={[styles.settingText, styles.deleteAccountText]}>{t('profile:deleteAccount')}</Text>
          {!deleting && <Ionicons name="chevron-forward" size={20} color={theme.t4} />}
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>PetHealth AI v1.0.0</Text>
      <View style={styles.bottomPadding} />
    </ScrollView>

    <Modal
      visible={phoneModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setPhoneModalVisible(false)}
    >
      <View style={styles.phoneModalOverlay}>
        <View style={styles.phoneModalCard}>
          <Text style={styles.phoneModalTitle}>{t('profile:phone')}</Text>
          <TextInput
            style={styles.phoneInput}
            value={phoneInput}
            onChangeText={setPhoneInput}
            keyboardType="phone-pad"
            placeholder={t('profile:phone')}
            placeholderTextColor={theme.t4}
            autoFocus
          />
          <View style={styles.phoneModalButtons}>
            <TouchableOpacity
              style={[styles.phoneBtn, styles.phoneBtnCancel]}
              onPress={() => setPhoneModalVisible(false)}
              disabled={savingPhone}
            >
              <Text style={styles.phoneBtnCancelText}>{t('common:cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.phoneBtn, styles.phoneBtnSave]}
              onPress={savePhone}
              disabled={savingPhone}
            >
              <Text style={styles.phoneBtnSaveText}>{savingPhone ? '...' : t('common:save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </Screen>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  screenTitle: {
    fontSize: 26,
    fontFamily: theme.font.bold,
    color: theme.t1,
    letterSpacing: -0.4,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  userCard: { marginHorizontal: 20, marginBottom: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  userInfo: { flex: 1 },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: theme.radii.pill999,
    borderWidth: 2,
    borderColor: theme.accent,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: theme.accentPress,
    borderRadius: theme.radii.pill999,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.surface,
  },
  premiumIcon: { fontSize: 14 },
  userName: { fontSize: 18, fontFamily: theme.font.bold, color: theme.t1 },
  userEmail: { fontSize: 13, color: theme.t2, marginTop: 2 },
  subscriptionBadge: {
    backgroundColor: theme.accentTint,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: theme.radii.r20,
  },
  subscriptionText: { fontSize: 13, color: theme.accent, fontFamily: theme.font.semibold },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: theme.radii.md16,
    padding: 16,
    alignItems: 'center',
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.sm12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontFamily: theme.font.bold, color: theme.t1, marginBottom: 4 },
  statLabel: { fontSize: 12, color: theme.t3, textAlign: 'center' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: theme.font.bold, color: theme.t1 },
  seeAll: { fontSize: 14, color: theme.accent, fontFamily: theme.font.semibold },
  nextBadgeCard: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: theme.radii.md16,
    marginBottom: 12,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nextBadgeLabel: { fontSize: 12, color: theme.t3, marginBottom: 4 },
  nextBadgeName: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.t1, marginBottom: 12 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
  progressPercent: { fontSize: 12, fontFamily: theme.font.semibold, color: theme.ok, minWidth: 35, textAlign: 'right' },
  rankCard: { marginBottom: 12 },
  rankMain: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rankLoading: { paddingVertical: 24, alignItems: 'center' },
  rankBadgeIcon: { fontSize: 36 },
  rankLabel: { fontSize: 12, fontFamily: theme.font.bold, color: theme.t3, textTransform: 'uppercase', letterSpacing: 0.4 },
  rankName: { fontSize: 17, fontFamily: theme.font.bold, color: theme.t1, marginTop: 1 },
  rankBadge: { marginTop: 6 },
  rankProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  rankProgressPct: { fontSize: 12, fontFamily: theme.font.semibold, color: theme.accent, minWidth: 38, textAlign: 'right' },
  rankToNext: { fontSize: 13, color: theme.t3, marginTop: 6 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface, borderRadius: theme.radii.sm12, borderWidth: 1, padding: 12, marginBottom: 8 },
  rankRowIcon: { fontSize: 22 },
  rankRowName: { flex: 1, fontSize: 14, color: theme.t1 },
  rankRowNameCurrent: { fontFamily: theme.font.bold },
  rankRowThreshold: { fontSize: 12, color: theme.t3, fontFamily: theme.font.semibold },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  petsScroll: { paddingRight: 20, gap: 12 },
  petCard: {
    width: 110,
    backgroundColor: theme.surface,
    borderRadius: theme.radii.md16,
    padding: 12,
    alignItems: 'center',
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  petAvatar: { width: 70, height: 70, borderRadius: theme.radii.pill999, marginBottom: 8 },
  petName: { fontSize: 14, fontFamily: theme.font.semibold, color: theme.t1, marginBottom: 2 },
  petBreed: { fontSize: 12, color: theme.t3 },
  charityCard: {
    backgroundColor: theme.surface,
    padding: 20,
    borderRadius: theme.radii.md16,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  charityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  charityTitle: { fontSize: 14, color: theme.t2 },
  charityGoal: { fontSize: 16, fontFamily: theme.font.bold, color: theme.accent },
  charityHint: { fontSize: 12, color: theme.t3, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: theme.radii.sm12,
    marginBottom: 8,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.r10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: { flex: 1, fontSize: 15, color: theme.t1, fontFamily: theme.font.medium },
  settingValue: { fontSize: 14, color: theme.t3, maxWidth: 150, textAlign: 'right' },
  phoneModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 }, // theme-neutral scrim
  phoneModalCard: { backgroundColor: theme.surface, borderRadius: theme.radii.md16, padding: 20 },
  phoneModalTitle: { fontSize: 18, fontFamily: theme.font.bold, color: theme.t1, marginBottom: 16 },
  phoneInput: { borderWidth: 1, borderColor: theme.hairline, borderRadius: theme.radii.r10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: theme.t1, marginBottom: 16 },
  phoneModalButtons: { flexDirection: 'row', gap: 12 },
  phoneBtn: { flex: 1, paddingVertical: 13, borderRadius: theme.radii.r10, alignItems: 'center' },
  phoneBtnCancel: { backgroundColor: theme.hairline },
  phoneBtnSave: { backgroundColor: theme.accentPress },
  phoneBtnCancelText: { color: theme.t1, fontFamily: theme.font.semibold, fontSize: 15 },
  phoneBtnSaveText: { color: theme.onAccent, fontFamily: theme.font.semibold, fontSize: 15 },
  logoutItem: { borderWidth: 1, borderColor: theme.hairline },
  logoutText: { color: theme.t2 },
  deleteAccountItem: { borderWidth: 1, borderColor: theme.danger },
  deleteAccountText: { color: theme.danger, fontFamily: theme.font.semibold },
  emptyCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radii.md16,
    padding: 24,
    alignItems: 'center',
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 15, fontFamily: theme.font.semibold, color: theme.t1 },
  emptySubtext: { fontSize: 13, color: theme.t3, marginTop: 4 },
  versionText: { textAlign: 'center', fontSize: 12, color: theme.t3, marginTop: 32 },
  bottomPadding: { height: 100 },
});
