import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-[#0B1220] text-white border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-5">

        <div className="flex items-center gap-2">
          <Leaf className="text-emerald-400" size={30} />
          <h1 className="text-2xl font-bold">
            Civic<span className="text-emerald-400">AI</span>
          </h1>
        </div>

        <ul className="hidden md:flex gap-8">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>Features</li>
          <li>About</li>
          <li>Contact</li>
        </ul>

        <div className="flex gap-3">
          <Link to="/login">
            <button className="border border-emerald-500 px-4 py-2 rounded-lg hover:bg-emerald-500 transition">
              Login
            </button>
          </Link>

          <Link to="/register">
            <button className="bg-emerald-500 px-4 py-2 rounded-lg hover:bg-emerald-600 transition">
              Register
            </button>
          </Link>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;