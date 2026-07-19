interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

interface DashboardCardsProps {
  stats: Stats;
}

export default function DashboardCards({
  stats,
}: DashboardCardsProps) {
  const cards = [
    {
      title: "Total Complaints",
      value: stats.total,
      bg: "bg-indigo-500",
      icon: "📋",
    },
    {
      title: "Pending",
      value: stats.pending,
      bg: "bg-yellow-500",
      icon: "🟡",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      bg: "bg-blue-500",
      icon: "🚧",
    },
    {
      title: "Completed",
      value: stats.resolved,
      bg: "bg-green-500",
      icon: "✅",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.bg} text-white rounded-2xl shadow-lg p-6 transition-transform duration-300 hover:scale-105`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">{card.title}</p>

              <h2 className="text-4xl font-bold mt-2">
                {card.value}
              </h2>
            </div>

            <div className="text-5xl">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}