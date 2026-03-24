import PublicLayout from "@/components/layouts/PublicLayout";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Target, Heart, Shield, Globe, Users, TrendingUp, Award, ArrowRight,
  CheckCircle2, Sparkles, Building2, Lightbulb, Eye, Rocket
} from "lucide-react";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";

const values = [
  { icon: Shield, title: "Trust & Transparency", desc: "Every fee is disclosed upfront. Every transaction is auditable. We believe trust is earned through radical transparency." },
  { icon: Heart, title: "User First", desc: "Every decision we make starts with one question: 'Does this help our traders succeed?' If not, we don't build it." },
  { icon: Lightbulb, title: "Innovation", desc: "We invest heavily in R&D to bring institutional-grade technology to everyday traders." },
  { icon: Globe, title: "Accessibility", desc: "Trading should be accessible to everyone, everywhere. We support 60+ countries and multiple languages." },
];

const milestones = [
  { year: "2020", event: "Founded in London with a vision to democratize institutional trading" },
  { year: "2021", event: "Launched crypto trading platform with 50+ trading pairs" },
  { year: "2022", event: "Expanded to forex and commodities. Reached 5,000 active traders" },
  { year: "2023", event: "Introduced copy trading. Surpassed $1B in quarterly volume" },
  { year: "2024", event: "Launched AI-powered analytics. Grew to 12,000+ traders globally" },
];

const team = [
  { name: "Alexander Chen", role: "CEO & Co-Founder", bio: "Former VP at Goldman Sachs. 15+ years in institutional trading." },
  { name: "Sarah Williams", role: "CTO", bio: "Ex-Google engineer. Built trading systems processing $50B+ daily." },
  { name: "Michael Torres", role: "Chief Risk Officer", bio: "20 years in risk management across JPMorgan and Citadel." },
  { name: "Emma Richardson", role: "Head of Product", bio: "Previously led fintech products at Revolut." },
];

