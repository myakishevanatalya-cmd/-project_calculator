const EVENT_TYPES = [
  { id: "open-house-day", name: "День открытых дверей", active: true },
  { id: "new-year-events", name: "Новогодние мероприятия", active: true },
  { id: "fairs", name: "Ярмарки", active: true },
  { id: "company-birthday", name: "День рождения компании", active: true },
  { id: "shor", name: "ШОР", active: true },
  { id: "online-courses", name: "Онлайн-курсы", active: true },
  { id: "retreats", name: "Ретриты", active: true },
  { id: "other", name: "Другое", active: true },
];

const TAX_PERCENT_DEFAULT = 5;
const FEE_PERCENT_DEFAULT = 2;

const COST_ITEMS = [
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

const SCENARIO_ORDER = ["minimum", "plan", "maximum"];
const SCENARIO_LABELS = {
  minimum: "Минимум",
  plan: "План",
  maximum: "Максимум",
};

function summarizeCosts(costLines) {
  return costLines.reduce(
    (acc, line) => {
      if (line.type === "fixed") {
        acc.fixedTotal += line.amount;
      } else {
        acc.variablePerParticipantTotal += line.amount;
      }
      return acc;
    },
    { fixedTotal: 0, variablePerParticipantTotal: 0 },
  );
}

function calculateTicketPrice({
  fixedCostsTotal,
  variableCostPerParticipant,
  targetMarginPercent,
  taxPercent,
  feePercent,
  planParticipants,
}) {
  if (planParticipants <= 0) {
    return null;
  }
  const targetMarginRate = targetMarginPercent / 100;
  const netFactor = 1 - (taxPercent + feePercent) / 100;
  const marginFactor = 1 - targetMarginRate;
  if (netFactor <= 0 || marginFactor <= 0) {
    return null;
  }
  const totalPlanCosts =
    fixedCostsTotal + variableCostPerParticipant * planParticipants;
  const requiredNetRevenue = totalPlanCosts / marginFactor;
  const price = requiredNetRevenue / (planParticipants * netFactor);
  return Number.isFinite(price) ? price : null;
}

function calculateScenarioStatus(marginPercent) {
  if (marginPercent < 0) {
    return "Убыток";
  }
  if (Math.abs(marginPercent) <= 1) {
    return "Окупаемость";
  }
  return "Прибыль";
}

function calculateScenario({
  name,
  participants,
  ticketPrice,
  fixedCostsTotal,
  variableCostPerParticipant,
}) {
  if (participants <= 0 || ticketPrice === null) {
    return null;
  }
  const revenue = ticketPrice * participants;
  const variableCosts = variableCostPerParticipant * participants;
  const totalCosts = fixedCostsTotal + variableCosts;
  const profit = revenue - totalCosts;
  const marginPercent = revenue === 0 ? 0 : (profit / revenue) * 100;
  const costPerParticipant = totalCosts / participants;
  return {
    name,
    participants,
    ticketPrice,
    revenue,
    variableCosts,
    fixedCosts: fixedCostsTotal,
    totalCosts,
    profit,
    marginPercent,
    costPerParticipant,
    status: calculateScenarioStatus(marginPercent),
  };
}

function calculateBreakEven({
  fixedCostsTotal,
  variableCostPerParticipant,
  ticketPrice,
  taxPercent,
  feePercent,
}) {
  if (ticketPrice === null) {
    return {
      ok: false,
      participants: null,
      message:
        "Недостаточно данных для расчета точки безубыточности. Проверьте входные значения.",
    };
  }
  const netTicketPrice = ticketPrice * (1 - (taxPercent + feePercent) / 100);
  const denominator = netTicketPrice - variableCostPerParticipant;
  if (denominator <= 0) {
    return {
      ok: false,
      participants: null,
      message:
        "Конструкция убыточна при любом количестве участников: чистая цена билета не покрывает переменные затраты.",
    };
  }
  return {
    ok: true,
    participants: fixedCostsTotal / denominator,
    message: null,
  };
}

const form = document.getElementById("event-params-form");
const eventTypeSelect = document.getElementById("event-type");
const scenarioWarning = document.getElementById("scenario-order-warning");
const costLinesContainer = document.getElementById("cost-lines");
const costStructureError = document.getElementById("cost-structure-error");
const addCostLineButton = document.getElementById("add-cost-line-btn");
const targetMarginInput = document.getElementById("target-margin");
const taxPercentInput = document.getElementById("tax-percent");
const feePercentInput = document.getElementById("fee-percent");
const breakEvenMessage = document.getElementById("break-even-message");
const clearFormButton = document.getElementById("clear-form-btn");
const saveDraftButton = document.getElementById("save-draft-btn");
const exportExcelButton = document.getElementById("export-excel-btn");
const exportPdfButton = document.getElementById("export-pdf-btn");
const themeButtons = Array.from(document.querySelectorAll(".theme-btn"));

const scenarioRowMap = {
  minimum: document.getElementById("scenario-minimum-row"),
  plan: document.getElementById("scenario-plan-row"),
  maximum: document.getElementById("scenario-maximum-row"),
};

const appState = {
  lastCalculation: null,
};

const fieldConfigs = [
  {
    inputId: "event-name",
    errorId: "event-name-error",
    validate: (value) => value.trim().length > 0,
    message: "Поле обязательно для заполнения",
  },
  {
    inputId: "event-type",
    errorId: "event-type-error",
    validate: (value) => value.trim().length > 0,
    message: "Выберите тип мероприятия",
  },
  {
    inputId: "start-date",
    errorId: "date-range-error",
    validate: (value) => value.trim().length > 0,
    message: "Укажите дату начала периода",
  },
  {
    inputId: "end-date",
    errorId: "date-range-error",
    validate: (value) => value.trim().length > 0,
    message: "Укажите дату окончания периода",
  },
  {
    inputId: "participants-min",
    errorId: "participants-min-error",
    validate: (value) => Number.isInteger(Number(value)) && Number(value) > 0,
    message: "Введите целое число больше 0",
  },
  {
    inputId: "participants-plan",
    errorId: "participants-plan-error",
    validate: (value) => Number.isInteger(Number(value)) && Number(value) > 0,
    message: "Введите целое число больше 0",
  },
  {
    inputId: "participants-max",
    errorId: "participants-max-error",
    validate: (value) => Number.isInteger(Number(value)) && Number(value) > 0,
    message: "Введите целое число больше 0",
  },
  {
    inputId: "target-margin",
    errorId: "target-margin-error",
    validate: (value) =>
      value.trim().length > 0 && Number.isFinite(Number(value)),
    message: "Введите числовое значение маржи",
  },
];

function getEventTypeNameById(id) {
  const item = EVENT_TYPES.find((eventType) => eventType.id === id);
  return item ? item.name : "";
}

function getCostItemById(itemId) {
  return COST_ITEMS.find((item) => item.id === itemId) || null;
}

function getScenarioLabel(scenarioKey) {
  return SCENARIO_LABELS[scenarioKey] || scenarioKey;
}

function formatMoney(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return `${value.toLocaleString("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} ₽`;
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatIsoDate(dateStr) {
  if (!dateStr) {
    return "-";
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }
  return date.toLocaleDateString("ru-RU");
}

function formatPeriod(startDate, endDate) {
  if (!startDate || !endDate) {
    return "-";
  }
  if (startDate === endDate) {
    return formatIsoDate(startDate);
  }
  return `${formatIsoDate(startDate)} - ${formatIsoDate(endDate)}`;
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function populateEventTypes() {
  const existingValues = new Set(
    Array.from(eventTypeSelect.options).map((option) => option.value),
  );
  EVENT_TYPES.filter((item) => item.active).forEach((item) => {
    if (existingValues.has(item.id)) {
      return;
    }
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    eventTypeSelect.append(option);
  });
}

function populateDefaults() {
  targetMarginInput.value = "20";
  taxPercentInput.value = String(TAX_PERCENT_DEFAULT);
  feePercentInput.value = String(FEE_PERCENT_DEFAULT);
}

function setFieldState(input, errorElement, isValid, errorMessage) {
  input.classList.toggle("invalid", !isValid);
  if (!isValid) {
    errorElement.textContent = errorMessage;
    return;
  }
  errorElement.textContent = "";
}

function validateScenarioOrder() {
  const min = Number(document.getElementById("participants-min").value);
  const plan = Number(document.getElementById("participants-plan").value);
  const max = Number(document.getElementById("participants-max").value);

  if (!min || !plan || !max) {
    scenarioWarning.textContent = "";
    return true;
  }

  if (min <= plan && plan <= max) {
    scenarioWarning.textContent = "";
    return true;
  }

  scenarioWarning.textContent =
    "Нарушен порядок сценариев: должно выполняться условие минимум ≤ план ≤ максимум.";
  return false;
}

function validateDateRange() {
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");
  const error = document.getElementById("date-range-error");

  if (!startDateInput.value || !endDateInput.value) {
    return false;
  }

  if (startDateInput.value <= endDateInput.value) {
    error.textContent = "";
    endDateInput.classList.remove("invalid");
    return true;
  }

  error.textContent = "Дата окончания не может быть раньше даты начала";
  endDateInput.classList.add("invalid");
  return false;
}

function createCostItemSelect() {
  const select = document.createElement("select");
  select.className = "cost-item-select";
  select.required = true;

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Выберите статью";
  select.append(emptyOption);

  COST_ITEMS.filter((item) => item.active).forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    select.append(option);
  });

  return select;
}

function refreshCostRowBySelectedItem(row) {
  const select = row.querySelector(".cost-item-select");
  const typeInput = row.querySelector(".cost-item-type");
  const amountHelper = row.querySelector(".cost-item-amount-helper");
  const itemHelper = row.querySelector(".cost-item-helper");
  const commentHelper = row.querySelector(".cost-item-comment-helper");
  const commentInput = row.querySelector(".cost-item-comment");
  const commentLabel = row.querySelector(".comment-label");
  const selectedItem = getCostItemById(select.value);

  if (!selectedItem) {
    typeInput.value = "";
    itemHelper.textContent = "";
    amountHelper.textContent = "Укажите сумму";
    commentHelper.textContent = "Комментарий необязателен";
    commentLabel.innerHTML = "Комментарий";
    commentInput.required = false;
    return;
  }

  typeInput.value =
    selectedItem.type === "fixed"
      ? "Фиксированная"
      : "Переменная на участника";

  itemHelper.textContent = selectedItem.helperText;
  amountHelper.textContent =
    selectedItem.type === "fixed"
      ? "Сумма на все мероприятие"
      : "Сумма на одного участника";

  const isOtherExpenses = selectedItem.id === "other-expenses";
  commentLabel.innerHTML = isOtherExpenses
    ? 'Комментарий <span>*</span>'
    : "Комментарий";
  commentInput.required = isOtherExpenses;
  commentHelper.textContent = isOtherExpenses
    ? 'Для статьи "Прочие расходы" комментарий обязателен'
    : "Комментарий необязателен";
}

function createCostRow(rowNumber) {
  const row = document.createElement("article");
  row.className = "cost-row";

  const rowHead = document.createElement("div");
  rowHead.className = "row-head";

  const rowTitle = document.createElement("p");
  rowTitle.className = "row-title";
  rowTitle.textContent = `Статья #${rowNumber}`;
  rowHead.append(rowTitle);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn-danger";
  deleteButton.textContent = "Удалить";
  rowHead.append(deleteButton);

  const rowGrid = document.createElement("div");
  rowGrid.className = "row-grid";

  const costItemField = document.createElement("div");
  costItemField.className = "field";
  const costItemLabel = document.createElement("label");
  costItemLabel.textContent = "Статья затрат *";
  const costItemSelect = createCostItemSelect();
  const costItemHelper = document.createElement("p");
  costItemHelper.className = "helper-text cost-item-helper";
  const costItemError = document.createElement("p");
  costItemError.className = "error-text cost-item-error";
  costItemField.append(costItemLabel, costItemSelect, costItemHelper, costItemError);

  const typeField = document.createElement("div");
  typeField.className = "field";
  const typeLabel = document.createElement("label");
  typeLabel.textContent = "Тип статьи";
  const typeInput = document.createElement("input");
  typeInput.className = "cost-item-type";
  typeInput.type = "text";
  typeInput.readOnly = true;
  const typeHelper = document.createElement("p");
  typeHelper.className = "helper-text";
  typeHelper.textContent = "Определяется по справочнику";
  const typeError = document.createElement("p");
  typeError.className = "error-text";
  typeField.append(typeLabel, typeInput, typeHelper, typeError);

  const amountField = document.createElement("div");
  amountField.className = "field";
  const amountLabel = document.createElement("label");
  amountLabel.textContent = "Сумма *";
  const amountInput = document.createElement("input");
  amountInput.className = "cost-item-amount";
  amountInput.type = "number";
  amountInput.min = "0";
  amountInput.step = "0.01";
  const amountHelper = document.createElement("p");
  amountHelper.className = "helper-text cost-item-amount-helper";
  amountHelper.textContent = "Укажите сумму";
  const amountError = document.createElement("p");
  amountError.className = "error-text cost-item-amount-error";
  amountField.append(amountLabel, amountInput, amountHelper, amountError);

  const commentField = document.createElement("div");
  commentField.className = "field";
  const commentLabel = document.createElement("label");
  commentLabel.className = "comment-label";
  commentLabel.textContent = "Комментарий";
  const commentInput = document.createElement("input");
  commentInput.className = "cost-item-comment";
  commentInput.type = "text";
  const commentHelper = document.createElement("p");
  commentHelper.className = "helper-text cost-item-comment-helper";
  commentHelper.textContent = "Комментарий необязателен";
  const commentError = document.createElement("p");
  commentError.className = "error-text cost-item-comment-error";
  commentField.append(commentLabel, commentInput, commentHelper, commentError);

  rowGrid.append(costItemField, typeField, amountField, commentField);
  row.append(rowHead, rowGrid);

  wireCostRow(row);
  return row;
}

function wireCostRow(row) {
  const deleteButton = row.querySelector(".btn-danger");
  const costItemSelect = row.querySelector(".cost-item-select");
  const amountInput = row.querySelector(".cost-item-amount");
  const commentInput = row.querySelector(".cost-item-comment");

  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      row.remove();
      renumberRows();
      validateCostStructure();
      recalculateAndRender();
    });
  }

  if (costItemSelect) {
    costItemSelect.addEventListener("change", () => {
      refreshCostRowBySelectedItem(row);
      validateCostStructure();
      recalculateAndRender();
    });
  }

  if (amountInput) {
    amountInput.addEventListener("input", () => {
      validateCostStructure();
      recalculateAndRender();
    });
  }

  if (commentInput) {
    commentInput.addEventListener("input", () => {
      validateCostStructure();
    });
  }

  refreshCostRowBySelectedItem(row);
}

