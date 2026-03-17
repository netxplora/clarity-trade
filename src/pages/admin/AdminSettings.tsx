import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Globe, Key, Bell } from "lucide-react";

const AdminSettings = () => {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold font-display">System Settings</h1>
          <p className="text-muted-foreground text-sm">Configure platform-wide settings</p>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-display">Platform Configuration</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input defaultValue="TradeX" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input defaultValue="support@tradex.com" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Default Trading Fee (%)</Label>
              <Input defaultValue="0.1" type="number" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Min Withdrawal (USDT)</Label>
              <Input defaultValue="50" type="number" className="bg-secondary border-border" />
            </div>
          </div>
          <Button variant="hero" size="sm">Save Configuration</Button>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-display">API Keys</h2>
          </div>
          <div className="space-y-3">
            {["Blockchain API", "Trading Engine API", "Email Service"].map((key) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <div className="font-medium text-sm">{key}</div>
                  <div className="text-xs text-muted-foreground font-mono">••••••••••••••••</div>
                </div>
                <Button variant="outline" size="sm">Update</Button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-display">Feature Toggles</h2>
          </div>
          {[
            { name: "Registration Open", enabled: true },
            { name: "Copy Trading", enabled: true },
            { name: "Withdrawals", enabled: true },
            { name: "Maintenance Mode", enabled: false },
          ].map((feat) => (
            <div key={feat.name} className="flex items-center justify-between">
              <span className="text-sm">{feat.name}</span>
              <Switch defaultChecked={feat.enabled} />
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
