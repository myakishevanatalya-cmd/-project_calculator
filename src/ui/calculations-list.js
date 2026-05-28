import { CALCULATIONS_MOCK } from "./calculations-list-data.js";
import { EVENT_TYPES } from "./reference-data.js";

const CALCULATIONS_STORAGE_KEY = "event_calculations_v1";

const tableBody = document.getElementById("calculations-table-body");
const filterEventType = document.getElementById("filter-event-type");
const filterStatus = document.getElementById("filter-status");
const sortButtons = [...document.querySelectorAll(".sort-btn")];

const eventTypeById = EVENT_TYPES.reduce((acc, item) => {
  acc[item.id] = item.name;
  return acc;
}, {});

const state = {
  filter: {
    eventType: "",
    statusCode: "",
  },
  sort: {
    field: "created_at",
    direction: "desc",
  },
};

function parseJsonSafe(value, fallbackValue) {
  if (!value) {
    return fallbackValue;
  }
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallbackValue;
  }
}

function normalizeStatusCode(statusValue) {
  const text = String(statusValue || "").toLowerCase();
  if (text.includes("утверж") || text.includes("approved")) {
    return "approved";
  }
  return "draft";
}

function statusCodeToLabel(statusCode) {
  return statusCode === "approved" ? "утвержден" : "черновик";
}

function readSavedCalculations() {
  try {
    const raw = window.localStorage.getItem(CALCULATIONS_STORAGE_KEY);
    const parsed = parseJsonSafe(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function getAllCalculations() {
  const saved = readSavedCalculations();
  const byId = new Map();

  CALCULATIONS_MOCK.forEach((item) => {
    byId.set(item.id, item);
  });
  saved.forEach((item) => {
    byId.set(item.id, item);
  });

  return [...byId.values()].map((item) => ({
    ...item,
    statusCode: normalizeStatusCode(item.status),
  }));
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} ₽`;
}

function formatDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString("ru-RU");
}

function formatDatePeriod(startDate, endDate) {
  if (!startDate || !endDate) {
    return "-";
  }
  if (startDate === endDate) {
    return formatDate(startDate);
  }
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function sortItems(items, sortField, direction) {
  const factor = direction === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    let left = 0;
    let right = 0;

    if (sortField === "event_date") {
      left = Date.parse(a.period_start);
      right = Date.parse(b.period_start);
    } else if (sortField === "margin") {
      left = Number(a.margin_plan_percent || 0);
      right = Number(b.margin_plan_percent || 0);
    } else if (sortField === "created_at") {
      left = Date.parse(a.created_at);
      right = Date.parse(b.created_at);
    }

    if (left === right) {
      return 0;
    }

    return left > right ? factor : -factor;
  });
}

function filterItems(items, filterModel) {
  return items.filter((item) => {
    const matchType =
      !filterModel.eventType || item.event_type_id === filterModel.eventType;
    const matchStatus =
      !filterModel.statusCode || item.statusCode === filterModel.statusCode;
    return matchType && matchStatus;
  });
}

function buildViewItems() {
  const allItems = getAllCalculations();
  const filtered = filterItems(allItems, state.filter);
  return sortItems(filtered, state.sort.field, state.sort.direction);
}

function rowStatusClass(statusCode) {
  if (statusCode === "approved") {
    return "status-profit";
  }
  return "status-breakeven";
}

function marginClass(margin) {
  if (margin < 0) {
    return "status-loss";
  }
  if (margin <= 1) {
    return "status-breakeven";
  }
  return "status-profit";
}

function renderTable() {
  const items = buildViewItems();

  tableBody.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("tr");
    row.className = "list-row-clickable";
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", `Открыть расчет ${item.title || "без названия"}`);

    row.innerHTML = `
      <td>${item.title || "-"}</td>
      <td>${eventTypeById[item.event_type_id] || "-"}</td>
      <td>${formatDatePeriod(item.period_start, item.period_end)}</td>
      <td>${Number(item.plan_participants || 0)}</td>
      <td>${formatMoney(item.ticket_price_plan)}</td>
      <td class="${marginClass(Number(item.margin_plan_percent || 0))}">${Math.round(
        Number(item.margin_plan_percent || 0),
      )}%</td>
      <td class="${rowStatusClass(item.statusCode)}">${statusCodeToLabel(item.statusCode)}</td>
      <td>${formatDate(item.created_at)}</td>
      <td>${item.author || "-"}</td>
    `;

    const openCalculator = () => {
      window.location.href = `./index.html?calculationId=${encodeURIComponent(item.id)}`;
    };

    row.addEventListener("click", openCalculator);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCalculator();
      }
    });

    tableBody.append(row);
  });
}

function fillEventTypeFilter() {
  EVENT_TYPES.filter((item) => item.active).forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    filterEventType.append(option);
  });
}

function fillStatusFilter() {
  if (!filterStatus) {
    return;
  }
  filterStatus.innerHTML = "";
  [
    { value: "", label: "Все статусы" },
    { value: "draft", label: "черновик" },
    { value: "approved", label: "утвержден" },
  ].forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    filterStatus.append(option);
  });
}

function updateSortButtonLabels() {
  sortButtons.forEach((button) => {
    const baseLabel = button.textContent.replace(/ ↑| ↓/g, "");
    if (button.dataset.sortField === state.sort.field) {
      const arrow = state.sort.direction === "asc" ? " ↑" : " ↓";
      button.textContent = `${baseLabel}${arrow}`;
      return;
    }
    button.textContent = baseLabel;
  });
}

filterEventType.addEventListener("change", () => {
  state.filter.eventType = filterEventType.value;
  renderTable();
});

filterStatus.addEventListener("change", () => {
  state.filter.statusCode = filterStatus.value;
  renderTable();
});

sortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const field = button.dataset.sortField;
    if (state.sort.field === field) {
      state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
    } else {
      state.sort.field = field;
      state.sort.direction = "asc";
    }
    updateSortButtonLabels();
    renderTable();
  });
});

fillEventTypeFilter();
fillStatusFilter();
updateSortButtonLabels();
renderTable();