function renumberRows() {
  const rows = costLinesContainer.querySelectorAll(".cost-row");
  rows.forEach((row, index) => {
    const title = row.querySelector(".row-title");
    title.textContent = `Статья #${index + 1}`;
  });
}

function clearRowErrors(row) {
  row.querySelectorAll(".error-text").forEach((errorElement) => {
    errorElement.textContent = "";
  });
  row.querySelectorAll("input, select").forEach((input) => {
    input.classList.remove("invalid");
  });
}

function validateCostStructure() {
  let valid = true;
  costStructureError.textContent = "";

  const rows = [...costLinesContainer.querySelectorAll(".cost-row")];
  rows.forEach((row) => {
    clearRowErrors(row);

    const itemSelect = row.querySelector(".cost-item-select");
    const amountInput = row.querySelector(".cost-item-amount");
    const commentInput = row.querySelector(".cost-item-comment");

    const itemError = row.querySelector(".cost-item-error");
    const amountError = row.querySelector(".cost-item-amount-error");
    const commentError = row.querySelector(".cost-item-comment-error");

    const selectedItem = getCostItemById(itemSelect.value);
    if (!selectedItem) {
      valid = false;
      itemSelect.classList.add("invalid");
      itemError.textContent = "Выберите статью затрат";
    }

    const amount = Number(amountInput.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      valid = false;
      amountInput.classList.add("invalid");
      amountError.textContent = "Введите сумму больше 0";
    }

    const isOtherExpenses = selectedItem && selectedItem.id === "other-expenses";
    if (isOtherExpenses && commentInput.value.trim().length === 0) {
      valid = false;
      commentInput.classList.add("invalid");
      commentError.textContent =
        'Для статьи "Прочие расходы" комментарий обязателен';
    }
  });

  return valid;
}

