import PublicLayout from "@/components/layouts/PublicLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Briefcase, MapPin, Clock, ArrowRight, Heart, Zap, Globe, Coffee,
  GraduationCap, Plane, Shield, Code, BarChart3, Headphones, Users, Rocket,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const openings = [
  { title: "Senior Backend Engineer", team: "Engineering", location: "London / Remote", type: "Full-time", desc: "Build high-performance trading systems handling billions in daily volume." },
  { title: "Product Designer", team: "Design", location: "London", type: "Full-time", desc: "Design beautiful, intuitive trading experiences for millions of users." },
  { title: "Compliance Officer", team: "Legal", location: "Dubai", type: "Full-time", desc: "Ensure regulatory compliance across multiple jurisdictions." },
  { title: "Data Scientist", team: "AI/ML", location: "Remote", type: "Full-time", desc: "Build ML models for market analysis, risk detection, and user insights." },
  { title: "Senior Mobile Developer", team: "Engineering", location: "Singapore / Remote", type: "Full-time", desc: "Build cross-platform mobile trading apps used by thousands daily." },
  { title: "Customer Success Manager", team: "Support", location: "London", type: "Full-time", desc: "Help traders succeed by providing world-class onboarding and support." },
];

const perks = [
  { icon: Heart, title: "Health & Wellness", desc: "Comprehensive health, dental, and vision insurance for you and your family." },
  { icon: Plane, title: "Unlimited PTO", desc: "We trust you to manage your time. Take the breaks you need." },
  { icon: GraduationCap, title: "Learning Budget", desc: "$5,000/year for courses, conferences, and professional development." },
  { icon: Coffee, title: "Remote-First", desc: "Work from anywhere. We have hubs in London, Dubai, and Singapore." },
  { icon: Zap, title: "Stock Options", desc: "Every team member gets equity. When we win, you win." },
  { icon: Shield, title: "401k / Pension", desc: "Competitive retirement contribution matching up to 6%." },
];

const teamIcons = [
  { icon: Code, name: "Engineering", count: "45+" },
  { icon: BarChart3, name: "Trading", count: "20+" },
  { icon: Users, name: "Product & Design", count: "15+" },
  { icon: Headphones, name: "Support", count: "25+" },
];

export default function Careers() {
  return (
    <PublicLayout title="Careers">
      <PublicPageHeader 
        label="CAREERS"
        title="Build the Future of Finance"
        description="Join a team of 100+ passionate people across London, Dubai, and Singapore who are making institutional-grade trading accessible to everyone."
        icon={Briefcase}
        image="/images/hero-trading-bg.png"
      />

      {/* Team Stats */}
      <section className="py-24 bg-white relative z-20 -mt-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {teamIcons.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-8 rounded-3xl bg-white border border-gray-100 shadow-xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                  <t.icon className="w-7 h-7 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-900">{t.count}</div>
                  <div className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest">{t.name}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture & Perks */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-playfair font-bold text-foreground mb-6">Why You'll Love Working Here</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We believe great work happens when people are supported, challenged, and trusted.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {perks.map((perk, i) => (
              <motion.div key={perk.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white border border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-gradient-gold group-hover:shadow-gold transition-all">
                  <perk.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 font-playfair">{perk.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{perk.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="openings" className="py-24 bg-[hsl(40,20%,98%)]">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-playfair font-bold text-foreground mb-6">Open Positions</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ready to make an impact? Explore our current openings and find your next challenge.
            </p>
          </motion.div>
          <div className="max-w-4xl mx-auto space-y-4">
            {openings.map((job, i) => (
              <motion.div key={job.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="group p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-lg hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center gap-6"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{job.team}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{job.desc}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {job.type}</span>
                  </div>
                </div>
                <Button variant="outline" className="h-10 px-6 rounded-xl text-sm font-semibold border-border shrink-0 group-hover:bg-gradient-gold group-hover:text-white group-hover:border-primary transition-all">
                  Apply <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring Process */}
      <section className="py-24 bg-white" id="process">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto mb-20">
            <span className="heading-gold">Join the Crew</span>
            <h2 className="title-hyip text-gray-900">How We Hire</h2>
            <p className="p-hyip">A transparent, efficient process designed to find the best fit for both you and the team.</p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
                { step: "01", title: "Application Review", desc: "Our recruitment team reviews your experience and portfolio." },
                { step: "02", title: "Introductory Call", desc: "A 30-minute chat to learn about your goals and our culture." },
                { step: "03", title: "Technical/Role Fit", desc: "Deep dive with future teammates on skills and case studies." },
                { step: "04", title: "Official Offer", desc: "Welcome to the team! We handle all the onboarding paperwork." }
            ].map((s, i) => (
                <motion.div key={s.step} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 relative group overflow-hidden"
                >
                    <div className="text-5xl font-black text-[#D4AF37]/10 absolute -top-2 -left-2 group-hover:text-[#D4AF37]/20 transition-colors uppercase italic">{s.step}</div>
                    <div className="relative z-10 pt-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">{s.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Values Deeper Dive */}
      <section className="py-24 bg-[hsl(40,20%,97%)]">
        <div className="container mx-auto px-6">
           <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-1/2">
                 <div className="grid grid-cols-2 gap-4">
                    <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2000&auto=format&fit=crop" className="rounded-2xl shadow-lg mt-8" alt="Team meeting" />
                    <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2000&auto=format&fit=crop" className="rounded-2xl shadow-lg" alt="Collab" />
                 </div>
              </div>
              <div className="lg:w-1/2 space-y-8">
                 <span className="heading-gold">Our DNA</span>
                 <h2 className="title-hyip text-gray-900 text-4xl">Ownership, Speed, and Relentless Curiosity</h2>
                 <p className="p-hyip text-lg">
                    We're not just building a platform; we're building a community of owners. At Clarity Trade, you have the autonomy to make decisions that impact the future of finance.
                 </p>
                 <ul className="space-y-4">
                    {[
                        "Default to Open: We share information broadly by default.",
                        "Obsess Over Quality: Details matter in institutional finance.",
                        "Iterate Fast: We prefer shipping and learning over perfection.",
                        "Compassion Always: We're humans first, traders second."
                    ].map((val) => (
                        <li key={val} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{val}</span>
                        </li>
                    ))}
                 </ul>
              </div>
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white text-center">
        <div className="container mx-auto px-6">
           <div className="max-w-3xl mx-auto p-12 rounded-[3rem] bg-[#1a1510] relative overflow-hidden group shadow-huge">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
              <div className="relative z-10">
                 <Rocket className="w-16 h-16 text-primary mx-auto mb-8 animate-bounce-slow" />
                 <h2 className="text-4xl font-black text-white mb-6 uppercase italic tracking-tight">Ready to launch <span className="text-primary">your career?</span></h2>
                 <p className="text-white/60 text-lg mb-10 font-medium">Join us in London, Dubai, or Singapore and help us build the next generation of trading tools.</p>
                 <div className="flex flex-wrap justify-center gap-4">
                    <Button variant="hero" className="h-14 px-10 rounded-xl text-white shadow-gold font-bold uppercase tracking-widest">
                       View Open Positions
                    </Button>
                    <Button variant="outline" className="h-14 px-10 rounded-xl border-white/10 text-white font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10">
                       Follow on LinkedIn
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      </section>
    </PublicLayout>
  );
}
