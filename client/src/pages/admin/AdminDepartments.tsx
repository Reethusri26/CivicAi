import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Card, PageHeader } from "../../components/ui/Card";
import { Input, Textarea } from "../../components/ui/Field";
import { ConfirmDialog, Modal } from "../../components/ui/Modal";
import { EmptyState, ErrorState, InlineAlert, ListSkeleton } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api, errorMessage } from "../../lib/api";
import { CATEGORIES } from "../../lib/constants";
import type { Department } from "../../lib/types";
import { useApi } from "../../lib/useApi";

function DepartmentForm({ department, all, onClose, onSaved }: { department: Department | null; all: Department[]; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: department?.name || "",
    description: department?.description || "",
    categories: department?.categories || [],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const ownerOf = (category: string) => all.find((d) => d.id !== department?.id && d.categories.includes(category))?.name;

  const toggle = (category: string) =>
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(category) ? prev.categories.filter((c) => c !== category) : [...prev.categories, category],
    }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (department) await api.put(`/admin/departments/${department.id}`, form);
      else await api.post("/admin/departments", form);
      toast.success(department ? "Department updated" : "Department created");
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={department ? `Edit ${department.name}` : "New department"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Save</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <InlineAlert tone="error">{error}</InlineAlert>}
        <Input label="Name" required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-autofocus />
        <Textarea label="Description" rows={2} maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Categories routed here</legend>
          <p className="text-xs text-slate-500">Each category goes to one department. Selecting one that belongs elsewhere moves it here.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {CATEGORIES.map((category) => {
              const owner = ownerOf(category);
              return (
                <label key={category} className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-2.5 text-sm">
                  <input type="checkbox" className="mt-0.5 size-4 rounded border-slate-300" checked={form.categories.includes(category)} onChange={() => toggle(category)} />
                  <span>
                    {category}
                    {owner && !form.categories.includes(category) && <span className="block text-xs text-slate-500">Currently: {owner}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

export default function AdminDepartments() {
  const toast = useToast();
  const [editing, setEditing] = useState<Department | null | "new">(null);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, error, initialLoading, reload } = useApi(
    () => api.get("/admin/departments").then((res) => res.data.departments as Department[]),
    []
  );

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/departments/${deleting.id}`);
      toast.success("Department deleted");
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  const unrouted = CATEGORIES.filter((c) => !data?.some((d) => d.categories.includes(c)));

  return (
    <>
      <PageHeader
        title="Departments"
        description="Departments own categories of complaints. New complaints are routed using these rules."
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>New department</Button>}
      />
      {unrouted.length > 0 && data && (
        <div className="mb-4">
          <InlineAlert tone="warning">Not routed to any department: {unrouted.join(", ")}. Complaints in these categories will need a department set manually.</InlineAlert>
        </div>
      )}
      {initialLoading ? (
        <ListSkeleton />
      ) : error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : !data?.length ? (
        <Card><EmptyState icon={<Building2 className="size-6" />} title="No departments" action={<Button onClick={() => setEditing("new")}>Create one</Button>} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((d) => (
            <Card key={d.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold">{d.name}</h2>
                <div className="flex">
                  <Button size="sm" variant="ghost" aria-label={`Edit ${d.name}`} onClick={() => setEditing(d)}><Pencil className="size-4" /></Button>
                  <Button size="sm" variant="ghost" aria-label={`Delete ${d.name}`} onClick={() => setDeleting(d)} className="text-rose-700 hover:bg-rose-50"><Trash2 className="size-4" /></Button>
                </div>
              </div>
              {d.description && <p className="mt-1 text-sm text-slate-600">{d.description}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.categories.length ? d.categories.map((c) => (
                  <span key={c} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800">{c}</span>
                )) : <span className="text-xs text-slate-500">No categories routed here</span>}
              </div>
              <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                <div><dt className="text-slate-500">Workers</dt><dd className="font-semibold">{d.workers}</dd></div>
                <div><dt className="text-slate-500">Open complaints</dt><dd className="font-semibold">{d.openComplaints}</dd></div>
              </dl>
            </Card>
          ))}
        </div>
      )}
      {editing && data && (
        <DepartmentForm department={editing === "new" ? null : editing} all={data} onClose={() => setEditing(null)} onSaved={reload} />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name}?`}
        message="Departments with workers can't be deleted. Existing complaints keep their department label."
        confirmLabel="Delete"
        tone="danger"
        loading={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
