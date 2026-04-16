import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TrendingUp, Copy, Users, Shield, ArrowRight } from "lucide-react";

const leaderboardData = [
  { id: 1, name: "Marcus V.", roi: "+185.4%", winRate: "82%", risk: "High", followers: "8,450", trend: "up" },
  { id: 2, name: "Elena R.", roi: "+142.1%", winRate: "78%", risk: "Moderate", followers: "5,120", trend: "up" },
  { id: 3, name: "James K.", roi: "+118.7%", winRate: "91%", risk: "Low", followers: "12,300", trend: "up" },
  { id: 4, name: "Sophia L.", roi: "+95.2%", winRate: "74%", risk: "Moderate", followers: "3,890", trend: "down" },
  { id: 5, name: "David C.", roi: "+88.5%", winRate: "88%", risk: "Low", followers: "9,100", trend: "up" },
];

const LeaderboardSection = () => {
  return (
    <section className="py-24 bg-[#0a0a0a] border-t border-[#333]/50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#D4AF37] font-semibold tracking-wider text-sm uppercase">Top Performers</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            Trader Leaderboard
          </h2>
          <p className="text-gray-400">
            Discover our most successful traders. Analyze their performance metrics and start copying their strategies today.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-[#1A1A1A] border border-[#333] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#111] border-b border-[#333]">
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Trader</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Profit (12M)</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Win Rate</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk Score</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Followers</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]/50">
                  {leaderboardData.map((trader, i) => (
                    <motion.tr 
                      key={trader.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-[#222] transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-xs font-bold text-white">
                            {trader.name.split(' ')[0][0]}{trader.name.split(' ')[1][0]}
                          </div>
                          <span className="font-semibold text-white">{trader.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-green-500">{trader.roi}</td>
                      <td className="py-4 px-6 text-gray-300">{trader.winRate}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          trader.risk === 'Low' ? 'bg-green-500/10 text-green-500' :
                          trader.risk === 'Moderate' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {trader.risk}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-300 flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" /> {trader.followers}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link to="/auth/register" className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border border-[#333] text-white text-sm rounded hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all">
                          Copy <Copy className="w-3 h-3" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-[#333] flex justify-center bg-[#111]">
              <Link to="/copy-trading" className="text-sm font-semibold text-[#D4AF37] hover:text-white transition-colors flex items-center gap-2">
                View Full Leaderboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardSection;
