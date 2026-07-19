import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Citizen",
    review:
      "CivicAI made reporting potholes incredibly easy. My complaint was resolved within a day!",
  },
  {
    name: "Priya Reddy",
    role: "Municipal Officer",
    review:
      "The AI-based prioritization has significantly improved our response time and resource management.",
  },
  {
    name: "Amit Kumar",
    role: "Field Worker",
    review:
      "Receiving tasks with location details saves time and helps me complete more work every day.",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-gray-100">
      <div className="max-w-7xl mx-auto px-8">
        <h2 className="text-4xl font-bold text-center">
          What People Say
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {testimonials.map((person, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow hover:shadow-lg transition"
            >
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className="fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-gray-600 leading-7">
                "{person.review}"
              </p>

              <div className="mt-6">
                <h3 className="font-bold">{person.name}</h3>
                <p className="text-sm text-gray-500">
                  {person.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;