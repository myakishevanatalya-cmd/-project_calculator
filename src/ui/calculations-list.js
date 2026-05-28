import { CALCULATIONS_MOCK } from "./calculations-list-data.js";
import { EVENT_TYPES } from "./reference-data.js";

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
    status: "",
  },
  sort: {
    field: "created_at",
    direction: "desc",
  },
};

function formatMoney(value) {
  return `${value.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₽`;
}

function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("ru-RU");
}

function formatDatePeriod(startDate, endDate) {
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
      left = a.margin_plan_percent;
      right = b.margin_plan_percent;
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
    const matchStatus = !filterModel.status || item.status === filterModel.status;
    return matchType && matchStatus;
  });
}

function buildViewItems() {
  const filtered = filterItems(CALCULATIONS_MOCK, state.filter);
  return sortItems(filtered, state.sort.field, state.sort.direction);
}

function rowStatusClass(status) {
  if (status === "утвержден") {
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
    row.setAttribute("aria-label", `Открыть расчет ${item.title}`);

    row.innerHTML = `
      <td>${item.title}</td>
      <td>${eventTypeById[item.event_type_id] || item.event_type_id}</td>
      <td>${formatDatePeriod(item.period_start, item.period_end)}</td>
      <td>${item.plan_participants}</td>
      <td>${formatMoney(item.ticket_price_plan)}</td>
      <td class="${marginClass(item.margin_plan_percent)}">${item.margin_plan_percent.toLocaleString("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%</td>
      <td class="${rowStatusClass(item.status)}">${item.status}</td>
      <td>${formatDate(item.created_at)}</td>
      <td>${item.author}</td>
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
  state.filter.status = filterStatus.value;
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
updateSortButtonLabels();
renderTable();
