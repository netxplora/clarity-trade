import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { 
  CheckCircle2, 
  ShieldCheck, 
  ArrowUpRight,
  Lock,
  Globe,
  Wallet,
  Building,
  ScanFace,
  Crown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const SubscriptionPage = () => {
  const { user } = useStore();
  const navigate = useNavigate();
  const [tierLimits, setTierLimits] = useState<Record<string, number>>({
    Starter: 100,
    Silver: 1000,
    Gold: 5000,
    Elite: 25000
  });

  useEffect(() => {
    const fetchTierLimits = async () => {
      const { data } = await supabase.from('platform_settings').select('tier_minimums').eq('id', 1).single();
      if (data?.tier_minimums) {
        setTierLimits(data.tier_minimums);
      }
    };
    fetchTierLimits();
  }, []);

  const handleUpgradeRequest = () => {
    navigate('/dashboard/kyc');
  };

  const kycTiers = [
    {
      id: "Starter",
      name: "Starter Bundle",
      statusText: "Access Level 1",
      description: "Start your journey by following beginner-level experts with minimal risk.",
      icon: ScanFace,
      color: "from-slate-400 to-slate-600",
      glow: "shadow-slate-500/10",
      limitText: `Min Balance: $${tierLimits.Starter?.toLocaleString()}`,
      requirements: [
        "Email Verification",
        "Phone Number Verification",
        `Minimum $${tierLimits.Starter?.toLocaleString()} Account Balance`
      ],
      benefits: [
        "Follow Beginner Experts",
        "Standard Mirroring Speed",
        "Basic Performance Tracking",
        "Max Withdrawal: $500 / daily"
      ],
      current: user?.current_plan === "Starter" || !user?.current_plan
    },
    {
      id: "Silver",
      name: "Silver Tier",
      statusText: "Access Level 2",
      description: "Unlock intermediate traders with higher growth potential and priority support.",
      icon: ShieldCheck,
      color: "from-blue-400 to-blue-600",
      glow: "shadow-blue-500/20",
      popular: true,
      limitText: `Min Balance: $${tierLimits.Silver?.toLocaleString()}`,
      requirements: [
        "All Starter Requirements",
        "Government ID Verification",
        `Minimum $${tierLimits.Silver?.toLocaleString()} Account Balance`
      ],
      benefits: [
        "Follow Silver Star Experts",
        "Priority Signal Mirroring",
        "24/7 Priority Support",
        "Max Withdrawal: $25,000 / daily"
      ],
      current: user?.current_plan === "Silver"
    },
    {
      id: "Gold",
      name: "Gold Status",
      statusText: "Access Level 3",
      description: "Access top-tier gold experts with proven track records and account management.",
      icon: Building,
      color: "from-amber-400 to-amber-600",
      glow: "shadow-amber-500/30",
      limitText: `Min Balance: $${tierLimits.Gold?.toLocaleString()}`,
      requirements: [
        "All Silver Requirements",
        "Proof of Address",
        `Minimum $${tierLimits.Gold?.toLocaleString()} Account Balance`
      ],
      benefits: [
        "Follow Gold Tier Experts",
        "Ultra-Fast Mirroring",
        "Account Strategy Manager",
        "Max Withdrawal: $100,000 / daily"
      ],
      current: user?.current_plan === "Gold"
    },
    {
      id: "Elite",
      name: "Elite Exclusive",
      statusText: "Full Access",
      description: "The ultimate professional grade copy trading experience with institutional tools.",
      icon: Crown,
      color: "from-slate-800 to-slate-900",
      glow: "shadow-slate-900/40",
      limitText: `Min Balance: $${tierLimits.Elite?.toLocaleString()}`,
      requirements: [
        "All Gold Requirements",
        "Full Compliance Review",
        `Minimum $${tierLimits.Elite?.toLocaleString()} Account Balance`
      ],
      benefits: [
        "Follow Elite Pro Experts",
        "Institutional Concierge",
        "Exclusive ROI Insights",
        "Uncapped Deposits & Withdrawals"
      ],
      current: user?.current_plan === "Elite"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-12 mb-20 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="relative text-center space-y-4 pt-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Compliance & Verification
          </motion.div>
          <h1 className="text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-none">
            Choose your verification tier
          </h1>
          <p className="text-muted-foreground text-sm font-medium max-w-2xl mx-auto leading-relaxed">
            Select a verification level based on your desired deposit and withdrawal limits.
          </p>
        </div>

        {/* Plan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {kycTiers.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative group rounded-[2.5rem] p-px overflow-hidden transition-all duration-500 hover:scale-[1.02] ${
                tier.current 
                ? 'bg-gradient-gold shadow-gold' 
                : 'bg-border hover:bg-primary/20 bg-opacity-20'
              }`}
            >
              <div className="relative bg-card rounded-[2.45rem] p-8 h-full flex flex-col justify-between overflow-hidden">
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tier.color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity blur-3xl -mr-16 -mt-16`} />
                
                <div className="space-y-6 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white shadow-lg`}>
                      <tier.icon className="w-7 h-7" />
                    </div>
                    {tier.popular && (
                      <Badge className="bg-primary text-white text-[9px] font-black uppercase tracking-widest px-3 py-1">MOST POPULAR</Badge>
                    )}
                    {tier.current && (
                      <Badge variant="outline" className="border-primary text-primary text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-primary/5">CURRENT TIER</Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight">{tier.id}</h3>
                    <div className="flex items-baseline gap-1 mt-2 mb-2">
                       <span className="text-xl font-black text-foreground">{tier.name}</span>
                    </div>
                    <div className="inline-block bg-secondary px-3 py-1 rounded-full text-xs font-bold text-foreground">
                       {tier.limitText}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium italic mt-3 leading-relaxed">
                      {tier.description}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Verification Requirements</h4>
                    {tier.requirements.map((req, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold text-muted-foreground leading-snug">{req}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Limits & Benefits</h4>
                    {tier.benefits.map((benefit, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold text-muted-foreground leading-snug">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-10 relative z-10">
                  <Button 
                    variant={tier.current ? "outline" : (tier.popular ? "hero" : "secondary")}
                    disabled={tier.current}
                    className={`w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all group/btn ${
                      tier.current ? 'border-primary/20 text-primary opacity-60' : 
                      (tier.popular ? 'text-white shadow-gold hover:scale-105 active:scale-95' : 'hover:bg-secondary border-border')
                    }`}
                    onClick={() => handleUpgradeRequest()}
                  >
                    {tier.current ? "CURRENTLY ACTIVE" : `VERIFY ${tier.id}`}
                    {!tier.current && <ArrowUpRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Global Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
           {[{
              icon: Globe,
              title: "Global Compliance",
              desc: "Fully compliant with international AML and KYC regulatory frameworks."
           }, {
              icon: Lock,
              title: "Secure Data",
              desc: "Top-tier encryption for all your personal and financial documents."
           }, {
              icon: Wallet,
              title: "Secure Withdrawals",
              desc: "Advanced verification protecting your funds."
           }].map((feature, i) => (
              <div key={i} className="p-8 rounded-[2rem] bg-secondary/30 border border-border flex flex-col items-center text-center">
                 <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center text-primary shadow-sm mb-6">
                    <feature.icon className="w-6 h-6" />
                 </div>
                 <h4 className="text-sm font-black text-foreground mb-2">{feature.title}</h4>
                 <p className="text-xs text-muted-foreground font-medium">{feature.desc}</p>
              </div>
           ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionPage;
