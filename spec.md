# FamilyBudget

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- User authentication with email/password (admin default: admin/admin)
- Family group system with shared budget access
- Family member management with Admin/Member roles
- Dashboard: monthly income, expenses, balance, savings overview, pie + bar charts
- Income tracking: source, amount, date, added-by
- Expense tracking: title, amount, category, date, paid-by, notes, share-amount notification option
- 12 expense categories: Food, Rent, Electricity Bill, Water Charges, Taxes, Maintenance, Education, Transport, Medical, Shopping, Entertainment, Others — each with a remarks/notes field
- Budget planning: per-category monthly limits with over-budget alerts
- Savings goals with progress bars
- Reports: monthly, category-wise, member-wise
- In-app notifications for budget exceeded and spending summaries
- Data validation: numeric amounts, required dates, required categories
- Responsive mobile-friendly UI

### Modify
N/A (new project)

### Remove
N/A (new project)

## Implementation Plan
1. Select `authorization` component for role-based access (Admin/Member)
2. Generate Motoko backend with:
   - Users and family groups
   - Income entries (source, amount, date, addedBy)
   - Expense entries (title, amount, category, date, paidBy, notes, shareAmount)
   - Budget limits per category per month
   - Savings goals (name, targetAmount, currentAmount, deadline)
   - Notifications (budgetExceeded, spendingSummary, shareReminder)
3. Build React frontend with:
   - Auth pages (login)
   - Sidebar nav: Dashboard, Income, Expenses, Budget, Savings, Reports, Settings
   - Dashboard with Recharts pie + bar charts
   - Income CRUD
   - Expense CRUD with category filter and share-amount intimation
   - Budget planning page with progress bars and alerts
   - Savings goals page
   - Reports page (monthly, category-wise, member-wise)
   - Settings page (family members, roles)
   - Notification panel
