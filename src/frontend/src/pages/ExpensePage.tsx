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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BudgetCategory, type Expense } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllExpenses,
  useCreateExpense,
  useDeleteExpense,
  useUpdateExpense,
} from "../hooks/useQueries";
import {
  ALL_CATEGORIES,
  formatCurrency,
  getCategoryLabel,
  getCurrentMonth,
  shortPrincipal,
} from "../utils/categories";

type FormState = {
  title: string;
  amount: string;
  category: BudgetCategory;
  date: string;
  notes: string;
  shareAmount: string;
};

const emptyForm = (): FormState => ({
  title: "",
  amount: "",
  category: BudgetCategory.food,
  date: new Date().toISOString().slice(0, 10),
  notes: "",
  shareAmount: "",
});

export default function ExpensePage() {
  const { identity } = useInternetIdentity();
  const { data: expenses, isLoading } = useAllExpenses();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());
  const [filterCategory, setFilterCategory] = useState<BudgetCategory | "all">(
    "all",
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const filtered = (expenses ?? []).filter((e) => {
    const monthMatch = !filterMonth || e.date.startsWith(filterMonth);
    const catMatch = filterCategory === "all" || e.category === filterCategory;
    return monthMatch && catMatch;
  });
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (item: Expense) => {
    setEditItem(item);
    setForm({
      title: item.title,
      amount: String(item.amount),
      category: item.category,
      date: item.date,
      notes: item.notes,
      shareAmount: item.shareAmount != null ? String(item.shareAmount) : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseFloat(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }
    const shareAmount = form.shareAmount
      ? Number.parseFloat(form.shareAmount)
      : null;
    try {
      if (editItem) {
        await updateMutation.mutateAsync({
          id: editItem.id,
          title: form.title,
          amount,
          category: form.category,
          date: form.date,
          notes: form.notes,
          shareAmount,
        });
        toast.success("Expense updated");
      } else {
        await createMutation.mutateAsync({
          title: form.title,
          amount,
          category: form.category,
          date: form.date,
          notes: form.notes,
          shareAmount,
        });
        toast.success("Expense added");
        if (shareAmount) {
          toast.info(
            `Family members notified of ₹${shareAmount.toFixed(2)} share amount`,
          );
        }
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save expense");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Expenses</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Total:{" "}
            <span className="font-semibold text-rose-600">
              {formatCurrency(totalFiltered)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-36 text-sm"
            data-ocid="expense.month.input"
          />
          <Select
            value={filterCategory}
            onValueChange={(v) =>
              setFilterCategory(v as BudgetCategory | "all")
            }
          >
            <SelectTrigger
              className="w-40 text-sm"
              data-ocid="expense.category.select"
            >
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {ALL_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} data-ocid="expense.add_button">
            <Plus className="h-4 w-4 mr-1" /> Add Expense
          </Button>
        </div>
      </div>

      <div
        className="rounded-lg border border-border overflow-hidden bg-card shadow-card"
        data-ocid="expense.table"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Paid By</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                    data-ocid="expense.empty_state"
                  >
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item, idx) => (
                  <TableRow
                    key={String(item.id)}
                    data-ocid={`expense.row.${idx + 1}`}
                  >
                    <TableCell className="font-medium">
                      <div>
                        {item.title}
                        {item.shareAmount != null && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Share: {formatCurrency(item.shareAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {getCategoryLabel(item.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-rose-600 font-semibold">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.paidBy.toString() ===
                      (identity?.getPrincipal().toString() ?? "")
                        ? "You"
                        : shortPrincipal(item.paidBy.toString())}
                    </TableCell>
                    <TableCell className="max-w-[120px]">
                      <span
                        className="text-xs text-muted-foreground truncate block"
                        title={item.notes}
                      >
                        {item.notes || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(item)}
                          data-ocid={`expense.edit_button.${idx + 1}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}
                          data-ocid={`expense.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-ocid="expense.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editItem ? "Edit Expense" : "Add Expense"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Title</Label>
                <Input
                  placeholder="e.g., Grocery Shopping"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                  data-ocid="expense.title.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  required
                  data-ocid="expense.amount.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                  data-ocid="expense.date.input"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, category: v as BudgetCategory }))
                  }
                >
                  <SelectTrigger data-ocid="expense.form.category.select">
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
              <div className="col-span-2 space-y-1.5">
                <Label>Notes / Remarks</Label>
                <Textarea
                  placeholder="Add any notes or remarks"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  data-ocid="expense.notes.textarea"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Share Amount (₹) — optional
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount to notify family members"
                  value={form.shareAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, shareAmount: e.target.value }))
                  }
                  data-ocid="expense.share.input"
                />
                <p className="text-xs text-muted-foreground">
                  Family members will be notified of this share amount
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="expense.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-ocid="expense.submit_button"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editItem ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-ocid="expense.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="expense.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-ocid="expense.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
