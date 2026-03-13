import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BudgetCategory, type BudgetLimit } from "../backend";
import {
  useAllExpenses,
  useBudgetLimitsByMonth,
  useCreateBudgetLimit,
  useDeleteBudgetLimit,
  useUpdateBudgetLimit,
} from "../hooks/useQueries";
import {
  ALL_CATEGORIES,
  formatCurrency,
  formatMonthDisplay,
  getCategoryLabel,
  getCurrentMonth,
} from "../utils/categories";

export default function BudgetPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const { data: budgetLimits, isLoading: budgetLoading } =
    useBudgetLimitsByMonth(selectedMonth);
  const { data: allExpenses, isLoading: expLoading } = useAllExpenses();
  const createMutation = useCreateBudgetLimit();
  const updateMutation = useUpdateBudgetLimit();
  const deleteMutation = useDeleteBudgetLimit();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<BudgetLimit | null>(null);
  const [formCategory, setFormCategory] = useState<BudgetCategory>(
    BudgetCategory.food,
  );
  const [formLimit, setFormLimit] = useState("");
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  // Calculate spent per category
  const spentByCategory: Partial<Record<BudgetCategory, number>> = {};
  for (const exp of (allExpenses ?? []).filter((e) =>
    e.date.startsWith(selectedMonth),
  )) {
    spentByCategory[exp.category] =
      (spentByCategory[exp.category] ?? 0) + exp.amount;
  }

  const openCreate = () => {
    setEditItem(null);
    setFormCategory(BudgetCategory.food);
    setFormLimit("");
    setDialogOpen(true);
  };

  const openEdit = (item: BudgetLimit) => {
    setEditItem(item);
    setFormCategory(item.category);
    setFormLimit(String(item.monthlyLimit));
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = Number.parseFloat(formLimit);
    if (Number.isNaN(limit) || limit <= 0) {
      toast.error("Invalid limit");
      return;
    }
    try {
      if (editItem) {
        await updateMutation.mutateAsync({
          id: editItem.id,
          category: formCategory,
          monthlyLimit: limit,
          month: selectedMonth,
        });
        toast.success("Budget limit updated");
      } else {
        await createMutation.mutateAsync({
          category: formCategory,
          monthlyLimit: limit,
          month: selectedMonth,
        });
        toast.success("Budget limit created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save budget limit");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Budget limit deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isLoading = budgetLoading || expLoading;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Budget Planning</h2>
          <p className="text-sm text-muted-foreground">
            {formatMonthDisplay(selectedMonth)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-36 text-sm"
            data-ocid="budget.month.input"
          />
          <Button onClick={openCreate} data-ocid="budget.add_button">
            <Plus className="h-4 w-4 mr-1" /> Add Limit
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (budgetLimits ?? []).length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="budget.empty_state"
        >
          <p className="font-medium">No budget limits set for this month</p>
          <p className="text-sm mt-1">
            Click "Add Limit" to set spending limits per category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(budgetLimits ?? []).map((item, idx) => {
            const spent = spentByCategory[item.category] ?? 0;
            const remaining = item.monthlyLimit - spent;
            const pct = Math.min((spent / item.monthlyLimit) * 100, 100);
            const overBudget = spent > item.monthlyLimit;
            return (
              <Card
                key={String(item.id)}
                className={`shadow-card ${overBudget ? "border-destructive" : ""}`}
                data-ocid={`budget.item.${idx + 1}`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">
                          {getCategoryLabel(item.category)}
                        </p>
                        {overBudget && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] flex items-center gap-1"
                          >
                            <AlertTriangle className="h-2.5 w-2.5" /> Over
                            Budget
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(spent)} of{" "}
                        {formatCurrency(item.monthlyLimit)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(item)}
                        data-ocid={`budget.edit_button.${idx + 1}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(item.id)}
                        data-ocid={`budget.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Progress
                    value={pct}
                    className={`h-2 ${overBudget ? "[&>div]:bg-destructive" : "[&>div]:bg-accent"}`}
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-muted-foreground">
                      {pct.toFixed(0)}% used
                    </span>
                    <span
                      className={`text-xs font-medium ${overBudget ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {overBudget
                        ? `${formatCurrency(Math.abs(remaining))} over`
                        : `${formatCurrency(remaining)} left`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="budget.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editItem ? "Edit Budget Limit" : "Set Budget Limit"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formCategory}
                onValueChange={(v) => setFormCategory(v as BudgetCategory)}
                disabled={!!editItem}
              >
                <SelectTrigger data-ocid="budget.category.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monthly Limit (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formLimit}
                onChange={(e) => setFormLimit(e.target.value)}
                required
                data-ocid="budget.limit.input"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="budget.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-ocid="budget.submit_button"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editItem ? "Update" : "Set Limit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-ocid="budget.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Budget Limit?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="budget.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-ocid="budget.delete.confirm_button"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
