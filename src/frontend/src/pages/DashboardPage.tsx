import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetCategory } from "../backend";
import {
  useAllExpenses,
  useAllIncome,
  useAllSavingsGoals,
  useTotalExpensesForMonth,
  useTotalIncomeForMonth,
} from "../hooks/useQueries";
import {
  CATEGORY_COLORS,
  formatCurrency,
  formatMonthDisplay,
  getCategoryLabel,
  getCurrentMonth,
  getLast6Months,
} from "../utils/categories";

export default function DashboardPage() {
  const currentMonth = getCurrentMonth();
  const { data: allExpenses, isLoading: expLoading } = useAllExpenses();
  const { data: allIncome, isLoading: incLoading } = useAllIncome();
  const { data: savingsGoals } = useAllSavingsGoals();
  const { data: totalIncome } = useTotalIncomeForMonth(currentMonth);
  const { data: totalExpenses } = useTotalExpensesForMonth(currentMonth);

  const income = totalIncome ?? 0;
  const expenses = totalExpenses ?? 0;
  const balance = income - expenses;

  // Pie chart: expenses by category for current month
  const monthExpenses = (allExpenses ?? []).filter((e) =>
    e.date.startsWith(currentMonth),
  );
  const categoryTotals: Partial<Record<BudgetCategory, number>> = {};
  for (const exp of monthExpenses) {
    categoryTotals[exp.category] =
      (categoryTotals[exp.category] ?? 0) + exp.amount;
  }
  const pieData = Object.entries(categoryTotals).map(([cat, amt]) => ({
    name: getCategoryLabel(cat as BudgetCategory),
    value: amt,
    color: CATEGORY_COLORS[cat as BudgetCategory],
  }));

  // Bar chart: last 6 months income vs expenses
  const last6 = getLast6Months();
  const barData = last6.map((month) => {
    const mIncome = (allIncome ?? [])
      .filter((i) => i.date.startsWith(month))
      .reduce((s, i) => s + i.amount, 0);
    const mExpenses = (allExpenses ?? [])
      .filter((e) => e.date.startsWith(month))
      .reduce((s, e) => s + e.amount, 0);
    return {
      month: formatMonthDisplay(month).split(" ")[0].slice(0, 3),
      income: mIncome,
      expenses: mExpenses,
    };
  });

  // Recent expenses
  const recentExpenses = [...(allExpenses ?? [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Savings summary
  const totalSavingsTarget = (savingsGoals ?? []).reduce(
    (s, g) => s + g.targetAmount,
    0,
  );
  const totalSavingsCurrent = (savingsGoals ?? []).reduce(
    (s, g) => s + g.currentAmount,
    0,
  );

  const isLoading = expLoading || incLoading;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Monthly Income"
          value={formatCurrency(income)}
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          loading={isLoading}
          sub={formatMonthDisplay(currentMonth)}
        />
        <SummaryCard
          title="Monthly Expenses"
          value={formatCurrency(expenses)}
          icon={<TrendingDown className="h-4 w-4" />}
          color="text-rose-600"
          bgColor="bg-rose-50"
          loading={isLoading}
          sub={formatMonthDisplay(currentMonth)}
        />
        <SummaryCard
          title="Balance"
          value={formatCurrency(balance)}
          icon={<Wallet className="h-4 w-4" />}
          color={balance >= 0 ? "text-primary" : "text-rose-600"}
          bgColor={balance >= 0 ? "bg-primary/10" : "bg-rose-50"}
          loading={isLoading}
          sub="Income - Expenses"
        />
        <SummaryCard
          title="Savings Progress"
          value={formatCurrency(totalSavingsCurrent)}
          icon={<PiggyBank className="h-4 w-4" />}
          color="text-violet-600"
          bgColor="bg-violet-50"
          loading={isLoading}
          sub={`of ${formatCurrency(totalSavingsTarget)} target`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">
              Expenses by Category
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {formatMonthDisplay(currentMonth)}
            </p>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div
                className="h-48 flex items-center justify-center text-sm text-muted-foreground"
                data-ocid="dashboard.expenses.empty_state"
              >
                No expenses recorded this month
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.color} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend
                    formatter={(v) => <span className="text-xs">{v}</span>}
                    iconSize={10}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">
              Income vs Expenses
            </CardTitle>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend
                  formatter={(v) => (
                    <span className="text-xs capitalize">{v}</span>
                  )}
                />
                <Bar dataKey="income" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base">
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentExpenses.length === 0 ? (
            <p
              className="text-sm text-muted-foreground py-4 text-center"
              data-ocid="dashboard.recent.empty_state"
            >
              No expenses yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map((exp, i) => (
                <div
                  key={String(exp.id)}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  data-ocid={`dashboard.expense.item.${i + 1}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{exp.title}</p>
                    <p className="text-xs text-muted-foreground">{exp.date}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {getCategoryLabel(exp.category)}
                    </Badge>
                    <span className="text-sm font-semibold text-rose-600">
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  color,
  bgColor,
  loading,
  sub,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  loading?: boolean;
  sub?: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className={`text-2xl font-display font-bold mt-1 ${color}`}>
                {value}
              </p>
            )}
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <span className={color}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
