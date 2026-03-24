import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "David Chen",
    role: "Portfolio Manager",
    text: "Clarity Trade has transformed how I manage client portfolios. The multi-asset execution is seamless, and the copy trading feature lets me offer structured strategies to retail clients effortlessly.",
    rating: 5,
    avatar: "DC",
  },
  {
    name: "Amara Okafor",
    role: "Independent Trader",
    text: "I've used several platforms over the years, but the speed and reliability here is unmatched. The gold-standard security gives me confidence to hold significant capital on the platform.",
    rating: 5,
    avatar: "AO",
  },
  {
    name: "Lena Petrov",
    role: "Forex Specialist",
    text: "The forex execution is institutional-grade. Tight spreads, deep liquidity, and the analytics tools help me make better decisions. This platform genuinely respects professional traders.",
    rating: 5,
    avatar: "LP",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="section-bg-white" id="testimonials">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
          <span className="heading-gold">Real Client Testimonials</span>
          <h2 className="title-hyip text-gray-900">
            Trusted by <span className="text-[#D4AF37]">Thousands of Traders</span>
          </h2>
          <p className="p-hyip">
            Join a global community of traders who have found success and 
            security with our intuitive and powerful platform.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm relative group hover:shadow-md transition-shadow h-full flex flex-col"
            >
              <div className="absolute top-6 right-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                <Quote className="w-12 h-12 text-[#D4AF37]" />
              </div>
              
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                ))}
              </div>

              <div className="flex-grow">
                 <p className="text-gray-600 italic leading-relaxed mb-8">"{testimonial.text}"</p>
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-gray-50 mt-auto">
                <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] font-extrabold text-sm border border-[#D4AF37]/20">
                   {testimonial.avatar}
                </div>
                <div>
                   <h4 className="font-extrabold text-gray-900 text-base">{testimonial.name}</h4>
                   <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{testimonial.role}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
