// ══════════════════════════════════════════════════════════════
// src/screens/MedicalHubScreen.js  — «Здоровье» (Medical Hub)
// Перенос композиции из веб-прототипа в React Native.
// Три вида: Список ↔ Календарь ↔ Паспорт (Segmented).
// Использует ваши примитивы: Screen / IconChip / Segmented.
// Все цвета — из theme-токенов; иконки — @expo/vector-icons Ionicons.
//
// ⚠️ ДАННЫЕ: ниже захардкожены демо-массивы (помечены DEMO). Замените их
//    на ваши хуки: useMedicalRecords / usePets / useDashboardStatus и т.п.
//    Разметка/композиция при этом не меняется.
// ══════════════════════════════════════════════════════════════
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import Screen from '../components/Screen';
import IconChip from '../components/IconChip';
import Segmented from '../components/Segmented';

// ─── DEMO данные (заменить на хуки) ───────────────────────────
const DEMO_EVENTS = [
  { id: '1', day: 14, mo: 'июн', type: 'record', cat: 'records', ic: 'medkit-outline', title: 'Визит — дерматит', sub: 'Клиника «Айболит» · д-р Соколова' },
  { id: '2', day: 14, mo: 'июн', type: 'prescription', cat: 'medications', ic: 'medical-outline', title: 'Apoquel · 16 мг', sub: 'раз в день · до 24 июн' },
  { id: '3', day: 12, mo: 'июн', type: 'vaccine', cat: 'vaccines', ic: 'shield-checkmark-outline', title: 'Бешенство (ревакцинация)', sub: 'следующая: 12 авг' },
  { id: '4', day: 2, mo: 'июн', type: 'record', cat: 'records', ic: 'flask-outline', title: 'Анализ крови', sub: 'результат: в норме' },
  { id: '5', day: 5, mo: 'май', type: 'reminder', cat: 'records', ic: 'bug-outline', title: 'Обработка от клещей', sub: 'Bravecto · до 5 июл' },
];
const CAL_MARKS = { 2: ['record'], 12: ['vaccine'], 14: ['record', 'prescription'], 24: ['prescription'], 28: ['appointment'] };
const DEMO_PET = { name: 'Луна', emoji: '🐕', breed: 'Лабрадор-ретривер', age: '3 года', avatar_url: null };

export default function MedicalHubScreen({ navigation }) {
  const { t } = useTranslation('medical');
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [view, setView] = useState('list');     // list | calendar | passport
  const [filter, setFilter] = useState('overview');

  const filters = [
    { k: 'overview', label: t('tabs.overview') },
    { k: 'vaccines', label: t('tabs.vaccines') },
    { k: 'medications', label: t('tabs.medications') },
    { k: 'records', label: t('tabs.records') },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.h1}>{t('header.title')}</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <HeaderBtn theme={theme} name="share-outline" onPress={() => {}} />
            <HeaderBtn theme={theme} name="scan-outline" onPress={() => navigation?.navigate('OCRReview')} />
          </View>
        </View>

        {/* Вид: список / календарь / паспорт */}
        <View style={{ marginBottom: 16 }}>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { k: 'list', label: 'Список' },
              { k: 'calendar', label: 'Календарь' },
              { k: 'passport', label: 'Паспорт' },
            ]}
          />
        </View>

        {view === 'list' && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
              {filters.map((f) => (
                <Chip key={f.k} theme={theme} label={f.label} active={filter === f.k} onPress={() => setFilter(f.k)} />
              ))}
            </ScrollView>
            <Timeline theme={theme} s={s} events={DEMO_EVENTS} filter={filter} onPress={() => navigation?.navigate('RecordDetail')} />
          </>
        )}

        {view === 'calendar' && <CalendarView theme={theme} s={s} onPress={() => navigation?.navigate('RecordDetail')} />}
        {view === 'passport' && <Passport theme={theme} s={s} pet={DEMO_PET} navigation={navigation} />}
      </ScrollView>
    </Screen>
  );
}

// ─── Header button ────────────────────────────────────────────
function HeaderBtn({ theme, name, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: 40, height: 40, borderRadius: theme.radii.pill999, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline,
        alignItems: 'center', justifyContent: 'center', ...theme.shadow }}
    >
      <Ionicons name={name} size={20} color={theme.accent} />
    </Pressable>
  );
}

