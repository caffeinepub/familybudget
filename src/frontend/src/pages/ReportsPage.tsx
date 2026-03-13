import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetCategory } from "../backend";
import { useAllExpenses, useAllIncome } from "../hooks/useQueries";
import {
  CATEGORY_COLORS,
  formatCurrency,
  formatMonthDisplay,
  getCategoryLabel,
  getCurrentMonth,
  getLast12Months,
} from "../utils/categories";

export default function ReportsPage() {
  const { data: allExpenses, isLoading: expLoading } = useAllExpenses();
  const { data: allIncome, isLoading: incLoading } = useAllIncome();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const isLoading = expLoading || incLoading;

  const last12 = getLast12Months();

  // Monthly summary
  const monthlySummary = last12.map((month) => {
    const inc = (allIncome ?? [])
      .filter((i) => i.date.startsWith(month))
      .reduce((s, i) => s + i.amount, 0);
    const exp = (allExpenses ?? [])
      .filter((e) => e.date.startsWith(month))
      .reduce((s, e) => s + e.amount, 0);
    return { month, income: inc, expenses: exp, balance: inc - exp };
  });

  // Category breakdown for selected month
  const monthExpenses = (allExpenses ?? []).filter((e) =>
    e.date.startsWith(selectedMonth),
  );
  const catTotals: Partial<Record<BudgetCategory, number>> = {};
  for (const exp of monthExpenses) {
    catTotals[exp.category] = (catTotals[exp.category] ?? 0) + exp.amount;
  }
  const categoryData = Object.entries(catTotals)
    .map(([cat, amt]) => ({
      name: getCategoryLabel(cat as BudgetCategory),
      amount: amt,
      color: CATEGORY_COLORS[cat as BudgetCategory],
    }))
    .sort((a, b) => b.amount - a.amount);

  // Member breakdown
  const memberTotals: Record<string, number> = {};
  for (const exp of allExpenses ?? []) {
    const p = exp.paidBy.toString();
    memberTotals[p] = (memberTotals[p] ?? 0) + exp.amount;
  }
  const memberData = Object.entries(memberTotals)
    .map(([principal, total]) => ({
      principal,
      displayName: `User ${principal.slice(0, 5)}...${principal.slice(-4)}`,
      total,
      count: (allExpenses ?? []).filter(
        (e) => e.paidBy.toString() === principal,
      ).length,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="p-4 lg:p-6">
      <h2 className="font-display text-xl font-bold mb-4">Reports</h2>

      <Tabs defaultValue="monthly" data-ocid="reports.tab">
        <TabsList className="mb-4">
          <TabsTrigger value="monthly" data-ocid="reports.monthly.tab">
            Monthly Summary
          </TabsTrigger>
          <TabsTrigger value="category" data-ocid="reports.category.tab">
            Category Breakdown
          </TabsTrigger>
          <TabsTrigger value="member" data-ocid="reports.member.tab">
            Member Breakdown
          </TabsTrigger>
        </TabsList>

        {/* Monthly Summary */}
        <TabsContent value="monthly">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">
                Last 12 Months
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton
                  className="h-48 w-full"
                  data-ocid="reports.monthly.loading_state"
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Income</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlySummary.map((row, idx) => (
                        <TableRow
                          key={row.month}
                          data-ocid={`reports.monthly.row.${idx + 1}`}
                        >
                          <TableCell className="font-medium">
                            {formatMonthDisplay(row.month)}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600">
                            {formatCurrency(row.income)}
                          </TableCell>
                          <TableCell className="text-right text-rose-600">
                            {formatCurrency(row.expenses)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold ${row.balance >= 0 ? "text-primary" : "text-destructive"}`}
                          >
                            {formatCurrency(row.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Breakdown */}
        <TabsContent value="category">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base">
                  Expenses by Category
                </CardTitle>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger
                    className="w-40 text-sm"
                    data-ocid="reports.category.month.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {last12.map((m) => (
                      <SelectItem key={m} value={m}>
                        {formatMonthDisplay(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton
                  className="h-64 w-full"
                  data-ocid="reports.category.loading_state"
                />
              ) : categoryData.length === 0 ? (
                <div
                  className="py-12 text-center text-sm text-muted-foreground"
                  data-ocid="reports.category.empty_state"
                >
                  No expenses for {formatMonthDisplay(selectedMonth)}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={110}
                    />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="amount" radius={[0, 3, 3, 0]}>
                      {categoryData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Member Breakdown */}
        <TabsContent value="member">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">
                Expenses by Family Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton
                  className="h-48 w-full"
                  data-ocid="reports.member.loading_state"
                />
              ) : memberData.length === 0 ? (
                <div
                  className="py-12 text-center text-sm text-muted-foreground"
                  data-ocid="reports.member.empty_state"
                >
                  No expense data available
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Member</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberData.map((member, idx) => (
                      <TableRow
                        key={member.principal}
                        data-ocid={`reports.member.row.${idx + 1}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                              {member.displayName.charAt(5)?.toUpperCase() ??
                                "U"}
                            </div>
                            <span className="font-mono text-xs">
                              {member.displayName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-rose-600">
                          {formatCurrency(member.total)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {member.count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
