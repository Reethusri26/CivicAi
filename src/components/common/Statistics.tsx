import { Users, ClipboardCheck, CheckCircle, Clock } from "lucide-react";

const stats = [
  {
    icon: <ClipboardCheck size={32} />,
    number: "12,500+",
    title: "Issues Reported",
  },
  {
    icon: <Users size={32} />,
    number: "500+",
    title: "Active Workers",
  },
  {
    icon: <CheckCircle size={32} />,
    number: "98%",
    title: "Resolved Successfully",
  },
  {
    icon: <Clock size={32} />,
    number: "< 24 hrs",
    title: "Average Response",
  },
];

const Statistics = () => {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 p-8 text-center shadow-sm hover:shadow-lg transition duration-300"
            >
              <div className="flex justify-center text-emerald-500 mb-4">
                {item.icon}
              </div>

              <h2 className="text-3xl font-bold text-gray-900">
                {item.number}
              </h2>

              <p className="mt-2 text-gray-600">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Statistics;