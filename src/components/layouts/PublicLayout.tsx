import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageTransition from "@/components/PageTransition";
import { useEffect } from "react";

const PublicLayout = ({ children, title }: { children: React.ReactNode; title?: string }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
    if (title) {
      document.title = `${title} | Clarity Trade`;
    }
  }, [title]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <Navbar />
      <main className="flex-grow">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
