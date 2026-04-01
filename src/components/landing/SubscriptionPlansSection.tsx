import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Star, ArrowRight, Zap, ShieldCheck, Crown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const SubscriptionPlansSection = () => {
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

  const TIERS = [
    {
      name: 'Starter',
      minBalance: `$${tierLimits.Starter?.toLocaleString()}`,
      description: 'Start your journey by following beginner-level experts.',
      features: [
        'Follow Beginner Experts',
        'Standard Mirroring Speed',
        'Basic Performance Tracking',
        'Email Support',
        'Community Access'
      ],
      cta: `Get Started ($${tierLimits.Starter?.toLocaleString()})`,
      icon: Shield,
      color: 'from-slate-500/10 to-slate-500/5',
      borderColor: 'border-slate-800/30'
    },
    {
      name: 'Silver',
      minBalance: `$${tierLimits.Silver?.toLocaleString()}`,
      description: 'Unlock intermediate traders with higher growth potential.',
      features: [
        'Follow Silver Star Experts',
        'Priority Signal Mirroring',
        '24/7 Priority Support',
        'Advanced Risk Guard',
        'Monthly Profit Reports'
      ],
      cta: `Go Silver ($${tierLimits.Silver?.toLocaleString()})`,
      icon: ShieldCheck,
      color: 'from-blue-500/10 to-blue-500/5',
      borderColor: 'border-blue-500/30'
    },
    {
      name: 'Gold',
      minBalance: `$${tierLimits.Gold?.toLocaleString()}`,
      description: 'Access top-tier gold experts with proven track records.',
      features: [
        'Follow Gold Tier Experts',
        'Ultra-Fast Mirroring',
        'Account Strategy Manager',
        'Custom Risk Limits',
        'VIP Market Signals'
      ],
      cta: `Go Gold ($${tierLimits.Gold?.toLocaleString()})`,
      icon: Star,
      color: 'from-primary/20 to-primary/5',
      borderColor: 'border-primary',
      popular: true
    },
    {
      name: 'Elite',
      minBalance: `$${tierLimits.Elite?.toLocaleString()}+`,
      description: 'The ultimate professional grade copy trading experience.',
      features: [
        'Follow Elite Pro Experts',
        'Institutional Concierge',
        'Private Signal Channels',
        'Exclusive ROI Insights',
        '1-on-1 Trading Sessions'
      ],
      cta: `Go Elite ($${tierLimits.Elite?.toLocaleString()}+)`,
      icon: Crown,
      color: 'from-slate-900/10 to-slate-900/5',
      borderColor: 'border-slate-700'
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-background" id="packages">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
           >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">Trader Access Packages</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6 tracking-tight"
          >
            Fund Your <span className="text-primary italic">Expert</span> Access
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground font-medium"
          >
            No recurring fees. Simply maintain the minimum balance in your wallet to unlock corresponding expert levels. Your balance remains yours, accessible at any time.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {TIERS.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex flex-col p-8 rounded-[2.5rem] bg-card border-2 ${tier.borderColor} transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group overflow-hidden`}
            >
              {tier.popular && (
                <div className="absolute top-6 right-6">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/30">
                    <Star className="w-3 h-3 fill-current" /> Most Popular
                  </div>
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-8 border border-border/50 group-hover:scale-110 transition-transform duration-500`}>
                <tier.icon className="w-7 h-7 text-foreground" />
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-black text-foreground mb-2">{tier.name}</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 leading-relaxed">
                  {tier.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">{tier.minBalance}</span>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">min balance</span>
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                variant={tier.popular ? "hero" : "outline"}
                className={`w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  tier.popular 
                  ? "shadow-gold text-white" 
                  : "bg-secondary/50 hover:bg-primary hover:text-white border-border"
                }`}
                onClick={() => navigate('/auth/register')}
              >
                {tier.cta} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="mt-6 text-center">
                <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                  No Subscription • Balance-Based Access
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 p-8 md:p-12 rounded-[3.5rem] bg-secondary/30 border border-border border-dashed flex flex-col md:flex-row items-center justify-between gap-8"
        >
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h4 className="text-xl font-black text-foreground tracking-tight">Enterprise Asset Management</h4>
                    <p className="text-sm text-muted-foreground font-medium mt-1">For institutional portfolios above $500,000. Contact our wealth desk for custom fee structures and private propagation channels.</p>
                </div>
            </div>
            <Button variant="outline" className="h-14 px-10 rounded-2xl text-xs font-black uppercase tracking-widest border-border hover:bg-secondary whitespace-nowrap">
                Contact Institutions
            </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default SubscriptionPlansSection;
