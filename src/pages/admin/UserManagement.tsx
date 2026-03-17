import { useState } from "react";
import { motion } from "framer-motion";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, Shield, Ban, CheckCircle } from "lucide-react";

const users = [
  { id: 1, name: "Alice Johnson", email: "alice@email.com", phone: "+1 555 1001", status: "Verified", kyc: "Approved", balance: "$12,400", joined: "Jan 2, 2026" },
  { id: 2, name: "Bob Smith", email: "bob@email.com", phone: "+1 555 1002", status: "Active", kyc: "Pending", balance: "$3,200", joined: "Feb 14, 2026" },
  { id: 3, name: "Carol White", email: "carol@email.com", phone: "+1 555 1003", status: "Verified", kyc: "Approved", balance: "$45,600", joined: "Nov 20, 2025" },
  { id: 4, name: "Dan Brown", email: "dan@email.com", phone: "+1 555 1004", status: "Suspended", kyc: "Rejected", balance: "$0", joined: "Mar 5, 2026" },
  { id: 5, name: "Eve Davis", email: "eve@email.com", phone: "+1 555 1005", status: "Active", kyc: "Pending", balance: "$8,750", joined: "Feb 28, 2026" },
  { id: 6, name: "Frank Miller", email: "frank@email.com", phone: "+1 555 1006", status: "Verified", kyc: "Approved", balance: "$21,300", joined: "Dec 12, 2025" },
];

const UserManagement = () => {
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">User Management</h1>
            <p className="text-muted-foreground text-sm">{users.length} total users</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-secondary/30">
                  <th className="text-left p-4 font-medium">User</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">KYC</th>
                  <th className="text-left p-4 font-medium">Balance</th>
                  <th className="text-left p-4 font-medium">Joined</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div className="font-medium font-display">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        user.status === "Verified" ? "bg-profit/10 text-profit" :
                        user.status === "Suspended" ? "bg-loss/10 text-loss" :
                        "bg-primary/10 text-primary"
                      }`}>{user.status}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        user.kyc === "Approved" ? "bg-profit/10 text-profit" :
                        user.kyc === "Rejected" ? "bg-loss/10 text-loss" :
                        "bg-warning/10 text-warning"
                      }`}>{user.kyc}</span>
                    </td>
                    <td className="p-4 font-medium font-display">{user.balance}</td>
                    <td className="p-4 text-muted-foreground">{user.joined}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user.kyc === "Pending" && (
                          <button className="p-1.5 rounded hover:bg-profit/10 text-profit" title="Approve KYC">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {user.status !== "Suspended" ? (
                          <button className="p-1.5 rounded hover:bg-loss/10 text-loss" title="Suspend">
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button className="p-1.5 rounded hover:bg-profit/10 text-profit" title="Reactivate">
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
