import { motion } from "framer-motion";
import { useMemo } from "react";

const generateChartData = (points: number, trend: "up" | "down" | "volatile") => {
  const data: number[] = [];
  let value = 50 + Math.random() * 30;
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - (trend === "down" ? 0.6 : 0.4)) * 4;
    value = Math.max(10, Math.min(90, value + change));
    data.push(value);
  }
  return data;
};

const MiniChart = ({ data, color }: { data: number[]; color: string }) => {
  const path = useMemo(() => {
    const w = 200;
    const h = 60;
    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (v / 100) * h;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [data]);

  return (
    <svg viewBox="0 0 200 60" className="w-full h-12">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path + " L 200 60 L 0 60 Z"} fill={`url(#grad-${color})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
};

const pairs = [
  { name: "BTC/USDT", price: "67,432.50", change: "+2.34%", up: true, trend: "up" as const },
  { name: "ETH/USDT", price: "3,521.80", change: "+1.12%", up: true, trend: "up" as const },
  { name: "SOL/USDT", price: "178.45", change: "-0.87%", up: false, trend: "down" as const },
  { name: "BNB/USDT", price: "612.30", change: "+3.56%", up: true, trend: "volatile" as const },
];

const MarketPreviewSection = () => {
  const charts = useMemo(() => pairs.map((p) => generateChartData(40, p.trend)), []);

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            Live <span className="text-gradient-primary">Markets</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Real-time market data at your fingertips.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {pairs.map((pair, i) => (
            <motion.div
              key={pair.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold font-display">{pair.name}</h4>
                  <div className="text-lg font-bold font-display mt-1">${pair.price}</div>
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-md ${pair.up ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"}`}>
                  {pair.change}
                </span>
              </div>
              <MiniChart data={charts[i]} color={pair.up ? "hsl(152,69%,53%)" : "hsl(0,72%,56%)"} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketPreviewSection;
