import PublicLayout from "@/components/layouts/PublicLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { BarChart3, TrendingUp, Compass, PieChart } from "lucide-react";

export default function Analytics() {
  const tools = [
    { title: "Risk Analysis", desc: "See how volatile your assets are and manage risk in real time.", icon: Compass },
    { title: "Portfolio Breakdown", desc: "View how your money is split across different assets.", icon: PieChart },
    { title: "Market Depth", desc: "See live buy and sell orders on a visual heatmap.", icon: BarChart3 },
    { title: "Performance Tracking", desc: "Compare your returns against market benchmarks.", icon: TrendingUp },
  ];

  return (
    <PublicLayout title="Analytics">
      <PublicPageHeader
        label="ANALYTICS"
        title="Pro Analytics"
        description="Make smarter decisions with powerful charts and real-time market data built right into your dashboard."
        icon={BarChart3}
        image="/images/hero-trading-bg.png"
      />
      <div className="container px-4 md:px-6 max-w-6xl mx-auto py-24">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 order-2 md:order-1">
               {tools.map((t) => (
                  <div key={t.title} className="p-6 rounded-3xl bg-white border border-border group hover:border-primary/30 transition-all hover:shadow-gold">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-gradient-gold group-hover:text-white transition-all shadow-sm mb-4">
                        <t.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold font-playfair mb-2">{t.title}</h3>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </div>
               ))}
            </div>
            <div className="order-1 md:order-2">
               <h2 className="text-3xl font-bold font-playfair mb-6 text-foreground">See What You've Been Missing</h2>
               <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  Retail traders lose because they trade blind. We provide the analytics, charting, and live on-chain data flows that give you the edge. No external subscriptions required.
               </p>
               <button className="h-12 px-8 rounded-xl bg-gradient-gold text-white font-semibold shadow-gold hover:opacity-90 transition-all mb-8">Start Your Analysis</button>
               <img src="/images/dashboard-mock.png" alt="Analytics Dashboard" className="rounded-2xl shadow-xl w-full border border-border mix-blend-multiply" />
            </div>
         </div>
      </div>
    </PublicLayout>
  );
}
