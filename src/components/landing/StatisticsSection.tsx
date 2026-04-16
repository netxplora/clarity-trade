import { motion } from "framer-motion";
import { Users, Briefcase, Activity, BarChart3, TrendingUp } from "lucide-react";

const stats = [
  { label: "Total Users", value: "250K+", icon: Users },
  { label: "Assets Managaged", value: "$1.5B+", icon: Briefcase },
  { label: "Total Trades", value: "15M+", icon: Activity },
  { label: "Active Traders", value: "85K+", icon: TrendingUp },
  { label: "Daily Volume", value: "$450M+", icon: BarChart3 },
];

const StatisticsSection = () => {
  return (
    <section className="py-16 bg-[#0B0F14] border-t border-[#333]/50 relative z-10 -mt-8 pt-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#1A1A1A] border border-[#333] rounded-xl p-6 flex flex-col items-center text-center hover:border-[#D4AF37]/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-4">
                <stat.icon className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "Inter, sans-serif" }}>{stat.value}</h3>
              <p className="text-sm text-gray-400 font-medium" style={{ fontFamily: "Inter, sans-serif" }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
