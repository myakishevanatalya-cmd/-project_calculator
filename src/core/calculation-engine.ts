import { CostItemType } from "../models/calculation";

export type ScenarioName = "minimum" | "plan" | "maximum";
export type ScenarioStatus = "Убыток" | "Окупаемость" | "Прибыль";

export interface CostComponent {
  type: CostItemType;
  amount: number;
}

export interface ScenarioParticipants {
  minimum: number;
  plan: number;
  maximum: number;
}

export interface TicketPriceInput {
  fixed_costs_total: number;
  variable_cost_per_participant: number;
  target_margin_percent: number;
  tax_percent: number;
  fee_percent: number;
  plan_participants: number;
}

export interface ScenarioResult {
  scenario: ScenarioName;
  participants: number;
  ticket_price: number;
  revenue: number;
  variable_costs: number;
  fixed_costs: number;
  total_costs: number;
  profit: number;
  margin_percent: number;
  cost_per_participant: number;
  status: ScenarioStatus;
}

export interface BreakEvenResult {
  ok: boolean;
  participants_break_even: number | null;
  message: string | null;
}

export interface ScenarioCalculationInput {
  participants: ScenarioParticipants;
  fixed_costs_total: number;
  variable_cost_per_participant: number;
  ticket_price: number;
}

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite non-negative number`);
  }
}

export function summarizeCosts(items: CostComponent[]): {
  fixed_total: number;
  variable_per_participant_total: number;
} {
  return items.reduce(
    (acc, item) => {
      if (item.type === "fixed") {
        acc.fixed_total += item.amount;
      } else {
        acc.variable_per_participant_total += item.amount;
      }
      return acc;
    },
    { fixed_total: 0, variable_per_participant_total: 0 },
  );
}

export function calculateTicketPrice(input: TicketPriceInput): number {
  assertFiniteNonNegative(input.fixed_costs_total, "fixed_costs_total");
  assertFiniteNonNegative(
    input.variable_cost_per_participant,
    "variable_cost_per_participant",
  );
  assertFiniteNonNegative(input.target_margin_percent, "target_margin_percent");
  assertFiniteNonNegative(input.tax_percent, "tax_percent");
  assertFiniteNonNegative(input.fee_percent, "fee_percent");
  assertFiniteNonNegative(input.plan_participants, "plan_participants");

  if (input.plan_participants <= 0) {
    throw new Error("plan_participants must be greater than 0");
  }

  const targetMarginRate = input.target_margin_percent / 100;
  const deductionsRate = (input.tax_percent + input.fee_percent) / 100;
  const netRevenueFactor = 1 - deductionsRate;
  const marginCoverageFactor = 1 - targetMarginRate;

  if (netRevenueFactor <= 0) {
    throw new Error("tax_percent + fee_percent must be less than 100");
  }

  if (marginCoverageFactor <= 0) {
    throw new Error("target_margin_percent must be less than 100");
  }

  const totalPlanCosts =
    input.fixed_costs_total +
    input.variable_cost_per_participant * input.plan_participants;
  const requiredNetRevenue = totalPlanCosts / marginCoverageFactor;
  const ticketPrice =
    requiredNetRevenue / (input.plan_participants * netRevenueFactor);

  return ticketPrice;
}

export function calculateScenarioStatus(marginPercent: number): ScenarioStatus {
  if (marginPercent < 0) {
    return "Убыток";
  }
  if (Math.abs(marginPercent) <= 1) {
    return "Окупаемость";
  }
  return "Прибыль";
}

export function calculateScenario(
  scenario: ScenarioName,
  participants: number,
  fixedCostsTotal: number,
  variableCostPerParticipant: number,
  ticketPrice: number,
): ScenarioResult {
  if (participants <= 0) {
    throw new Error(`${scenario} participants must be greater than 0`);
  }

  const revenue = ticketPrice * participants;
  const variableCosts = variableCostPerParticipant * participants;
  const totalCosts = fixedCostsTotal + variableCosts;
  const profit = revenue - totalCosts;
  const marginPercent = revenue === 0 ? 0 : (profit / revenue) * 100;
  const costPerParticipant = totalCosts / participants;

  return {
    scenario,
    participants,
    ticket_price: ticketPrice,
    revenue,
    variable_costs: variableCosts,
    fixed_costs: fixedCostsTotal,
    total_costs: totalCosts,
    profit,
    margin_percent: marginPercent,
    cost_per_participant: costPerParticipant,
    status: calculateScenarioStatus(marginPercent),
  };
}

export function calculateThreeScenarios(
  input: ScenarioCalculationInput,
): Record<ScenarioName, ScenarioResult> {
  const { minimum, plan, maximum } = input.participants;

  return {
    minimum: calculateScenario(
      "minimum",
      minimum,
      input.fixed_costs_total,
      input.variable_cost_per_participant,
      input.ticket_price,
    ),
    plan: calculateScenario(
      "plan",
      plan,
      input.fixed_costs_total,
      input.variable_cost_per_participant,
      input.ticket_price,
    ),
    maximum: calculateScenario(
      "maximum",
      maximum,
      input.fixed_costs_total,
      input.variable_cost_per_participant,
      input.ticket_price,
    ),
  };
}

export function calculateBreakEvenParticipants(
  fixedCostsTotal: number,
  variableCostPerParticipant: number,
  ticketPrice: number,
  taxPercent: number,
  feePercent: number,
): BreakEvenResult {
  assertFiniteNonNegative(fixedCostsTotal, "fixedCostsTotal");
  assertFiniteNonNegative(
    variableCostPerParticipant,
    "variableCostPerParticipant",
  );
  assertFiniteNonNegative(ticketPrice, "ticketPrice");
  assertFiniteNonNegative(taxPercent, "taxPercent");
  assertFiniteNonNegative(feePercent, "feePercent");

  const deductionsRate = (taxPercent + feePercent) / 100;
  const netTicketPrice = ticketPrice * (1 - deductionsRate);
  const denominator = netTicketPrice - variableCostPerParticipant;

  if (denominator <= 0) {
    return {
      ok: false,
      participants_break_even: null,
      message:
        "Конструкция убыточна при любом количестве участников: чистая цена билета не покрывает переменные затраты.",
    };
  }

  return {
    ok: true,
    participants_break_even: fixedCostsTotal / denominator,
    message: null,
  };
}
