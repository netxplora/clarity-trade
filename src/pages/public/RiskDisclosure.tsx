import PublicLayout from "@/components/layouts/PublicLayout";
import { PublicPageHeader } from "@/components/landing/PublicPageHeader";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const sections = [
  { title: "1. General Risk Warning", content: "Trading in financial instruments, including but not limited to cryptocurrencies, forex (foreign exchange), and commodities, carries a high level of risk and may not be suitable for all investors. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.\n\nThere is a possibility that you could sustain a loss of some or all of your initial investment and therefore you should not invest money that you cannot afford to lose." },
  { title: "2. Cryptocurrency Risks", content: "Cryptocurrency trading involves specific risks that traditional financial instruments may not carry:\n\n• Extreme price volatility: Cryptocurrency prices can fluctuate by 10-20% or more within a single day\n• Regulatory uncertainty: The regulatory landscape for cryptocurrencies varies by jurisdiction and is subject to change\n• Technology risks: Smart contract bugs, network congestion, and protocol vulnerabilities\n• Irreversible transactions: Cryptocurrency transactions cannot be reversed once confirmed\n• Market manipulation: Crypto markets may be susceptible to manipulation due to lower liquidity in some assets\n• Custody risks: Loss of private keys or wallet access may result in permanent loss of assets" },
  { title: "3. Forex Trading Risks", content: "Foreign exchange trading carries distinct risk factors:\n\n• Leverage amplifies both gains and losses: Using 100:1 leverage means a 1% move equals a 100% gain or loss on your margin\n• Interest rate and geopolitical risks: Currency values are affected by central bank decisions and global events\n• Gap risk: Prices can gap significantly at market open, especially after weekends\n• Counterparty risk: The reliability of your broker affects your trading experience\n• Liquidity risk: Some currency pairs, especially exotics, may have wider spreads during low-volume periods" },
  { title: "4. Commodity Trading Risks", content: "Commodity trading is subject to:\n\n• Supply and demand fluctuations driven by weather, geopolitics, and production levels\n• Storage and delivery considerations for physical commodities\n• Seasonal price patterns that may not repeat\n• Currency risk when commodities are priced in a foreign currency\n• Speculative bubbles and sudden price corrections" },
  { title: "5. Leverage & Margin Risk", content: "Leveraged trading allows you to control a large position with a relatively small deposit (margin). While leverage can amplify profits, it equally amplifies losses:\n\n• You can lose more than your initial deposit in certain scenarios\n• Margin calls may require you to deposit additional funds immediately\n• Positions may be automatically closed if your margin falls below the maintenance level\n• Negative balance protection is applied where regulations require it, but is not universal\n\nWe strongly recommend using risk management tools such as stop-loss orders and take-profit levels on every trade." },
  { title: "6. Copy Trading Risks", content: "Copy trading allows you to replicate the trades of other traders. However:\n\n• Past performance is not indicative of future results\n• The traders you copy may change their strategy without notice\n• Slippage and execution differences may result in different outcomes\n• You are ultimately responsible for your own trading decisions\n• Diversification across multiple traders is recommended" },
  { title: "7. No Financial Advice", content: "Nothing on the Clarity Trade platform constitutes financial, investment, tax, or legal advice. All content is provided for informational and educational purposes only.\n\nYou should consult with a qualified financial advisor before making any investment decisions. We do not recommend any specific investments, trading strategies, or financial products." },
  { title: "8. Regulatory Considerations", content: "Clarity Trade operates under the regulatory framework of the jurisdictions in which it is licensed. However:\n\n• Regulations vary by country and may change\n• Some products may not be available in all jurisdictions\n• Tax obligations vary by country and are your responsibility\n• Compensation schemes may not cover all types of losses\n\nPlease ensure you understand the regulations applicable to your jurisdiction before trading." },
  { title: "9. Technology Risks", content: "Trading platforms are dependent on technology infrastructure. Risks include:\n\n• System outages or maintenance periods during which you cannot trade\n• Internet connectivity issues that may prevent order execution\n• Software bugs that may affect pricing or order processing\n• Cybersecurity threats despite our industry-leading security measures\n\nWe recommend having backup plans and not relying solely on any single system for critical trading decisions." },
  { title: "10. Acknowledgment", content: "By opening an account and trading on the Clarity Trade platform, you acknowledge that:\n\n• You have read and understood this Risk Disclosure statement\n• You are aware of the risks involved in trading financial instruments\n• You are trading with funds you can afford to lose\n• You will seek independent financial advice if needed\n• You accept full responsibility for your trading decisions" },
];

export default function RiskDisclosure() {
  return (
    <PublicLayout title="Risk Disclosure">
      <PublicPageHeader 
        label="LEGAL"
        title="Risk Disclosure"
        description="Important information regarding the risks associated with trading financial instruments, including cryptocurrency, forex, and commodities. Please read carefully."
        icon={AlertTriangle}
        image="/images/security-hero.png"
      />

      <section className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
              <div className="p-8 rounded-3xl bg-red-50/50 border border-red-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-red-900 mb-2">Important Risk Warning</h3>
                    <p className="text-red-800/80 leading-relaxed font-bold">
                      Trading financial instruments involves significant risk of loss. You should only trade with money you can afford to lose. 
                      Between 70-80% of retail investor accounts lose money when trading leveraged products. 
                      Consider whether you understand how these products work and whether you can afford the risk of losing your money.
                    </p>
                    <p className="text-red-400 mt-4 text-xs font-black uppercase tracking-widest">Last updated: March 1, 2026</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="space-y-12">
              {sections.map((section, i) => (
                <motion.div key={section.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">{section.title}</h2>
                  <div className="text-gray-500 font-medium leading-relaxed whitespace-pre-line">{section.content}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
