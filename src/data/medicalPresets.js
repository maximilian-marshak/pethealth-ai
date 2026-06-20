// src/data/medicalPresets.js
//
// Курированный справочник распространённых в РБ/РФ ветеринарных препаратов,
// вакцин и антипаразитарных средств для автоподстановки (typeahead).
//
// Источник: курированная выборка из официальных реестров ветпрепаратов
// (Департамент ветеринарного и продовольственного надзора РБ — dvpn.gov.by;
//  Государственный реестр ЛС для ветприменения Россельхознадзора — fsvps.gov.ru).
// ВНИМАНИЕ: это сид для UX, НЕ исчерпывающий и не медицинский справочник.
// Перед клиническим использованием/релизом сверить с актуальным официальным
// реестром. Список расширяемый; позже выносится в БД/админку.
//
// Схема:
//   VACCINES        { name, substance (охват/антигены), species }
//   ANTIPARASITICS  { name, substance (действ. вещество), kind, species }
//                   kind: 'ecto' | 'endo' | 'combo'
//                   (маппинг на record_parasite_treatments.kind:
//                    'ecto'->'ectoparasite', 'endo'->'deworming', 'combo'-> оба)
//   DRUGS           { name, substance (действ. вещество), species }
//   species: массив из 'dog' | 'cat'  (пусто/оба = универсально)

export const VACCINES = [
  // Собаки
  { name: 'Нобивак DHPPi', substance: 'чума, аденовироз (гепатит), парвовироз, парагрипп', species: ['dog'] },
  { name: 'Нобивак DHP', substance: 'чума, аденовироз (гепатит), парвовироз', species: ['dog'] },
  { name: 'Нобивак Lepto', substance: 'лептоспироз', species: ['dog'] },
  { name: 'Нобивак L4', substance: 'лептоспироз (4 серогруппы)', species: ['dog'] },
  { name: 'Нобивак KC', substance: 'питомниковый кашель (Bordetella bronchiseptica + парагрипп)', species: ['dog'] },
  { name: 'Нобивак Puppy DP', substance: 'чума, парвовироз (щенки)', species: ['dog'] },
  { name: 'Эурикан DHPPI2-L', substance: 'чума, гепатит, парвовироз, парагрипп, лептоспироз', species: ['dog'] },
  { name: 'Эурикан DHPPI2-LR', substance: 'чума, гепатит, парвовироз, парагрипп, лептоспироз, бешенство', species: ['dog'] },
  { name: 'Вангард Плюс 5 L4 CV', substance: 'комплексная (чума, аденовироз, парво, парагрипп, лептоспироз, короновироз)', species: ['dog'] },
  { name: 'Биокан Novel DHPPi/L4', substance: 'чума, аденовироз, парво, парагрипп, лептоспироз (4)', species: ['dog'] },
  { name: 'Биокан Novel DHPPi/L4R', substance: 'комплексная + бешенство', species: ['dog'] },
  { name: 'Мультикан-4', substance: 'чума, аденовироз, парво, короновироз', species: ['dog'] },
  { name: 'Мультикан-6', substance: 'чума, аденовироз, парво, короновироз, лептоспироз', species: ['dog'] },
  { name: 'Мультикан-8', substance: 'комплексная + бешенство + лептоспироз', species: ['dog'] },
  { name: 'Гексаканивак', substance: 'комплексная для собак', species: ['dog'] },
  { name: 'Дипентавак', substance: 'комплексная + бешенство', species: ['dog'] },
  // Кошки
  { name: 'Пуревакс RCP', substance: 'ринотрахеит, калицивироз, панлейкопения', species: ['cat'] },
  { name: 'Пуревакс RCPCh', substance: 'ринотрахеит, калицивироз, панлейкопения, хламидиоз', species: ['cat'] },
  { name: 'Нобивак Tricat Trio', substance: 'ринотрахеит, калицивироз, панлейкопения', species: ['cat'] },
  { name: 'Нобивак Ducat', substance: 'ринотрахеит, калицивироз', species: ['cat'] },
  { name: 'Феловакс 4', substance: 'панлейкопения, ринотрахеит, калицивироз, хламидиоз', species: ['cat'] },
  { name: 'Мультифел-4', substance: 'панлейкопения, ринотрахеит, калицивироз, хламидиоз', species: ['cat'] },
  { name: 'Квадрикат', substance: 'ринотрахеит, калицивироз, панлейкопения, бешенство', species: ['cat'] },
  { name: 'Фел-О-Вакс', substance: 'панлейкопения, ринотрахеит, калицивироз, хламидиоз', species: ['cat'] },
  // Бешенство (моно), универсальные
  { name: 'Нобивак Rabies', substance: 'бешенство', species: ['dog', 'cat'] },
  { name: 'Рабизин', substance: 'бешенство', species: ['dog', 'cat'] },
  { name: 'Дефенсор 3', substance: 'бешенство', species: ['dog', 'cat'] },
  { name: 'Рабикан', substance: 'бешенство', species: ['dog', 'cat'] },
];

