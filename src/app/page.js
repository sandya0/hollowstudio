import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Services from "@/components/Services";
import Works from "@/components/Works";
import dynamic from 'next/dynamic';


const Services = dynamic(() => import("@/components/Services"));
const Works = dynamic(() => import("@/components/Works"));
const Contact = dynamic(() => import("@/components/Contact"));


export default function Home() {
  
  return (
    <>
      {/* Grid overlay layer */}
      {/* <div className="grid-overlay" /> */}

      <main className="relative">
        <Navbar />
        <Hero />
        <Services />
        <Works />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
