import Navbar from "../../components/layout/Navbar";
import Hero from "../../components/common/Hero";
import Statistics from "../../components/common/Statistics";
import Features from "../../components/common/Features";
import HowItWorks from "../../components/common/HowItWorks";
import Testimonials from "../../components/common/Testimonials";
import FAQ from "../../components/common/FAQ";
import Footer from "../../components/layout/Footer";

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Statistics />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <Footer />
    </>
  );
};

export default LandingPage;