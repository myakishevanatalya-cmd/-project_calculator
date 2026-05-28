export type CostItemType = "fixed" | "variable_per_participant";

export interface EventType {
  id: string;
  name: string;
  description: string;
  is_open_event: boolean;
  active: boolean;
}

export interface CostItem {
  id: string;
  code: string;
  name: string;
  type: CostItemType;
  helper_text: string;
  active: boolean;
}

export interface CalculationLine {
  id: string;
  cost_item_id: string;
  amount: number;
  note?: string;
}

export interface CalculationState {
  id: string;
  event_type_id: string | null;
  event_name: string;
  participants_count: number;
  tax_percent: number;
  fee_percent: number;
  lines: CalculationLine[];
  totals: {
    fixed_total: number;
    variable_total: number;
    subtotal: number;
    tax_amount: number;
    fee_amount: number;
    grand_total: number;
    per_participant_total: number;
  };
  created_at: string;
  updated_at: string;
}