function collectCostLinesDetailed() {
  const rows = [...costLinesContainer.querySelectorAll(".cost-row")];
  const lines = [];

  rows.forEach((row, index) => {
    const itemSelect = row.querySelector(".cost-item-select");
    const amountInput = row.querySelector(".cost-item-amount");
    const commentInput = row.querySelector(".cost-item-comment");
    const item = getCostItemById(itemSelect.value);
    const amount = Number(amountInput.value);

    if (!item) {
      return;
    }

    lines.push({
      row_number: index + 1,
      item_id: item.id,
      item_name: item.name,
      type: item.type,
      helper_text: item.helperText,
      amount: Number.isFinite(amount) ? amount : null,
      comment: commentInput.value.trim(),
    });
  });

  return lines;
}

function collectCostLinesForMath() {
  return collectCostLinesDetailed()
    .filter((line) => Number.isFinite(line.amount) && line.amount > 0)
    .map((line) => ({
      type: line.type,
      amount: line.amount,
    }));
}

function readParticipants() {
  return {
    minimum: Number(document.getElementById("participants-min").value),
    plan: Number(document.getElementById("participants-plan").value),
    maximum: Number(document.getElementById("participants-max").value),
  };
}

function setScenarioRow(row, scenario) {
  const cells = row.querySelectorAll("td[data-key]");
  if (!scenario) {
    cells.forEach((cell) => {
      cell.textContent = "-";
      cell.classList.remove("status-loss", "status-breakeven", "status-profit");
    });
    return;
  }

  const mapping = {
    participants: String(scenario.participants),
    ticketPrice: formatMoney(scenario.ticketPrice, 0),
    revenue: formatMoney(scenario.revenue, 0),
    variableCosts: formatMoney(scenario.variableCosts, 0),
    fixedCosts: formatMoney(scenario.fixedCosts, 0),
    totalCosts: formatMoney(scenario.totalCosts, 0),
    profit: formatMoney(scenario.profit, 0),
    marginPercent: `${formatNumber(scenario.marginPercent, 0)}%`,
    costPerParticipant: formatMoney(scenario.costPerParticipant, 0),
    status: scenario.status,
  };

  cells.forEach((cell) => {
    const key = cell.dataset.key;
    cell.textContent = mapping[key];
    cell.classList.remove("metric-neg", "metric-pos");
    if (key === "profit" || key === "marginPercent") {
      const raw = key === "profit" ? scenario.profit : scenario.marginPercent;
      if (raw < 0) {
        cell.classList.add("metric-neg");
      } else if (raw > 0) {
        cell.classList.add("metric-pos");
      }
    }
    if (key !== "status") {
      return;
    }
    cell.classList.remove("status-loss", "status-breakeven", "status-profit");
    if (scenario.status === "Убыток") {
      cell.classList.add("status-loss");
    } else if (scenario.status === "Окупаемость") {
      cell.classList.add("status-breakeven");
    } else if (scenario.status === "Прибыль") {
      cell.classList.add("status-profit");
    }
  });
}

function resetResultsTable() {
  setScenarioRow(scenarioRowMap.minimum, null);
  setScenarioRow(scenarioRowMap.plan, null);
  setScenarioRow(scenarioRowMap.maximum, null);
  breakEvenMessage.textContent = "Точка безубыточности: -";
  breakEvenMessage.classList.remove("status-loss", "status-profit");
}

function recalculateAndRender() {
  const start = performance.now();

  const participants = readParticipants();
  const margin = Number(targetMarginInput.value);
  const tax = Number(taxPercentInput.value);
  const fee = Number(feePercentInput.value);

  const minParticipantsValid =
    Number.isInteger(participants.minimum) && participants.minimum > 0;
  const planParticipantsValid =
    Number.isInteger(participants.plan) && participants.plan > 0;
  const maxParticipantsValid =
    Number.isInteger(participants.maximum) && participants.maximum > 0;

  const marginValid =
    targetMarginInput.value.trim().length > 0 && Number.isFinite(margin);
  const costs = summarizeCosts(collectCostLinesForMath());

  if (
    !minParticipantsValid ||
    !planParticipantsValid ||
    !maxParticipantsValid ||
    !marginValid
  ) {
    appState.lastCalculation = null;
    resetResultsTable();
    return;
  }

  const ticketPrice = calculateTicketPrice({
    fixedCostsTotal: costs.fixedTotal,
    variableCostPerParticipant: costs.variablePerParticipantTotal,
    targetMarginPercent: margin,
    taxPercent: tax,
    feePercent: fee,
    planParticipants: participants.plan,
  });

  const minimumScenario = calculateScenario({
    name: "minimum",
    participants: participants.minimum,
    ticketPrice,
    fixedCostsTotal: costs.fixedTotal,
    variableCostPerParticipant: costs.variablePerParticipantTotal,
  });
  const planScenario = calculateScenario({
    name: "plan",
    participants: participants.plan,
    ticketPrice,
    fixedCostsTotal: costs.fixedTotal,
    variableCostPerParticipant: costs.variablePerParticipantTotal,
  });
  const maximumScenario = calculateScenario({
    name: "maximum",
    participants: participants.maximum,
    ticketPrice,
    fixedCostsTotal: costs.fixedTotal,
    variableCostPerParticipant: costs.variablePerParticipantTotal,
  });

  setScenarioRow(scenarioRowMap.minimum, minimumScenario);
  setScenarioRow(scenarioRowMap.plan, planScenario);
  setScenarioRow(scenarioRowMap.maximum, maximumScenario);

  const breakEven = calculateBreakEven({
    fixedCostsTotal: costs.fixedTotal,
    variableCostPerParticipant: costs.variablePerParticipantTotal,
    ticketPrice,
    taxPercent: tax,
    feePercent: fee,
  });

  breakEvenMessage.classList.remove("status-loss", "status-profit");
  if (breakEven.ok) {
    breakEvenMessage.textContent = `Точка безубыточности: ${formatNumber(
      breakEven.participants,
    )} участников`;
    breakEvenMessage.classList.add("status-profit");
  } else {
    breakEvenMessage.textContent = breakEven.message;
    breakEvenMessage.classList.add("status-loss");
  }

  appState.lastCalculation = {
    participants,
    margin,
    tax,
    fee,
    costs,
    ticketPrice,
    scenarios: {
      minimum: minimumScenario,
      plan: planScenario,
      maximum: maximumScenario,
    },
    breakEven,
  };

  const elapsed = performance.now() - start;
  console.log(`recalc_ms=${elapsed.toFixed(2)}`);
}

