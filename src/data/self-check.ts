import {
  COST_ITEMS,
  EMPTY_CALCULATION_STATE,
  EVENT_TYPES,
  FEE_PERCENT_DEFAULT,
  TAX_PERCENT_DEFAULT,
} from "./mock-reference-data";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Self-check failed: ${message}`);
  }
}

const requiredEventTypes = [
  "День открытых дверей",
  "Новогодние мероприятия",
  "Ярмарки",
  "День рождения компании",
  "ШОР",
  "Онлайн-курсы",
  "Ретриты",
];

const otherExpenses = COST_ITEMS.find((item) => item.name === "Прочие расходы");

assert(
  otherExpenses?.type === "fixed",
  'У статьи "Прочие расходы" должен быть type = "fixed"',
);
assert(
  otherExpenses?.helper_text === "прочие затраты, не вошедшие в статьи выше",
  'У статьи "Прочие расходы" неверный helper_text',
);

assert(
  requiredEventTypes.every((name) =>
    EVENT_TYPES.some((eventType) => eventType.name === name),
  ),
  "Не все 7 обязательных типов мероприятий присутствуют в EVENT_TYPES",
);

assert(
  TAX_PERCENT_DEFAULT === 5 && FEE_PERCENT_DEFAULT === 2,
  "Константы налога и комиссии должны быть равны 5 и 2 соответственно",
);

console.log("Self-check passed.");
console.log(
  JSON.stringify(
    {
      TAX_PERCENT_DEFAULT,
      FEE_PERCENT_DEFAULT,
      EVENT_TYPES,
      COST_ITEMS,
      EMPTY_CALCULATION_STATE,
    },
    null,
    2,
  ),
);
