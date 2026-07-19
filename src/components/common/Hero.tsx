import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-[#0B1220] text-white">

      <div className="max-w-7xl mx-auto min-h-[90vh] flex flex-col justify-center items-center text-center px-8">

        <motion.h1
          initial={{opacity:0,y:30}}
          animate={{opacity:1,y:0}}
          transition={{duration:0.8}}
          className="text-6xl font-black leading-tight"
        >
          Building
          <span className="text-emerald-400">
            {" "}Cleaner Cities{" "}
          </span>

          Through AI
        </motion.h1>

        <motion.p
          initial={{opacity:0}}
          animate={{opacity:1}}
          transition={{delay:0.4}}
          className="mt-8 text-xl text-gray-400 max-w-3xl"
        >
          Report garbage, potholes, dead animals,
          water leakage and civic issues in seconds.
          AI intelligently assigns the nearest worker
          for faster resolution.
        </motion.p>

        <motion.div
          initial={{opacity:0}}
          animate={{opacity:1}}
          transition={{delay:0.8}}
          className="mt-10 flex gap-5"
        >

          <button className="bg-emerald-500 px-8 py-4 rounded-xl flex items-center gap-2 hover:bg-emerald-600">

            Report Issue

            <ArrowRight/>

          </button>

          <button className="border border-gray-500 px-8 py-4 rounded-xl">

            Track Complaint

          </button>

        </motion.div>

      </div>

    </section>
  );
};

export default Hero;