function addCostRow() {
  const nextNumber = costLinesContainer.querySelectorAll(".cost-row").length + 1;
  const row = createCostRow(nextNumber);
  costLinesContainer.append(row);
}

function validateForm() {
  let formValid = true;
  const dateRangeError = document.getElementById("date-range-error");
  dateRangeError.textContent = "";

  fieldConfigs.forEach((fieldConfig) => {
    const input = document.getElementById(fieldConfig.inputId);
    const errorElement = document.getElementById(fieldConfig.errorId);
    const valid = fieldConfig.validate(input.value);
    if (!valid) {
      formValid = false;
    }
    setFieldState(input, errorElement, valid, fieldConfig.message);
  });

  if (!validateDateRange()) {
    formValid = false;
  }

  if (!validateScenarioOrder()) {
    formValid = false;
  }

  if (!validateCostStructure()) {
    formValid = false;
    costStructureError.textContent =
      "Проверьте корректность данных в блоке структуры затрат.";
  }

  return formValid;
}

function resetFormState() {
  form.reset();
  populateDefaults();
  costLinesContainer.innerHTML = "";
  addCostRow();
  fieldConfigs.forEach((fieldConfig) => {
    const errorElement = document.getElementById(fieldConfig.errorId);
    if (errorElement) {
      errorElement.textContent = "";
    }
  });
  scenarioWarning.textContent = "";
  costStructureError.textContent = "";
  appState.lastCalculation = null;
  resetResultsTable();
}

function buildExportFileBaseName() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `calc_report_${stamp}`;
}

function applyTheme(themeName) {
  const allowedThemes = new Set(["core", "sun", "leaf", "board"]);
  const safeTheme = allowedThemes.has(themeName) ? themeName : "core";
  if (safeTheme === "core") {
    document.body.removeAttribute("data-theme");
  } else {
    document.body.setAttribute("data-theme", safeTheme);
  }
  themeButtons.forEach((button) => {
    const isActive = button.dataset.theme === safeTheme;
    button.classList.toggle("is-active", isActive);
  });
  try {
    window.localStorage.setItem("calc_theme", safeTheme);
  } catch (_error) {
    // ignore storage errors in restricted environments
  }
}

function initThemeControls() {
  if (themeButtons.length === 0) {
    return;
  }
  let savedTheme = "core";
  try {
    const storageTheme = window.localStorage.getItem("calc_theme");
    if (storageTheme) {
      savedTheme = storageTheme;
    }
  } catch (_error) {
    // ignore storage errors
  }
  applyTheme(savedTheme);
  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(button.dataset.theme || "core");
    });
  });
}

function getCurrentTheme() {
  return document.body.getAttribute("data-theme") || "core";
}

function getPdfPalette() {
  const theme = getCurrentTheme();
  const byTheme = {
    core: {
      heading: "#2f6f82",
      accent: "#69afc6",
      accentAlt: "#a7c552",
      subtitle: "#475467",
      border: "#c5d5dd",
      headBg: "#e8f2f6",
      keyBg: "#edf6fa",
      pageBg: "#ffffff",
      text: "#111827",
    },
    sun: {
      heading: "#8c4e1f",
      accent: "#d88640",
      accentAlt: "#ddb890",
      subtitle: "#5f5b54",
      border: "#d2c2af",
      headBg: "#f7efe8",
      keyBg: "#fbf3eb",
      pageBg: "#fffdfa",
      text: "#1f2937",
    },
    leaf: {
      heading: "#456f39",
      accent: "#a7c552",
      accentAlt: "#c3cf9c",
      subtitle: "#596357",
      border: "#c6d3b0",
      headBg: "#edf3e4",
      keyBg: "#f4f8ef",
      pageBg: "#fcfdf9",
      text: "#1f2937",
    },
    board: {
      heading: "#1f4f5e",
      accent: "#66a9bf",
      accentAlt: "#d88640",
      subtitle: "#4b5563",
      border: "#bac8ce",
      headBg: "#e9eff3",
      keyBg: "#f2f7fa",
      pageBg: "#ffffff",
      text: "#0f172a",
    },
  };
  return byTheme[theme] || byTheme.core;
}

function toExcelArgb(hexColor) {
  return `FF${String(hexColor).replace("#", "").toUpperCase()}`;
}

function setExcelThinBorder(cell, borderArgb) {
  cell.border = {
    top: { style: "thin", color: { argb: borderArgb } },
    left: { style: "thin", color: { argb: borderArgb } },
    bottom: { style: "thin", color: { argb: borderArgb } },
    right: { style: "thin", color: { argb: borderArgb } },
  };
}

function styleExcelHeaderRow(row, palette) {
  const headerBg = toExcelArgb(palette.headBg);
  const border = toExcelArgb(palette.border);
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerBg } };
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: toExcelArgb(palette.text) } };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    setExcelThinBorder(cell, border);
  });
}

function styleExcelDataRange(sheet, fromRow, toRow, fromCol, toCol, palette) {
  const border = toExcelArgb(palette.border);
  for (let r = fromRow; r <= toRow; r += 1) {
    for (let c = fromCol; c <= toCol; c += 1) {
      const cell = sheet.getCell(r, c);
      cell.font = cell.font || { name: "Calibri", size: 10 };
      cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      setExcelThinBorder(cell, border);
    }
  }
}

function downloadBlobFile(fileName, blob) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

async function waitForRenderReady() {
  await new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, 80);
    });
  });
  if (document.fonts && typeof document.fonts.ready?.then === "function") {
    await document.fonts.ready;
  }
}

function getCurrentReportData() {
  const eventName = document.getElementById("event-name").value.trim();
  const eventTypeId = document.getElementById("event-type").value;
  const formatValue = document.getElementById("event-format").value;
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;
  const participants = readParticipants();
  const targetMargin = Number(targetMarginInput.value);
  const taxPercent = Number(taxPercentInput.value);
  const feePercent = Number(feePercentInput.value);
  const costLines = collectCostLinesDetailed();

  return {
    event: {
      name: eventName || "-",
      eventTypeId: eventTypeId || "",
      eventTypeName: getEventTypeNameById(eventTypeId) || "-",
      format: formatValue || "-",
      startDate,
      endDate,
      periodLabel: formatPeriod(startDate, endDate),
    },
    participants: {
      minimum: Number.isInteger(participants.minimum) ? participants.minimum : null,
      plan: Number.isInteger(participants.plan) ? participants.plan : null,
      maximum: Number.isInteger(participants.maximum) ? participants.maximum : null,
    },
    financialInputs: {
      targetMarginPercent: Number.isFinite(targetMargin) ? targetMargin : null,
      taxPercent: Number.isFinite(taxPercent) ? taxPercent : TAX_PERCENT_DEFAULT,
      feePercent: Number.isFinite(feePercent) ? feePercent : FEE_PERCENT_DEFAULT,
    },
    costLines,
    calculation: appState.lastCalculation,
  };
}

function ensureCalculationAvailableForExport(reportData) {
  if (!reportData.calculation) {
    window.alert(
      "Недостаточно данных для экспорта. Заполните обязательные поля и проверьте расчет.",
    );
    return false;
  }
  return true;
}

