import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    role : Text; // "admin" or "member"
  };

  public type BudgetCategory = {
    #food;
    #rent;
    #electricityBill;
    #waterCharges;
    #taxes;
    #maintenance;
    #education;
    #transport;
    #medical;
    #shopping;
    #entertainment;
    #others;
  };

  type BudgetLimit = {
    id : Nat;
    category : BudgetCategory;
    monthlyLimit : Float;
    month : Text;
    createdBy : Principal;
  };

  type SavingsGoal = {
    id : Nat;
    name : Text;
    targetAmount : Float;
    currentAmount : Float;
    deadline : Text;
    createdBy : Principal;
  };

  type Notification = {
    id : Nat;
    message : Text;
    notificationType : Text;
    isRead : Bool;
    userId : Principal;
    createdAt : Text;
  };

  type Income = {
    id : Nat;
    source : Text;
    amount : Float;
    date : Text;
    addedBy : Principal;
  };

  public type Expense = {
    id : Nat;
    title : Text;
    amount : Float;
    category : BudgetCategory;
    date : Text;
    paidBy : Principal;
    notes : Text;
    shareAmount : ?Float;
    createdAt : Time.Time;
  };

  module Expense {
    public func compare(expense1 : Expense, expense2 : Expense) : { #greater; #less; #equal } {
      Nat.compare(expense1.id, expense2.id);
    };

    public func compareByDate(expense1 : Expense, expense2 : Expense) : { #greater; #less; #equal } {
      switch (Text.compare(expense1.date, expense2.date)) {
        case (#equal) { compare(expense1, expense2) };
        case (order) { order };
      };
    };
  };

  var nextBudgetLimitId = 0;
  var nextSavingsGoalId = 0;
  var nextNotificationId = 0;
  var nextIncomeId = 0;
  var nextExpenseId = 0;

  let budgetLimits = Map.empty<Nat, BudgetLimit>();
  let savingsGoals = Map.empty<Nat, SavingsGoal>();
  let notifications = Map.empty<Nat, Notification>();
  let incomes = Map.empty<Nat, Income>();
  let expenses = Map.empty<Nat, Expense>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Admin-only: Promote/demote family members
  public shared ({ caller }) func promoteMemberToAdmin(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can promote members");
    };
    AccessControl.assignRole(accessControlState, caller, user, #admin);
  };

  public shared ({ caller }) func demoteAdminToMember(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can demote members");
    };
    AccessControl.assignRole(accessControlState, caller, user, #user);
  };

  // Budget Limits CRUD
  public shared ({ caller }) func createBudgetLimit(category : BudgetCategory, monthlyLimit : Float, month : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create budget limits");
    };
    let budgetLimit : BudgetLimit = {
      id = nextBudgetLimitId;
      category;
      monthlyLimit;
      month;
      createdBy = caller;
    };
    budgetLimits.add(nextBudgetLimitId, budgetLimit);
    nextBudgetLimitId += 1;
    budgetLimit.id;
  };

  public query ({ caller }) func readBudgetLimit(id : Nat) : async BudgetLimit {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read budget limits");
    };
    switch (budgetLimits.get(id)) {
      case (null) { Runtime.trap("Budget limit not found") };
      case (?budgetLimit) { budgetLimit };
    };
  };

  public shared ({ caller }) func updateBudgetLimit(id : Nat, category : BudgetCategory, monthlyLimit : Float, month : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update budget limits");
    };
    switch (budgetLimits.get(id)) {
      case (null) { Runtime.trap("Budget limit not found") };
      case (?existing) {
        if (existing.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own budget limits or be an admin");
        };
        let updated : BudgetLimit = {
          id;
          category;
          monthlyLimit;
          month;
          createdBy = existing.createdBy;
        };
        budgetLimits.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteBudgetLimit(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete budget limits");
    };
    switch (budgetLimits.get(id)) {
      case (null) { Runtime.trap("Budget limit not found") };
      case (?existing) {
        if (existing.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own budget limits or be an admin");
        };
        budgetLimits.remove(id);
      };
    };
  };

  public query ({ caller }) func getBudgetLimitsByMonth(month : Text) : async [BudgetLimit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query budget limits");
    };
    budgetLimits.values().toArray().filter(
      func(limit : BudgetLimit) : Bool {
        limit.month == month;
      }
    );
  };

  // Savings Goals CRUD
  public shared ({ caller }) func createSavingsGoal(name : Text, targetAmount : Float, deadline : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create savings goals");
    };
    let savingsGoal : SavingsGoal = {
      id = nextSavingsGoalId;
      name;
      targetAmount;
      currentAmount = 0.0;
      deadline;
      createdBy = caller;
    };
    savingsGoals.add(nextSavingsGoalId, savingsGoal);
    nextSavingsGoalId += 1;
    savingsGoal.id;
  };

  public query ({ caller }) func readSavingsGoal(id : Nat) : async SavingsGoal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read savings goals");
    };
    switch (savingsGoals.get(id)) {
      case (null) { Runtime.trap("Savings goal not found") };
      case (?goal) { goal };
    };
  };

  public shared ({ caller }) func updateSavingsGoal(id : Nat, name : Text, targetAmount : Float, currentAmount : Float, deadline : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update savings goals");
    };
    switch (savingsGoals.get(id)) {
      case (null) { Runtime.trap("Savings goal not found") };
      case (?existing) {
        if (existing.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own savings goals or be an admin");
        };
        let updated : SavingsGoal = {
          id;
          name;
          targetAmount;
          currentAmount;
          deadline;
          createdBy = existing.createdBy;
        };
        savingsGoals.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteSavingsGoal(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete savings goals");
    };
    switch (savingsGoals.get(id)) {
      case (null) { Runtime.trap("Savings goal not found") };
      case (?existing) {
        if (existing.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own savings goals or be an admin");
        };
        savingsGoals.remove(id);
      };
    };
  };

  public query ({ caller }) func getAllSavingsGoals() : async [SavingsGoal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query savings goals");
    };
    savingsGoals.values().toArray();
  };

  // Income CRUD
  public shared ({ caller }) func createIncome(source : Text, amount : Float, date : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create income entries");
    };
    let income : Income = {
      id = nextIncomeId;
      source;
      amount;
      date;
      addedBy = caller;
    };
    incomes.add(nextIncomeId, income);
    nextIncomeId += 1;
    income.id;
  };

  public query ({ caller }) func readIncome(id : Nat) : async Income {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read income entries");
    };
    switch (incomes.get(id)) {
      case (null) { Runtime.trap("Income entry not found") };
      case (?income) { income };
    };
  };

  public shared ({ caller }) func updateIncome(id : Nat, source : Text, amount : Float, date : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update income entries");
    };
    switch (incomes.get(id)) {
      case (null) { Runtime.trap("Income entry not found") };
      case (?existing) {
        if (existing.addedBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own income entries or be an admin");
        };
        let updated : Income = {
          id;
          source;
          amount;
          date;
          addedBy = existing.addedBy;
        };
        incomes.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteIncome(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete income entries");
    };
    switch (incomes.get(id)) {
      case (null) { Runtime.trap("Income entry not found") };
      case (?existing) {
        if (existing.addedBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own income entries or be an admin");
        };
        incomes.remove(id);
      };
    };
  };

  public query ({ caller }) func getAllIncome() : async [Income] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query income entries");
    };
    incomes.values().toArray();
  };

  // Expense CRUD
  public shared ({ caller }) func createExpense(title : Text, amount : Float, category : BudgetCategory, date : Text, notes : Text, shareAmount : ?Float) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create expense entries");
    };
    let expense : Expense = {
      id = nextExpenseId;
      title;
      amount;
      category;
      date;
      paidBy = caller;
      notes;
      shareAmount;
      createdAt = Time.now();
    };
    expenses.add(nextExpenseId, expense);
    nextExpenseId += 1;
    expense.id;
  };

  public query ({ caller }) func readExpense(id : Nat) : async Expense {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read expense entries");
    };
    switch (expenses.get(id)) {
      case (null) { Runtime.trap("Expense entry not found") };
      case (?expense) { expense };
    };
  };

  public shared ({ caller }) func updateExpense(id : Nat, title : Text, amount : Float, category : BudgetCategory, date : Text, notes : Text, shareAmount : ?Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update expense entries");
    };
    switch (expenses.get(id)) {
      case (null) { Runtime.trap("Expense entry not found") };
      case (?existing) {
        if (existing.paidBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own expense entries or be an admin");
        };
        let updated : Expense = {
          id;
          title;
          amount;
          category;
          date;
          paidBy = existing.paidBy;
          notes;
          shareAmount;
          createdAt = existing.createdAt;
        };
        expenses.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete expense entries");
    };
    switch (expenses.get(id)) {
      case (null) { Runtime.trap("Expense entry not found") };
      case (?existing) {
        if (existing.paidBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own expense entries or be an admin");
        };
        expenses.remove(id);
      };
    };
  };

  public query ({ caller }) func getAllExpenses() : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query expense entries");
    };
    expenses.values().toArray();
  };

  public query ({ caller }) func getExpensesByCategory(category : BudgetCategory) : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query expense entries");
    };
    let filtered = expenses.values().toArray().filter(
      func(expense) {
        expense.category == category;
      }
    );
    filtered.sort(Expense.compareByDate);
  };

  public query ({ caller }) func getExpensesByMember(member : Principal) : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query expense entries");
    };
    expenses.values().toArray().filter(
      func(expense : Expense) : Bool {
        expense.paidBy == member;
      }
    );
  };

  public query ({ caller }) func getExpensesByCategoryForMonth(category : BudgetCategory, month : Text) : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query expense entries");
    };
    expenses.values().toArray().filter(
      func(expense : Expense) : Bool {
        expense.category == category and expense.date.startsWith(#text month);
      }
    );
  };

  // Notifications CRUD
  public shared ({ caller }) func createNotification(message : Text, notificationType : Text, userId : Principal, createdAt : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create notifications");
    };
    let notification : Notification = {
      id = nextNotificationId;
      message;
      notificationType;
      isRead = false;
      userId;
      createdAt;
    };
    notifications.add(nextNotificationId, notification);
    nextNotificationId += 1;
    notification.id;
  };

  public query ({ caller }) func readNotification(id : Nat) : async Notification {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read notifications");
    };
    switch (notifications.get(id)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?notification) {
        if (notification.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only read your own notifications");
        };
        notification;
      };
    };
  };

  public shared ({ caller }) func markNotificationAsRead(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };
    switch (notifications.get(id)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?existing) {
        if (existing.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only mark your own notifications as read");
        };
        let updated : Notification = {
          id = existing.id;
          message = existing.message;
          notificationType = existing.notificationType;
          isRead = true;
          userId = existing.userId;
          createdAt = existing.createdAt;
        };
        notifications.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteNotification(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete notifications");
    };
    switch (notifications.get(id)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?existing) {
        if (existing.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own notifications");
        };
        notifications.remove(id);
      };
    };
  };

  public query ({ caller }) func getMyNotifications() : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query notifications");
    };
    notifications.values().toArray().filter(
      func(notification : Notification) : Bool {
        notification.userId == caller;
      }
    );
  };

  // Aggregation queries
  public query ({ caller }) func getTotalIncomeForMonth(month : Text) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query income totals");
    };
    var total : Float = 0.0;
    for (income in incomes.values()) {
      if (income.date.startsWith(#text month)) {
        total += income.amount;
      };
    };
    total;
  };

  public query ({ caller }) func getTotalExpensesForMonth(month : Text) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query expense totals");
    };
    var total : Float = 0.0;
    for (expense in expenses.values()) {
      if (expense.date.startsWith(#text month)) {
        total += expense.amount;
      };
    };
    total;
  };
};
