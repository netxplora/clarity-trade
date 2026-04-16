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
    <section className="py-24 bg-background border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#D4AF37] font-semibold tracking-wider text-sm uppercase">Top Performers</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            Trader Leaderboard
          </h2>
          <p className="text-muted-foreground">
            Discover our most successful traders. Analyze their performance metrics and start copying their strategies today.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary border-b border-border">
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trader</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profit (12M)</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Win Rate</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Score</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Followers</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {leaderboardData.map((trader, i) => (
                    <motion.tr 
                      key={trader.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-accent/5 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground">
                            {trader.name.split(' ')[0][0]}{trader.name.split(' ')[1][0]}
                          </div>
                          <span className="font-semibold text-foreground">{trader.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-profit">{trader.roi}</td>
                      <td className="py-4 px-6 text-muted-foreground">{trader.winRate}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          trader.risk === 'Low' ? 'bg-profit/10 text-profit' :
                          trader.risk === 'Moderate' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' :
                          'bg-loss/10 text-loss'
                        }`}>
                          {trader.risk}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground/60" /> {trader.followers}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link to="/auth/register" className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border border-border text-foreground text-sm rounded hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all">
                          Copy <Copy className="w-3 h-3" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-border flex justify-center bg-secondary/50">
              <Link to="/copy-trading" className="text-sm font-semibold text-[#D4AF37] hover:text-foreground transition-colors flex items-center gap-2">
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
