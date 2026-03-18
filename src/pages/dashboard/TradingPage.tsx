import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TradingViewWidget from "@/components/TradingViewWidget";

const pairs = [
  { name: "BTC/USDT", price: 67432.5, change: 2.34, symbol: "BINANCE:BTCUSDT" },
  { name: "ETH/USDT", price: 3521.8, change: 1.12, symbol: "BINANCE:ETHUSDT" },
  { name: "SOL/USDT", price: 178.45, change: -0.87, symbol: "BINANCE:SOLUSDT" },
  { name: "BNB/USDT", price: 612.3, change: 3.56, symbol: "BINANCE:BNBUSDT" },
  { name: "XRP/USDT", price: 0.62, change: -1.23, symbol: "BINANCE:XRPUSDT" },
  { name: "ADA/USDT", price: 0.45, change: 0.78, symbol: "BINANCE:ADAUSDT" },
];

const orderBook = {
  asks: [
    { price: 67450.2, amount: 0.342 },
    { price: 67448.0, amount: 0.128 },
    { price: 67445.5, amount: 0.891 },
    { price: 67442.1, amount: 0.456 },
    { price: 67440.0, amount: 1.234 },
  ],
  bids: [
    { price: 67432.5, amount: 0.567 },
    { price: 67430.0, amount: 0.234 },
    { price: 67428.8, amount: 0.789 },
    { price: 67425.1, amount: 0.123 },
    { price: 67420.0, amount: 1.456 },
  ],
};

type OrderType = "market" | "limit" | "stop-loss" | "take-profit";

const TradingPage = () => {
  const [selectedPair, setSelectedPair] = useState("BTC/USDT");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [side, setSide] = useState<"buy" | "sell">("buy");

  const currentPair = pairs.find((p) => p.name === selectedPair)!;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Trading</h1>
          <p className="text-muted-foreground text-sm">Execute trades with real-time professional charts</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Pair selector */}
          <div className="lg:col-span-1 glass-card p-4 max-h-[600px] overflow-y-auto">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Markets</h3>
            <div className="space-y-1">
              {pairs.map((pair) => (
                <button
                  key={pair.name}
                  onClick={() => setSelectedPair(pair.name)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    selectedPair === pair.name ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
                  }`}
                >
                  <span className="font-medium font-display">{pair.name}</span>
                  <div className="text-right">
                    <div className="text-xs font-medium">${pair.price.toLocaleString()}</div>
                    <div className={`text-xs ${pair.change >= 0 ? "text-profit" : "text-loss"}`}>
                      {pair.change >= 0 ? "+" : ""}{pair.change}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chart + Order book */}
          <div className="lg:col-span-2 space-y-4">
            {/* TradingView Chart */}
            <div className="glass-card p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold font-display">{currentPair.name}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold font-display">${currentPair.price.toLocaleString()}</span>
                    <span className={`text-sm font-medium ${currentPair.change >= 0 ? "text-profit" : "text-loss"}`}>
                      {currentPair.change >= 0 ? "+" : ""}{currentPair.change}%
                    </span>
                  </div>
                </div>
              </div>
              <TradingViewWidget symbol={currentPair.symbol} />
            </div>

            {/* Order book */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Order Book</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex justify-between text-muted-foreground mb-2">
                    <span>Price (USDT)</span>
                    <span>Amount</span>
                  </div>
                  {[...orderBook.asks].reverse().map((o, i) => (
                    <div key={i} className="flex justify-between py-1 text-loss">
                      <span>{o.price.toFixed(1)}</span>
                      <span>{o.amount.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between text-muted-foreground mb-2">
                    <span>Price (USDT)</span>
                    <span>Amount</span>
                  </div>
                  {orderBook.bids.map((o, i) => (
                    <div key={i} className="flex justify-between py-1 text-profit">
                      <span>{o.price.toFixed(1)}</span>
                      <span>{o.amount.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Order panel */}
          <div className="lg:col-span-1 glass-card p-5 space-y-4 h-fit">
            <div className="flex rounded-lg bg-secondary p-1">
              <button
                onClick={() => setSide("buy")}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                  side === "buy" ? "bg-profit text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setSide("sell")}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                  side === "sell" ? "bg-loss text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sell
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Order Type</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["market", "limit", "stop-loss", "take-profit"] as OrderType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`px-2 py-1.5 rounded text-xs font-medium capitalize transition-all duration-200 ${
                      orderType === t ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {orderType !== "market" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Price (USDT)</label>
                <Input placeholder="0.00" type="number" className="bg-secondary border-border h-10" />
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Amount ({selectedPair.split("/")[0]})</label>
              <Input placeholder="0.00" type="number" className="bg-secondary border-border h-10" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Total (USDT)</label>
              <Input placeholder="0.00" type="number" className="bg-secondary border-border h-10" />
            </div>

            <div className="flex gap-2">
              {["25%", "50%", "75%", "100%"].map((pct) => (
                <button key={pct} className="flex-1 py-1.5 rounded bg-secondary text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200">
                  {pct}
                </button>
              ))}
            </div>

            <Button
              variant="hero"
              className={`w-full h-12 text-sm font-semibold ${
                side === "sell" ? "bg-loss hover:bg-loss/90 shadow-none" : ""
              }`}
              style={side === "sell" ? { boxShadow: "0 0 30px hsl(0 72% 56% / 0.3)" } : undefined}
            >
              {side === "buy" ? "Buy" : "Sell"} {selectedPair.split("/")[0]}
            </Button>

            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
              <div className="flex justify-between"><span>Available</span><span>5,241.00 USDT</span></div>
              <div className="flex justify-between"><span>Fee</span><span>0.1%</span></div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TradingPage;
