import { useState } from "react";
import PublicLayout from "@/components/layouts/PublicLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BarChart3, TrendingUp, TrendingDown, Search, ArrowUpRight, Globe, Clock, Zap,
  Star, ArrowRight, Activity, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "crypto" | "forex" | "commodities";

const marketData: Record<Tab, { name: string; symbol: string; price: string; change: string; up: boolean; marketCap?: string; volume: string }[]> = {
  crypto: [
    { name: "Bitcoin", symbol: "BTC/USDT", price: "$64,281.40", change: "+5.24%", up: true, marketCap: "$1.26T", volume: "$28.4B" },
    { name: "Ethereum", symbol: "ETH/USDT", price: "$3,421.50", change: "+3.12%", up: true, marketCap: "$411B", volume: "$14.2B" },
    { name: "Solana", symbol: "SOL/USDT", price: "$142.80", change: "+8.67%", up: true, marketCap: "$63B", volume: "$3.8B" },
    { name: "BNB", symbol: "BNB/USDT", price: "$584.20", change: "-1.34%", up: false, marketCap: "$87B", volume: "$1.2B" },
    { name: "XRP", symbol: "XRP/USDT", price: "$0.6234", change: "+2.18%", up: true, marketCap: "$34B", volume: "$1.5B" },
    { name: "Cardano", symbol: "ADA/USDT", price: "$0.4512", change: "-0.82%", up: false, marketCap: "$16B", volume: "$420M" },
    { name: "Avalanche", symbol: "AVAX/USDT", price: "$35.42", change: "+4.15%", up: true, marketCap: "$13B", volume: "$580M" },
    { name: "Polygon", symbol: "MATIC/USDT", price: "$0.7845", change: "+1.95%", up: true, marketCap: "$7.2B", volume: "$310M" },
  ],
  forex: [
    { name: "Euro / US Dollar", symbol: "EUR/USD", price: "1.0842", change: "+0.12%", up: true, volume: "$2.1T" },
    { name: "British Pound / US Dollar", symbol: "GBP/USD", price: "1.2654", change: "+0.08%", up: true, volume: "$1.2T" },
    { name: "US Dollar / Japanese Yen", symbol: "USD/JPY", price: "150.42", change: "-0.24%", up: false, volume: "$1.1T" },
    { name: "Australian Dollar / US Dollar", symbol: "AUD/USD", price: "0.6523", change: "+0.15%", up: true, volume: "$460B" },
    { name: "US Dollar / Swiss Franc", symbol: "USD/CHF", price: "0.8812", change: "-0.06%", up: false, volume: "$380B" },
    { name: "US Dollar / Canadian Dollar", symbol: "USD/CAD", price: "1.3598", change: "+0.03%", up: true, volume: "$320B" },
    { name: "New Zealand Dollar / US Dollar", symbol: "NZD/USD", price: "0.6012", change: "+0.22%", up: true, volume: "$110B" },
    { name: "Euro / British Pound", symbol: "EUR/GBP", price: "0.8568", change: "-0.10%", up: false, volume: "$180B" },
  ],
  commodities: [
    { name: "Gold", symbol: "XAU/USD", price: "$2,342.80", change: "+1.24%", up: true, volume: "$180B" },
    { name: "Silver", symbol: "XAG/USD", price: "$27.45", change: "+0.82%", up: true, volume: "$24B" },
    { name: "Crude Oil (WTI)", symbol: "CL", price: "$78.42", change: "-0.56%", up: false, volume: "$65B" },
    { name: "Natural Gas", symbol: "NG", price: "$2.18", change: "+2.31%", up: true, volume: "$12B" },
    { name: "Copper", symbol: "HG", price: "$4.12", change: "+1.05%", up: true, volume: "$8.5B" },
    { name: "Platinum", symbol: "XPT/USD", price: "$982.50", change: "-0.32%", up: false, volume: "$4.2B" },
    { name: "Wheat", symbol: "ZW", price: "$562.25", change: "-0.18%", up: false, volume: "$2.1B" },
    { name: "Brent Crude", symbol: "BRN", price: "$82.14", change: "+0.44%", up: true, volume: "$45B" },
  ],
};