// ─── Chip (фильтр) ────────────────────────────────────────────
function Chip({ theme, label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: theme.radii.pill999,
        backgroundColor: active ? theme.accent : theme.surface,
        borderWidth: 1, borderColor: active ? theme.accent : theme.hairline }}
    >
      <Text style={{ fontSize: 13, fontFamily: theme.font.semibold, color: active ? theme.onAccent : theme.t2 }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Список (timeline) ────────────────────────────────────────
function Timeline({ theme, s, events, filter, onPress }) {
  const list = events.filter((e) => filter === 'overview' || e.cat === filter);
  return (
    <View style={{ gap: 10 }}>
      {list.map((e) => {
        const ec = theme.eventTypes[e.type];
        return (
          <Pressable key={e.id} onPress={onPress} style={s.card}>
            <View style={s.dateCol}>
              <Text style={s.dateDay}>{e.day}</Text>
              <Text style={s.dateMo}>{e.mo}</Text>
            </View>
            <View style={s.vline} />
            <IconChip name={e.ic} size={20} color={ec} bg={ec + '1f'} />
            <View style={{ flex: 1, marginLeft: 13 }}>
              <Text style={s.cardTitle}>{e.title}</Text>
              <Text style={s.cardSub}>{e.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.t4} />
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Календарь ────────────────────────────────────────────────
function CalendarView({ theme, s, onPress }) {
  const [sel, setSel] = useState(14);
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const legend = [
    { type: 'record', label: 'Визит' }, { type: 'vaccine', label: 'Вакцина' },
    { type: 'prescription', label: 'Лекарство' }, { type: 'appointment', label: 'Приём' },
  ];
  const cells = Array.from({ length: 30 }, (_, i) => i + 1);
  const agenda = DEMO_EVENTS.filter((e) => e.day === sel && e.mo === 'июн');

  return (
    <>
      <View style={[s.solid, { padding: 16, marginBottom: 14 }]}>
        <View style={s.calHead}>
          <Ionicons name="chevron-back" size={20} color={theme.t3} />
          <Text style={s.calMonth}>Июнь 2026</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.t3} />
        </View>
        <View style={s.calRow}>
          {days.map((d) => <Text key={d} style={s.calDow}>{d}</Text>)}
        </View>
        <View style={s.calGrid}>
          {cells.map((d) => {
            const marks = CAL_MARKS[d] || [];
            const on = sel === d;
            return (
              <Pressable key={d} onPress={() => setSel(d)} style={[s.calCell, on && { backgroundColor: theme.accent }]}>
                <Text style={{ fontSize: 13.5, fontFamily: on ? theme.font.bold : theme.font.semibold, color: on ? theme.onAccent : (d === 25 ? theme.accent : theme.t1) }}>{d}</Text>
                <View style={{ flexDirection: 'row', gap: 2, height: 5, marginTop: 3 }}>
                  {marks.map((m, i) => <View key={i} style={{ width: 5, height: 5, borderRadius: theme.radii.pill999, backgroundColor: on ? theme.onAccent : theme.eventTypes[m] }} />)}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={s.legend}>
        {legend.map((l) => (
          <View key={l.type} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 9, height: 9, borderRadius: theme.radii.pill999, backgroundColor: theme.eventTypes[l.type] }} />
            <Text style={s.legendTxt}>{l.label}</Text>
          </View>
        ))}
      </View>

      <Text style={s.section}>События дня</Text>
      {agenda.length ? (
        <Timeline theme={theme} s={s} events={agenda} filter="overview" onPress={onPress} />
      ) : (
        <View style={[s.solid, { padding: 28, alignItems: 'center' }]}>
          <Text style={{ fontSize: 28, marginBottom: 6 }}>📅</Text>
          <Text style={{ fontSize: 14, color: theme.t2, fontFamily: theme.font.semibold }}>Нет событий</Text>
        </View>
      )}
    </>
  );
}

// ─── Паспорт ──────────────────────────────────────────────────
function Passport({ theme, s, pet, navigation }) {
  const info = [
    { ic: 'calendar-outline', label: 'Дата рождения', val: '12 марта 2023' },
    { ic: 'male-outline', label: 'Пол', val: 'Сука · стерилизована' },
    { ic: 'barbell-outline', label: 'Вес', val: '24,5 кг' },
    { ic: 'water-outline', label: 'Группа крови', val: 'DEA 1.1+' },
    { ic: 'hardware-chip-outline', label: 'Микрочип', val: '985112…78903' },
  ];
  const allergies = [
    { name: 'Курица', sev: 'moderate' },
    { name: 'Амоксициллин', sev: 'severe' },
  ];
  const sevColor = { mild: theme.ok, moderate: theme.warn, severe: theme.danger };
  const sevLabel = { mild: 'Лёгкая', moderate: 'Средняя', severe: 'Тяжёлая' };

  return (
    <>
      {/* Hero */}
      <View style={[s.solid, { padding: 20, marginBottom: 14, flexDirection: 'row', alignItems: 'center' }]}>
        <View style={s.avatar}>
          {pet.avatar_url ? <Image source={{ uri: pet.avatar_url }} style={s.avatarImg} /> : <Text style={{ fontSize: 36 }}>{pet.emoji}</Text>}
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={s.petName}>{pet.name}</Text>
          <Text style={s.petBreed}>{pet.breed} · {pet.age}</Text>
        </View>
      </View>

      {/* Аллергии — danger-плашка */}
      <View style={[s.allergyBox, { backgroundColor: theme.danger + '14', borderColor: theme.danger + '40' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Ionicons name="warning" size={19} color={theme.danger} />
          <Text style={{ fontSize: 15, fontFamily: theme.font.bold, color: theme.danger }}>Аллергии</Text>
        </View>
        <View style={{ gap: 8 }}>
          {allergies.map((a, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14.5, fontFamily: theme.font.bold, color: theme.t1 }}>{a.name}</Text>
              <View style={{ backgroundColor: sevColor[a.sev] + '1f', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radii.pill999 }}>
                <Text style={{ fontSize: 12, fontFamily: theme.font.bold, color: sevColor[a.sev] }}>{sevLabel[a.sev]}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Информация */}
      <View style={[s.solid, { paddingHorizontal: 6, paddingVertical: 6, marginBottom: 14 }]}>
        {info.map((it, i) => (
          <View key={i} style={[s.infoRow, i < info.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.hairline }]}>
            <Ionicons name={it.ic} size={20} color={theme.accent} />
            <Text style={{ flex: 1, marginLeft: 13, fontSize: 13.5, color: theme.t2, fontFamily: theme.font.semibold }}>{it.label}</Text>
            <Text style={{ fontSize: 14, fontFamily: theme.font.bold, color: theme.t1 }}>{it.val}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
const makeStyles = (theme) => StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, marginBottom: 8 },
  h1: { fontSize: 26, color: theme.t1, fontFamily: theme.font.bold },
  chipsRow: { gap: 8, paddingBottom: 2, marginBottom: 16 },

  // solid card (данные)
  solid: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline, borderRadius: theme.radii.lg24, ...theme.shadow },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline, borderRadius: theme.radii.lg24,
    padding: 14, flexDirection: 'row', alignItems: 'center', ...theme.shadow },

  dateCol: { minWidth: 38, alignItems: 'center' },
  dateDay: { fontSize: 19, color: theme.t1, lineHeight: 20, fontFamily: theme.font.bold },
  dateMo: { fontSize: 11, color: theme.t3, fontFamily: theme.font.bold, textTransform: 'uppercase' },
  vline: { width: 1, alignSelf: 'stretch', backgroundColor: theme.hairline, marginHorizontal: 13 },
  cardTitle: { fontSize: 14.5, fontFamily: theme.font.bold, color: theme.t1 },
  cardSub: { fontSize: 12.5, color: theme.t2, marginTop: 1 },

  // calendar
  calHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  calMonth: { fontSize: 16, color: theme.t1, fontFamily: theme.font.bold },
  calRow: { flexDirection: 'row', marginBottom: 6 },
  calDow: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: theme.font.bold, color: theme.t3 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, borderRadius: theme.radii.sm12, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16, paddingHorizontal: 4 },
  legendTxt: { fontSize: 12, color: theme.t2, fontFamily: theme.font.semibold },
  section: { fontSize: 18, color: theme.t1, marginBottom: 12, marginTop: 4, fontFamily: theme.font.bold },

  // passport
  avatar: { width: 72, height: 72, borderRadius: theme.radii.pill999, backgroundColor: theme.accentTint, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.accent, overflow: 'hidden' },
  avatarImg: { width: 72, height: 72 },
  petName: { fontSize: 22, color: theme.t1, fontFamily: theme.font.bold },
  petBreed: { fontSize: 14, color: theme.t2 },
  allergyBox: { borderWidth: 1, borderRadius: theme.radii.lg24, padding: 16, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12 },
});
