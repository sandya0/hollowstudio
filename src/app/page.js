import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";

export default function Home() {
  
  return (
    <>
      {/* Grid overlay layer */}
      {/* <div className="grid-overlay" /> */}

      <main className="relative">
        <Navbar />
        <Hero />
      </main>
    </>
  );
}
