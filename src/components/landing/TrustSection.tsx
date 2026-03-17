import { motion } from "framer-motion";
import { Shield, Eye, Lock, Server } from "lucide-react";

const items = [
  { icon: Lock, title: "End-to-End Encryption", desc: "All data and transactions are encrypted with AES-256." },
  { icon: Eye, title: "Full Transparency", desc: "Real-time verified performance data — no hidden metrics." },
  { icon: Server, title: "99.99% Uptime", desc: "Enterprise infrastructure ensuring your trades never miss a beat." },
  { icon: Shield, title: "2FA Protection", desc: "Google Authenticator and biometric security for every account." },
];

const TrustSection = () => {
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
            Trust & <span className="text-gradient-primary">Security</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Your funds and data are protected by institutional-grade security.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold font-display mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
