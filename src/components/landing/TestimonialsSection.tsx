import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "David Kim",
    role: "Crypto Investor",
    text: "Copy trading changed everything for me. I went from losing money to consistent profits just by following top traders.",
    rating: 5,
  },
  {
    name: "Emma Thompson",
    role: "Day Trader",
    text: "The platform is incredibly intuitive. Charts load fast, execution is instant, and the analytics are best-in-class.",
    rating: 5,
  },
  {
    name: "Carlos Mendez",
    role: "Pro Trader",
    text: "As a signal provider, I earn commissions while helping others. The copy trading engine is remarkably accurate.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            Trusted by <span className="text-gradient-primary">Thousands</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="glass-card p-6"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-warning fill-warning" />
                ))}
              </div>
              <p className="text-muted-foreground mb-5 leading-relaxed">"{t.text}"</p>
              <div>
                <div className="font-semibold font-display">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
