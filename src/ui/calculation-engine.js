export function summarizeCosts(costLines) {
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

export function calculateTicketPrice({
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

export function calculateScenarioStatus(marginPercent) {
  if (marginPercent < 0) {
    return "Убыток";
  }
  if (Math.abs(marginPercent) <= 1) {
    return "Окупаемость";
  }
  return "Прибыль";
}

export function calculateScenario({
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

export function calculateBreakEven({
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
