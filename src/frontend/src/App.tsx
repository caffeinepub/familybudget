import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { Loader2, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import Layout from "./components/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerProfile, useSaveCallerProfile } from "./hooks/useQueries";
import BudgetPage from "./pages/BudgetPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensePage from "./pages/ExpensePage";
import IncomePage from "./pages/IncomePage";
import ReportsPage from "./pages/ReportsPage";
import SavingsPage from "./pages/SavingsPage";
import SettingsPage from "./pages/SettingsPage";

export type PageType =
  | "dashboard"
  | "income"
  | "expenses"
  | "budget"
  | "savings"
  | "reports"
  | "settings";

function ProfileSetup({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const saveMutation = useSaveCallerProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await saveMutation.mutateAsync({ name: name.trim(), role: "member" });
    onDone();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
              <Wallet className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-2xl">
              Welcome to FamilyBudget
            </CardTitle>
            <CardDescription>
              Set up your profile to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-ocid="profile.input"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={saveMutation.isPending || !name.trim()}
                data-ocid="profile.submit_button"
              >
                {saveMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function AuthPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-card">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
              <Wallet className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-3xl tracking-tight">
              FamilyBudget
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Track income, expenses, and savings goals together as a family
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
                  <span className="text-lg">💰</span>
                  <span>Track Income</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
                  <span className="text-lg">📊</span>
                  <span>Budgets & Goals</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
                  <span className="text-lg">👨‍👩‍👧‍👦</span>
                  <span>Family Sharing</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
                  <span className="text-lg">📈</span>
                  <span>Reports & Insights</span>
                </div>
              </div>
              <Button
                onClick={login}
                className="w-full mt-4"
                size="lg"
                disabled={isLoggingIn}
                data-ocid="auth.login.primary_button"
              >
                {isLoggingIn && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isLoggingIn ? "Connecting..." : "Sign In to Get Started"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorLoading } = useActor();
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
  const profileQuery = useCallerProfile();
  const [profileSetupDone, setProfileSetupDone] = useState(false);

  const isAuthenticated = !!identity;

  if (isInitializing || (isAuthenticated && actorLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (
    !actorLoading &&
    !profileQuery.isLoading &&
    profileQuery.data === null &&
    !profileSetupDone
  ) {
    return <ProfileSetup onDone={() => setProfileSetupDone(true)} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "income":
        return <IncomePage />;
      case "expenses":
        return <ExpensePage />;
      case "budget":
        return <BudgetPage />;
      case "savings":
        return <SavingsPage />;
      case "reports":
        return <ReportsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster position="top-right" richColors />
    </>
  );
}
