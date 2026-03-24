import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TradingViewWidget from "@/components/TradingViewWidget";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Zap, 
  ShieldCheck, 
  ShieldAlert,
  Activity,
  Info,
  History,
  Target,
  Globe,
  Coins,
  ArrowRightLeft
} from "lucide-react";

type MarketCategory = "CRYPTO" | "FOREX" | "COMMODITIES";

const cryptoPairs = [
  { name: "BTC/USDT", price: 67432.5, change: 2.34, high: 68120.0, low: 66200.5, volume: "1.2B", symbol: "BINANCE:BTCUSDT", category: "CRYPTO" },
  { name: "ETH/USDT", price: 3521.8, change: 1.12, high: 3605.2, low: 3480.1, volume: "840M", symbol: "BINANCE:ETHUSDT", category: "CRYPTO" },
  { name: "SOL/USDT", price: 178.45, change: -0.87, high: 185.3, low: 172.4, volume: "420M", symbol: "BINANCE:SOLUSDT", category: "CRYPTO" },
  { name: "BNB/USDT", price: 612.3, change: 3.56, high: 625.0, low: 598.5, volume: "150M", symbol: "BINANCE:BNBUSDT", category: "CRYPTO" },
];

const forexPairs = [
  { name: "EUR/USD", price: 1.0842, change: 0.15, high: 1.0865, low: 1.0820, volume: "4.2T", symbol: "FX:EURUSD", category: "FOREX" },
  { name: "GBP/USD", price: 1.2654, change: -0.21, high: 1.2690, low: 1.2630, volume: "2.8T", symbol: "FX:GBPUSD", category: "FOREX" },
  { name: "USD/JPY", price: 151.42, change: 0.45, high: 151.80, low: 150.95, volume: "3.1T", symbol: "FX:USDJPY", category: "FOREX" },
  { name: "AUD/USD", price: 0.6542, change: -0.12, high: 0.6580, low: 0.6520, volume: "1.2T", symbol: "FX:AUDUSD", category: "FOREX" },
];

const commoditiesPairs = [
  { name: "GOLD", price: 2165.42, change: 1.45, high: 2180.0, low: 2150.5, volume: "850M", symbol: "TVC:GOLD", category: "COMMODITIES" },
  { name: "SILVER", price: 24.85, change: 0.87, high: 25.10, low: 24.60, volume: "120M", symbol: "TVC:SILVER", category: "COMMODITIES" },
  { name: "CRUDE OIL", price: 81.42, change: -1.12, high: 83.50, low: 80.20, volume: "2.4B", symbol: "TVC:UKOIL", category: "COMMODITIES" },
];

const allPairs = [...cryptoPairs, ...forexPairs, ...commoditiesPairs];

const orderBook = {
  asks: [
    { price: 67450.2, amount: 0.342, total: 23145.6 },
    { price: 67448.0, amount: 0.128, total: 8633.3 },
    { price: 67445.5, amount: 0.891, total: 60093.9 },
    { price: 67442.1, amount: 0.456, total: 30753.6 },
    { price: 67440.0, amount: 1.234, total: 83220.9 },
  ],
  bids: [
    { price: 67432.5, amount: 0.567, total: 38234.2 },
    { price: 67430.0, amount: 0.234, total: 15778.6 },
    { price: 67428.8, amount: 0.789, total: 53201.3 },
    { price: 67425.1, amount: 0.123, total: 8293.3 },
    { price: 67420.0, amount: 1.456, total: 98163.5 },
  ],
};

type OrderType = "market" | "limit" | "stop-loss" | "take-profit";

