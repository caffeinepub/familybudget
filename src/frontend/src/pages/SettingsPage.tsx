import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Copy, Loader2, ShieldCheck, User, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllExpenses,
  useCallerProfile,
  useIsAdmin,
  useSaveCallerProfile,
} from "../hooks/useQueries";

export default function SettingsPage() {
  const { identity } = useInternetIdentity();
  const profileQuery = useCallerProfile();
  const isAdminQuery = useIsAdmin();
  const saveMutation = useSaveCallerProfile();
  const { data: expenses } = useAllExpenses();

  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const profile = profileQuery.data;
  const isAdmin = isAdminQuery.data ?? false;
  const myPrincipal = identity?.getPrincipal().toString() ?? "";

  // Get unique members from expenses
  const uniqueMembers = [
    ...new Set((expenses ?? []).map((e) => e.paidBy.toString())),
  ];

  const startEdit = () => {
    setName(profile?.name ?? "");
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveMutation.mutateAsync({
        name: name.trim(),
        role: profile?.role ?? "member",
      });
      toast.success("Profile saved");
      setEditing(false);
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const copyPrincipal = () => {
    navigator.clipboard.writeText(myPrincipal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      <h2 className="font-display text-xl font-bold">Settings</h2>

      {/* Profile Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            My Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileQuery.isLoading ? (
            <Skeleton
              className="h-12 w-full"
              data-ocid="settings.profile.loading_state"
            />
          ) : (
            <>
              {!editing ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {profile?.name ?? "(No name set)"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Role:{" "}
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {profile?.role ?? "member"}
                      </Badge>
                      {isAdmin && (
                        <Badge variant="default" className="ml-1 text-xs">
                          Admin
                        </Badge>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEdit}
                    data-ocid="settings.profile.edit_button"
                  >
                    Edit
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Display Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      data-ocid="settings.profile.name.input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={saveMutation.isPending}
                      data-ocid="settings.profile.save_button"
                    >
                      {saveMutation.isPending && (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      )}
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(false)}
                      data-ocid="settings.profile.cancel_button"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <Separator />

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Your Principal ID
                </Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <code className="text-xs bg-muted px-2 py-1.5 rounded flex-1 truncate font-mono">
                    {myPrincipal}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={copyPrincipal}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Family Members */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Family Members
          </CardTitle>
          <CardDescription>Members who have recorded expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin && (
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-accent/10 border border-accent/20">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <p className="text-xs text-accent font-medium">
                You are an admin. Full member management available.
              </p>
            </div>
          )}
          {!isAdmin && (
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Member management is available for admin users only.
              </p>
            </div>
          )}
          {uniqueMembers.length === 0 ? (
            <p
              className="text-sm text-muted-foreground py-3 text-center"
              data-ocid="settings.members.empty_state"
            >
              No family members recorded yet
            </p>
          ) : (
            <div className="space-y-2" data-ocid="settings.members.list">
              {uniqueMembers.map((principal, idx) => (
                <div
                  key={principal}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50"
                  data-ocid={`settings.member.item.${idx + 1}`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs truncate">
                      {principal === myPrincipal ? (
                        <span className="font-semibold">
                          {principal}{" "}
                          <Badge variant="secondary" className="text-[10px]">
                            You
                          </Badge>
                        </span>
                      ) : (
                        principal
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pt-4">
        &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
