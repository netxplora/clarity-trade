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
  ShieldCheck, 
  History,
  Target,
  Globe,
  Coins,
  TrendingUp,
  Activity
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

  const { user, balance, formatCurrency, fetchAppData, activeTrades: storeActiveTrades, tradeHistory: storeTradeHistory } = useStore();
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  
  const [dbPairs, setDbPairs] = useState<any[]>([]);

  // Sync trades from global store (kept in sync by AuthListener real-time subscription)
  useEffect(() => {
    if (storeActiveTrades && storeActiveTrades.length > 0) {
      setActiveTrades(storeActiveTrades.map(t => ({
        id: t.id,
        pair: t.pair,
        type: t.type,
        amount: t.amount,
        entryPrice: t.entry_price ?? t.entryPrice,
        currentPrice: t.current_price ?? t.currentPrice,
        pnl: t.pnl,
        time: t.time,
        status: t.status
      })));
    }
  }, [storeActiveTrades]);

  useEffect(() => {
    if (storeTradeHistory && storeTradeHistory.length > 0) {
      setTradeHistory(storeTradeHistory.filter(t => t.status === 'Closed').map(t => ({
        id: t.id,
        pair: t.pair,
        type: t.type,
        amount: t.amount,
        entryPrice: t.entry_price ?? t.entryPrice,
        currentPrice: t.current_price ?? t.currentPrice,
        pnl: t.pnl,
        time: t.time,
        status: t.status
      })));
    }
  }, [storeTradeHistory]);

  const fetchUserTrades = async () => {
    if (!user?.id) return;
    // Only fetch directly if global store hasn't populated yet
    if (storeActiveTrades.length > 0 || storeTradeHistory.length > 0) return;
    
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
        const { error } = await supabase.from('trades').delete().eq('id', orderId);
        if (!error) {
            toast.success("Order Cancelled");
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
      setActiveTrades(prev => prev.map(trade => {
        const volatility = 0.0005;
        const change = 1 + (Math.random() * volatility * 2 - volatility);
        const newPrice = trade.currentPrice * change;
        const pnl = trade.type === 'Buy' 
          ? (newPrice - trade.entryPrice) * (trade.amount / trade.entryPrice)
          : (trade.entryPrice - newPrice) * (trade.amount / trade.entryPrice);
        
        return { ...trade, currentPrice: newPrice, pnl };
      }));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [activeTrades.length]);

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
             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-xs font-bold uppercase tracking-wider">
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
                  <div className="bg-card border border-border/50 h-[720px] flex flex-col shadow-huge rounded-[2rem] overflow-hidden">
                    <div className="p-4 bg-secondary/30 border-b border-border space-y-3">
                        <div className="flex p-1 bg-secondary rounded-xl border border-border">
                           {(["CRYPTO", "FOREX", "COMMODITIES"] as MarketCategory[]).map(cat => (
                              <button 
                                 key={cat}
                                 onClick={() => setCategory(cat)}
                                 className={`flex-1 py-1.5 text-[9px] font-black tracking-[0.2em] uppercase transition-all rounded-lg ${category === cat ? "bg-card text-primary border border-border shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-card/50"}`}
                              >
                                 {cat.substring(0, 3)}
                              </button>
                           ))}
                        </div>
                       <div className="relative group">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                         <input 
                           className="w-full bg-secondary/50 border border-border rounded-xl pl-11 pr-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] focus:border-primary/50 outline-none transition-all text-foreground shadow-inner" 
                           placeholder="Search markets..."
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
                  <div className="bg-card border border-border p-2 h-[500px] relative overflow-hidden shadow-sm rounded-3xl">
                     <TradingViewWidget symbol={currentPair.symbol} />
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
                        {/* Mobile Stacked Cards */}
                        <div className="md:hidden space-y-4 p-4">
                           {activeTrades.length === 0 ? (
                              <div className="py-12 text-center">
                                 <Activity className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                                 <p className="text-sm font-bold text-muted-foreground">No open positions.</p>
                              </div>
                           ) : activeTrades.map((trade) => (
                              <div key={trade.id} className="bg-secondary/40 border border-border/50 rounded-2xl p-4 space-y-3">
                                 <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center font-black text-[10px]">
                                          {trade.pair.substring(0, 3)}
                                       </div>
                                       <div>
                                          <div className="text-sm font-bold text-foreground">{trade.pair}</div>
                                          <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">ID: {trade.id}</div>
                                       </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                       trade.type === 'Buy' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'
                                    }`}>
                                       {trade.type}
                                    </span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/50 pt-3">
                                    <div>
                                       <span className="text-muted-foreground font-black uppercase block">Size</span>
                                       <span className="font-bold text-foreground">{formatCurrency(trade.amount)}</span>
                                    </div>
                                    <div>
                                       <span className="text-muted-foreground font-black uppercase block">Entry</span>
                                       <span className="font-bold text-foreground">{trade.entryPrice.toLocaleString()}</span>
                                    </div>
                                    <div>
                                       <span className="text-muted-foreground font-black uppercase block">PnL</span>
                                       <span className={`font-black ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                                       </span>
                                    </div>
                                 </div>
                                 <div className="pt-2">
                                    <Button 
                                       variant="outline" 
                                       size="sm" 
                                       onClick={() => handleCloseTrade(trade.id)}
                                       className="w-full h-10 rounded-xl border-border text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/20 transition-all"
                                    >
                                        Close Trade
                                     </Button>
                                 </div>
                              </div>
                           ))}
                        </div>

                        {/* Desktop Table */}
                        <table className="hidden md:table w-full text-left">
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
                                          trade.type === 'Buy' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'
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
                                          className="h-9 px-4 rounded-xl border-border text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/20 transition-all"
                                       >
                                           Close Trade
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
                        {/* Mobile Stacked Cards */}
                        <div className="md:hidden space-y-4 p-4">
                           {tradeHistory.length === 0 ? (
                              <div className="py-12 text-center">
                                 <History className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                                 <p className="text-sm font-bold text-muted-foreground">No trade history.</p>
                              </div>
                           ) : tradeHistory.map((trade) => (
                              <div key={trade.id} className="bg-secondary/40 border border-border/50 rounded-2xl p-4 space-y-3">
                                 <div className="flex justify-between items-start">
                                    <div className="font-bold text-foreground text-sm">{trade.pair}</div>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                       trade.type === 'Buy' ? 'text-green-600 border-green-500/20 bg-green-500/10' : 'text-red-600 border-red-500/20 bg-red-500/10'
                                    }`}>
                                       {trade.type}
                                    </span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/50 pt-3">
                                    <div>
                                       <span className="text-muted-foreground font-black uppercase block">Size</span>
                                       <span className="font-bold text-foreground">{formatCurrency(trade.amount)}</span>
                                    </div>
                                    <div>
                                       <span className="text-muted-foreground font-black uppercase block">Entry</span>
                                       <span className="font-bold text-foreground">{trade.entryPrice.toLocaleString()}</span>
                                    </div>
                                    <div>
                                       <span className="text-muted-foreground font-black uppercase block">PnL</span>
                                       <span className={`font-black ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                                       </span>
                                    </div>
                                    <div>
                                       <span className="text-muted-foreground font-black uppercase block">Date</span>
                                       <span className="text-muted-foreground font-bold">{new Date(trade.time).toLocaleDateString()}</span>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>

                        {/* Desktop Table View */}
                        <table className="hidden md:table w-full text-left">
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
                                          trade.type === 'Buy' ? 'text-green-600 border-green-500/20 bg-green-500/10' : 'text-red-600 border-red-500/20 bg-red-500/10'
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
                        {/* Mobile Stacked Cards */}
                        <div className="md:hidden space-y-4 p-4">
                           {pendingOrders.length === 0 ? (
                              <div className="py-12 text-center">
                                 <Target className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                                 <p className="text-sm font-bold text-muted-foreground">No pending orders.</p>
                              </div>
                           ) : pendingOrders.map((order) => (
                              <div key={order.id} className="bg-secondary/40 border border-border/50 rounded-2xl p-4 space-y-3">
                                 <div className="flex justify-between items-start">
                                    <div>
                                       <div className="text-sm font-bold text-foreground">{order.pair}</div>
                                       <div className="text-[10px] text-muted-foreground">{new Date(order.time).toLocaleString()}</div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-secondary">
                                       {order.orderType} {order.type}
                                    </span>
                                 </div>
                                 <div className="flex justify-between items-center text-xs border-t border-border/50 pt-3">
                                    <span className="text-muted-foreground font-black uppercase">Price</span>
                                    <span className="font-bold text-foreground">{order.price.toLocaleString()}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground font-black uppercase">Size</span>
                                    <span className="font-bold text-foreground">{formatCurrency(order.amount)}</span>
                                 </div>
                                 <div className="pt-2">
                                    <Button 
                                       variant="ghost" 
                                       size="sm" 
                                       onClick={() => handleCancelOrder(order.id)}
                                       className="w-full text-red-600 hover:text-white bg-red-500/10 hover:bg-red-600 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl h-10"
                                    >
                                       Cancel
                                    </Button>
                                 </div>
                              </div>
                           ))}
                        </div>

                        {/* Desktop Table View */}
                        <table className="hidden md:table w-full text-left">
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
                                          className="text-red-600 hover:text-red-700 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-widest"
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
          </div>

          <div className="col-span-12 lg:col-span-3">
             <div className="bg-card border border-border/50 p-6 mt-0 space-y-8 sticky top-10 shadow-huge rounded-[2rem] overflow-hidden relative">
                <div className="flex rounded-2xl bg-secondary p-1.5 border border-border relative z-10">
                  <button
                    onClick={() => setSide("buy")}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${
                      side === "buy" ? "bg-gradient-to-r from-profit to-emerald-600 text-white shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    Buy Market
                  </button>
                  <button
                    onClick={() => setSide("sell")}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${
                      side === "sell" ? "bg-gradient-to-r from-loss to-rose-600 text-white shadow-glow-loss" : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    Sell Market
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
                            className="w-full bg-secondary/50 border border-border h-12 rounded-xl px-4 text-sm font-bold focus:border-primary/50 outline-none transition-all text-foreground shadow-inner" 
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
                              className="w-full bg-secondary/50 border border-border h-12 rounded-xl px-4 text-sm font-bold focus:border-primary/50 outline-none transition-all text-foreground shadow-inner" 
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
                          className={`w-full h-14 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-huge transition-all ${
                             side === "sell" 
                             ? "bg-gradient-to-r from-loss to-rose-600 hover:scale-[1.02] text-white shadow-glow-loss" 
                             : "bg-gradient-to-r from-profit to-emerald-600 hover:scale-[1.02] text-white shadow-glow"
                          } disabled:opacity-50 border-none`}
                         >
                           {isTradeLoading ? "Processing Fill..." : `Execute ${side} ${selectedPair.split("/")[0]}`}
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
