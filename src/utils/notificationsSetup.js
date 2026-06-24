// ══════════════════════════════════════════════════════════════
// src/utils/notificationsSetup.js
// Локальные уведомления по due-событиям. Всё в try/catch — в Expo Go
// нативный модуль может быть недоступен (no-op, без краша). Тест — на
// dev/standalone build.
// Триггер: 09:00 локально в день события. Пере-синхронизация: cancelAll → заново.
// ══════════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import i18n from './i18n';

const ANDROID_CHANNEL = 'default';
const NOTIFY_HOUR = 9;   // 09:00 локально в день события
const MAX_SCHEDULED = 60; // < лимита iOS (64); планируем ближайшие

let _handlerSet = false;
function ensureHandler() {
  if (_handlerSet) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,   // показывать в foreground (старый API)
        shouldShowBanner: true,  // новый API (SDK 51+)
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    _handlerSet = true;
  } catch (_) {
    // Expo Go / модуль недоступен — игнорируем.
  }
}

// Запрос разрешения (мягко: не пере-спрашиваем, если уже отвечено).
// Android — канал по умолчанию. Возвращает статус ('granted'|'denied'|'unavailable'|…).
export async function requestNotificationPermission() {
  try {
    ensureHandler();
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;

    if (status !== 'granted' && current.canAskAgain) {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }

    if (Platform.OS === 'android' && status === 'granted') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    return status;
  } catch (e) {
    console.warn('notifications: permission/setup unavailable (non-fatal):', e?.message);
    return 'unavailable';
  }
}

// 09:00 локально в день события (ymd 'YYYY-MM-DD').
function triggerDate(ymd) {
  if (!ymd) return null;
  const d = new Date(`${ymd}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  d.setHours(NOTIFY_HOUR, 0, 0, 0);
  return d;
}

// Тексты пуша по типу (локализованы, ns notifications.push.*).
function contentFor(ev) {
  const opts = { petName: ev.petName || '', title: ev.title || '' };
  return {
    title: i18n.t(`notifications:push.${ev.type}.title`, { ...opts, defaultValue: ev.title || '' }),
    body: i18n.t(`notifications:push.${ev.type}.body`, { ...opts, defaultValue: '' }),
    data: { id: ev.id, type: ev.type, petId: ev.petId },
  };
}

// Полная пере-синхронизация: отменить всё запланированное и поставить заново
// только будущие события (это же обеспечивает дедуп). Прошедшие не планируем.
export async function scheduleNotificationsFromEvents(events) {
  try {
    ensureHandler();
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    const future = (events || [])
      .map((ev) => ({ ev, when: triggerDate(ev.date) }))
      .filter((x) => x.when && x.when > now)
      .sort((a, b) => a.when - b.when)
      .slice(0, MAX_SCHEDULED);

    for (const { ev, when } of future) {
      await Notifications.scheduleNotificationAsync({
        content: contentFor(ev),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: ANDROID_CHANNEL, // совпадает с создаваемым каналом (Android)
        },
      });
    }
    return future.length;
  } catch (e) {
    console.warn('notifications: scheduling unavailable (non-fatal):', e?.message);
    return 0;
  }
}

// Отменить все запланированные уведомления (guard — no-op в Expo Go).
export async function cancelAllScheduled() {
  try {
    ensureHandler();
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('notifications: cancel unavailable (non-fatal):', e?.message);
  }
}
