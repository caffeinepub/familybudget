import { BudgetCategory } from "../backend";

export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  [BudgetCategory.food]: "Food",
  [BudgetCategory.rent]: "Rent",
  [BudgetCategory.electricityBill]: "Electricity Bill",
  [BudgetCategory.waterCharges]: "Water Charges",
  [BudgetCategory.taxes]: "Taxes",
  [BudgetCategory.maintenance]: "Maintenance",
  [BudgetCategory.education]: "Education",
  [BudgetCategory.transport]: "Transport",
  [BudgetCategory.medical]: "Medical",
  [BudgetCategory.shopping]: "Shopping",
  [BudgetCategory.entertainment]: "Entertainment",
  [BudgetCategory.others]: "Others",
};

export const ALL_CATEGORIES = Object.values(BudgetCategory);

export function getCategoryLabel(cat: BudgetCategory): string {
  return CATEGORY_LABELS[cat] ?? cat;
}

export const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  [BudgetCategory.food]: "#22c55e",
  [BudgetCategory.rent]: "#6366f1",
  [BudgetCategory.electricityBill]: "#f59e0b",
  [BudgetCategory.waterCharges]: "#06b6d4",
  [BudgetCategory.taxes]: "#ef4444",
  [BudgetCategory.maintenance]: "#8b5cf6",
  [BudgetCategory.education]: "#3b82f6",
  [BudgetCategory.transport]: "#f97316",
  [BudgetCategory.medical]: "#ec4899",
  [BudgetCategory.shopping]: "#14b8a6",
  [BudgetCategory.entertainment]: "#a855f7",
  [BudgetCategory.others]: "#94a3b8",
};

export function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function formatMonthDisplay(month: string): string {
  const [year, mon] = month.split("-");
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
  }
  return months;
}

export function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
  }
  return months;
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export function shortPrincipal(p: string): string {
  if (p.length <= 12) return p;
  return `${p.slice(0, 5)}...${p.slice(-4)}`;
}
