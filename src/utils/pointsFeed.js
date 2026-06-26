// ══════════════════════════════════════════════════════════════
// src/utils/pointsFeed.js
// Разбор строки ленты баллов (user_points). Чистая функция.
// Начисление: points>0, reason = event_key (→ i18n paws.events.*).
// Донат:      points<0, reason = 'Donation to {shelter}' (англ. из SQL make_donation)
//             → извлекаем имя приюта; UI локализует префикс t('activity.feed.donation').
// ══════════════════════════════════════════════════════════════

// Иконка по event_key (общий источник для HowToEarnPaws + ленты «Сводки»).
export const EVENT_ICONS = {
  visit_verified:       'medical-outline',
  vaccination_verified: 'medkit-outline',
  reminder_completed:   'notifications-outline',
  course_completed:     'checkmark-done-outline',
  ocr_document:         'document-text-outline',
  daily_checkin:        'today-outline',
  streak_7:             'flame-outline',
  streak_30:            'flame',
  manual_first:         'create-outline',
  medication_taken:     'bandage-outline',
};

const DONATION_PREFIX = 'Donation to ';

// row: { points, reason, source_type, created_at }
// → { kind: 'donation', shelter } | { kind: 'award', eventKey }
export function parsePointsReason(row) {
  const reason = (row?.reason || '').toString();
  const points = Number(row?.points);

  if (Number.isFinite(points) && points < 0 && reason.startsWith(DONATION_PREFIX)) {
    return { kind: 'donation', shelter: reason.slice(DONATION_PREFIX.length).trim() };
  }
  return { kind: 'award', eventKey: reason };
}