function exportToExcelFallback(reportData) {
  if (!window.XLSX) {
    window.alert("Библиотека Excel не загружена. Проверьте подключение к интернету.");
    return;
  }
  const workbook = window.XLSX.utils.book_new();
  const scenarioRows = [
    ["Сценарий", "Участники", "Цена билета", "Выручка", "Переменные", "Фиксированные", "Итого", "Прибыль", "Маржа, %", "Себестоимость", "Статус"],
  ];
  SCENARIO_ORDER.forEach((scenarioKey) => {
    const scenario = reportData.calculation.scenarios[scenarioKey];
    scenarioRows.push([
      getScenarioLabel(scenarioKey),
      scenario ? scenario.participants : "-",
      scenario ? Math.round(scenario.ticketPrice) : "-",
      scenario ? Math.round(scenario.revenue) : "-",
      scenario ? Math.round(scenario.variableCosts) : "-",
      scenario ? Math.round(scenario.fixedCosts) : "-",
      scenario ? Math.round(scenario.totalCosts) : "-",
      scenario ? Math.round(scenario.profit) : "-",
      scenario ? Math.round(scenario.marginPercent) : "-",
      scenario ? Math.round(scenario.costPerParticipant) : "-",
      scenario ? scenario.status : "-",
    ]);
  });
  const ws = window.XLSX.utils.aoa_to_sheet(scenarioRows);
  window.XLSX.utils.book_append_sheet(workbook, ws, "Сценарии");
  window.XLSX.writeFile(workbook, `${buildExportFileBaseName()}.xlsx`);
}

