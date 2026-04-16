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
    <section className="py-24 bg-background border-t border-border/50" id="testimonials">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
          <span className="text-[#D4AF37] font-semibold tracking-wider text-sm uppercase">Client Endorsements</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            Trusted by Professionals
          </h2>
          <p className="text-muted-foreground">
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
              className="bg-card border border-border p-8 rounded-xl relative group hover:border-[#D4AF37]/50 transition-all h-full flex flex-col"
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
                 <p className="text-foreground italic leading-relaxed mb-8">"{testimonial.text}"</p>
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-border/50 mt-auto">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-[#D4AF37] font-extrabold text-sm border border-border">
                   {testimonial.avatar}
                </div>
                <div>
                   <h4 className="font-bold text-foreground text-base" style={{ fontFamily: "Inter, sans-serif" }}>{testimonial.name}</h4>
                   <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{testimonial.role}</span>
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
