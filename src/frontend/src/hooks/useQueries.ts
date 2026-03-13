import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BudgetCategory, UserProfile } from "../backend";
import { useActor } from "./useActor";

export function useAllExpenses() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["expenses"],
    queryFn: () => actor!.getAllExpenses(),
    enabled: !!actor && !isFetching,
  });
}

export function useAllIncome() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["income"],
    queryFn: () => actor!.getAllIncome(),
    enabled: !!actor && !isFetching,
  });
}

export function useAllSavingsGoals() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["savings"],
    queryFn: () => actor!.getAllSavingsGoals(),
    enabled: !!actor && !isFetching,
  });
}

export function useBudgetLimitsByMonth(month: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["budget", month],
    queryFn: () => actor!.getBudgetLimitsByMonth(month),
    enabled: !!actor && !isFetching,
  });
}

export function useTotalIncomeForMonth(month: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["totalIncome", month],
    queryFn: () => actor!.getTotalIncomeForMonth(month),
    enabled: !!actor && !isFetching,
  });
}

export function useTotalExpensesForMonth(month: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["totalExpenses", month],
    queryFn: () => actor!.getTotalExpensesForMonth(month),
    enabled: !!actor && !isFetching,
  });
}

export function useMyNotifications() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => actor!.getMyNotifications(),
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: () => actor!.isCallerAdmin(),
    enabled: !!actor && !isFetching,
  });
}

// Mutations
export function useCreateExpense() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      title: string;
      amount: number;
      category: BudgetCategory;
      date: string;
      notes: string;
      shareAmount: number | null;
    }) =>
      actor!.createExpense(
        args.title,
        args.amount,
        args.category,
        args.date,
        args.notes,
        args.shareAmount,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useUpdateExpense() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: bigint;
      title: string;
      amount: number;
      category: BudgetCategory;
      date: string;
      notes: string;
      shareAmount: number | null;
    }) =>
      actor!.updateExpense(
        args.id,
        args.title,
        args.amount,
        args.category,
        args.date,
        args.notes,
        args.shareAmount,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useDeleteExpense() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.deleteExpense(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useCreateIncome() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { source: string; amount: number; date: string }) =>
      actor!.createIncome(args.source, args.amount, args.date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["income"] }),
  });
}

export function useUpdateIncome() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: bigint;
      source: string;
      amount: number;
      date: string;
    }) => actor!.updateIncome(args.id, args.source, args.amount, args.date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["income"] }),
  });
}

export function useDeleteIncome() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.deleteIncome(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["income"] }),
  });
}

export function useCreateBudgetLimit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      category: BudgetCategory;
      monthlyLimit: number;
      month: string;
    }) =>
      actor!.createBudgetLimit(args.category, args.monthlyLimit, args.month),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budget"] }),
  });
}

export function useUpdateBudgetLimit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: bigint;
      category: BudgetCategory;
      monthlyLimit: number;
      month: string;
    }) =>
      actor!.updateBudgetLimit(
        args.id,
        args.category,
        args.monthlyLimit,
        args.month,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budget"] }),
  });
}

export function useDeleteBudgetLimit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.deleteBudgetLimit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budget"] }),
  });
}

export function useCreateSavingsGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      name: string;
      targetAmount: number;
      deadline: string;
    }) => actor!.createSavingsGoal(args.name, args.targetAmount, args.deadline),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings"] }),
  });
}

export function useUpdateSavingsGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: bigint;
      name: string;
      targetAmount: number;
      currentAmount: number;
      deadline: string;
    }) =>
      actor!.updateSavingsGoal(
        args.id,
        args.name,
        args.targetAmount,
        args.currentAmount,
        args.deadline,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings"] }),
  });
}

export function useDeleteSavingsGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.deleteSavingsGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings"] }),
  });
}

export function useSaveCallerProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: UserProfile) => actor!.saveCallerUserProfile(profile),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["callerProfile"] }),
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.markNotificationAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
