import {
  Brain,
  MapPinned,
  Users,
  BarChart3,
  Bell,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Issue Detection",
    description:
      "Automatically detects garbage, potholes, water leakage, and other civic issues.",
  },
  {
    icon: MapPinned,
    title: "Live GPS Tracking",
    description:
      "Locate issues accurately with integrated GPS mapping.",
  },
  {
    icon: Users,
    title: "Smart Worker Allocation",
    description:
      "Assigns the nearest available worker automatically.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Monitor complaints, response times, and city performance.",
  },
  {
    icon: Bell,
    title: "Instant Notifications",
    description:
      "Keep citizens informed with real-time complaint updates.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Platform",
    description:
      "Role-based access with JWT authentication and secure APIs.",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-8">

        <h2 className="text-4xl font-bold text-center">
          Why Choose
          <span className="text-emerald-500"> CivicAI</span>
        </h2>

        <p className="text-center text-gray-500 mt-4 max-w-2xl mx-auto">
          Empowering citizens and municipalities with AI-driven civic issue
          management.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                  <Icon className="text-emerald-600" size={28} />
                </div>

                <h3 className="text-xl font-semibold mb-3">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-7">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Features;