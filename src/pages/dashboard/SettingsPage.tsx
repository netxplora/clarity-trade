import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, Bell, User, Key } from "lucide-react";

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold font-display">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your account preferences</p>
        </div>

        {/* Profile */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-display">Profile</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input defaultValue="John Doe" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="john@example.com" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input defaultValue="+1 555 000 0000" className="bg-secondary border-border" />
            </div>
          </div>
          <Button variant="hero" size="sm">Save Changes</Button>
        </div>

        {/* Security */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-display">Security</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Two-Factor Authentication</div>
              <div className="text-xs text-muted-foreground">Secure your account with Google Authenticator</div>
            </div>
            <Switch />
          </div>
          <div className="space-y-2">
            <Label>Change Password</Label>
            <Input type="password" placeholder="New password" className="bg-secondary border-border" />
          </div>
          <Button variant="hero" size="sm">Update Security</Button>
        </div>

        {/* Notifications */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-display">Notifications</h2>
          </div>
          {["Trade Alerts", "Deposit Confirmations", "Withdrawal Updates", "Copy Trading Alerts", "Marketing Emails"].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <span className="text-sm">{item}</span>
              <Switch defaultChecked={item !== "Marketing Emails"} />
            </div>
          ))}
        </div>

        {/* KYC */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold font-display">KYC Verification</h2>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-warning/10">
            <div>
              <div className="font-medium text-sm text-warning">Verification Pending</div>
              <div className="text-xs text-muted-foreground">Complete KYC to unlock full withdrawal limits</div>
            </div>
            <Button variant="outline" size="sm">Verify Now</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
