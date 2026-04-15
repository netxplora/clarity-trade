import { Search, MessageSquare, BookOpen, Clock, Shield, Database, Headset, ChevronRight, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/lib/supabase";

const categories = [
  { 
    icon: Shield, 
    title: "Account & Security", 
    desc: "Protect your account and manage identity verification.", 
    items: [
      { id: "kyc", label: "How to complete KYC Verification" },
      { id: "2fa", label: "Enabling Two-Factor Authentication (2FA)" },
      { id: "passwd", label: "Resetting your account password" },
      { id: "sessions", label: "Monitoring active login sessions" }
    ] 
  },
  { 
    icon: Database, 
    title: "Deposits & Withdrawals", 
    desc: "Manage your funds, wallet addresses, and withdrawals.", 
    items: [
      { id: "addr", label: "Generating wallet addresses" },
      { id: "time", label: "Withdrawal processing timeframes" },
      { id: "fees", label: "Transaction fees and limits" },
      { id: "methods", label: "Supported payment methods" }
    ] 
  },
  { 
    icon: BookOpen, 
    title: "Trading Guide", 
    desc: "Learn to navigate the markets and use advanced tools.", 
    items: [
      { id: "chart", label: "Customizing your chart layout" },
      { id: "orders", label: "Market, Limit, and Stop orders" },
      { id: "leverage", label: "Understanding leverage and margin" },
      { id: "copy", label: "Copy trading for beginners" }
    ] 
  },
  { 
    icon: Clock, 
    title: "Platform & Policies", 
    desc: "Terms of service, privacy, and operating hours.", 
    items: [
      { id: "hours", label: "Trading session hours" },
      { id: "tos", label: "Platform terms and conditions" },
      { id: "privacy", label: "How we protect your data" },
      { id: "risk", label: "Risk disclosure agreement" }
    ] 
  },
];

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { data, error } = await supabase
          .from('support_faqs')
          .select('*')
          .eq('status', 'active')
          .order('priority', { ascending: false });
        
        if (error) throw error;
        setFaqs(data || []);
      } catch (err) {
        console.error('Error fetching FAQs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(search.toLowerCase()) || 
    faq.answer.toLowerCase().includes(search.toLowerCase()) ||
    faq.category?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCategories = categories.map(cat => ({
    ...cat,
    items: faqs
      .filter(f => f.category?.toLowerCase() === cat.title.toLowerCase())
      .slice(0, 4)
      .map(f => ({ id: f.id, label: f.question }))
  })).filter(cat => 
    cat.title.toLowerCase().includes(search.toLowerCase()) || 
    cat.desc.toLowerCase().includes(search.toLowerCase()) ||
    cat.items.length > 0
  );

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="relative rounded-[2.5rem] bg-card border border-border overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="p-8 lg:p-14 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl text-center md:text-left">
            <h1 className="text-4xl lg:text-5xl font-black text-foreground tracking-tight mb-4">How can we help?</h1>
            <p className="text-muted-foreground text-lg font-medium leading-relaxed mb-10">Search our knowledge base or browse frequently asked questions to find solutions quickly.</p>
            
            <div className="relative group max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Ask a question or search topics..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-16 pl-14 pr-6 rounded-2xl bg-secondary border border-border text-foreground font-bold outline-none focus:border-primary/50 transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
               <HelpCircle className="w-24 h-24 text-primary opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {filteredCategories.map((cat, i) => (
          <motion.div 
            key={cat.title} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            className="p-10 rounded-[2rem] bg-card border border-border shadow-huge hover:border-primary/30 transition-all duration-500 group"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all duration-500">
                <cat.icon className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
              </div>
              <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
            <h3 className="text-2xl font-black text-foreground mb-4">{cat.title}</h3>
            <p className="text-muted-foreground mb-8 leading-relaxed font-semibold">{cat.desc}</p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {cat.items.map(item => (
                <button key={item.id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 hover:bg-primary/5 border border-transparent hover:border-primary/10 text-left transition-all group/item">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover/item:bg-primary group-hover/item:scale-125 transition-all" />
                  <span className="text-xs font-bold text-foreground/80 group-hover/item:text-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* FAQ Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h2 className="text-2xl font-black text-foreground tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="bg-card border border-border rounded-[2rem] p-8 lg:p-10 shadow-huge">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-secondary/20 rounded-2xl animate-pulse" />)}
              </div>
            ) : filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="w-full space-y-4">
                {filteredFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border border-border rounded-2xl px-6 bg-secondary/20 overflow-hidden">
                    <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline py-6 text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground font-semibold pb-6">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-10 text-muted-foreground font-bold">
                No matching questions found. Try a different search term.
              </div>
            )}
          </div>
        </div>

        {/* Popular Articles List */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            <h2 className="text-2xl font-black text-foreground tracking-tight">Popular Articles</h2>
          </div>
          <div className="bg-card border border-border rounded-[2rem] p-8 shadow-huge flex flex-col gap-4">
             {[
               { title: "Introduction to Margin Trading", time: "5 min read", category: "Trading" },
               { title: "Securing your Wallet with 2FA", time: "3 min read", category: "Security" },
               { title: "Understanding Exchange Rates", time: "4 min read", category: "Finance" },
               { title: "Troubleshooting Login Issues", time: "2 min read", category: "Account" },
               { title: "How to export your Tax Reports", time: "6 min read", category: "Reports" },
             ].map((article, idx) => (
               <button key={idx} className="flex flex-col gap-1 p-4 rounded-xl hover:bg-secondary/50 transition-colors text-left group">
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest">{article.category}</span>
                 <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{article.title}</span>
                 <div className="flex items-center gap-2 mt-2 opacity-40">
                   <Clock className="w-3 h-3" />
                   <span className="text-[9px] font-bold uppercase">{article.time}</span>
                 </div>
               </button>
             ))}
             <Button variant="outline" className="mt-4 h-12 rounded-xl font-black border-border">View All Resources</Button>
          </div>
        </div>
      </div>

      {/* Support CTA Section */}
      <div className="py-20 bg-secondary/30 rounded-[2.5rem] border border-border relative overflow-hidden text-center px-6">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/[0.03] rounded-full blur-[80px]" />
        <Headset className="w-16 h-16 text-primary mx-auto mb-8" />
        <h2 className="text-3xl lg:text-4xl font-black text-foreground mb-6">Need further assistance?</h2>
        <p className="text-muted-foreground font-semibold max-w-2xl mx-auto mb-12 italic">Our support team is available 24/7. Connect with an expert for account-specific inquiries or technical troubleshooting.</p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button size="lg" className="h-14 px-10 rounded-xl font-black shadow-glow bg-primary hover:bg-primary/90 text-white gap-3 transition-all hover:scale-105 active:scale-95" asChild>
            <Link to="/contact">Live Chat <MessageSquare className="w-5 h-5" /></Link>
          </Button>
          <Button variant="outline" size="lg" className="h-14 px-10 rounded-xl font-black border-border bg-card hover:bg-secondary transition-all" asChild>
            <Link to="/contact">Create Support Ticket</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