export const ANTIPARASITICS = [
  // Эктопаразиты (блохи/клещи)
  { name: 'Бравекто', substance: 'флураланер', kind: 'ecto', species: ['dog', 'cat'] },
  { name: 'Симпарика', substance: 'сароланер', kind: 'ecto', species: ['dog'] },
  { name: 'Нексгард', substance: 'афоксоланер', kind: 'ecto', species: ['dog'] },
  { name: 'Фронтлайн', substance: 'фипронил', kind: 'ecto', species: ['dog', 'cat'] },
  { name: 'Фронтлайн Комбо', substance: 'фипронил + (S)-метопрен', kind: 'ecto', species: ['dog', 'cat'] },
  { name: 'Адвантикс', substance: 'имидаклоприд + перметрин', kind: 'ecto', species: ['dog'] },
  { name: 'Форесто', substance: 'имидаклоприд + флуметрин (ошейник)', kind: 'ecto', species: ['dog', 'cat'] },
  { name: 'Барс', substance: 'фипронил / перметрин', kind: 'ecto', species: ['dog', 'cat'] },
  { name: 'Рольф Клуб 3D', substance: 'фипронил + перметрин + пирипроксифен', kind: 'ecto', species: ['dog', 'cat'] },
  { name: 'Вектра 3D', substance: 'динотефуран + пирипроксифен + перметрин', kind: 'ecto', species: ['dog'] },
  { name: 'Чистотел', substance: 'фипронил / перметрин', kind: 'ecto', species: ['dog', 'cat'] },
  { name: 'Дана Ультра', substance: 'фипронил + дифлубензурон', kind: 'ecto', species: ['dog', 'cat'] },
  // Комбинированные (экто + эндо/гельминты)
  { name: 'Нексгард Спектра', substance: 'афоксоланер + милбемицина оксим', kind: 'combo', species: ['dog'] },
  { name: 'Адвокат', substance: 'имидаклоприд + моксидектин', kind: 'combo', species: ['dog', 'cat'] },
  { name: 'Стронгхолд', substance: 'селамектин', kind: 'combo', species: ['dog', 'cat'] },
  { name: 'Инспектор', substance: 'фипронил + моксидектин', kind: 'combo', species: ['dog', 'cat'] },
  { name: 'Бродлайн', substance: 'фипронил + (S)-метопрен + эприномектин + празиквантел', kind: 'combo', species: ['cat'] },
  { name: 'Симпарика Трио', substance: 'сароланер + моксидектин + пирантел', kind: 'combo', species: ['dog'] },
  // Гельминты (эндопаразиты)
  { name: 'Дронтал', substance: 'празиквантел + пирантел', kind: 'endo', species: ['cat'] },
  { name: 'Дронтал плюс', substance: 'празиквантел + пирантел + фебантел', kind: 'endo', species: ['dog'] },
  { name: 'Мильбемакс', substance: 'милбемицина оксим + празиквантел', kind: 'endo', species: ['dog', 'cat'] },
  { name: 'Каниквантел плюс', substance: 'празиквантел + фенбендазол', kind: 'endo', species: ['dog', 'cat'] },
  { name: 'Празицид', substance: 'празиквантел + пирантел + фебантел', kind: 'endo', species: ['dog', 'cat'] },
  { name: 'Дирофен', substance: 'пирантел + фебантел + празиквантел', kind: 'endo', species: ['dog', 'cat'] },
  { name: 'Профендер', substance: 'эмодепсид + празиквантел', kind: 'endo', species: ['cat'] },
  { name: 'Дронцит', substance: 'празиквантел', kind: 'endo', species: ['dog', 'cat'] },
  { name: 'Прококс', substance: 'эмодепсид + толтразурил', kind: 'endo', species: ['dog'] },
  { name: 'Гельмимакс', substance: 'моксидектин + празиквантел', kind: 'endo', species: ['dog', 'cat'] },
  { name: 'Фебтал', substance: 'фенбендазол', kind: 'endo', species: ['dog', 'cat'] },
  { name: 'Поливеркан', substance: 'оксибендазол + никлозамид', kind: 'endo', species: ['dog'] },
];

