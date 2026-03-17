import { TrendingUp } from "lucide-react";

const footerLinks = {
  Platform: ["Trading", "Copy Trading", "Markets", "Analytics", "Pricing"],
  Company: ["About", "Careers", "Blog", "Press", "Contact"],
  Legal: ["Terms of Service", "Privacy Policy", "Cookie Policy", "Risk Disclosure"],
  Support: ["Help Center", "API Docs", "Status", "Community"],
};

const Footer = () => {
  return (
    <footer className="border-t border-border py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold font-display">TradeX</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The smarter way to trade. Copy top traders, fund with crypto, grow your wealth.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold font-display mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© 2026 TradeX. All rights reserved.</p>
          <p className="text-xs text-muted-foreground max-w-lg text-center md:text-right">
            Trading involves significant risk. Past performance is not indicative of future results. Only trade with capital you can afford to lose.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
