import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

interface Props {
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
  };
}

export default function AdminCharts({ stats }: Props) {
  const pieData = {
    labels: ["Pending", "In Progress", "Resolved"],
    datasets: [
      {
        data: [
          stats.pending,
          stats.inProgress,
          stats.resolved,
        ],
      },
    ],
  };

  const barData = {
    labels: ["Pending", "In Progress", "Resolved"],
    datasets: [
      {
        label: "Complaints",
        data: [
          stats.pending,
          stats.inProgress,
          stats.resolved,
        ],
      },
    ],
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 mt-8">
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">
          Complaint Distribution
        </h2>
        <Pie data={pieData} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">
          Status Overview
        </h2>
        <Bar data={barData} />
      </div>
    </div>
  );
}