export const DRUGS = [
  // Антибиотики
  { name: 'Синулокс', substance: 'амоксициллин + клавулановая кислота', species: ['dog', 'cat'] },
  { name: 'Кладакса', substance: 'амоксициллин + клавулановая кислота', species: ['dog', 'cat'] },
  { name: 'Амоксиклав', substance: 'амоксициллин + клавулановая кислота', species: ['dog', 'cat'] },
  { name: 'Амоксициллин 15%', substance: 'амоксициллин', species: ['dog', 'cat'] },
  { name: 'Энрофлон', substance: 'энрофлоксацин', species: ['dog', 'cat'] },
  { name: 'Байтрил', substance: 'энрофлоксацин', species: ['dog', 'cat'] },
  { name: 'Энроксил', substance: 'энрофлоксацин', species: ['dog', 'cat'] },
  { name: 'Марбоцил', substance: 'марбофлоксацин', species: ['dog', 'cat'] },
  { name: 'Цефтриаксон', substance: 'цефтриаксон', species: ['dog', 'cat'] },
  { name: 'Цефовецин (Конвения)', substance: 'цефовецин', species: ['dog', 'cat'] },
  { name: 'Доксициклин', substance: 'доксициклин', species: ['dog', 'cat'] },
  { name: 'Метронидазол', substance: 'метронидазол', species: ['dog', 'cat'] },
  { name: 'Тилозин', substance: 'тилозин', species: ['dog', 'cat'] },
  { name: 'Гентамицин', substance: 'гентамицин', species: ['dog', 'cat'] },
  { name: 'Сульф-120/480', substance: 'триметоприм + сульфаниламид', species: ['dog', 'cat'] },
  // НПВС / обезболивающие / противовоспалительные
  { name: 'Мелоксивет', substance: 'мелоксикам', species: ['dog', 'cat'] },
  { name: 'Локсиком', substance: 'мелоксикам', species: ['dog', 'cat'] },
  { name: 'Мелоксидил', substance: 'мелоксикам', species: ['dog', 'cat'] },
  { name: 'Онсиор', substance: 'робенакоксиб', species: ['dog', 'cat'] },
  { name: 'Превикокс', substance: 'фирококсиб', species: ['dog'] },
  { name: 'Римадил', substance: 'карпрофен', species: ['dog'] },
  { name: 'Кетофен', substance: 'кетопрофен', species: ['dog', 'cat'] },
  { name: 'Флексопрофен', substance: 'кетопрофен', species: ['dog', 'cat'] },
  { name: 'Преднизолон', substance: 'преднизолон', species: ['dog', 'cat'] },
  { name: 'Дексаметазон', substance: 'дексаметазон', species: ['dog', 'cat'] },
  // ЖКТ / противорвотные / гепато
  { name: 'Серения', substance: 'маропитант', species: ['dog', 'cat'] },
  { name: 'Церукал', substance: 'метоклопрамид', species: ['dog', 'cat'] },
  { name: 'Омепразол', substance: 'омепразол', species: ['dog', 'cat'] },
  { name: 'Смекта', substance: 'смектит диоктаэдрический', species: ['dog', 'cat'] },
  { name: 'Фортифлора', substance: 'пробиотик (Enterococcus faecium)', species: ['dog', 'cat'] },
  { name: 'Лактобифадол', substance: 'пробиотик', species: ['dog', 'cat'] },
  { name: 'Гептрал', substance: 'адеметионин', species: ['dog', 'cat'] },
  { name: 'Дюфалак', substance: 'лактулоза', species: ['dog', 'cat'] },
  // Антисептики / наружное / уши
  { name: 'Хлоргексидин', substance: 'хлоргексидина биглюконат', species: ['dog', 'cat'] },
  { name: 'Мирамистин', substance: 'бензилдиметил-аммония хлорид', species: ['dog', 'cat'] },
  { name: 'Суролан', substance: 'миконазол + полимиксин B + преднизолон', species: ['dog', 'cat'] },
  { name: 'Ауризон', substance: 'марбофлоксацин + клотримазол + дексаметазон', species: ['dog'] },
  { name: 'Отоксолан', substance: 'ушная суспензия (антибиотик + противогрибковое + ГКС)', species: ['dog', 'cat'] },
  { name: 'Оридермил', substance: 'неомицин + нистатин + триамцинолон + перметрин', species: ['cat'] },
  { name: 'Тетравет', substance: 'окситетрациклин (спрей)', species: ['dog', 'cat'] },
  { name: 'Алюминиум-спрей', substance: 'алюминия порошок (наружно)', species: ['dog', 'cat'] },
  // Прочее распространённое
  { name: 'Гамавит', substance: 'комплекс (аминокислоты, витамины, нуклеинат натрия)', species: ['dog', 'cat'] },
  { name: 'Катозал', substance: 'бутафосфан + цианокобаламин (B12)', species: ['dog', 'cat'] },
  { name: 'Фоспренил', substance: 'фосфорилированные полипренолы', species: ['dog', 'cat'] },
  { name: 'Травматин', substance: 'комплексный (гомеопатический)', species: ['dog', 'cat'] },
  { name: 'Хондартрон', substance: 'комплексный (для суставов)', species: ['dog', 'cat'] },
  { name: 'Веракол', substance: 'комплексный (ЖКТ)', species: ['dog', 'cat'] },
  { name: 'Лиарсин', substance: 'комплексный (ЖКТ/печень)', species: ['dog', 'cat'] },
  { name: 'Дюфалайт', substance: 'инфузионный раствор (электролиты, аминокислоты, глюкоза)', species: ['dog', 'cat'] },
  { name: 'Айсидивит', substance: 'витаминно-минеральный комплекс', species: ['dog', 'cat'] },
];

// Объединённый справочник (для общего поиска при необходимости)
export const ALL_PRESETS = {
  vaccine: VACCINES,
  antiparasitic: ANTIPARASITICS,
  drug: DRUGS,
};

export default ALL_PRESETS;
