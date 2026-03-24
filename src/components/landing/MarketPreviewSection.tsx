import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Globe, Coins, Gem, ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const markets = [
  { category: "Crypto", pairs: [
    { name: "BTC/USDT", price: "$64,281.40", change: "+5.24%", up: true, volume: "$1.2B" },
    { name: "ETH/USDT", price: "$3,542.80", change: "+3.18%", up: true, volume: "$842M" },
    { name: "SOL/USDT", price: "$155.20", change: "-1.42%", up: false, volume: "$312M" },
  ]},
  { category: "Forex", pairs: [
    { name: "EUR/USD", price: "1.0855", change: "+0.12%", up: true, volume: "$5.4B" },
    { name: "GBP/USD", price: "1.2641", change: "+0.08%", up: true, volume: "$3.2B" },
    { name: "USD/JPY", price: "156.84", change: "-0.24%", up: false, volume: "$4.1B" },
  ]},
  { category: "Commodities", pairs: [
    { name: "GOLD", price: "$2,342.60", change: "+0.86%", up: true, volume: "$2.1B" },
    { name: "SILVER", price: "$27.85", change: "+1.24%", up: true, volume: "$890M" },
    { name: "OIL (WTI)", price: "$82.45", change: "-0.58%", up: false, volume: "$1.4B" },
  ]},
];

const categoryIcons: Record<string, typeof Coins> = { Crypto: Coins, Forex: Globe, Commodities: Gem };

const MarketPreviewSection = () => {
  return (
    <section className="section-bg-light" id="markets">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 px-4">
          <span className="heading-gold">Live Market Overview</span>
          <h2 className="title-hyip text-gray-900">
            Institutional-Grade Markets <span className="text-[#D4AF37]">Active Now</span>
          </h2>
          <p className="p-hyip">
            Explore diverse trading opportunities across multiple asset classes with 
            real-time price updates and lightning-fast execution.
          </p>
        </div>

        {/* Market Categories Grid */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {markets.map((market, mi) => {
            const Icon = categoryIcons[market.category];
            return (
              <motion.div
                key={market.category}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: mi * 0.1 }}
                className="hyip-card !p-0 overflow-hidden group shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {/* Category Header */}
                <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30 group-hover:bg-gray-50/50 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
                    <Icon className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg uppercase tracking-wide">{market.category}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] uppercase font-bold text-green-600">Trading Live</span>
                    </div>
                  </div>
                </div>

                {/* Pairs List */}
                <div className="divide-y divide-gray-50">
                  {market.pairs.map((pair) => (
                    <div key={pair.name} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50/30 transition-colors group/pair cursor-pointer">
                      <div>
                        <div className="font-bold text-gray-900 text-sm flex items-center gap-1 group-hover/pair:text-[#D4AF37] transition-colors">
                           {pair.name}
                        </div>
                        <div className="text-[10px] uppercase font-semibold text-gray-400 mt-0.5 tracking-wider">Vol: {pair.volume}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 text-sm tabular-nums">{pair.price}</div>
                        <div className={`text-[10px] font-bold flex items-center justify-end gap-1 mt-1 ${pair.up ? 'text-green-500' : 'text-red-500'}`}>
                          {pair.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {pair.change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Link */}
                <div className="p-4 bg-gray-50/30 border-t border-gray-50">
                  <Link to="/crypto" className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center justify-center gap-2 group/link px-4 py-2 hover:bg-[#D4AF37]/10 border border-transparent hover:border-[#D4AF37]/30 rounded transition-all">
                    Explore All Assets <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MarketPreviewSection;