export default function MarketData() {
  const [activeTab, setActiveTab] = useState<Tab>("crypto");
  const [search, setSearch] = useState("");

  const filteredData = marketData[activeTab].filter(
    (item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PublicLayout title="Market Data">
      <PublicPageHeader 
        label="LIVE MARKETS"
        title="Live Market Data"
        description="Track real-time prices, volume, and market trends across crypto, forex, and commodities — all in one place."
        icon={Activity}
        image="/images/security-hero.png"
      />

      {/* Market Stats */}
      <section className="py-24 bg-white relative z-20 -mt-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Globe, value: "150+", label: "Markets" },
              { icon: Zap, value: "<10ms", label: "Data Latency" },
              { icon: Clock, value: "24/7", label: "Coverage" },
              { icon: RefreshCw, value: "Real-time", label: "Updates" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-8 rounded-3xl bg-white border border-gray-100 shadow-xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                  <stat.icon className="w-7 h-7 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-900">{stat.value}</div>
                  <div className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Table */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          {/* Tabs & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex gap-2">
              {(["crypto", "forex", "commodities"] as Tab[]).map((tab) => (
                <button key={tab} onClick={() => { setActiveTab(tab); setSearch(""); }}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === tab
                    ? "bg-gradient-gold text-white shadow-gold"
                    : "bg-secondary border border-border text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search markets..."
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-secondary border border-border text-sm focus:border-primary/50 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Table */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={activeTab}
            className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              {/* Mobile Stacked Cards */}
              <div className="md:hidden space-y-4 p-4 text-left">
                 {filteredData.map((item) => (
                    <div key={item.symbol} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-sm">
                       <div className="flex justify-between items-start">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center font-bold text-xs text-primary shrink-0">
                             {item.symbol.split("/")[0].substring(0, 3)}
                           </div>
                           <div>
                             <div className="font-semibold text-foreground">{item.name}</div>
                             <div className="text-xs text-muted-foreground">{item.symbol}</div>
                           </div>
                         </div>
                         <div className="font-bold text-foreground tabular-nums text-lg">{item.price}</div>
                       </div>
                       <div className="grid grid-cols-2 gap-2 text-sm border-t border-gray-50 pt-3">
                         <div>
                            <span className="text-gray-500 font-bold block text-[10px] uppercase tracking-widest">Change</span>
                            <span className={`inline-flex items-center gap-1 font-semibold ${item.up ? "text-green-600" : "text-red-600"}`}>
                              {item.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              {item.change}
                            </span>
                         </div>
                         <div>
                            <span className="text-gray-500 font-bold block text-[10px] uppercase tracking-widest">Volume</span>
                            <span className="text-muted-foreground font-semibold tabular-nums">{item.volume}</span>
                         </div>
                         {activeTab === "crypto" && (
                           <div className="col-span-2">
                             <span className="text-gray-500 font-bold block text-[10px] uppercase tracking-widest">Market Cap</span>
                             <span className="text-muted-foreground font-semibold tabular-nums">{item.marketCap}</span>
                           </div>
                         )}
                       </div>
                       <div className="pt-2">
                         <Button variant="outline" className="w-full text-xs font-semibold h-10 border-border" asChild>
                           <Link to="/auth/register">Trade {item.symbol.split("/")[0]} <ArrowUpRight className="w-3.5 h-3.5 ml-1" /></Link>
                         </Button>
                       </div>
                    </div>
                 ))}
              </div>

              {/* Desktop Table View */}
              <table className="hidden md:table w-full">
                <thead className="bg-secondary/50 border-b border-border text-left">
                  <tr className="text-xs text-muted-foreground font-semibold">
                    <th className="py-4 px-6">Market</th>
                    <th className="text-right py-4 px-6">Price</th>
                    <th className="text-right py-4 px-6">24h Change</th>
                    {activeTab === "crypto" && <th className="text-right py-4 px-6">Market Cap</th>}
                    <th className="text-right py-4 px-6">Volume</th>
                    <th className="text-right py-4 px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-left">
                  {filteredData.map((item) => (
                    <tr key={item.symbol} className="hover:bg-secondary/30 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center font-bold text-xs text-primary shrink-0">
                            {item.symbol.split("/")[0].substring(0, 3)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-foreground tabular-nums">{item.price}</td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${item.up ? "text-green-600" : "text-red-600"}`}>
                          {item.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {item.change}
                        </span>
                      </td>
                      {activeTab === "crypto" && <td className="py-4 px-6 text-right text-sm text-muted-foreground tabular-nums">{item.marketCap}</td>}
                      <td className="py-4 px-6 text-right text-sm text-muted-foreground tabular-nums">{item.volume}</td>
                      <td className="py-4 px-6 text-right">
                        <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs font-semibold border-border opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                          <Link to="/auth/register">Trade <ArrowUpRight className="w-3.5 h-3.5 ml-1" /></Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-4 opacity-30" />
                <p>No markets found matching "{search}"</p>
              </div>
            )}
          </motion.div>

          <div className="text-center mt-10">
            <Button variant="hero" className="h-14 px-10 rounded-xl text-sm font-bold shadow-gold text-white" asChild>
              <Link to="/auth/register">Start Trading Now <ArrowRight className="w-5 h-5 ml-2" /></Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Prices are indicative and update in real-time during market hours.</p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
