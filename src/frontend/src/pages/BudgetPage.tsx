import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { BudgetCategory } from "../backend";
import {
  useAllExpenses,
  useBudgetLimitsByMonth,
  useCreateBudgetLimit,
  useDeleteBudgetLimit,
  useUpdateBudgetLimit,
} from "../hooks/useQueries";
import {
  ALL_CATEGORIES,
  CATEGORY_COLORS,
  formatCurrency,
  formatMonthDisplay,
  getCategoryLabel,
  getCurrentMonth,
} from "../utils/categories";

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍽️",
  rent: "🏠",
  electricityBill: "⚡",
  waterCharges: "💧",
  taxes: "🧾",
  maintenance: "🔧",
  education: "📚",
  transport: "🚗",
  medical: "🏥",
  shopping: "🛍️",
  entertainment: "🎬",
  others: "📦",
};

export default function BudgetPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const { data: budgetLimits, isLoading: budgetLoading } =
    useBudgetLimitsByMonth(selectedMonth);
  const { data: allExpenses, isLoading: expLoading } = useAllExpenses();
  const createMutation = useCreateBudgetLimit();
  const updateMutation = useUpdateBudgetLimit();
  const deleteMutation = useDeleteBudgetLimit();

  // local input state: category -> string value
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [savingCat, setSavingCat] = useState<string | null>(null);

  // Sync inputs when budgetLimits loads
  useEffect(() => {
    if (!budgetLimits) return;
    const next: Record<string, string> = {};
    for (const bl of budgetLimits) {
      next[bl.category as string] = String(bl.monthlyLimit);
    }
    setInputs(next);
  }, [budgetLimits]);

  // Calculate spent per category for current month
  const spentByCategory: Partial<Record<BudgetCategory, number>> = {};
  for (const exp of (allExpenses ?? []).filter((e) =>
    e.date.startsWith(selectedMonth),
  )) {
    spentByCategory[exp.category] =
      (spentByCategory[exp.category] ?? 0) + exp.amount;
  }

  const handleSave = async (cat: BudgetCategory) => {
    const val = inputs[cat as string] ?? "";
    const limit = Number.parseFloat(val);
    if (!val || Number.isNaN(limit) || limit <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSavingCat(cat as string);
    try {
      const existing = (budgetLimits ?? []).find((bl) => bl.category === cat);
      if (existing) {
        await updateMutation.mutateAsync({
          id: existing.id,
          category: cat,
          monthlyLimit: limit,
          month: selectedMonth,
        });
      } else {
        await createMutation.mutateAsync({
          category: cat,
          monthlyLimit: limit,
          month: selectedMonth,
        });
      }
      toast.success(`${getCategoryLabel(cat)} budget saved`);
    } catch {
      toast.error("Failed to save budget");
    } finally {
      setSavingCat(null);
    }
  };

  const handleClear = async (cat: BudgetCategory) => {
    const existing = (budgetLimits ?? []).find((bl) => bl.category === cat);
    if (existing) {
      setSavingCat(cat as string);
      try {
        await deleteMutation.mutateAsync(existing.id);
        setInputs((prev) => {
          const n = { ...prev };
          delete n[cat as string];
          return n;
        });
        toast.success(`${getCategoryLabel(cat)} budget cleared`);
      } catch {
        toast.error("Failed to clear budget");
      } finally {
        setSavingCat(null);
      }
    } else {
      setInputs((prev) => {
        const n = { ...prev };
        delete n[cat as string];
        return n;
      });
    }
  };

  const isLoading = budgetLoading || expLoading;

  // Summary totals
  const totalBudget = (budgetLimits ?? []).reduce(
    (s, b) => s + b.monthlyLimit,
    0,
  );
  const totalSpent = Object.values(spentByCategory).reduce(
    (s, v) => s + (v ?? 0),
    0,
  );

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Budget Planning</h2>
          <p className="text-sm text-muted-foreground">
            {formatMonthDisplay(selectedMonth)}
          </p>
        </div>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            setInputs({});
          }}
          className="w-36 text-sm"
          data-ocid="budget.month.input"
        />
      </div>

      {/* Summary bar */}
      {totalBudget > 0 && (
        <Card className="shadow-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Budget</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
              </span>
            </div>
            <Progress
              value={Math.min((totalSpent / totalBudget) * 100, 100)}
              className="h-2.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {((totalSpent / totalBudget) * 100).toFixed(1)}% of total budget
              used
            </p>
          </CardContent>
        </Card>
      )}

      {/* Category grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ALL_CATEGORIES.map((cat) => (
            <Card key={cat}>
              <CardContent className="pt-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          data-ocid="budget.table"
        >
          {ALL_CATEGORIES.map((cat, idx) => {
            const spent = spentByCategory[cat] ?? 0;
            const limitVal = inputs[cat as string] ?? "";
            const limitNum = Number.parseFloat(limitVal);
            const hasLimit = !Number.isNaN(limitNum) && limitNum > 0;
            const pct = hasLimit ? Math.min((spent / limitNum) * 100, 100) : 0;
            const overBudget = hasLimit && spent > limitNum;
            const color = CATEGORY_COLORS[cat];
            const isSaving = savingCat === (cat as string);
            const existing = (budgetLimits ?? []).find(
              (bl) => bl.category === cat,
            );

            return (
              <Card
                key={cat}
                className={`shadow-card transition-all ${
                  overBudget ? "border-destructive" : ""
                }`}
                data-ocid={`budget.item.${idx + 1}`}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {CATEGORY_ICONS[cat as string] ?? "📦"}
                      </span>
                      <span className="font-semibold text-sm">
                        {getCategoryLabel(cat)}
                      </span>
                    </div>
                    {overBudget && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] flex items-center gap-1"
                      >
                        <AlertTriangle className="h-2.5 w-2.5" /> Over
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {/* Amount input */}
                  <div>
                    <label
                      htmlFor={`budget-limit-${cat}`}
                      className="text-xs text-muted-foreground mb-1 block"
                    >
                      Monthly Limit (₹)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter amount"
                      value={limitVal}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [cat as string]: e.target.value,
                        }))
                      }
                      id={`budget-limit-${cat}`}
                      className="h-8 text-sm"
                      data-ocid={`budget.limit.input.${idx + 1}`}
                    />
                  </div>

                  {/* Progress */}
                  {hasLimit && (
                    <div>
                      <Progress
                        value={pct}
                        className={`h-1.5 ${
                          overBudget
                            ? "[&>div]:bg-destructive"
                            : "[&>div]:bg-accent"
                        }`}
                        style={
                          {
                            "--progress-color": color,
                          } as React.CSSProperties
                        }
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-[11px] text-muted-foreground">
                          Spent: {formatCurrency(spent)}
                        </span>
                        <span
                          className={`text-[11px] font-medium ${
                            overBudget
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {overBudget
                            ? `${formatCurrency(Math.abs(limitNum - spent))} over`
                            : `${formatCurrency(limitNum - spent)} left`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => handleSave(cat)}
                      disabled={isSaving}
                      data-ocid={`budget.save_button.${idx + 1}`}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      {existing ? "Update" : "Set"}
                    </Button>
                    {existing && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                        onClick={() => handleClear(cat)}
                        disabled={isSaving}
                        data-ocid={`budget.delete_button.${idx + 1}`}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
