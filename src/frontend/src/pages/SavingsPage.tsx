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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Pencil,
  Plus,
  PlusCircle,
  Target,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BudgetCategory, type SavingsGoal } from "../backend";
import {
  useAllSavingsGoals,
  useCreateExpense,
  useCreateSavingsGoal,
  useDeleteSavingsGoal,
  useUpdateSavingsGoal,
} from "../hooks/useQueries";
import { formatCurrency } from "../utils/categories";

type FormState = {
  name: string;
  targetAmount: string;
  deadline: string;
  currentAmount?: string;
};
const emptyForm = (): FormState => ({
  name: "",
  targetAmount: "",
  deadline: "",
  currentAmount: "",
});

export default function SavingsPage() {
  const { data: goals, isLoading } = useAllSavingsGoals();
  const createMutation = useCreateSavingsGoal();
  const updateMutation = useUpdateSavingsGoal();
  const deleteMutation = useDeleteSavingsGoal();
  const createExpenseMutation = useCreateExpense();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [updateAmount, setUpdateAmount] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (item: SavingsGoal) => {
    setEditItem(item);
    setForm({
      name: item.name,
      targetAmount: String(item.targetAmount),
      deadline: item.deadline,
      currentAmount: String(item.currentAmount),
    });
    setDialogOpen(true);
  };

  const openUpdate = (item: SavingsGoal) => {
    setSelectedGoal(item);
    setUpdateAmount("");
    setUpdateDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number.parseFloat(form.targetAmount);
    if (Number.isNaN(target) || target <= 0) {
      toast.error("Invalid target amount");
      return;
    }
    if (!form.deadline) {
      toast.error("Deadline is required");
      return;
    }
    try {
      if (editItem) {
        const current = Number.parseFloat(form.currentAmount ?? "0") || 0;
        const prevAmount = editItem.currentAmount;
        await updateMutation.mutateAsync({
          id: editItem.id,
          name: form.name,
          targetAmount: target,
          currentAmount: current,
          deadline: form.deadline,
        });
        // Auto-create expense for the incremental amount saved
        const delta = current - prevAmount;
        if (delta > 0) {
          const today = new Date().toISOString().slice(0, 10);
          await createExpenseMutation.mutateAsync({
            title: `Savings: ${form.name}`,
            amount: delta,
            category: BudgetCategory.others,
            date: today,
            notes: `Auto-added from savings goal: ${form.name}`,
            shareAmount: null,
          });
          toast.success(
            `Savings goal updated & ₹${delta.toFixed(2)} added to expenses`,
          );
        } else {
          toast.success("Savings goal updated");
        }
      } else {
        await createMutation.mutateAsync({
          name: form.name,
          targetAmount: target,
          deadline: form.deadline,
        });
        toast.success("Savings goal created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save goal");
    }
  };

  const handleUpdateAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const addAmount = Number.parseFloat(updateAmount);
    if (Number.isNaN(addAmount) || addAmount <= 0) {
      toast.error("Please enter a valid amount to add");
      return;
    }
    const newTotal = selectedGoal.currentAmount + addAmount;
    try {
      await updateMutation.mutateAsync({
        id: selectedGoal.id,
        name: selectedGoal.name,
        targetAmount: selectedGoal.targetAmount,
        currentAmount: newTotal,
        deadline: selectedGoal.deadline,
      });
      // Auto-create expense for the amount being saved
      const today = new Date().toISOString().slice(0, 10);
      await createExpenseMutation.mutateAsync({
        title: `Savings: ${selectedGoal.name}`,
        amount: addAmount,
        category: BudgetCategory.others,
        date: today,
        notes: `Auto-added from savings goal: ${selectedGoal.name}`,
        shareAmount: null,
      });
      toast.success(
        `₹${addAmount.toFixed(2)} added to savings & recorded in expenses`,
      );
      setUpdateDialogOpen(false);
    } catch {
      toast.error("Failed to update progress");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Savings goal deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Savings Goals</h2>
          <p className="text-sm text-muted-foreground">
            {(goals ?? []).length} goal{(goals ?? []).length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} data-ocid="savings.add_button">
          <Plus className="h-4 w-4 mr-1" /> Add Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (goals ?? []).length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-muted-foreground"
          data-ocid="savings.empty_state"
        >
          <Target className="h-12 w-12 mb-4 opacity-30" />
          <p className="font-medium">No savings goals yet</p>
          <p className="text-sm mt-1">
            Start by creating your first savings goal
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {(goals ?? []).map((goal, idx) => {
            const pct =
              goal.targetAmount > 0
                ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                : 0;
            const daysLeft = Math.ceil(
              (new Date(goal.deadline).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            );
            const achieved = goal.currentAmount >= goal.targetAmount;
            return (
              <Card
                key={String(goal.id)}
                className={`shadow-card ${achieved ? "border-accent" : ""}`}
                data-ocid={`savings.item.${idx + 1}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="font-display text-base leading-tight">
                      {goal.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(goal)}
                        data-ocid={`savings.edit_button.${idx + 1}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(goal.id)}
                        data-ocid={`savings.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {formatCurrency(goal.currentAmount)} /{" "}
                        {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-2.5 ${achieved ? "[&>div]:bg-accent" : "[&>div]:bg-primary"}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{pct.toFixed(0)}% achieved</span>
                      <span>
                        {achieved
                          ? "✅ Goal reached!"
                          : daysLeft > 0
                            ? `${daysLeft} days left`
                            : "Deadline passed"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Deadline: {goal.deadline}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => openUpdate(goal)}
                      data-ocid={`savings.update_button.${idx + 1}`}
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-1" />
                      Add Savings Amount
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="savings.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editItem ? "Edit Goal" : "New Savings Goal"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Goal Name</Label>
              <Input
                placeholder="e.g., Emergency Fund, Family Vacation"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                data-ocid="savings.name.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Target Amount (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.targetAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, targetAmount: e.target.value }))
                }
                required
                data-ocid="savings.target.input"
              />
            </div>
            {editItem && (
              <div className="space-y-2">
                <Label>Current Amount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.currentAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currentAmount: e.target.value }))
                  }
                  data-ocid="savings.current.input"
                />
                <p className="text-xs text-muted-foreground">
                  If you increase this amount, the difference will be
                  automatically added to expenses.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deadline: e.target.value }))
                }
                required
                data-ocid="savings.deadline.input"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="savings.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-ocid="savings.submit_button"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editItem ? "Update" : "Create Goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Savings Amount Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent data-ocid="savings.update.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Add Savings — {selectedGoal?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateAmount} className="space-y-4">
            <div className="space-y-2">
              <Label>Amount to Add (₹)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter amount to save"
                value={updateAmount}
                onChange={(e) => setUpdateAmount(e.target.value)}
                required
                data-ocid="savings.update.input"
              />
              {selectedGoal && (
                <div className="rounded-md bg-muted p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current saved</span>
                    <span className="font-medium">
                      {formatCurrency(selectedGoal.currentAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-medium">
                      {formatCurrency(selectedGoal.targetAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    This amount will also be automatically recorded in your
                    expenses.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUpdateDialogOpen(false)}
                data-ocid="savings.update.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  updateMutation.isPending || createExpenseMutation.isPending
                }
                data-ocid="savings.update.submit_button"
              >
                {(updateMutation.isPending ||
                  createExpenseMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save & Add to Expenses
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-ocid="savings.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="savings.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-ocid="savings.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
