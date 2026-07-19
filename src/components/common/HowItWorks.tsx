import {
  Camera,
  Brain,
  UserCheck,
  CheckCircle,
} from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "1. Report Issue",
    description:
      "Upload a photo and location of the civic issue in seconds.",
  },
  {
    icon: Brain,
    title: "2. AI Analysis",
    description:
      "AI identifies the issue type and assigns a priority level.",
  },
  {
    icon: UserCheck,
    title: "3. Worker Assigned",
    description:
      "The nearest available worker is automatically assigned.",
  },
  {
    icon: CheckCircle,
    title: "4. Issue Resolved",
    description:
      "Worker completes the task and citizens receive updates instantly.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-8">

        <div className="text-center">
          <h2 className="text-4xl font-bold">
            How <span className="text-emerald-500">CivicAI</span> Works
          </h2>

          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Reporting civic problems is now faster, smarter, and completely
            transparent.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mt-16">

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={index}
                className="relative bg-gray-50 rounded-2xl p-8 text-center hover:shadow-xl transition"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-6">
                  <Icon className="text-emerald-600" size={30} />
                </div>

                <h3 className="text-xl font-semibold mb-3">
                  {step.title}
                </h3>

                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
};

export default HowItWorks;