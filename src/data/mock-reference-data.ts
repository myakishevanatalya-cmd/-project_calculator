import { CalculationState, CostItem, EventType } from "../models/calculation";

export const TAX_PERCENT_DEFAULT = 5;
export const FEE_PERCENT_DEFAULT = 2;

export const EVENT_TYPES: EventType[] = [
  {
    id: "open-house-day",
    name: "День открытых дверей",
    description: "Публичное мероприятие для знакомства с компанией",
    is_open_event: true,
    active: true,
  },
  {
    id: "new-year-events",
    name: "Новогодние мероприятия",
    description: "Сезонные праздничные активности",
    is_open_event: true,
    active: true,
  },
  {
    id: "fairs",
    name: "Ярмарки",
    description: "Выездные и внутренние ярмарочные события",
    is_open_event: true,
    active: true,
  },
  {
    id: "company-birthday",
    name: "День рождения компании",
    description: "Корпоративное событие к дате основания",
    is_open_event: false,
    active: true,
  },
  {
    id: "shor",
    name: "ШОР",
    description: "Формат мероприятий ШОР",
    is_open_event: false,
    active: true,
  },
  {
    id: "online-courses",
    name: "Онлайн-курсы",
    description: "Онлайн-формат обучения и проведения мероприятий",
    is_open_event: true,
    active: true,
  },
  {
    id: "retreats",
    name: "Ретриты",
    description: "Выездные мероприятия с образовательной/восстановительной программой",
    is_open_event: false,
    active: true,
  },
  {
    id: "other",
    name: "Другое",
    description: "Иной формат мероприятия",
    is_open_event: false,
    active: true,
  },
];

export const COST_ITEMS: CostItem[] = [
  {
    id: "equipment",
    code: "EQUIPMENT",
    name: "Оборудование",
    type: "fixed",
    helper_text: "оборудование, техника для событий",
    active: true,
  },
  {
    id: "payroll",
    code: "PAYROLL",
    name: "ФОТ",
    type: "fixed",
    helper_text: "ФОТ людей, напрямую связанных с событием",
    active: true,
  },
  {
    id: "rent",
    code: "RENT",
    name: "Аренда",
    type: "fixed",
    helper_text: "площадки, зала, оборудования и т.д.",
    active: true,
  },
  {
    id: "materials-decor-souvenirs",
    code: "MATERIALS_DECOR_SOUVENIRS",
    name: "Материалы, декор, оформление, сувениры",
    type: "fixed",
    helper_text: "все разовые закупки для проведения события",
    active: true,
  },
  {
    id: "marketing",
    code: "MARKETING",
    name: "Маркетинг",
    type: "fixed",
    helper_text:
      "все затраты, связанные с маркетингом: продвижение, реклама и т.д.",
    active: true,
  },
  {
    id: "other-expenses",
    code: "OTHER_EXPENSES",
    name: "Прочие расходы",
    type: "fixed",
    helper_text: "прочие затраты, не вошедшие в статьи выше",
    active: true,
  },
];

export const EMPTY_CALCULATION_STATE: CalculationState = {
  id: "calc-draft-1",
  event_type_id: null,
  event_name: "",
  participants_count: 0,
  tax_percent: TAX_PERCENT_DEFAULT,
  fee_percent: FEE_PERCENT_DEFAULT,
  lines: [],
  totals: {
    fixed_total: 0,
    variable_total: 0,
    subtotal: 0,
    tax_amount: 0,
    fee_amount: 0,
    grand_total: 0,
    per_participant_total: 0,
  },
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};
