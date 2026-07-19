import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getAllComplaints,
  getWorkers,
  assignWorker,
  searchComplaints,
  filterComplaints,
} from "../../services/adminService";

import AnalyticsCharts from "./AnalyticsCharts";
import DashboardCards from "./DashboardCards";

interface Complaint {
  _id: string;
  title: string;
  description: string;
  category?: string;
  status: string;
  priority?: string;

  image?: string;
  completionImage?: string;

  address?: string;

  aiCategory?: string;
  aiConfidence?: number;

  citizen?: {
    name: string;
    email: string;
  };

  assignedWorker?: {
    _id: string;
    name: string;
  };
}

interface Worker {
  _id: string;
  name: string;
  department: string;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedWorkers, setSelectedWorkers] =
    useState<Record<string, string>>({});

  useEffect(() => {
    loadDashboard();
    loadWorkers();
  }, []);

  const loadDashboard = async () => {
    try {
      const statsRes = await getDashboardStats();
      const complaintsRes = await getAllComplaints();

      setStats(statsRes.data.stats);
      setComplaints(complaintsRes.data.complaints);
    } catch (err) {
      console.error(err);
    }
  };

  const loadWorkers = async () => {
    try {
      const res = await getWorkers();
      setWorkers(res.data.workers);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      loadDashboard();
      return;
    }

    try {
      const res = await searchComplaints(search);
      setComplaints(res.data.complaints);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilter = async (status: string) => {
    setStatusFilter(status);

    if (status === "All") {
      loadDashboard();
      return;
    }

    try {
      const res = await filterComplaints(status);
      setComplaints(res.data.complaints);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (complaintId: string) => {
    const workerId = selectedWorkers[complaintId];

    if (!workerId) {
      alert("Please select a worker.");
      return;
    }

    try {
      await assignWorker(complaintId, workerId);

      alert("Worker assigned successfully.");

      loadDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";

      case "In Progress":
        return "bg-blue-100 text-blue-700";

      case "Assigned":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const priorityColor = (priority?: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700";

      case "Medium":
        return "bg-orange-100 text-orange-700";

      default:
        return "bg-green-100 text-green-700";
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <h1 className="text-4xl font-bold mb-8">
        Admin Dashboard
      </h1>

      <DashboardCards stats={stats} />

      <AnalyticsCharts stats={stats} />

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <div className="flex flex-wrap gap-4">

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaints..."
            className="border rounded-lg p-3 flex-1"
          />

          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-6 rounded-lg"
          >
            Search
          </button>

          <select
            value={statusFilter}
            onChange={(e) => handleFilter(e.target.value)}
            className="border rounded-lg px-4"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Assigned</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>

        </div>

      </div>
            <div className="overflow-x-auto bg-white rounded-xl shadow">

        <table className="min-w-full">

          <thead className="bg-slate-800 text-white">

            <tr>

              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Citizen</th>
              <th className="px-4 py-3 text-left">AI Category</th>
              <th className="px-4 py-3 text-left">Address</th>
              <th className="px-4 py-3 text-left">Image</th>
              <th className="px-4 py-3 text-left">Completion</th>
              <th className="px-4 py-3 text-left">Assign Worker</th>
              <th className="px-4 py-3 text-center">Action</th>

            </tr>

          </thead>

          <tbody>

            {complaints.length === 0 ? (

              <tr>

                <td
                  colSpan={12}
                  className="py-10 text-center text-gray-500"
                >
                  No complaints available.
                </td>

              </tr>

            ) : (

              complaints.map((item) => (

                <tr
                  key={item._id}
                  className="border-b hover:bg-gray-50"
                >

                  <td className="px-4 py-4 font-semibold">
                    {item.title}
                  </td>

                  <td className="px-4 py-4 max-w-xs">
                    {item.description}
                  </td>

                  <td className="px-4 py-4">
                    {item.category || "-"}
                  </td>

                  <td className="px-4 py-4">

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>

                  </td>

                  <td className="px-4 py-4">

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColor(
                        item.priority
                      )}`}
                    >
                      {item.priority || "Low"}
                    </span>

                  </td>

                  <td className="px-4 py-4">

                    <div>

                      <p className="font-medium">
                        {item.citizen?.name || "-"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {item.citizen?.email}
                      </p>

                    </div>

                  </td>

                  <td className="px-4 py-4">

                    <div>

                      <p>
                        {item.aiCategory || "-"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {item.aiConfidence
                          ? `${item.aiConfidence}%`
                          : ""}
                      </p>

                    </div>

                  </td>

                  <td className="px-4 py-4">
                    {item.address || "-"}
                  </td>

                  <td className="px-4 py-4">

                    {item.image ? (

                      <a
                        href={`http://localhost:5000/${item.image}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>

                    ) : (

                      <span className="text-gray-400">
                        No Image
                      </span>

                    )}

                  </td>

                  <td className="px-4 py-4">

                    {item.completionImage ? (

                      <a
                        href={`http://localhost:5000/${item.completionImage}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        View
                      </a>

                    ) : (

                      <span className="text-gray-400">
                        Pending
                      </span>

                    )}

                  </td>

                  <td className="px-4 py-4">

                    <select
                      className="border rounded-lg p-2 w-full"
                      value={selectedWorkers[item._id] || ""}
                      onChange={(e) =>
                        setSelectedWorkers({
                          ...selectedWorkers,
                          [item._id]: e.target.value,
                        })
                      }
                    >

                      <option value="">
                        Select Worker
                      </option>

                      {workers.map((worker) => (

                        <option
                          key={worker._id}
                          value={worker._id}
                        >
                          {worker.name} ({worker.department})
                        </option>

                      ))}

                    </select>

                  </td>

                  <td className="px-4 py-4 text-center">

                    <button
                      onClick={() => handleAssign(item._id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                    >
                      Assign
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="bg-white rounded-xl shadow p-6">

          <h3 className="text-gray-500 text-sm">
            Total Complaints
          </h3>

          <p className="text-4xl font-bold mt-2 text-slate-700">
            {stats.total}
          </p>

        </div>

        <div className="bg-yellow-50 rounded-xl shadow p-6">

          <h3 className="text-yellow-700 text-sm">
            Pending
          </h3>

          <p className="text-4xl font-bold mt-2 text-yellow-600">
            {stats.pending}
          </p>

        </div>

        <div className="bg-blue-50 rounded-xl shadow p-6">

          <h3 className="text-blue-700 text-sm">
            In Progress
          </h3>

          <p className="text-4xl font-bold mt-2 text-blue-600">
            {stats.inProgress}
          </p>

        </div>

        <div className="bg-green-50 rounded-xl shadow p-6">

          <h3 className="text-green-700 text-sm">
            Completed
          </h3>

          <p className="text-4xl font-bold mt-2 text-green-600">
            {stats.resolved}
          </p>

        </div>

      </div>

      <div className="mt-8 bg-white rounded-xl shadow p-6">

        <h2 className="text-xl font-semibold mb-4">
          Quick Insights
        </h2>

        <ul className="space-y-3 text-gray-700">

          <li>
            📌 Total Complaints :
            <span className="font-semibold ml-2">
              {stats.total}
            </span>
          </li>

          <li>
            ⏳ Pending :
            <span className="font-semibold ml-2">
              {stats.pending}
            </span>
          </li>

          <li>
            🚧 In Progress :
            <span className="font-semibold ml-2">
              {stats.inProgress}
            </span>
          </li>

          <li>
            ✅ Completed :
            <span className="font-semibold ml-2">
              {stats.resolved}
            </span>
          </li>

        </ul>

      </div>
          </div>
  );
}