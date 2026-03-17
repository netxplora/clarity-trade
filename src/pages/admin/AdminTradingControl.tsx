import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";

const initialPairs = [
  { name: "BTC/USDT", spread: "0.05%", fee: "0.1%", active: true },
  { name: "ETH/USDT", spread: "0.08%", fee: "0.1%", active: true },
  { name: "SOL/USDT", spread: "0.12%", fee: "0.15%", active: true },
  { name: "BNB/USDT", spread: "0.10%", fee: "0.1%", active: true },
  { name: "XRP/USDT", spread: "0.15%", fee: "0.15%", active: false },
  { name: "ADA/USDT", spread: "0.18%", fee: "0.2%", active: true },
];

const AdminTradingControl = () => {
  const [pairs, setPairs] = useState(initialPairs);

  const togglePair = (index: number) => {
    const updated = [...pairs];
    updated[index].active = !updated[index].active;
    setPairs(updated);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Trading Control</h1>
            <p className="text-muted-foreground text-sm">Manage trading pairs, fees, and spreads</p>
          </div>
          <Button variant="hero" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Pair
          </Button>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-secondary/30">
                <th className="text-left p-4 font-medium">Pair</th>
                <th className="text-left p-4 font-medium">Spread</th>
                <th className="text-left p-4 font-medium">Fee</th>
                <th className="text-left p-4 font-medium">Active</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((pair, i) => (
                <tr key={pair.name} className="border-b border-border/50 last:border-0">
                  <td className="p-4 font-medium font-display">{pair.name}</td>
                  <td className="p-4">{pair.spread}</td>
                  <td className="p-4">{pair.fee}</td>
                  <td className="p-4">
                    <Switch checked={pair.active} onCheckedChange={() => togglePair(i)} />
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-1.5 rounded hover:bg-loss/10 text-loss">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTradingControl;
