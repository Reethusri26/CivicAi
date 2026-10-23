import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Filler, Legend, Tooltip);

ChartJS.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";
ChartJS.defaults.color = "#475569";
ChartJS.defaults.plugins.legend.labels.boxWidth = 10;
ChartJS.defaults.plugins.legend.labels.boxHeight = 10;
ChartJS.defaults.maintainAspectRatio = false;

export const GRID_COLOR = "#e2e8f0";

// Categorical palette for series without an inherent colour (categories, departments).
export const SERIES_COLORS = ["#2647e0", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#e11d48", "#64748b", "#14b8a6"];

export const integerAxis = {
  beginAtZero: true,
  ticks: { precision: 0 },
  grid: { color: GRID_COLOR },
  border: { display: false },
};
