import { AlertTriangle, CalendarClock, CheckCircle2, ChevronRight, Hammer, ListTodo, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { PriorityBadge, StatusBadge } from "../../components/ui/Badges";
import { PageHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { EmptyState, ErrorState, ListSkeleton } from "../../components/ui/States";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { cx } from "../../lib/cx";
import { firstName, formatDate, timeAgo } from "../../lib/format";
import type { Complaint } from "../../lib/types";
import { useApi } from "../../lib/useApi";

interface TaskResponse {
  stats: { assigned: number; inProgress: number; completed: number; highPriorityOpen: number };
  tasks: Complaint[];
}

function TaskCard({ task }: { task: Complaint }) {
  return (
    <Link
      to={`/worker/tasks/${task.id}`}
      className={cx(
        "group block rounded-xl border bg-white p-4 shadow-card transition hover:shadow-raised",
        task.priority === "High" && task.status !== "Completed" ? "border-rose-200 border-l-4 border-l-rose-500" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-slate-500">{task.reference}</p>
          <h3 className="mt-0.5 text-base font-semibold text-slate-900">{task.title}</h3>
        </div>
        <ChevronRight className="mt-3 size-5 shrink-0 text-slate-300 group-hover:text-brand-500" aria-hidden />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{task.category}</span>
      </div>
      <div className="mt-3 space-y-1 text-sm text-slate-600">
        {task.address && (
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
            <span className="line-clamp-2">{task.address}{task.landmark && ` · near ${task.landmark}`}</span>
          </p>
        )}
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarClock className="size-4 text-slate-400" aria-hidden />
          {task.status === "Completed" ? `Completed ${formatDate(task.completedAt)}` : `Assigned ${timeAgo(task.assignedAt)}`}
        </p>
      </div>
    </Link>
  );
}

export default function WorkerTasks({ history = false }: { history?: boolean }) {
  const { user } = useAuth();
  const { data, error, initialLoading, reload } = useApi(
    () => api.get("/worker/tasks", { params: history ? { status: "Completed" } : {} }).then((res) => res.data as TaskResponse),
    [history]
  );

  const tasks = (data?.tasks || []).filter((task) => (history ? task.status === "Completed" : task.status !== "Completed"));
  const stats = data?.stats;

  return (
    <>
      <PageHeader
        eyebrow={history ? undefined : `Hello, ${firstName(user?.name)}`}
        title={history ? "Completed tasks" : "My tasks"}
        description={history ? "Work you've finished, newest first." : `${user?.department} department · ordered by status and priority`}
      />

      {!history && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Assigned" value={stats?.assigned ?? 0} loading={initialLoading} tone="violet" icon={<ListTodo className="size-5" />} />
          <StatCard label="In progress" value={stats?.inProgress ?? 0} loading={initialLoading} tone="blue" icon={<Hammer className="size-5" />} />
          <StatCard label="High priority" value={stats?.highPriorityOpen ?? 0} loading={initialLoading} tone="rose" icon={<AlertTriangle className="size-5" />} />
          <StatCard label="Completed" value={stats?.completed ?? 0} loading={initialLoading} tone="emerald" icon={<CheckCircle2 className="size-5" />} />
        </div>
      )}

      {initialLoading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState
            icon={history ? <CheckCircle2 className="size-6" /> : <ListTodo className="size-6" />}
            title={history ? "No completed tasks yet" : "No open tasks"}
            description={history ? "Tasks you complete will appear here." : "New assignments will appear here and in your notifications."}
          />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </>
  );
}
