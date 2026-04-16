const RiskDisclaimerSection = () => {
  return (
    <section className="py-8 bg-[#050505] border-t border-[#222]">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
            Risk Disclaimer & Regulatory Notice
          </h4>
          <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed text-justify mb-3">
            Trading foreign exchange (Forex), cryptocurrencies, and commodities on margin carries a high level of risk and may not be suitable for all investors. The high degree of leverage can work against you as well as for you. Before deciding to trade or invest in any of the asset classes or copy trading services offered by ClarityTrade, you should carefully consider your investment objectives, level of experience, and risk appetite. There is a possibility that you may sustain a loss of some or all of your initial investment and therefore you should not invest money that you cannot afford to lose.
          </p>
          <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed text-justify mb-3">
            Past performance of any trading system, strategy, or copy trading professional is not indicative of future results. Any performance statistics presented on the platform represent historical data and are not a guarantee of future returns. You should be aware of all the risks associated with global financial markets trading and seek advice from an independent financial advisor if you have any doubts.
          </p>
          <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed text-justify">
            ClarityTrade serves as a technology provider and does not give investment advice. By using the platform, you acknowledge and agree that you are solely responsible for your own trading and investment decisions. The information on this site is not directed at residents in any country or jurisdiction where such distribution or use would be contrary to local law or regulation.
          </p>
        </div>
      </div>
    </section>
  );
};

export default RiskDisclaimerSection;
