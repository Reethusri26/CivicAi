const faqs = [
  {
    question: "How do I report an issue?",
    answer:
      "Log in, upload an image, select the location, and submit your complaint.",
  },
  {
    question: "Can I track my complaint?",
    answer:
      "Yes. Every complaint has a live tracking status.",
  },
  {
    question: "How does AI help?",
    answer:
      "AI identifies the issue category, assigns priority, and recommends the nearest worker.",
  },
];

const FAQ = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-8">

        <h2 className="text-4xl font-bold text-center">
          Frequently Asked Questions
        </h2>

        <div className="mt-16 space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border rounded-xl p-6"
            >
              <h3 className="font-semibold text-lg">
                {faq.question}
              </h3>

              <p className="text-gray-600 mt-3">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;