async function exportToExcel() {
  const reportData = getCurrentReportData();
  if (!ensureCalculationAvailableForExport(reportData)) {
    return;
  }

  if (!window.ExcelJS) {
    exportToExcelFallback(reportData);
    return;
  }

  try {
    const palette = getPdfPalette();
    const costsDataStartRow = 4;
    const costsDataEndRow = Math.max(
      costsDataStartRow,
      costsDataStartRow + reportData.costLines.length - 1,
    );
    const costsFixedTotalRow = costsDataEndRow + 2;
    const costsVariableTotalRow = costsDataEndRow + 3;
    const workbook = new window.ExcelJS.Workbook();
    workbook.creator = "Калькулятор экономики мероприятий";
    workbook.created = new Date();
    workbook.modified = new Date();

  const wsInputs = workbook.addWorksheet("Inputs", { views: [{ state: "frozen", ySplit: 4 }] });
  const wsCosts = workbook.addWorksheet("Costs", { views: [{ state: "frozen", ySplit: 3 }] });
  const wsScenarios = workbook.addWorksheet("Scenarios", { views: [{ state: "frozen", ySplit: 4 }] });
  const wsReport = workbook.addWorksheet("Report");

  const titleFill = toExcelArgb(palette.accent);
  const titleFont = toExcelArgb("#ffffff");
  const bodyFont = toExcelArgb(palette.text);

  wsInputs.columns = [{ width: 40 }, { width: 44 }];
  wsInputs.mergeCells("A1:B1");
  wsInputs.getCell("A1").value = "Определение стоимости мероприятия (проекта)";
  wsInputs.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: titleFill } };
  wsInputs.getCell("A1").font = { name: "Calibri", size: 14, bold: true, color: { argb: titleFont } };
  wsInputs.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
  wsInputs.getRow(1).height = 26;
  wsInputs.getCell("A2").value = `Сформировано: ${new Date().toLocaleString("ru-RU")}`;
  wsInputs.getCell("A2").font = { name: "Calibri", size: 10, italic: true, color: { argb: toExcelArgb(palette.subtitle) } };
  wsInputs.getCell("A4").value = "Параметр";
  wsInputs.getCell("B4").value = "Значение";
  styleExcelHeaderRow(wsInputs.getRow(4), palette);

  const inputRows = [
    ["Название мероприятия", reportData.event.name],
    ["Тип мероприятия", reportData.event.eventTypeName],
    ["Формат", reportData.event.format],
    ["Дата/период", reportData.event.periodLabel],
    ["Минимум участников", reportData.participants.minimum || 0],
    ["План участников", reportData.participants.plan || 0],
    ["Максимум участников", reportData.participants.maximum || 0],
    ["Целевая маржа, %", reportData.financialInputs.targetMarginPercent || 0],
    ["Налог, %", reportData.financialInputs.taxPercent],
    ["Комиссия, %", reportData.financialInputs.feePercent],
  ];
  let inputRowCursor = 5;
  inputRows.forEach(([name, value]) => {
    wsInputs.getCell(`A${inputRowCursor}`).value = name;
    wsInputs.getCell(`B${inputRowCursor}`).value = value;
    inputRowCursor += 1;
  });
  wsInputs.getCell(`A${inputRowCursor + 1}`).value = "Фиксированные затраты (из Costs)";
  wsInputs.getCell(`B${inputRowCursor + 1}`).value = {
    formula: `Costs!B${costsFixedTotalRow}`,
  };
  wsInputs.getCell(`A${inputRowCursor + 2}`).value = "Переменные на участника (из Costs)";
  wsInputs.getCell(`B${inputRowCursor + 2}`).value = {
    formula: `Costs!B${costsVariableTotalRow}`,
  };
  wsInputs.getCell(`A${inputRowCursor + 3}`).value = "Точка безубыточности X (из Scenarios)";
  wsInputs.getCell(`B${inputRowCursor + 3}`).value = { formula: "Scenarios!B10" };
  styleExcelDataRange(wsInputs, 5, inputRowCursor + 3, 1, 2, palette);
  wsInputs.getCell("B9").numFmt = "0";
  wsInputs.getCell("B10").numFmt = "0";
  wsInputs.getCell("B11").numFmt = "0";
  wsInputs.getCell("B12").numFmt = "0.00";
  wsInputs.getCell("B13").numFmt = "0.00";
  wsInputs.getCell("B14").numFmt = "0.00";
  wsInputs.getCell("B16").numFmt = '#,##0" ₽"';
  wsInputs.getCell("B17").numFmt = '#,##0" ₽"';

  wsCosts.columns = [{ width: 6 }, { width: 38 }, { width: 24 }, { width: 16 }, { width: 42 }];
  wsCosts.mergeCells("A1:E1");
  wsCosts.getCell("A1").value = "Структура затрат";
  wsCosts.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: titleFill } };
  wsCosts.getCell("A1").font = { name: "Calibri", size: 13, bold: true, color: { argb: titleFont } };
  wsCosts.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
  wsCosts.getRow(1).height = 24;
  wsCosts.getRow(3).values = ["#", "Статья", "Тип", "Сумма", "Комментарий"];
  styleExcelHeaderRow(wsCosts.getRow(3), palette);

  const costStartRow = costsDataStartRow;
  reportData.costLines.forEach((line, index) => {
    const rowIndex = costStartRow + index;
    wsCosts.getCell(rowIndex, 1).value = line.row_number;
    wsCosts.getCell(rowIndex, 2).value = line.item_name;
    wsCosts.getCell(rowIndex, 3).value = line.type === "fixed" ? "fixed" : "variable_per_participant";
    wsCosts.getCell(rowIndex, 4).value = Number.isFinite(line.amount) ? line.amount : 0;
    wsCosts.getCell(rowIndex, 5).value = line.comment || "";
  });

  const costEndRow = costsDataEndRow;
  styleExcelDataRange(wsCosts, costStartRow, costEndRow, 1, 5, palette);
  wsCosts.getColumn(4).numFmt = '#,##0" ₽"';
  wsCosts.getCell(`A${costsFixedTotalRow}`).value = "Итоги";
  wsCosts.getCell(`B${costsFixedTotalRow}`).value = {
    formula: 'SUMIFS(D:D,C:C,"fixed")',
  };
  wsCosts.getCell(`A${costsVariableTotalRow}`).value = "Итоги";
  wsCosts.getCell(`B${costsVariableTotalRow}`).value = {
    formula: 'SUMIFS(D:D,C:C,"variable_per_participant")',
  };
  wsCosts.getCell(`C${costsFixedTotalRow}`).value = "fixed_total";
  wsCosts.getCell(`C${costsVariableTotalRow}`).value =
    "variable_total_per_participant";
  [costsFixedTotalRow, costsVariableTotalRow].forEach((r) => {
    wsCosts.getCell(`A${r}`).font = { name: "Calibri", bold: true, size: 11, color: { argb: bodyFont } };
    wsCosts.getCell(`B${r}`).font = { name: "Calibri", bold: true, size: 11, color: { argb: bodyFont } };
    wsCosts.getCell(`C${r}`).font = { name: "Calibri", bold: true, size: 11, color: { argb: bodyFont } };
    wsCosts.getCell(`B${r}`).numFmt = '#,##0" ₽"';
    wsCosts.getCell(`A${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: toExcelArgb(palette.keyBg) } };
    wsCosts.getCell(`B${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: toExcelArgb(palette.keyBg) } };
    wsCosts.getCell(`C${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: toExcelArgb(palette.keyBg) } };
    setExcelThinBorder(wsCosts.getCell(`A${r}`), toExcelArgb(palette.border));
    setExcelThinBorder(wsCosts.getCell(`B${r}`), toExcelArgb(palette.border));
    setExcelThinBorder(wsCosts.getCell(`C${r}`), toExcelArgb(palette.border));
  });

  wsScenarios.columns = [
    { width: 14 },
    { width: 13 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 12 },
    { width: 16 },
    { width: 14 },
  ];
  wsScenarios.mergeCells("A1:K1");
  wsScenarios.getCell("A1").value = "Результаты по сценариям (с формулами)";
  wsScenarios.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: titleFill } };
  wsScenarios.getCell("A1").font = { name: "Calibri", size: 13, bold: true, color: { argb: titleFont } };
  wsScenarios.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
  wsScenarios.getRow(1).height = 24;
  wsScenarios.getRow(3).values = [
    "Сценарий",
    "Участники",
    "Цена билета",
    "Выручка",
    "Переменные",
    "Фиксированные",
    "Полные",
    "Прибыль/убыток",
    "Маржа, %",
    "Себестоимость/чел.",
    "Статус",
  ];
  styleExcelHeaderRow(wsScenarios.getRow(3), palette);

  const scenarioConfig = [
    { key: "minimum", source: "Inputs!B9" },
    { key: "plan", source: "Inputs!B10" },
    { key: "maximum", source: "Inputs!B11" },
  ];
  const scenarioStartRow = 4;
  scenarioConfig.forEach((cfg, index) => {
    const r = scenarioStartRow + index;
    wsScenarios.getCell(`A${r}`).value = getScenarioLabel(cfg.key);
    wsScenarios.getCell(`B${r}`).value = { formula: `=${cfg.source}` };
    wsScenarios.getCell(`C${r}`).value = {
      formula:
        "=((Inputs!B16+Inputs!B17*Inputs!B10)/(1-Inputs!B12/100))/(Inputs!B10*(1-(Inputs!B13+Inputs!B14)/100))",
    };
    wsScenarios.getCell(`D${r}`).value = { formula: `=B${r}*C${r}` };
    wsScenarios.getCell(`E${r}`).value = { formula: `=B${r}*Inputs!B17` };
    wsScenarios.getCell(`F${r}`).value = { formula: "=Inputs!B16" };
    wsScenarios.getCell(`G${r}`).value = { formula: `=E${r}+F${r}` };
    wsScenarios.getCell(`H${r}`).value = { formula: `=D${r}-G${r}` };
    wsScenarios.getCell(`I${r}`).value = { formula: `=IF(D${r}=0,0,H${r}/D${r})` };
    wsScenarios.getCell(`J${r}`).value = { formula: `=IF(B${r}=0,0,G${r}/B${r})` };
    wsScenarios.getCell(`K${r}`).value = {
      formula: `=IF(I${r}<0,"Убыток",IF(ABS(I${r})<=0.01,"Окупаемость","Прибыль"))`,
    };
  });
  styleExcelDataRange(wsScenarios, scenarioStartRow, scenarioStartRow + 2, 1, 11, palette);
  ["C", "D", "E", "F", "G", "H", "J"].forEach((col) => {
    wsScenarios.getColumn(col).numFmt = '#,##0" ₽"';
  });
  wsScenarios.getColumn("I").numFmt = "0%";
  wsScenarios.getColumn("B").numFmt = "0";
  wsScenarios.getCell("A10").value = "Точка безубыточности X";
  wsScenarios.getCell("B10").value = {
    formula:
      '=IF((C5*(1-(Inputs!B13+Inputs!B14)/100)-Inputs!B17)<=0,"Убыточная конструкция",Inputs!B16/(C5*(1-(Inputs!B13+Inputs!B14)/100)-Inputs!B17))',
  };
  wsScenarios.getCell("A11").value = "Точное значение X";
  wsScenarios.getCell("B11").value = {
    formula:
      '=IF((C5*(1-(Inputs!B13+Inputs!B14)/100)-Inputs!B17)<=0,"-",Inputs!B16/(C5*(1-(Inputs!B13+Inputs!B14)/100)-Inputs!B17))',
  };
  wsScenarios.getCell("B11").numFmt = "0.000000";
  styleExcelDataRange(wsScenarios, 10, 11, 1, 2, palette);

  wsReport.columns = [{ width: 44 }, { width: 24 }, { width: 24 }];
  wsReport.mergeCells("A1:C1");
  wsReport.getCell("A1").value = "Готовый отчет для согласования";
  wsReport.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: titleFill } };
  wsReport.getCell("A1").font = { name: "Calibri", size: 14, bold: true, color: { argb: titleFont } };
  wsReport.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
  wsReport.getRow(1).height = 26;
  wsReport.getCell("A2").value = `Проект: ${reportData.event.name}`;
  wsReport.getCell("A3").value = `Период: ${reportData.event.periodLabel}`;
  wsReport.getCell("A4").value = `Тип: ${reportData.event.eventTypeName}`;
  wsReport.getCell("A6").value = "Плановый сценарий";
  wsReport.getCell("B6").value = "Формула";
  wsReport.getCell("C6").value = "Значение";
  styleExcelHeaderRow(wsReport.getRow(6), palette);
  wsReport.getCell("A7").value = "Цена билета";
  wsReport.getCell("B7").value = "Cost-plus pricing";
  wsReport.getCell("C7").value = { formula: "Scenarios!C5" };
  wsReport.getCell("A8").value = "Выручка";
  wsReport.getCell("B8").value = "Цена * участники";
  wsReport.getCell("C8").value = { formula: "Scenarios!D5" };
  wsReport.getCell("A9").value = "Прибыль/убыток";
  wsReport.getCell("B9").value = "Выручка - полные затраты";
  wsReport.getCell("C9").value = { formula: "Scenarios!H5" };
  wsReport.getCell("A10").value = "Маржа, %";
  wsReport.getCell("B10").value = "Прибыль / выручка";
  wsReport.getCell("C10").value = { formula: "Scenarios!I5" };
  wsReport.getCell("A11").value = "Точка безубыточности";
  wsReport.getCell("B11").value = "X = FC / (net_ticket - VC)";
  wsReport.getCell("C11").value = { formula: "Scenarios!B10" };
  styleExcelDataRange(wsReport, 7, 11, 1, 3, palette);
  ["C7", "C8", "C9"].forEach((address) => {
    wsReport.getCell(address).numFmt = '#,##0" ₽"';
  });
  wsReport.getCell("C10").numFmt = "0%";
  wsReport.getCell("A14").value = "Подготовил: _______________________";
  wsReport.getCell("A15").value = "Согласовано: ______________________";
  wsReport.getCell("A16").value = `Дата: ${new Date().toLocaleDateString("ru-RU")}`;
  wsReport.getCell("A14").font = { name: "Calibri", size: 11, color: { argb: bodyFont } };
  wsReport.getCell("A15").font = { name: "Calibri", size: 11, color: { argb: bodyFont } };
  wsReport.getCell("A16").font = { name: "Calibri", size: 11, color: { argb: bodyFont } };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlobFile(`${buildExportFileBaseName()}.xlsx`, blob);
  } catch (error) {
    console.error("Excel export failed, fallback to SheetJS export:", error);
    exportToExcelFallback(reportData);
  }
}

function buildPdfReportElement(reportData) {
  const palette = getPdfPalette();

  const planScenario = reportData.calculation.scenarios.plan;
  const breakEvenText = reportData.calculation.breakEven.ok
    ? `${formatNumber(reportData.calculation.breakEven.participants, 2)} участников`
    : reportData.calculation.breakEven.message;
  const generatedAt = new Date();
  const docDate = generatedAt.toLocaleDateString("ru-RU");
  const docTime = generatedAt.toLocaleTimeString("ru-RU");
  const docNumber = `ECON-${generatedAt.getFullYear()}${String(generatedAt.getMonth() + 1).padStart(2, "0")}${String(generatedAt.getDate()).padStart(2, "0")}-${String(generatedAt.getHours()).padStart(2, "0")}${String(generatedAt.getMinutes()).padStart(2, "0")}`;
  const maxCostRowsInPdf = 8;
  const shownCostLines = reportData.costLines.slice(0, maxCostRowsInPdf);
  const hiddenCostRowsCount = Math.max(0, reportData.costLines.length - shownCostLines.length);
  const fixedTotal = Number(reportData.calculation.costs?.fixedTotal || 0);
  const variableTotalPerParticipant = Number(
    reportData.calculation.costs?.variablePerParticipantTotal || 0,
  );

  const costRowsHtml =
    reportData.costLines.length === 0
      ? `<tr><td colspan="4" style="border:1px solid ${palette.border}; padding:6px;">Нет добавленных статей</td></tr>`
      : shownCostLines
          .map(
            (line) => `
              <tr>
                <td style="border:1px solid ${palette.border}; padding:6px; text-align:center;">${line.row_number}</td>
                <td style="border:1px solid ${palette.border}; padding:6px;">${esc(line.item_name)}</td>
                <td style="border:1px solid ${palette.border}; padding:6px;">${line.type === "fixed" ? "Фиксированная" : "Переменная/уч."}</td>
                <td style="border:1px solid ${palette.border}; padding:6px; text-align:right;">${esc(formatMoney(line.amount || 0, 0))}</td>
              </tr>
            `,
          )
          .join("") +
        (hiddenCostRowsCount > 0
          ? `
          <tr>
            <td style="border:1px solid ${palette.border}; padding:6px; text-align:center;">…</td>
            <td colspan="3" style="border:1px solid ${palette.border}; padding:6px; color:${palette.subtitle};">
              В отчете скрыто еще ${hiddenCostRowsCount} строк(и) затрат для сохранения одностраничного формата.
            </td>
          </tr>
        `
          : "");

  const scenarioRowsHtml = SCENARIO_ORDER
    .map((key) => {
      const scenario = reportData.calculation.scenarios[key];
      if (!scenario) {
        return `<tr><td style="border:1px solid ${palette.border}; padding:6px;">${getScenarioLabel(key)}</td><td colspan="6" style="border:1px solid ${palette.border}; padding:6px;">Недостаточно данных</td></tr>`;
      }
      return `
        <tr>
          <td style="border:1px solid ${palette.border}; padding:6px;">${getScenarioLabel(key)}</td>
          <td style="border:1px solid ${palette.border}; padding:6px; text-align:right;">${scenario.participants}</td>
          <td style="border:1px solid ${palette.border}; padding:6px; text-align:right;">${esc(formatMoney(scenario.ticketPrice, 0))}</td>
          <td style="border:1px solid ${palette.border}; padding:6px; text-align:right;">${esc(formatMoney(scenario.revenue, 0))}</td>
          <td style="border:1px solid ${palette.border}; padding:6px; text-align:right;">${esc(formatMoney(scenario.totalCosts, 0))}</td>
          <td style="border:1px solid ${palette.border}; padding:6px; text-align:right;">${esc(formatMoney(scenario.profit, 0))}</td>
          <td style="border:1px solid ${palette.border}; padding:6px; text-align:right;">${esc(formatNumber(scenario.marginPercent, 0))}%</td>
        </tr>
      `;
    })
    .join("");

  const wrapper = document.createElement("div");
  wrapper.style.width = "760px";
  wrapper.style.padding = "18px 18px 16px";
  wrapper.style.background = palette.pageBg;
  wrapper.style.color = palette.text;
  wrapper.style.fontFamily = '"Segoe UI", Arial, sans-serif';
  wrapper.style.boxSizing = "border-box";
  wrapper.innerHTML = `
    <div style="height:8px; border-radius:6px; background:linear-gradient(90deg, ${palette.accent} 0%, ${palette.accentAlt} 55%, ${palette.heading} 100%); margin-bottom:12px;"></div>
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:10px;">
      <div>
        <h1 style="margin:0 0 4px 0; font-size:24px; line-height:1.2; color:${palette.heading};">Определение стоимости мероприятия (проекта)</h1>
        <p style="margin:0; font-size:12px; color:${palette.subtitle};">Готовый расчетный документ для согласования</p>
      </div>
      <div style="min-width:230px; border:1px solid ${palette.border}; border-radius:10px; padding:8px; background:${palette.keyBg}; font-size:11px;">
        <div style="display:flex; justify-content:space-between; gap:8px;"><span style="color:${palette.subtitle};">Документ:</span><strong>${docNumber}</strong></div>
        <div style="display:flex; justify-content:space-between; gap:8px;"><span style="color:${palette.subtitle};">Дата:</span><strong>${docDate}</strong></div>
        <div style="display:flex; justify-content:space-between; gap:8px;"><span style="color:${palette.subtitle};">Время:</span><strong>${docTime}</strong></div>
      </div>
    </div>

    <table style="width:100%; border-collapse:collapse; margin-bottom:10px; font-size:12px;">
      <tr>
        <td style="width:28%; border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Название</td>
        <td style="border:1px solid ${palette.border}; padding:6px;">${esc(reportData.event.name)}</td>
        <td style="width:20%; border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Тип</td>
        <td style="border:1px solid ${palette.border}; padding:6px;">${esc(reportData.event.eventTypeName)}</td>
      </tr>
      <tr>
        <td style="border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Период</td>
        <td style="border:1px solid ${palette.border}; padding:6px;">${esc(reportData.event.periodLabel)}</td>
        <td style="border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Формат</td>
        <td style="border:1px solid ${palette.border}; padding:6px;">${esc(reportData.event.format)}</td>
      </tr>
      <tr>
        <td style="border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Участники</td>
        <td style="border:1px solid ${palette.border}; padding:6px;" colspan="3">мин ${esc(reportData.participants.minimum || "-")} / план ${esc(reportData.participants.plan || "-")} / макс ${esc(reportData.participants.maximum || "-")}</td>
      </tr>
      <tr>
        <td style="border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Маржа / Налог / Комиссия</td>
        <td style="border:1px solid ${palette.border}; padding:6px;" colspan="3">${esc(reportData.financialInputs.targetMarginPercent || 0)}% / ${esc(reportData.financialInputs.taxPercent)}% / ${esc(reportData.financialInputs.feePercent)}%</td>
      </tr>
      <tr>
        <td style="border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Итого фиксированные / переменные на участника</td>
        <td style="border:1px solid ${palette.border}; padding:6px;" colspan="3">${esc(formatMoney(fixedTotal, 0))} / ${esc(formatMoney(variableTotalPerParticipant, 0))}</td>
      </tr>
    </table>

    <table style="width:100%; border-collapse:collapse; margin-bottom:10px; font-size:12px;">
      <tr>
        <th style="border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">KPI (План)</th>
        <th style="border:1px solid ${palette.border}; padding:6px; background:${palette.keyBg};">Цена билета</th>
        <th style="border:1px solid ${palette.border}; padding:6px; background:${palette.keyBg};">Выручка</th>
        <th style="border:1px solid ${palette.border}; padding:6px; background:${palette.keyBg};">Прибыль/убыток</th>
        <th style="border:1px solid ${palette.border}; padding:6px; background:${palette.keyBg};">Маржа</th>
      </tr>
      <tr>
        <td style="border:1px solid ${palette.border}; padding:6px;">Плановый сценарий</td>
        <td style="border:1px solid ${palette.border}; padding:6px; text-align:right;">${planScenario ? esc(formatMoney(planScenario.ticketPrice, 0)) : "-"}</td>
        <td style="border:1px solid ${palette.border}; padding:6px; text-align:right;">${planScenario ? esc(formatMoney(planScenario.revenue, 0)) : "-"}</td>
        <td style="border:1px solid ${palette.border}; padding:6px; text-align:right;">${planScenario ? esc(formatMoney(planScenario.profit, 0)) : "-"}</td>
        <td style="border:1px solid ${palette.border}; padding:6px; text-align:right;">${planScenario ? `${esc(formatNumber(planScenario.marginPercent, 0))}%` : "-"}</td>
      </tr>
    </table>

    <h2 style="margin:10px 0 6px; font-size:15px; color:${palette.heading};">Структура затрат</h2>
    <table style="width:100%; border-collapse:collapse; margin-bottom:10px; font-size:11px;">
      <thead>
        <tr>
          <th style="width:6%; border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">#</th>
          <th style="border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Статья</th>
          <th style="width:20%; border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Тип</th>
          <th style="width:18%; border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Сумма</th>
        </tr>
      </thead>
      <tbody>${costRowsHtml}</tbody>
    </table>

    <h2 style="margin:10px 0 6px; font-size:15px; color:${palette.heading};">Сценарии</h2>
    <table style="width:100%; border-collapse:collapse; margin-bottom:10px; font-size:11px;">
      <thead>
        <tr>
          <th style="border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Сценарий</th>
          <th style="border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Участники</th>
          <th style="border:1px solid ${palette.border}; padding:6px; background:${palette.keyBg};">Цена</th>
          <th style="border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Выручка</th>
          <th style="border:1px solid ${palette.border}; padding:6px; background:${palette.headBg};">Затраты</th>
          <th style="border:1px solid ${palette.border}; padding:6px; background:${palette.keyBg};">Прибыль</th>
          <th style="border:1px solid ${palette.border}; padding:6px; background:${palette.keyBg};">Маржа</th>
        </tr>
      </thead>
      <tbody>${scenarioRowsHtml}</tbody>
    </table>

    <div style="border:1px solid ${palette.border}; background:${palette.keyBg}; border-radius:8px; padding:8px; margin-bottom:10px; font-size:12px;">
      <strong>Точка безубыточности:</strong> ${esc(breakEvenText)}
    </div>

    <table style="width:100%; border-collapse:collapse; font-size:12px; margin-top:10px;">
      <tr>
        <td style="padding:8px 6px 4px 6px; width:50%;">Подготовил (ФИО/подпись): ______________________</td>
        <td style="padding:8px 6px 4px 6px;">Согласовано (ФИО/подпись): ______________________</td>
      </tr>
      <tr>
        <td style="padding:2px 6px;">Дата: ${docDate}</td>
        <td style="padding:2px 6px;">Должность: ______________________</td>
      </tr>
    </table>
    <p style="margin:8px 0 0 0; font-size:10px; color:${palette.subtitle};">
      Документ сформирован автоматически калькулятором экономики мероприятий. Версия для внутреннего согласования.
    </p>
  `;
  return wrapper;
}

async function exportToPdf() {
  const canUseCanvasPdf =
    typeof window.html2canvas === "function" &&
    window.jspdf &&
    typeof window.jspdf.jsPDF === "function";
  if (!canUseCanvasPdf && !window.html2pdf) {
    window.alert("Библиотека PDF не загружена. Проверьте подключение к интернету.");
    return;
  }

  const reportData = getCurrentReportData();
  if (!ensureCalculationAvailableForExport(reportData)) {
    return;
  }

  const reportElement = buildPdfReportElement(reportData);
  const sandbox = document.createElement("div");
  sandbox.style.position = "fixed";
  sandbox.style.left = "0";
  sandbox.style.top = "0";
  sandbox.style.width = "840px";
  sandbox.style.opacity = "1";
  sandbox.style.pointerEvents = "none";
  sandbox.style.background = "#ffffff";
  sandbox.style.transform = "translateX(-200vw)";
  sandbox.style.zIndex = "2147483647";
  sandbox.append(reportElement);
  document.body.append(sandbox);

  try {
    await waitForRenderReady();

    if (canUseCanvasPdf) {
      const canvas = await window.html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1280,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new window.jspdf.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 6;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      let renderWidth = maxWidth;
      let renderHeight = (canvas.height * renderWidth) / canvas.width;
      if (renderHeight > maxHeight) {
        renderHeight = maxHeight;
        renderWidth = (canvas.width * renderHeight) / canvas.height;
      }
      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;
      pdf.addImage(imgData, "JPEG", x, y, renderWidth, renderHeight);
      pdf.save(`${buildExportFileBaseName()}.pdf`);
      return;
    }

    await window
      .html2pdf()
      .set({
        margin: 6,
        filename: `${buildExportFileBaseName()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1280,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(reportElement)
      .save();
  } catch (error) {
    console.error("PDF export failed:", error);
    window.alert("Не удалось сформировать PDF. Проверьте введенные данные и повторите попытку.");
  } finally {
    sandbox.remove();
  }
}

function initApp() {
  const requiredElements = [
    form,
    eventTypeSelect,
    costLinesContainer,
    addCostLineButton,
    targetMarginInput,
    taxPercentInput,
    feePercentInput,
    clearFormButton,
  ];

  const allPresent = requiredElements.every((element) => !!element);
  if (!allPresent) {
    console.error("UI initialization failed: missing required DOM elements.");
    return;
  }

  fieldConfigs.forEach((fieldConfig) => {
    const input = document.getElementById(fieldConfig.inputId);
    if (!input) {
      return;
    }
    input.addEventListener("input", () => {
      validateForm();
      recalculateAndRender();
    });
  });

  if (addCostLineButton) {
    addCostLineButton.addEventListener("click", () => {
      addCostRow();
    });
  }

  if (clearFormButton) {
    clearFormButton.addEventListener("click", () => {
      const confirmed = window.confirm(
        "Очистить все поля формы и результаты расчета?",
      );
      if (!confirmed) {
        return;
      }
      resetFormState();
    });
  }

  if (saveDraftButton) {
    saveDraftButton.addEventListener("click", () => {
      window.alert("Сохранение будет подключено на этапе интеграции с бэкендом.");
    });
  }

  if (exportExcelButton) {
    exportExcelButton.addEventListener("click", () => {
      recalculateAndRender();
      exportToExcel();
    });
  }

  if (exportPdfButton) {
    exportPdfButton.addEventListener("click", () => {
      recalculateAndRender();
      exportToPdf();
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    validateForm();
    recalculateAndRender();
  });

  populateEventTypes();
  initThemeControls();
  populateDefaults();
  const existingRows = costLinesContainer.querySelectorAll(".cost-row");
  if (existingRows.length > 0) {
    existingRows.forEach((row) => {
      wireCostRow(row);
    });
  } else {
    addCostRow();
  }
  renumberRows();
  recalculateAndRender();
}

try {
  initApp();
} catch (error) {
  console.error("UI initialization failed with exception:", error);
}


