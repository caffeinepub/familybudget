import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Notification {
    id: bigint;
    userId: Principal;
    notificationType: string;
    createdAt: string;
    isRead: boolean;
    message: string;
}
export interface Income {
    id: bigint;
    source: string;
    date: string;
    addedBy: Principal;
    amount: number;
}
export interface BudgetLimit {
    id: bigint;
    month: string;
    monthlyLimit: number;
    createdBy: Principal;
    category: BudgetCategory;
}
export interface Expense {
    id: bigint;
    title: string;
    date: string;
    createdAt: Time;
    notes: string;
    category: BudgetCategory;
    amount: number;
    shareAmount?: number;
    paidBy: Principal;
}
export interface UserProfile {
    name: string;
    role: string;
}
export interface SavingsGoal {
    id: bigint;
    name: string;
    createdBy: Principal;
    deadline: string;
    targetAmount: number;
    currentAmount: number;
}
export enum BudgetCategory {
    taxes = "taxes",
    entertainment = "entertainment",
    food = "food",
    rent = "rent",
    transport = "transport",
    education = "education",
    others = "others",
    maintenance = "maintenance",
    shopping = "shopping",
    electricityBill = "electricityBill",
    waterCharges = "waterCharges",
    medical = "medical"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBudgetLimit(category: BudgetCategory, monthlyLimit: number, month: string): Promise<bigint>;
    createExpense(title: string, amount: number, category: BudgetCategory, date: string, notes: string, shareAmount: number | null): Promise<bigint>;
    createIncome(source: string, amount: number, date: string): Promise<bigint>;
    createNotification(message: string, notificationType: string, userId: Principal, createdAt: string): Promise<bigint>;
    createSavingsGoal(name: string, targetAmount: number, deadline: string): Promise<bigint>;
    deleteBudgetLimit(id: bigint): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    deleteIncome(id: bigint): Promise<void>;
    deleteNotification(id: bigint): Promise<void>;
    deleteSavingsGoal(id: bigint): Promise<void>;
    demoteAdminToMember(user: Principal): Promise<void>;
    getAllExpenses(): Promise<Array<Expense>>;
    getAllIncome(): Promise<Array<Income>>;
    getAllSavingsGoals(): Promise<Array<SavingsGoal>>;
    getBudgetLimitsByMonth(month: string): Promise<Array<BudgetLimit>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExpensesByCategory(category: BudgetCategory): Promise<Array<Expense>>;
    getExpensesByCategoryForMonth(category: BudgetCategory, month: string): Promise<Array<Expense>>;
    getExpensesByMember(member: Principal): Promise<Array<Expense>>;
    getMyNotifications(): Promise<Array<Notification>>;
    getTotalExpensesForMonth(month: string): Promise<number>;
    getTotalIncomeForMonth(month: string): Promise<number>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markNotificationAsRead(id: bigint): Promise<void>;
    promoteMemberToAdmin(user: Principal): Promise<void>;
    readBudgetLimit(id: bigint): Promise<BudgetLimit>;
    readExpense(id: bigint): Promise<Expense>;
    readIncome(id: bigint): Promise<Income>;
    readNotification(id: bigint): Promise<Notification>;
    readSavingsGoal(id: bigint): Promise<SavingsGoal>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBudgetLimit(id: bigint, category: BudgetCategory, monthlyLimit: number, month: string): Promise<void>;
    updateExpense(id: bigint, title: string, amount: number, category: BudgetCategory, date: string, notes: string, shareAmount: number | null): Promise<void>;
    updateIncome(id: bigint, source: string, amount: number, date: string): Promise<void>;
    updateSavingsGoal(id: bigint, name: string, targetAmount: number, currentAmount: number, deadline: string): Promise<void>;
}
