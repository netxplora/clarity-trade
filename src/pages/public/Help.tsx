import PublicLayout from "@/components/layouts/PublicLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { HelpCircle, Search, MessageSquare, BookOpen, Clock, Shield, Database, Headset } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const categories = [
  { icon: Shield, title: "Account & Security", desc: "How to protect your account and verify your identity.", items: ["KYC Verification Process", "Setting up 2FA", "Recovery Codes FAQ", "Password Security"] },
  { icon: Database, title: "Deposits & Withdrawals", desc: "Everything about funding your account and withdrawing profits.", items: ["Adding Bank Account", "Processing Timeframes", "Crypto Deposit Guide", "Withdrawal Limits"] },
  { icon: BookOpen, title: "Trading Essentials", desc: "Learn how to use our platform and execute trades efficiently.", items: ["Using Advanced Charting", "Order Types Guide", "Leverage & Margin", "Copy Trading Setup"] },
  { icon: Clock, title: "Platform & Support", desc: "General information about Clarity Trade and our services.", items: ["Trading Hours", "Support Tickets", "Data Feeds", "Mobile App Guide"] },
];

export default function Help() {
  return (
    <PublicLayout title="Help Center">
      <PublicPageHeader 
        label="HELP CENTER"
        title="Solutions & Support"
        description="Search our extensive knowledge base or browse help topics to find solutions for your inquiries. Our team is always here for you."
        icon={HelpCircle}
        image="/images/3d-hq.png"
      />

      <section className="py-24 bg-white" id="help-search">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto relative -mt-32 z-20">
            <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-2xl border border-gray-100 mb-20 flex flex-col md:flex-row gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Ask a question or search topics..." 
                  className="w-full h-16 pl-16 pr-6 rounded-2xl bg-gray-50 border border-gray-100 text-gray-900 font-bold outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>
              <Button variant="hero" className="h-16 px-10 rounded-2xl font-black shadow-gold text-white">Search Help</Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {categories.map((cat, i) => (
                <motion.div key={cat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="p-10 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#D4AF37] transition-all duration-500 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-8 group-hover:bg-[#D4AF37] transition-all">
                    <cat.icon className="w-8 h-8 text-[#D4AF37] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">{cat.title}</h3>
                  <p className="text-gray-500 mb-8 leading-relaxed font-bold">{cat.desc}</p>
                  
                  <ul className="space-y-4">
                    {cat.items.map(item => (
                      <li key={item} className="flex items-center gap-3 text-sm text-gray-900 font-bold group/item cursor-pointer">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] group-hover/item:scale-150 transition-transform" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-24 bg-[#0B0F14] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/[0.05] rounded-full blur-[120px]" />
        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
           <Headset className="w-16 h-16 text-[#D4AF37] mx-auto mb-8" />
           <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">Can't find what you need?</h2>
           <p className="p-hyip-dark mb-12">Our dedicated support specialists are ready to help you 24/5 with any technical or account inquiries.</p>
           <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button variant="hero" className="h-16 px-12 rounded-2xl font-black shadow-gold text-white" asChild>
                 <Link to="/contact">Chat Now <MessageSquare className="w-5 h-5 ml-2" /></Link>
              </Button>
              <Button variant="outline" className="h-16 px-12 rounded-2xl font-black border-white/20 text-white hover:bg-white/10" asChild>
                 <Link to="/contact">Submit Ticket</Link>
              </Button>
           </div>
        </div>
      </section>
    </PublicLayout>
  );
}
