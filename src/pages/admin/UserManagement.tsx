import { useState } from "react";
import { motion } from "framer-motion";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search, Shield, Ban, CheckCircle, DollarSign, X,
  Snowflake, Flame, Edit, Eye,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  kyc: string;
  balance: string;
  balanceNum: number;
  joined: string;
  frozen: boolean;
}

const initialUsers: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@email.com", phone: "+1 555 1001", status: "Verified", kyc: "Approved", balance: "$12,400.00", balanceNum: 12400, joined: "Jan 2, 2026", frozen: false },
  { id: 2, name: "Bob Smith", email: "bob@email.com", phone: "+1 555 1002", status: "Active", kyc: "Pending", balance: "$3,200.00", balanceNum: 3200, joined: "Feb 14, 2026", frozen: false },
  { id: 3, name: "Carol White", email: "carol@email.com", phone: "+1 555 1003", status: "Verified", kyc: "Approved", balance: "$45,600.00", balanceNum: 45600, joined: "Nov 20, 2025", frozen: false },
  { id: 4, name: "Dan Brown", email: "dan@email.com", phone: "+1 555 1004", status: "Suspended", kyc: "Rejected", balance: "$0.00", balanceNum: 0, joined: "Mar 5, 2026", frozen: true },
  { id: 5, name: "Eve Davis", email: "eve@email.com", phone: "+1 555 1005", status: "Active", kyc: "Pending", balance: "$8,750.00", balanceNum: 8750, joined: "Feb 28, 2026", frozen: false },
  { id: 6, name: "Frank Miller", email: "frank@email.com", phone: "+1 555 1006", status: "Verified", kyc: "Approved", balance: "$21,300.00", balanceNum: 21300, joined: "Dec 12, 2025", frozen: false },
];

const UserManagement = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [balanceDialog, setBalanceDialog] = useState<User | null>(null);
  const [balanceAction, setBalanceAction] = useState<"credit" | "debit">("credit");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [viewUser, setViewUser] = useState<User | null>(null);

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleFreeze = (id: number) => {
    setUsers(users.map((u) => u.id === id ? { ...u, frozen: !u.frozen, status: u.frozen ? "Active" : "Suspended" } : u));
  };

  const handleKycApprove = (id: number) => {
    setUsers(users.map((u) => u.id === id ? { ...u, kyc: "Approved", status: "Verified" } : u));
  };

  const handleBalanceUpdate = () => {
    if (!balanceDialog || !balanceAmount) return;
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) return;
    setUsers(users.map((u) => {
      if (u.id !== balanceDialog.id) return u;
      const newBal = balanceAction === "credit" ? u.balanceNum + amount : Math.max(0, u.balanceNum - amount);
      return { ...u, balanceNum: newBal, balance: `$${newBal.toLocaleString("en-US", { minimumFractionDigits: 2 })}` };
    }));
    setBalanceDialog(null);
    setBalanceAmount("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">User Management</h1>
            <p className="text-muted-foreground text-sm">{users.length} total users · Full account control</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-secondary/30">
                  <th className="text-left p-4 font-medium">User</th>
                  <th className="text-left p-4 font-medium hidden sm:table-cell">Status</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">KYC</th>
                  <th className="text-left p-4 font-medium">Balance</th>
                  <th className="text-left p-4 font-medium hidden lg:table-cell">Joined</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium font-display">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        user.status === "Verified" ? "bg-profit/10 text-profit" :
                        user.status === "Suspended" ? "bg-loss/10 text-loss" :
                        "bg-primary/10 text-primary"
                      }`}>{user.status}</span>
                      {user.frozen && <span className="ml-1 text-xs text-blue-400">❄️</span>}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        user.kyc === "Approved" ? "bg-profit/10 text-profit" :
                        user.kyc === "Rejected" ? "bg-loss/10 text-loss" :
                        "bg-warning/10 text-warning"
                      }`}>{user.kyc}</span>
                    </td>
                    <td className="p-4 font-medium font-display">{user.balance}</td>
                    <td className="p-4 text-muted-foreground hidden lg:table-cell">{user.joined}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => setViewUser(user)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                              <Eye className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => setBalanceDialog(user)} className="p-1.5 rounded hover:bg-primary/10 text-primary">
                              <DollarSign className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Edit Balance</TooltipContent>
                        </Tooltip>
                        {user.kyc === "Pending" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button onClick={() => handleKycApprove(user.id)} className="p-1.5 rounded hover:bg-profit/10 text-profit">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Approve KYC</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleFreeze(user.id)} className={`p-1.5 rounded ${user.frozen ? "hover:bg-profit/10 text-profit" : "hover:bg-loss/10 text-loss"}`}>
                              {user.frozen ? <Flame className="w-4 h-4" /> : <Snowflake className="w-4 h-4" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{user.frozen ? "Unfreeze Account" : "Freeze Account"}</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Balance Edit Dialog */}
      <Dialog open={!!balanceDialog} onOpenChange={() => setBalanceDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Balance — {balanceDialog?.name}</DialogTitle>
            <DialogDescription>Current balance: {balanceDialog?.balance}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex rounded-lg bg-secondary p-1">
              <button
                onClick={() => setBalanceAction("credit")}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  balanceAction === "credit" ? "bg-profit text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Credit (Add)
              </button>
              <button
                onClick={() => setBalanceAction("debit")}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  balanceAction === "debit" ? "bg-loss text-foreground" : "text-muted-foreground"
                }`}
              >
                Debit (Remove)
              </button>
            </div>
            <div className="space-y-2">
              <Label>Amount (USDT)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialog(null)}>Cancel</Button>
            <Button variant="hero" onClick={handleBalanceUpdate}>
              {balanceAction === "credit" ? "Credit Account" : "Debit Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">User Details</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground block text-xs">Name</span>{viewUser.name}</div>
                <div><span className="text-muted-foreground block text-xs">Email</span>{viewUser.email}</div>
                <div><span className="text-muted-foreground block text-xs">Phone</span>{viewUser.phone}</div>
                <div><span className="text-muted-foreground block text-xs">Balance</span><span className="font-bold font-display">{viewUser.balance}</span></div>
                <div><span className="text-muted-foreground block text-xs">Status</span>{viewUser.status}</div>
                <div><span className="text-muted-foreground block text-xs">KYC</span>{viewUser.kyc}</div>
                <div><span className="text-muted-foreground block text-xs">Joined</span>{viewUser.joined}</div>
                <div><span className="text-muted-foreground block text-xs">Frozen</span>{viewUser.frozen ? "Yes" : "No"}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default UserManagement;