const TradingPage = () => {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState("BTC/USDT");
  const [category, setCategory] = useState<MarketCategory>("CRYPTO");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLedgerTab, setActiveLedgerTab] = useState("Open Positions");
  const [isTradeLoading, setIsTradeLoading] = useState(false);

  const { user, balance, formatCurrency, fetchAppData } = useStore();
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  
  const [dbPairs, setDbPairs] = useState<any[]>([]);
  const [sentimentBias, setSentimentBias] = useState(0);

  const fetchUserTrades = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('trades').select('*').eq('user_id', user.id).order('time', { ascending: false });
    if (data) {
        const mapped = data.map(t => ({
            id: t.id,
            pair: t.pair,
            type: t.type,
            amount: t.amount,
            entryPrice: t.entry_price,
            currentPrice: t.current_price,
            pnl: t.pnl,
            time: t.time,
            status: t.status
        }));
        setActiveTrades(mapped.filter(t => t.status === 'Open'));
        setTradeHistory(mapped.filter(t => t.status === 'Closed'));
        // Load pending orders
        const { data: pending } = await supabase.from('trades').select('*').eq('user_id', user.id).eq('status', 'Pending');
        if (pending) {
            setPendingOrders(pending.map(p => ({
                id: p.id,
                pair: p.pair,
                type: p.type,
                amount: p.amount,
                price: p.entry_price,
                time: p.time,
                orderType: p.order_type
            })));
        }
    }
  };

  const [pendingOrders, setPendingOrders] = useState<any[]>([]);

  const handleCancelOrder = async (orderId: string) => {
    try {
        setIsTradeLoading(true);
        // Refund margin if it was locked? In this simplified model, we'll just delete/cancel.
        const { error } = await supabase.from('trades').delete().eq('id', orderId);
        if (!error) {
            toast.success("Order Cancelled");
            fetchUserTrades();
            fetchAppData();
        }
    } catch(err) {
        toast.error("Failed to cancel order");
    } finally {
        setIsTradeLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
       const { data: pairs } = await supabase.from('market_pairs').select('*').eq('active', true);
       if (pairs) setDbPairs(pairs);

       const { data: sets } = await supabase.from('platform_settings').select('*').limit(1).single();
       if (sets) setSentimentBias(sets.sentiment_bias || 0);
    } catch (err) {
       console.error("Failed to fetch market data", err);
    }
  };

  useEffect(() => {
    fetchUserTrades();
    fetchMarketData();
  }, [user?.id]);
  
  const dynamicPairs = useMemo(() => {
     const pairs = dbPairs.length > 0 ? dbPairs.map(dbP => {
        const staticP = allPairs.find(p => p.name === dbP.name);
        if (staticP) return { ...staticP, dbId: dbP.id };
        return {
           name: dbP.name,
           price: 1520.4,
           change: 2.1,
           high: 1550.0,
           low: 1500.0,
           volume: "100M",
           symbol: `BINANCE:${dbP.name.replace("/", "")}`,
           category: "CRYPTO" as MarketCategory,
           dbId: dbP.id
        };
     }) : allPairs;
     return pairs;
  }, [dbPairs]);

  // Price & PnL Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Randomly fluctuate active trade current prices to simulate PnL
      setActiveTrades(prev => prev.map(trade => {
        const volatility = 0.0005; 
        const change = 1 + (Math.random() * volatility * 2 - volatility);
        const newPrice = trade.currentPrice * change;
        const pnl = trade.type === 'Buy' 
          ? (newPrice - trade.entryPrice) * (trade.amount / trade.entryPrice)
          : (trade.entryPrice - newPrice) * (trade.amount / trade.entryPrice);
        
        return { ...trade, currentPrice: newPrice, pnl };
      }));

      // 2. Simulate Order Book movement
      setOrderBook(prev => ({
         bids: prev.bids.map(b => ({ ...b, amount: Math.max(0.1, b.amount + (Math.random() * 0.2 - 0.1)) })),
         asks: prev.asks.map(a => ({ ...a, amount: Math.max(0.1, a.amount + (Math.random() * 0.2 - 0.1)) }))
      }));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [activeTrades.length]);

  const [orderBook, setOrderBook] = useState({
     bids: [
        { price: 65240.5, amount: 1.24 },
        { price: 65239.0, amount: 3.52 },
        { price: 65238.1, amount: 0.89 },
        { price: 65237.5, amount: 5.11 },
        { price: 65236.2, amount: 2.34 },
     ],
     asks: [
        { price: 65242.8, amount: 0.45 },
        { price: 65243.5, amount: 1.89 },
        { price: 65244.2, amount: 4.12 },
        { price: 65245.0, amount: 0.77 },
        { price: 65246.5, amount: 2.56 },
     ]
  });

  const currentPair = dynamicPairs.find((p) => p.name === selectedPair) || dynamicPairs[0];

  useEffect(() => {
    if (currentPair) {
       setPrice(currentPair.price.toString());
    }
  }, [currentPair]);

  const totalUsdt = amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(2) : "0.00";

  const handleExecuteTrade = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      toast.error("Please enter a valid amount");
      return;
    }

    const tradeTotal = parseFloat(amount) * currentPair.price;
    const { data: b } = await supabase.from('balances').select('*').eq('user_id', user?.id).maybeSingle();

    if (side === "buy" && tradeTotal > (b?.fiat_balance || 0)) {
      toast.error("Insufficient fiat balance to open position");
      return;
    }

    if (side === "sell" && (b?.fiat_balance || 0) < tradeTotal * 0.1) {
      toast.error("Insufficient margin (fiat) to open sell position");
      return;
    }

    try {
        setIsTradeLoading(true);
        const isPending = orderType !== "market";
        
        // 1. Update balances
        const updateB: any = {};
        if (side === "buy") {
            // For both market and limit buys, we lock the cash
            updateB.fiat_balance = Math.max(0, (b?.fiat_balance || 0) - tradeTotal);
            if (!isPending) updateB.trading_balance = (b?.trading_balance || 0) + tradeTotal;
        } else {
            // Sell logic: We still use 10% fiat as maintenance margin for shorts
            const marginRequired = tradeTotal * 0.1;
            updateB.fiat_balance = Math.max(0, (b?.fiat_balance || 0) - marginRequired);
            if (!isPending) updateB.trading_balance = (b?.trading_balance || 0) + tradeTotal;
        }
        
        if (Object.keys(updateB).length > 0) {
            await supabase.from('balances').update(updateB).eq('user_id', user?.id);
        }

        const { error } = await supabase.from('trades').insert({
            user_id: user?.id,
            pair: selectedPair,
            type: side === "buy" ? "Buy" : "Sell",
            amount: tradeTotal,
            entry_price: isPending ? parseFloat(price) : currentPair.price,
            current_price: currentPair.price,
            order_type: orderType,
            status: isPending ? 'Pending' : 'Open',
            time: new Date().toISOString()
        });
        
        if (!error) {
           toast.success(isPending ? "Limit Order Placed" : `${side === "buy" ? "Buy" : "Sell"} order executed`, {
               description: isPending ? `Searching for liquidity at ${price}...` : `Successfully filled ${amount} ${selectedPair.split('/')[0]}.`
           });
           setAmount("");
           await fetchUserTrades();
           await fetchAppData(); // Sync UI balances immediately
        } else {
           toast.error(error.message);
        }
    } catch(err: any) {
        toast.error("Executing trade failed.");
    } finally {
        setIsTradeLoading(false);
    }
  };

  const handleCloseTrade = async (tradeId: string) => {
    try {
        setIsTradeLoading(true);
        const trade = activeTrades.find(t => t.id === tradeId);
        if (!trade) return;

        // 1. Calculate PnL and return to fiat balance
        const { data: b } = await supabase.from('balances').select('*').eq('user_id', user?.id).maybeSingle();
        const pnl = trade.pnl || 0;
        const totalReturn = trade.amount + pnl;

        await supabase.from('balances').update({
            fiat_balance: Math.max(0, (b?.fiat_balance || 0) + totalReturn),
            trading_balance: Math.max(0, (b?.trading_balance || 0) - trade.amount)
        }).eq('user_id', user?.id);

        const { error } = await supabase.from('trades').update({ 
           status: 'Closed',
           pnl: pnl,
           current_price: trade.currentPrice
        }).eq('id', tradeId);

        if (!error) {
           toast.success("Position Closed", { description: `Trade settled at ${formatCurrency(trade.currentPrice)}.` });
           await fetchUserTrades();
           await fetchAppData();
        } else {
           toast.error(error.message);
        }
    } catch(err: any) {
        toast.error("Failed to close position");
    } finally {
        setIsTradeLoading(false);
    }
  };

  const setPercentage = (pct: number) => {
    if (side === "buy") {
      const maxAmount = (balance.available * pct) / currentPair.price;
      setAmount(maxAmount.toFixed(currentPair.category === 'CRYPTO' ? 4 : 2));
    } else {
        // Sell side: find asset balance
        const asset = selectedPair.split("/")[0].toLowerCase() as keyof typeof user.balances;
        const availableAsset = user?.balances?.[asset] || 0;
        setAmount((availableAsset * pct).toFixed(currentPair.category === 'CRYPTO' ? 4 : 2));
    }
  };

  const filteredPairs = dynamicPairs.filter(p => 
    p.category === category && 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const buySentiment = Math.min(100, 64 + sentimentBias);
  const sellSentiment = 100 - buySentiment;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Universal Market Bar */}
        <div className="bg-card border border-border p-6 flex flex-wrap items-center gap-10 shadow-sm rounded-3xl overflow-x-auto">
          <div className="flex items-center gap-4 pr-10 border-r border-border">
             <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary shadow-sm">
                {currentPair.category === 'CRYPTO' ? <Coins className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
             </div>
             <div>
                <h1 className="text-xl font-bold font-sans text-foreground truncate max-w-[150px]">{selectedPair}</h1>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">{currentPair.category} Market</div>
             </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className={`text-2xl font-bold tracking-tight ${currentPair.change >= 0 ? "text-green-600" : "text-red-600"}`}>
              {currentPair.category === 'FOREX' ? "" : formatCurrency(currentPair.price)}
            </span>
            <div className={`flex items-center gap-1 text-[11px] font-bold ${currentPair.change >= 0 ? "text-green-600" : "text-red-600"}`}>
               {currentPair.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
               {currentPair.change >= 0 ? "+" : ""}{currentPair.change}% <span className="opacity-50 ml-1 text-muted-foreground font-semibold uppercase tracking-wider">24h Change</span>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">24h High</span>
              <span className="text-sm font-semibold text-foreground">{currentPair.high.toLocaleString()}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">24h Low</span>
              <span className="text-sm font-semibold text-foreground">{currentPair.low.toLocaleString()}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">24h Volume</span>
              <span className="text-sm font-semibold text-foreground">{currentPair.volume}</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">
                <Target className="w-4 h-4" /> Live Market
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Main Content: Chart + Tabs */}
          <div className="md:col-span-12 lg:col-span-9 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
               {/* Market Selection Column */}
               <div className="hidden xl:col-span-3 xl:block">
                  <div className="bg-card border border-border h-[720px] flex flex-col shadow-sm rounded-3xl overflow-hidden">
                    <div className="p-4 bg-secondary/30 border-b border-border space-y-3">
                        <div className="flex p-1 bg-secondary rounded-xl border border-border">
                           {(["CRYPTO", "FOREX", "COMMODITIES"] as MarketCategory[]).map(cat => (
                              <button 
                                 key={cat}
                                 onClick={() => setCategory(cat)}
                                 className={`flex-1 py-1.5 text-[9px] font-bold tracking-widest uppercase transition-all rounded-lg ${category === cat ? "bg-card text-primary border border-border shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-card/50"}`}
                              >
                                 {cat.substring(0, 3)}
                              </button>
                           ))}
                        </div>
                       <div className="relative group">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground transition-colors" />
                         <input 
                           className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold uppercase tracking-wider focus:border-primary/50 outline-none transition-all" 
                           placeholder="Search Pairs..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                         />
                       </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                      {filteredPairs.map((pair) => (
                        <button
                          key={pair.name}
                          onClick={() => setSelectedPair(pair.name)}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-300 relative group ${
                            selectedPair === pair.name ? "bg-secondary border border-border" : "hover:bg-secondary/50 border border-transparent"
                          }`}
                        >
                          {selectedPair === pair.name && (
                             <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-md" />
                          )}
                          <div className="flex flex-col items-start gap-1 relative z-10 pl-1">
                             <span className={`text-xs font-bold ${selectedPair === pair.name ? "text-primary" : "text-foreground group-hover:text-primary"} transition-colors`}>{pair.name}</span>
                             <span className="text-[10px] text-muted-foreground font-semibold">Vol: {pair.volume}</span>
                          </div>
                          <div className="text-right relative z-10">
                             <div className="text-xs font-bold text-foreground">{pair.price.toLocaleString()}</div>
                             <div className={`text-[10px] font-bold mt-0.5 ${pair.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {pair.change >= 0 ? "+" : ""}{pair.change}%
                             </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
               </div>

               {/* Chart & Market Depth */}
               <div className="col-span-12 xl:col-span-9 space-y-6">
                  {/* Chart */}
                  <div className="bg-card border border-border p-2 h-[500px] relative overflow-hidden shadow-sm rounded-3xl">
                     <TradingViewWidget symbol={currentPair.symbol} />
                  </div>

                  {/* Order Book */}
                  <div className="bg-card border border-border p-6 shadow-sm rounded-3xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary">
                             <ArrowRightLeft className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold font-sans text-foreground">Order Book Details</h3>
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Market Depth</div>
                          </div>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                       {/* Asks */}
                       <div>
                          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2 border-b border-border pb-2">
                             <span>Price</span>
                             <span>Amount</span>
                             <span className="text-right">Total</span>
                          </div>
                          <div className="space-y-1">
                             {[...orderBook.asks].reverse().map((o, i) => (
                               <div key={i} className="flex justify-between py-1.5 relative group px-2 rounded-lg transition-all hover:bg-secondary">
                                  <div className="absolute right-0 top-0.5 bottom-0.5 bg-red-50 rounded-md -z-1 opacity-50" style={{ width: `${(o.amount / 1.5) * 100}%` }} />
                                  <span className="text-xs font-semibold font-mono text-red-600">{o.price.toLocaleString()}</span>
                                  <span className="text-xs font-semibold font-mono text-foreground">{o.amount.toFixed(3)}</span>
                                  <span className="text-xs font-semibold font-mono text-muted-foreground text-right tabular-nums">{formatCurrency(o.total)}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                       {/* Bids */}
                       <div>
                          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2 border-b border-border pb-2">
                             <span>Price</span>
                             <span>Amount</span>
                             <span className="text-right">Total</span>
                          </div>
                          <div className="space-y-1">
                             {orderBook.bids.map((o, i) => (
                               <div key={i} className="flex justify-between py-1.5 relative group px-2 rounded-lg transition-all hover:bg-secondary">
                                  <div className="absolute left-0 top-0.5 bottom-0.5 bg-green-50 rounded-md -z-1 opacity-50" style={{ width: `${(o.amount / 1.5) * 100}%` }} />
                                  <span className="text-xs font-semibold font-mono text-green-600">{o.price.toLocaleString()}</span>
                                  <span className="text-xs font-semibold font-mono text-foreground">{o.amount.toFixed(3)}</span>
                                  <span className="text-xs font-semibold font-mono text-muted-foreground text-right tabular-nums">{formatCurrency(o.total)}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Trade Tabs */}
            <div className="bg-card border border-border overflow-hidden rounded-3xl shadow-sm">
               <div className="flex border-b border-border bg-secondary/30">
                  {["Open Positions", "Pending Orders", "Order History"].map((tab) => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveLedgerTab(tab)}
                        className={`flex-1 h-14 text-xs font-bold uppercase tracking-wider transition-all ${
                        activeLedgerTab === tab ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}>
                      {tab}
                    </button>
                  ))}
               </div>
               
               <div className="p-0">
                  {activeLedgerTab === "Open Positions" && (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-secondary/30 border-b border-border">
                              <tr className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                 <th className="px-6 py-4">Instrument</th>
                                 <th className="px-6 py-4">Side</th>
                                 <th className="px-6 py-4">Size</th>
                                 <th className="px-6 py-4">Entry</th>
                                 <th className="px-6 py-4">PnL</th>
                                 <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-border">
                              {activeTrades.length === 0 ? (
                                 <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                       <Activity className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-muted-foreground">No open positions.</p>
                                     </td>
                                  </tr>
                              ) : activeTrades.map((trade) => (
                                 <tr key={trade.id} className="hover:bg-secondary/20 transition-colors group">
                                    <td className="px-6 py-5">
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center font-black text-[10px]">
                                             {trade.pair.substring(0, 3)}
                                          </div>
                                          <div>
                                             <div className="text-sm font-bold text-foreground">{trade.pair}</div>
                                             <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">ID: {trade.id}</div>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-5">
                                       <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                          trade.type === 'Buy' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                       }`}>
                                          {trade.type}
                                       </span>
                                    </td>
                                    <td className="px-6 py-5">
                                       <div className="text-sm font-bold text-foreground">{formatCurrency(trade.amount)}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                       <div className="text-sm font-bold text-foreground">{trade.entryPrice.toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                       <div className={`text-sm font-black ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                                       </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                       <Button 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={() => handleCloseTrade(trade.id)}
                                          className="h-9 px-4 rounded-xl border-border text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                                       >
                                           Close
                                        </Button>
                                     </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  )}

                  {activeLedgerTab === "Order History" && (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-secondary/30 border-b border-border">
                              <tr className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                 <th className="px-6 py-4">Instrument</th>
                                 <th className="px-6 py-4">Side</th>
                                 <th className="px-6 py-4">Size</th>
                                 <th className="px-6 py-4">Entry</th>
                                 <th className="px-6 py-4">PnL</th>
                                 <th className="px-6 py-4 text-right">Date</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-border">
                              {tradeHistory.length === 0 ? (
                                 <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                       <History className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-muted-foreground">No trade history.</p>
                                     </td>
                                  </tr>
                              ) : tradeHistory.map((trade) => (
                                 <tr key={trade.id} className="hover:bg-secondary/10 transition-colors">
                                    <td className="px-6 py-5 font-bold text-sm">{trade.pair}</td>
                                    <td className="px-6 py-5">
                                       <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                          trade.type === 'Buy' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'
                                       }`}>
                                          {trade.type}
                                       </span>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-bold">{formatCurrency(trade.amount)}</td>
                                    <td className="px-6 py-5 text-sm font-bold">{trade.entryPrice.toLocaleString()}</td>
                                    <td className={`px-6 py-5 text-sm font-black ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                       {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                                    </td>
                                    <td className="px-6 py-5 text-right text-[10px] text-muted-foreground font-bold uppercase">
                                       {new Date(trade.time).toLocaleDateString()}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  )}

                  {activeLedgerTab === "Pending Orders" && (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-secondary/30 border-b border-border">
                              <tr className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                 <th className="px-6 py-4">Instrument</th>
                                 <th className="px-6 py-4">Type</th>
                                 <th className="px-6 py-4">Price</th>
                                 <th className="px-6 py-4">Size</th>
                                 <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-border">
                              {pendingOrders.length === 0 ? (
                                 <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                       <Target className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-muted-foreground">No pending orders.</p>
                                     </td>
                                  </tr>
                              ) : pendingOrders.map((order) => (
                                 <tr key={order.id} className="hover:bg-secondary/20 transition-colors">
                                    <td className="px-6 py-5">
                                       <div className="text-sm font-bold text-foreground">{order.pair}</div>
                                       <div className="text-[10px] text-muted-foreground">{new Date(order.time).toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                       <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-secondary">
                                          {order.orderType} {order.type}
                                       </span>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-bold">{order.price.toLocaleString()}</td>
                                    <td className="px-6 py-5 text-sm font-bold">{formatCurrency(order.amount)}</td>
                                    <td className="px-6 py-5 text-right">
                                       <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          onClick={() => handleCancelOrder(order.id)}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest"
                                       >
                                          Cancel
                                       </Button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  )}
               </div>
            </div>

            {/* Trading Insights Section */}
            <div className="grid md:grid-cols-2 gap-6 pb-12">
               <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
                  <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                     <Activity className="w-6 h-6 text-primary" /> Market Sentiment
                  </h3>
                   <div className="space-y-6">
                     <div className="space-y-2">
                        <div className="flex justify-between items-end text-xs font-bold uppercase tracking-wider">
                           <span className="text-green-600">Buy Orders</span>
                           <span className="text-red-600">Sell Orders</span>
                        </div>
                        <div className="h-4 w-full bg-secondary rounded-full overflow-hidden flex">
                           <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${buySentiment}%` }} />
                           <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${sellSentiment}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-2">
                           <span>{buySentiment}% BULLISH</span>
                           <span>{sellSentiment}% BEARISH</span>
                        </div>
                     </div>
                     <p className="text-sm text-muted-foreground leading-relaxed">
                        The current market sentiment for {selectedPair} is moderately bullish, driven by institutional buying pressure and positive technical divergence on the daily timeframe.
                     </p>
                  </div>
               </div>

               <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
                  <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3 text-sans">
                     <Info className="w-6 h-6 text-primary" /> Trading Tip
                  </h3>
                  <div className="bg-secondary/50 p-6 rounded-2xl border border-border">
                     <p className="text-sm italic text-muted-foreground leading-relaxed">
                        "In {category} markets, volatility often peaks during the crossover between major global trading sessions. Always use stop-loss orders to protect your capital during high-impact news releases."
                     </p>
                     <div className="mt-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">TRX</div>
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">Pro Tip</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Order Form */}
          <div className="col-span-12 lg:col-span-3">
             <div className="bg-card border border-border p-6 mt-0 space-y-8 sticky top-10 shadow-sm rounded-3xl overflow-hidden relative">
                <div className="flex rounded-2xl bg-secondary p-1.5 border border-border relative z-10">
                  <button
                    onClick={() => setSide("buy")}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                      side === "buy" ? "bg-green-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setSide("sell")}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                      side === "sell" ? "bg-red-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    Sell
                  </button>
                </div>

                <div className="space-y-6 relative z-10">
                    <div className="space-y-3">
                       <label className="text-xs font-semibold text-foreground flex justify-between">
                          <span>Order Type</span>
                       </label>
                       <div className="grid grid-cols-2 gap-2">
                        {(["market", "limit", "stop-loss", "take-profit"] as OrderType[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => setOrderType(t)}
                            className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                              orderType === t ? "bg-primary text-white border-primary shadow-sm" : "bg-card text-muted-foreground border-border hover:bg-secondary"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {orderType !== "market" && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-foreground">Trigger Price ({category === 'FOREX' ? '' : 'USDT'})</label>
                          <input 
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-secondary border border-border h-12 rounded-xl px-4 text-sm font-bold focus:border-primary/50 outline-none transition-all text-foreground shadow-inner" 
                            type="number" 
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground flex justify-between items-center">
                          <span>Amount ({selectedPair.split("/")[0]})</span>
                          {side === "sell" && (
                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                              Bal: {user?.balances?.[selectedPair.split("/")[0].toLowerCase() as keyof typeof user.balances]?.toFixed(currentPair.category === 'CRYPTO' ? 4 : 2) || "0.00"}
                            </span>
                          )}
                        </label>
                        <div className="relative group">
                           <input 
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full bg-secondary border border-border h-12 rounded-xl px-4 text-sm font-bold focus:border-primary/50 outline-none transition-all text-foreground shadow-inner" 
                              placeholder="0.0000"
                              type="number" 
                           />
                           <button 
                              onClick={() => setPercentage(1)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                           >
                              MAX
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {[25, 50, 75, 100].map((pct) => (
                        <button 
                          key={pct} 
                          onClick={() => setPercentage(pct / 100)}
                          className="flex-1 py-1.5 rounded-lg bg-secondary text-[10px] font-bold text-muted-foreground hover:bg-card hover:text-foreground border border-border transition-all uppercase"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>

                    <div className="bg-secondary/50 rounded-2xl p-4 border border-border space-y-3">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Value</span>
                          <span className="text-xs font-bold text-foreground">{formatCurrency(parseFloat(totalUsdt) || 0)}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Fee</span>
                          <span className="text-[10px] font-semibold text-muted-foreground">
                             {(dbPairs.find(p => p.name === currentPair.name)?.fee) || '0.12%'}
                          </span>
                       </div>
                       <div className="h-px bg-border my-2" />
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Available Balance</span>
                          <span className="text-xs font-bold text-primary">{formatCurrency(balance.available)}</span>
                       </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Button
                         onClick={handleExecuteTrade}
                         disabled={isTradeLoading}
                         className={`w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all ${
                            side === "sell" 
                            ? "bg-red-600 hover:bg-red-700 text-white" 
                            : "bg-green-600 hover:bg-green-700 text-white"
                         } disabled:opacity-50`}
                        >
                          {isTradeLoading ? "Processing..." : `${side} ${selectedPair.split("/")[0]}`}
                        </Button>

                       <div className="flex items-start gap-2 justify-center py-2 px-3 rounded-xl bg-secondary border border-border">
                          <ShieldCheck className="w-4 h-4 text-primary shrink-0 opacity-80" />
                          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Orders are final. Review before execution.</span>
                       </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TradingPage;
