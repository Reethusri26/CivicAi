import { Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#0B1220] text-gray-300 py-16">
      <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-10">

        <div>
          <div className="flex items-center gap-3">
            <Leaf className="text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">
              CivicAI
            </h2>
          </div>

          <p className="mt-4">
            AI-powered civic management platform helping
            cities become cleaner, smarter, and more efficient.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">
            Quick Links
          </h3>

          <ul className="space-y-2">
            <li>Home</li>
            <li>Features</li>
            <li>About</li>
            <li>Contact</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">
            Contact
          </h3>

          <p>Email: support@civicai.com</p>
          <p>Phone: +91 9876543210</p>
        </div>

      </div>

      <div className="text-center mt-10 text-gray-500">
        © 2026 CivicAI. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;