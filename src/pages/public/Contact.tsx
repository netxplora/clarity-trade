import { useState } from "react";
import PublicLayout from "@/components/layouts/PublicLayout";
import { motion } from "framer-motion";
import {
  Mail, Phone, MapPin, Clock, Send, MessageSquare, Headphones,
  Globe, ArrowRight, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";

const offices = [
  { city: "London", address: "One Canada Square, Canary Wharf, London E14 5AB", timezone: "GMT+0", phone: "+44 20 7946 0958" },
  { city: "Dubai", address: "DIFC Gate Building, Level 15, Dubai, UAE", timezone: "GMT+4", phone: "+971 4 424 8600" },
  { city: "Singapore", address: "1 Raffles Place, Tower 2, Singapore 048616", timezone: "GMT+8", phone: "+65 6823 4500" },
];

const faqs = [
  { q: "How quickly do you respond to tickets?", a: "Average response time is under 2 hours during business hours. Critical issues are escalated immediately." },
  { q: "Do you offer phone support?", a: "Yes, phone support is available 24/5 for all verified account holders. VIP clients get 24/7 priority access." },
];

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent successfully!", {
      description: "We'll get back to you within 24 hours."
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <PublicLayout title="Contact Us">
      <PublicPageHeader 
        label="CONTACT US"
        title="We're Here to Help"
        description="Have a question, need support, or want to learn more about our platform? Our team is available 24/5 to assist you with any inquiries."
        icon={Headphones}
        image="/images/3d-hq.png"
      />

      {/* Contact Methods */}
      <section className="section-bg-light py-16 lg:py-24" id="methods">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: Mail, title: "Email Support", value: "support@claritytrade.com", action: "mailto:support@claritytrade.com" },
              { icon: Phone, title: "Call Center", value: "+44 20 7946 0958", action: "tel:+442079460958" },
              { icon: MessageSquare, title: "Live Chat", value: "24/7 Instant Help", action: "#" },
            ].map((method, i) => (
              <motion.a key={method.title} href={method.action} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="hyip-card group text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-[#D4AF37] transition-all border border-[#D4AF37]/20">
                  <method.icon className="w-8 h-8 text-[#D4AF37] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{method.title}</h3>
                <p className="text-[#D4AF37] font-black text-lg mb-1">{method.value}</p>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Available 24/5</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="section-bg-white py-24" id="form">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-20 max-w-7xl mx-auto">
            {/* Form */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-7">
              <span className="heading-gold">Message Center</span>
              <h2 className="title-hyip text-gray-900 mb-6">Send Us a Inquiry</h2>
              <p className="p-hyip mb-12">Fill out the form below and one of our specialists will get back to you within 24 business hours.</p>
              
              <form onSubmit={handleSubmit} className="space-y-8 bg-gray-50 p-10 lg:p-12 rounded-3xl border border-gray-100 shadow-sm">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-3 block">Full Name</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full h-14 px-6 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm font-bold focus:border-[#D4AF37] outline-none transition-all shadow-sm"
                      placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-3 block">Email Address</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full h-14 px-6 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm font-bold focus:border-[#D4AF37] outline-none transition-all shadow-sm"
                      placeholder="e.g. john@example.com" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-3 block">Subject</label>
                  <select required value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full h-14 px-6 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm font-bold focus:border-[#D4AF37] outline-none transition-all shadow-sm"
                  >
                    <option value="">Select Inquiry Type...</option>
                    <option value="general">General Support</option>
                    <option value="account">Account Verification</option>
                    <option value="trading">Trading Tools</option>
                    <option value="finance">Deposits & Withdrawals</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-3 block">Message Details</label>
                  <textarea required rows={5} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-6 py-5 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm font-bold focus:border-[#D4AF37] outline-none transition-all shadow-sm resize-none"
                    placeholder="How can we assist you today?" />
                </div>
                <button type="submit" className="btn-gold !w-full !py-5 flex items-center justify-center gap-3">
                  Send Message <Send className="w-5 h-5" />
                </button>
              </form>
            </motion.div>

            {/* Info Sidebar */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-5 space-y-12">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-8 border-b-2 border-[#D4AF37] inline-block">Global Headquarters</h3>
                <div className="space-y-6">
                  {offices.map((office) => (
                    <div key={office.city} className="hyip-card !p-8 group hover:!border-[#D4AF37]">
                      <div className="flex items-center gap-3 mb-4">
                        <Building2 className="w-5 h-5 text-[#D4AF37]" />
                        <span className="font-black text-gray-900 uppercase tracking-widest text-sm">{office.city} Office</span>
                      </div>
                      <p className="text-gray-500 font-bold mb-4 leading-relaxed">{office.address}</p>
                      <div className="flex flex-col gap-2 text-xs font-black text-[#D4AF37]">
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {office.timezone}</span>
                        <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> {office.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hyip-card-dark !p-10">
                <Globe className="w-12 h-12 text-[#D4AF37] mb-6" />
                <h4 className="font-black text-white text-xl mb-4">Multilingual Support</h4>
                <p className="p-hyip-dark text-sm mb-0">
                  We support traders in 60+ countries. Our expert team provides assistance in 
                  English, Arabic, Mandarin, Spanish, and French.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
