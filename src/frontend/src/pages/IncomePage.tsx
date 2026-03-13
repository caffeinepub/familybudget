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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Income } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllIncome,
  useCreateIncome,
  useDeleteIncome,
  useUpdateIncome,
} from "../hooks/useQueries";
import {
  formatCurrency,
  getCurrentMonth,
  shortPrincipal,
} from "../utils/categories";

type FormState = { source: string; amount: string; date: string };
const emptyForm = (): FormState => ({
  source: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
});

export default function IncomePage() {
  const { identity } = useInternetIdentity();
  const { data: incomes, isLoading } = useAllIncome();
  const createMutation = useCreateIncome();
  const updateMutation = useUpdateIncome();
  const deleteMutation = useDeleteIncome();

  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Income | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const filtered = (incomes ?? []).filter(
    (i) => !filterMonth || i.date.startsWith(filterMonth),
  );
  const totalFiltered = filtered.reduce((s, i) => s + i.amount, 0);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (item: Income) => {
    setEditItem(item);
    setForm({
      source: item.source,
      amount: String(item.amount),
      date: item.date,
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
    try {
      if (editItem) {
        await updateMutation.mutateAsync({
          id: editItem.id,
          source: form.source,
          amount,
          date: form.date,
        });
        toast.success("Income updated");
      } else {
        await createMutation.mutateAsync({
          source: form.source,
          amount,
          date: form.date,
        });
        toast.success("Income added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save income");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Income deleted");
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
          <h2 className="font-display text-xl font-bold">Income</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Total:{" "}
            <span className="font-semibold text-emerald-600">
              {formatCurrency(totalFiltered)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-36 text-sm"
            data-ocid="income.month.input"
          />
          <Button onClick={openCreate} data-ocid="income.add_button">
            <Plus className="h-4 w-4 mr-1" /> Add Income
          </Button>
        </div>
      </div>

      <div
        className="rounded-lg border border-border overflow-hidden bg-card shadow-card"
        data-ocid="income.table"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Source</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                  data-ocid="income.empty_state"
                >
                  No income records found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item, idx) => (
                <TableRow
                  key={String(item.id)}
                  data-ocid={`income.row.${idx + 1}`}
                >
                  <TableCell className="font-medium">{item.source}</TableCell>
                  <TableCell className="text-emerald-600 font-semibold">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.addedBy.toString() ===
                    (identity?.getPrincipal().toString() ?? "")
                      ? "You"
                      : shortPrincipal(item.addedBy.toString())}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(item)}
                        data-ocid={`income.edit_button.${idx + 1}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(item.id)}
                        data-ocid={`income.delete_button.${idx + 1}`}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="income.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editItem ? "Edit Income" : "Add Income"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <Input
                placeholder="e.g., Salary, Freelance"
                value={form.source}
                onChange={(e) =>
                  setForm((f) => ({ ...f, source: e.target.value }))
                }
                required
                data-ocid="income.source.input"
              />
            </div>
            <div className="space-y-2">
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
                data-ocid="income.amount.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                required
                data-ocid="income.date.input"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="income.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-ocid="income.submit_button"
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
        <AlertDialogContent data-ocid="income.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="income.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-ocid="income.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
