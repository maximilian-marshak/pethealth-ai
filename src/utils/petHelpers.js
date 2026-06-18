// ══════════════════════════════════════════════════
// src/utils/petHelpers.js
// ══════════════════════════════════════════════════

/**
 * Возраст питомца в целых годах по дате рождения.
 * @param {string|Date|null|undefined} birthDate — birth_date из таблицы pets
 * @returns {number|null} целое число лет, либо null если даты нет/некорректна
 */
export function getAgeFromBirthDate(birthDate) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  // День рождения в этом году ещё не наступил — вычитаем год
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age < 0 ? null : age;
}
