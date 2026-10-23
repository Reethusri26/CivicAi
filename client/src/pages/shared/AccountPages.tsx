import { BellOff } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { complaintPathFor } from "../../lib/paths";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, PageHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Field";
import { EmptyState, ErrorState, ListSkeleton } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../context/AuthContext";
import { api, errorMessage, isRemembered } from "../../lib/api";
import { cx } from "../../lib/cx";
import { formatDateTime, timeAgo } from "../../lib/format";
import type { AppNotification } from "../../lib/types";
import { useApi } from "../../lib/useApi";

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, error, initialLoading, reload } = useApi(
    () => api.get("/notifications").then((res) => res.data as { notifications: AppNotification[]; unread: number }),
    []
  );

  const markAll = async () => {
    await api.post("/notifications/read", {}).catch(() => undefined);
    reload();
  };

  const open = async (item: AppNotification) => {
    if (!item.read) await api.post("/notifications/read", { ids: [item.id] }).catch(() => undefined);
    if (item.complaintId && user) navigate(complaintPathFor(user.role, item.complaintId));
    else reload();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Updates about complaints and tasks you're involved in."
        actions={data && data.unread > 0 ? <Button variant="secondary" size="sm" onClick={markAll}>Mark all as read</Button> : undefined}
      />
      {initialLoading ? (
        <ListSkeleton rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.notifications.length ? (
        <Card><EmptyState icon={<BellOff className="size-6" />} title="No notifications yet" description="You'll be notified here when something changes." /></Card>
      ) : (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {data.notifications.map((item) => (
            <button key={item.id} onClick={() => open(item)} className={cx("flex w-full gap-3 px-5 py-4 text-left hover:bg-slate-50", !item.read && "bg-brand-50/40")}>
              <span className={cx("mt-1.5 size-2 shrink-0 rounded-full", item.read ? "bg-slate-200" : "bg-brand-600")} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                {item.message && <span className="mt-0.5 block text-sm text-slate-600">{item.message}</span>}
              </span>
              <span className="shrink-0 text-xs text-slate-400" title={formatDateTime(item.createdAt)}>{timeAgo(item.createdAt)}</span>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}

export function ProfilePage() {
  const { user, updateUser, setSession } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [changing, setChanging] = useState(false);

  if (!user) return null;

  const settingFirst = user.hasPassword === false;

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch("/auth/me", user.role === "worker" ? { phone } : { name, phone });
      updateUser(res.data.user);
      toast.success("Profile saved");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPwError("");
    if (passwords.newPassword !== passwords.confirm) {
      setPwError("The new passwords don't match");
      return;
    }
    setChanging(true);
    try {
      const res = await api.post("/auth/change-password", {
        currentPassword: settingFirst ? undefined : passwords.currentPassword,
        newPassword: passwords.newPassword,
        remember: isRemembered(),
      });
      setSession(res.data.token, res.data.user);
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success(settingFirst ? "Password set. You can now sign in with email too." : "Password changed. Other devices have been signed out.");
    } catch (err) {
      setPwError(errorMessage(err));
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={user.role === "admin" ? "Settings" : "Profile"} description="Manage your account details and password." />
      <Card>
        <CardHeader title="Account details" />
        <form onSubmit={saveProfile} className="space-y-4 p-5">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} disabled={user.role === "worker"} hint={user.role === "worker" ? "Ask an administrator to change your name" : undefined} />
          <Input label="Email" value={user.email} disabled hint="Email can't be changed" />
          {user.department && <Input label="Department" value={user.department} disabled />}
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button type="submit" loading={saving}>Save changes</Button>
        </form>
      </Card>
      <Card>
        <CardHeader
          title={settingFirst ? "Set a password" : "Change password"}
          description={
            settingFirst
              ? "You signed up with Google. Add a password if you also want to sign in with your email."
              : "Changing your password signs you out on other devices."
          }
        />
        <form onSubmit={changePassword} className="space-y-4 p-5">
          {/* Lets password managers update the saved login for this account. */}
          <input type="email" name="username" autoComplete="username" value={user.email} readOnly hidden />
          {!settingFirst && (
            <Input label="Current password" type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
          )}
          <Input label="New password" type="password" autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} hint="At least 8 characters with a letter and a number" required />
          <Input label="Confirm new password" type="password" autoComplete="new-password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required error={pwError} />
          <Button type="submit" variant="secondary" loading={changing} disabled={(!settingFirst && !passwords.currentPassword) || !passwords.newPassword}>
            {settingFirst ? "Set password" : "Update password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
