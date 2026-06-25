import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';
import { useTheme } from '../theme/ThemeProvider';
import Screen from '../components/Screen';

export default function AddPetScreen({ navigation }) {
  const { t } = useTranslation('pets');
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // ─── Динамические опции из переводов ───────────────────
  const SPECIES_OPTIONS = [
    { key: 'Dog',     label: t('dog') },
    { key: 'Cat',     label: t('cat') },
    { key: 'Rabbit',  label: t('rabbit') },
    { key: 'Bird',    label: t('bird') },
    { key: 'Hamster', label: t('hamster') },
    { key: 'Other',   label: t('other') },
  ];

  const GENDER_OPTIONS = [
    { key: 'Male',   label: t('male') },
    { key: 'Female', label: t('female') },
  ];

  // ─── State ──────────────────────────────────────────────
  const [name, setName]             = useState('');
  const [species, setSpecies]       = useState('');
  const [breed, setBreed]           = useState('');
  const [age, setAge]               = useState('');
  const [weight, setWeight]         = useState('');
  const [gender, setGender]         = useState('');
  const [microchipId, setMicrochipId] = useState('');
  const [loading, setLoading]       = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // ─── Загрузка пользователя ──────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          return;
        }

        if (session?.user) {
          setCurrentUser(session.user);
          return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error('User error:', userError);
          return;
        }

        if (user) {
          setCurrentUser(user);
        } else {
          Alert.alert(t('errors.notLoggedIn'), t('errors.pleaseLogin'), [
            { text: t('auth.ok'), onPress: () => navigation.replace('Login') },
          ]);
        }
      } catch (e) {
        console.error('Error loading user:', e);
      }
    };

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // ─── Валидация ──────────────────────────────────────────
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert(t('validation.missingInfo'), t('validation.nameRequired'));
      return false;
    }
    if (!species) {
      Alert.alert(t('validation.missingInfo'), t('validation.speciesRequired'));
      return false;
    }
    if (!gender) {
      Alert.alert(t('validation.missingInfo'), t('validation.genderRequired'));
      return false;
    }
    return true;
  };

  // ─── Возраст → дата рождения ────────────────────────────
  const getBirthDate = (ageYears) => {
    const parsed = parseFloat(ageYears);
    if (!ageYears || isNaN(parsed) || parsed < 0) return null;
    const date = new Date();
    date.setFullYear(date.getFullYear() - Math.floor(parsed));
    const remainingMonths = Math.round((parsed % 1) * 12);
    date.setMonth(date.getMonth() - remainingMonths);
    return date.toISOString().split('T')[0];
  };

  // ─── Сохранение питомца ─────────────────────────────────
  const handleSavePet = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? currentUser?.id;

      if (!userId) {
        Alert.alert(t('errors.notLoggedIn'), t('errors.sessionExpired'), [
          { text: t('auth.ok'), onPress: () => navigation.replace('Login') },
        ]);
        setLoading(false);
        return;
      }

      const petData = {
        owner_id:     userId,
        name:         name.trim(),
        species:      species,
        breed:        breed.trim() || null,
        birth_date:   getBirthDate(age),
        weight:       weight ? parseFloat(weight) : null,
        weight_unit:  'kg',
        gender:       gender.toLowerCase(),
        microchip_id: microchipId.trim() || null,
      };

      const { data, error } = await supabase
        .from('pets')
        .insert([petData])
        .select();

      if (error) {
        console.error('Supabase insert error:', error.message, error.code);

        if (error.code === '23503') {
          Alert.alert(t('errors.authError'), t('errors.authErrorMessage'), [
            { text: t('auth.logOut'), onPress: handleLogout },
            { text: t('cancel'), style: 'cancel' },
          ]);
        } else if (error.code === '23505') {
          Alert.alert(t('errors.duplicate'), t('errors.duplicateMicrochip'));
        } else if (error.code === '42501') {
          Alert.alert(t('errors.permissionDenied'), t('errors.permissionMessage'));
        } else {
          Alert.alert(t('errors.saveFailed'), error.message);
        }
        return;
      }

      Alert.alert(
        t('success.title'),
        t('success.message', { name }),
        [{ text: t('auth.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      console.error('Unexpected error:', e);
      Alert.alert(t('errors.error'), t('errors.unexpected'));
    } finally {
      setLoading(false);
    }
  };

  // ─── Выход ──────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  // ─── Render ─────────────────────────────────────────────
  return (
    <Screen edges={[]}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('addNewPet')}</Text>
          <Text style={styles.subtitle}>{t('subtitle')}</Text>

          {__DEV__ && (
            <Text style={styles.debugText}>
              {currentUser
                ? `✅ User: ${currentUser.id.slice(0, 8)}...`
                : '❌ No user loaded'}
            </Text>
          )}
        </View>

        {/* Form */}
        <View style={styles.form}>

          {/* Имя питомца */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('name')} {t('required')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('namePlaceholder')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholderTextColor={theme.t4}
            />
          </View>

          {/* Вид */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('species')} {t('required')}</Text>
            <View style={styles.optionsGrid}>
              {SPECIES_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionButton,
                    species === option.key && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSpecies(option.key)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      species === option.key && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Пол */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('gender')} {t('required')}</Text>
            <View style={styles.optionsRow}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.genderButton,
                    gender === option.key && styles.optionButtonSelected,
                  ]}
                  onPress={() => setGender(option.key)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      gender === option.key && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Порода */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('breed')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('breedPlaceholder')}
              value={breed}
              onChangeText={setBreed}
              autoCapitalize="words"
              placeholderTextColor={theme.t4}
            />
          </View>

          {/* Возраст и вес */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>{t('age')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('agePlaceholder')}
                value={age}
                onChangeText={setAge}
                keyboardType="decimal-pad"
                placeholderTextColor={theme.t4}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>{t('weight')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('weightPlaceholder')}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholderTextColor={theme.t4}
              />
            </View>
          </View>

          {/* Микрочип */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('microchipId')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('microchipPlaceholder')}
              value={microchipId}
              onChangeText={setMicrochipId}
              keyboardType="numeric"
              placeholderTextColor={theme.t4}
            />
          </View>

          {/* Кнопка сохранения */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSavePet}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.onAccent} size="small" />
                <Text style={styles.saveButtonText}>  {t('saving')}</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>{t('savePet')}</Text>
            )}
          </TouchableOpacity>

          {/* Кнопка отмены */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Hero-шапка — accentPress fill (белый текст ≈AA-крупный); текст onAccent + alpha.
  header: {
    backgroundColor: theme.accentPress,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: theme.onAccent + 'D9',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: theme.font.bold,
    color: theme.onAccent,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.onAccent + 'CC',
  },
  debugText: {
    fontSize: 11,
    color: theme.onAccent + 'B3',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontFamily: theme.font.semibold,
    color: theme.t2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.hairline,
    borderRadius: theme.radii.sm12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.t1,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radii.r20,
    borderWidth: 1.5,
    borderColor: theme.hairline,
    backgroundColor: theme.surface,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.radii.sm12,
    borderWidth: 1.5,
    borderColor: theme.hairline,
    backgroundColor: theme.surface,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: theme.accent,
    backgroundColor: theme.accentTint,
  },
  optionText: {
    fontSize: 14,
    color: theme.t3,
    fontFamily: theme.font.medium,
  },
  optionTextSelected: {
    color: theme.accentPress,
    fontFamily: theme.font.bold,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: theme.accentPress,
    borderRadius: theme.radii.r14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: theme.hairline,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: theme.onAccent,
    fontSize: 17,
    fontFamily: theme.font.bold,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: theme.t3,
    fontSize: 16,
    fontFamily: theme.font.medium,
  },
});
