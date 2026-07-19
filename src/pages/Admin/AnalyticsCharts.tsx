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

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

interface Props {
  stats: Stats;
}

export default function AnalyticsCharts({ stats }: Props) {
  const pieData = {
    labels: ["Pending", "In Progress", "Completed"],
    datasets: [
      {
        label: "Complaints",
        data: [
          stats.pending,
          stats.inProgress,
          stats.resolved,
        ],
        backgroundColor: [
          "#facc15",
          "#3b82f6",
          "#22c55e",
        ],
      },
    ],
  };

  const barData = {
    labels: [
      "Pending",
      "In Progress",
      "Completed",
    ],
    datasets: [
      {
        label: "Complaints",
        data: [
          stats.pending,
          stats.inProgress,
          stats.resolved,
        ],
        backgroundColor: [
          "#facc15",
          "#3b82f6",
          "#22c55e",
        ],
      },
    ],
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-8">

      <div className="bg-white rounded-xl shadow-lg p-6">

        <h2 className="text-xl font-semibold mb-4">
          Complaint Distribution
        </h2>

        <Pie data={pieData} />

      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">

        <h2 className="text-xl font-semibold mb-4">
          Status Overview
        </h2>

        <Bar
          data={barData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
            },
          }}
        />

      </div>

    </div>
  );
}