export default function AboutUs() {
  return (
    <PublicLayout title="About Us">
      <PublicPageHeader 
        label="ABOUT US"
        title="Building the Future of Trading"
        description="We started Clarity Trade with a simple belief: the world's best trading technology shouldn't be locked behind institutional doors. It should be available to everyone."
        icon={Building2}
        image="/images/3d-hq.png"
      />

      {/* Mission & Vision */}
      <section className="section-bg-white" id="mission">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="hyip-card h-full"
            >
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-8">
                <Target className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Our Mission</h2>
              <p className="p-hyip">
                To democratize access to financial markets by providing institutional-grade trading technology, 
                education, and tools to traders of all experience levels, regardless of their background or location.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="hyip-card h-full"
            >
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-8">
                <Eye className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Our Vision</h2>
              <p className="p-hyip">
                A world where anyone can participate in global financial markets confidently and fairly. 
                Where technology levels the playing field and knowledge is shared freely within a secure ecosystem.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-bg-light" id="values">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
            <span className="heading-gold">What We Stand For</span>
            <h2 className="title-hyip text-gray-900">Our Core Principles</h2>
            <p className="p-hyip">
              Our values help to guide every product decision, every customer 
              interaction, and every single line of code we write into our platform.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="hyip-card !p-10 group"
              >
                <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-6 border border-[#D4AF37]/20 group-hover:bg-[#D4AF37] transition-all">
                  <v.icon className="w-6 h-6 text-[#D4AF37] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-[#D4AF37] transition-colors">{v.title}</h3>
                <p className="p-hyip text-sm">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-bg-white py-24" id="timeline">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto mb-20 lg:mb-24">
            <span className="heading-gold">Our History</span>
            <h2 className="title-hyip text-gray-900">The Journey So Far</h2>
            <p className="p-hyip">From a small idea to a global trading infrastructure serving thousands.</p>
          </motion.div>
          <div className="max-w-4xl mx-auto space-y-0">
            {milestones.map((m, i) => (
              <motion.div key={m.year} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex gap-10 items-start pb-12 last:pb-0 relative"
              >
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-[#D4AF37] text-gray-900 flex items-center justify-center font-black text-sm shadow-gold relative z-10">
                    {m.year}
                  </div>
                  {i < milestones.length - 1 && <div className="w-0.5 h-full bg-[#D4AF37]/20 mt-2 z-0" />}
                </div>
                <div className="pt-4 px-6 py-8 rounded-xl bg-gray-50 border border-gray-100 flex-grow shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-900 font-extrabold text-lg mb-2">{m.event}</p>
                  <p className="text-gray-500 text-sm">Strategic milestone achieved in our global expansion roadmap.</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-bg-light" id="team">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
            <span className="heading-gold">Our Experts</span>
            <h2 className="title-hyip text-gray-900">The Leadership Team</h2>
            <p className="p-hyip">Led by veterans from the world's top financial institutions and tech companies.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {team.map((member, i) => (
              <motion.div key={member.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="hyip-card !p-0 overflow-hidden text-center group"
              >
                <div className="p-8 pb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37]/40 to-[#D4AF37]/10 text-gray-900 flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-md border border-white/50 group-hover:scale-110 transition-transform">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="font-black text-gray-900 text-xl tracking-tight mb-1">{member.name}</h3>
                  <div className="text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-4">{member.role}</div>
                </div>
                <div className="p-6 bg-gray-50 border-t border-gray-100 h-full">
                  <p className="p-hyip text-sm italic">"{member.bio}"</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology & Security */}
      <section className="py-24 bg-white" id="tech">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:w-1/2 space-y-8">
              <span className="heading-gold">The Engine Room</span>
              <h2 className="title-hyip text-gray-900 leading-tight">Institutional-Grade Infrastructure for Every Trader</h2>
              <p className="p-hyip text-lg">
                Our proprietary matching engine, <span className="text-gray-900 font-bold italic">ClarityEngine v3.0</span>, was built from the ground up to handle peak market volatility with sub-millisecond latency.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                {[
                  { label: "Execution Speed", value: "< 2ms", desc: "Ultra-fast order matching." },
                  { label: "Daily Peak Volume", value: "$4.2B", desc: "Proven stability under load." },
                  { label: "Data Encryption", value: "AES-256", desc: "Military-grade data protection." },
                  { label: "Global Nodes", value: "14", desc: "Localized low-latency access." }
                ].map((stat) => (
                  <div key={stat.label} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-2xl font-black text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest">{stat.label}</div>
                    <div className="text-[11px] text-gray-400 mt-2 italic">{stat.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="lg:w-1/2 relative">
                <div className="absolute inset-0 bg-gradient-gold opacity-10 blur-3xl rounded-full" />
                <img 
                  src="https://images.unsplash.com/photo-1558494949-ef010cbdcc51?q=80&w=2021&auto=format&fit=crop" 
                  alt="Server Infrastructure" 
                  className="rounded-3xl shadow-huge relative z-10 border border-white/20"
                />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Corporate Responsibility */}
      <section className="py-24 bg-[hsl(40,20%,97%)]" id="responsibility">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
            <span className="heading-gold">Beyond the Markets</span>
            <h2 className="title-hyip text-gray-900">Trading for a Better Future</h2>
            <p className="p-hyip">Sustainability and financial literacy are core to our identity as a global financial leader.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="hyip-card">
              <CheckCircle2 className="w-10 h-10 text-[#D4AF37] mb-6" />
              <h3 className="text-lg font-bold text-gray-900 mb-4">Carbon Neutral Trading</h3>
              <p className="text-sm text-gray-500 leading-relaxed">We offset 100% of the carbon footprint generated by our data centers through verified reforestation projects.</p>
            </div>
            <div className="hyip-card">
              <Sparkles className="w-10 h-10 text-[#D4AF37] mb-6" />
              <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Literacy Fund</h3>
              <p className="text-sm text-gray-500 leading-relaxed">0.1% of every trade fee goes into our global education fund, providing free trading courses to underprivileged communities.</p>
            </div>
            <div className="hyip-card">
              <Rocket className="w-10 h-10 text-[#D4AF37] mb-6" />
              <h3 className="text-lg font-bold text-gray-900 mb-4">FinTech Scholarships</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Supporting the next generation of engineers with over 50 scholarships annually for students pursuing financial technology.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Reach - Dark Section */}
      <section className="section-bg-dark text-center" id="global">
        <div className="container mx-auto px-6">
           <div className="max-w-4xl mx-auto flex flex-col items-center">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="mb-10 text-[#D4AF37]"
             >
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-float">
                    <Globe className="w-12 h-12" />
                </div>
             </motion.div>
             <h2 className="title-hyip text-white mb-8 text-4xl lg:text-5xl">Serving Traders In Over <br className="hidden md:block" /> <span className="text-[#D4AF37]">60 Countries</span> Worldwide</h2>
             <p className="p-hyip-dark mb-12 text-lg lg:text-xl font-medium max-w-2xl opacity-80">
                Clarity Trade is committed to breaking down financial barriers. No matter where you are, 
                our platform provides you with the same institutional power used by the world's best banks.
             </p>
             <div className="flex justify-center gap-6">
                <Link to="/register" className="btn-gold !px-12 !h-14 flex items-center gap-2">Join Our Community <ArrowRight className="w-4 h-4" /></Link>
             </div>
           </div>
        </div>
      </section>
    </PublicLayout>
  );
}
