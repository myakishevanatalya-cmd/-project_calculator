export const EVENT_TYPES = [
  {
    id: "open-house-day",
    name: "День открытых дверей",
    active: true,
  },
  {
    id: "new-year-events",
    name: "Новогодние мероприятия",
    active: true,
  },
  {
    id: "fairs",
    name: "Ярмарки",
    active: true,
  },
  {
    id: "company-birthday",
    name: "День рождения компании",
    active: true,
  },
  {
    id: "shor",
    name: "ШОР",
    active: true,
  },
  {
    id: "online-courses",
    name: "Онлайн-курсы",
    active: true,
  },
  {
    id: "retreats",
    name: "Ретриты",
    active: true,
  },
  {
    id: "other",
    name: "Другое",
    active: true,
  },
];

export const TAX_PERCENT_DEFAULT = 5;
export const FEE_PERCENT_DEFAULT = 2;

export const COST_ITEMS = [
  {
    id: "equipment",
    code: "EQUIPMENT",
    name: "Оборудование",
    type: "fixed",
    helperText: "оборудование, техника для событий",
    active: true,
  },
  {
    id: "payroll",
    code: "PAYROLL",
    name: "ФОТ",
    type: "fixed",
    helperText: "ФОТ людей, напрямую связанных с событием",
    active: true,
  },
  {
    id: "rent",
    code: "RENT",
    name: "Аренда",
    type: "fixed",
    helperText: "площадки, зала, оборудования и т.д.",
    active: true,
  },
  {
    id: "materials-decor-souvenirs",
    code: "MATERIALS_DECOR_SOUVENIRS",
    name: "Материалы, декор, оформление, сувениры",
    type: "fixed",
    helperText: "все разовые закупки для проведения события",
    active: true,
  },
  {
    id: "marketing",
    code: "MARKETING",
    name: "Маркетинг",
    type: "fixed",
    helperText:
      "все затраты, связанные с маркетингом: продвижение, реклама и т.д.",
    active: true,
  },
  {
    id: "other-expenses",
    code: "OTHER_EXPENSES",
    name: "Прочие расходы",
    type: "fixed",
    helperText: "прочие затраты, не вошедшие в статьи выше",
    active: true,
  },
  {
    id: "souvenirs-per-participant",
    code: "SOUVENIRS_PER_PARTICIPANT",
    name: "Сувениры на участника",
    type: "variable_per_participant",
    helperText: "переменные затраты на одного участника",
    active: true,
  },
  {
    id: "food-per-participant",
    code: "FOOD_PER_PARTICIPANT",
    name: "Питание на участника",
    type: "variable_per_participant",
    helperText: "переменные затраты на одного участника",
    active: true,
  },
];
