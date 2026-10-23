import { HardHat, KeyRound, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card, PageHeader } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, ErrorState, InlineAlert, ListSkeleton } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api, errorMessage } from "../../lib/api";
import { cx } from "../../lib/cx";
import type { Department, WorkerSummary } from "../../lib/types";
import { useApi } from "../../lib/useApi";

type Mode = { kind: "create" } | { kind: "edit"; worker: WorkerSummary } | { kind: "password"; worker: WorkerSummary } | null;

function WorkerForm({ mode, departments, onClose, onSaved }: { mode: Exclude<Mode, null>; departments: Department[]; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const existing = mode.kind === "create" ? null : mode.worker;
  const [form, setForm] = useState({
    name: existing?.name || "",
    email: existing?.email || "",
    phone: existing?.phone || "",
    department: existing?.department || departments[0]?.name || "",
    password: "",
    isActive: existing?.isActive ?? true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (mode.kind === "create") {
        await api.post("/admin/workers", { name: form.name, email: form.email, phone: form.phone, department: form.department, password: form.password });
        toast.success("Worker account created. Share the password with them securely.");
      } else if (mode.kind === "edit") {
        await api.patch(`/admin/workers/${mode.worker.id}`, { name: form.name, phone: form.phone, department: form.department, isActive: form.isActive });
        toast.success("Worker updated");
      } else {
        await api.post(`/admin/workers/${mode.worker.id}/reset-password`, { password: form.password });
        toast.success("Password reset. The worker has been signed out everywhere.");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const titles = { create: "Add worker", edit: "Edit worker", password: "Reset password" };

  return (
    <Modal
      open
      onClose={onClose}
      title={titles[mode.kind]}
      description={existing ? `${existing.name} · ${existing.email}` : "Workers sign in with this email and password."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Save</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <InlineAlert tone="error">{error}</InlineAlert>}
        {mode.kind !== "password" && (
          <>
            <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-autofocus />
            {mode.kind === "create" && <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
            <Select label="Department" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {departments.map((d) => <option key={d.id}>{d.name}</option>)}
            </Select>
            <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} hint="Shown to the resident while this worker has their complaint open" />
          </>
        )}
        {mode.kind !== "edit" && (
          <Input
            label={mode.kind === "create" ? "Initial password" : "New password"}
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            hint="At least 8 characters with a letter and a number"
          />
        )}
        {mode.kind === "edit" && (
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <input type="checkbox" className="mt-0.5 size-4 rounded border-slate-300" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            <span className="text-sm">
              <span className="font-medium text-slate-900">Account active</span>
              <span className="block text-slate-500">Deactivating signs the worker out immediately and blocks sign-in. Their task history is kept.</span>
            </span>
          </label>
        )}
      </form>
    </Modal>
  );
}

export default function AdminWorkers() {
  const [mode, setMode] = useState<Mode>(null);
  const { data, error, initialLoading, reload } = useApi(
    () =>
      Promise.all([api.get("/admin/workers"), api.get("/admin/departments")]).then(([w, d]) => ({
        workers: w.data.workers as WorkerSummary[],
        departments: d.data.departments as Department[],
      })),
    []
  );

  return (
    <>
      <PageHeader
        title="Workers"
        description="Field staff accounts and their current workload."
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setMode({ kind: "create" })} disabled={!data?.departments.length}>Add worker</Button>}
      />

      {initialLoading ? (
        <ListSkeleton />
      ) : error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : !data?.workers.length ? (
        <Card>
          <EmptyState icon={<HardHat className="size-6" />} title="No workers yet" description="Add field workers so complaints can be assigned to them." action={<Button onClick={() => setMode({ kind: "create" })} icon={<Plus className="size-4" />}>Add worker</Button>} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Worker</th>
                  <th scope="col" className="px-4 py-3">Department</th>
                  <th scope="col" className="px-4 py-3">Phone</th>
                  <th scope="col" className="px-4 py-3 text-right">Open tasks</th>
                  <th scope="col" className="px-4 py-3 text-right">Completed</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.workers.map((w) => (
                  <tr key={w.id} className={cx(!w.isActive && "bg-slate-50/60 text-slate-500")}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{w.name}</p>
                      <p className="text-xs text-slate-500">{w.email}</p>
                    </td>
                    <td className="px-4 py-3">{w.department}</td>
                    <td className="whitespace-nowrap px-4 py-3">{w.phone || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <Link to={`/admin/complaints?worker=${w.id}`} className="font-semibold text-brand-700 hover:underline">{w.activeTasks}</Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{w.completedTasks}</td>
                    <td className="px-4 py-3">
                      <span className={cx("rounded-full px-2 py-0.5 text-xs font-semibold", w.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600")}>
                        {w.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" icon={<Pencil className="size-3.5" />} onClick={() => setMode({ kind: "edit", worker: w })}>Edit</Button>
                      <Button size="sm" variant="ghost" icon={<KeyRound className="size-3.5" />} onClick={() => setMode({ kind: "password", worker: w })}>Password</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {mode && data && <WorkerForm mode={mode} departments={data.departments} onClose={() => setMode(null)} onSaved={reload} />}
    </>
  );
}
