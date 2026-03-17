import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, Ban, Star } from "lucide-react";

const proTraders = [
  { name: "Alex Morgan", email: "alex@email.com", status: "Approved", followers: "3.2K", roi: "+127.4%", commission: "15%", applied: "Dec 10, 2025" },
  { name: "Sarah Chen", email: "sarah@email.com", status: "Approved", followers: "5.8K", roi: "+89.6%", commission: "12%", applied: "Nov 5, 2025" },
  { name: "Marcus Rivera", email: "marcus@email.com", status: "Approved", followers: "2.1K", roi: "+203.1%", commission: "18%", applied: "Jan 20, 2026" },
  { name: "New Applicant 1", email: "applicant1@email.com", status: "Pending", followers: "0", roi: "+45.2%", commission: "-", applied: "Mar 15, 2026" },
  { name: "New Applicant 2", email: "applicant2@email.com", status: "Pending", followers: "0", roi: "+67.8%", commission: "-", applied: "Mar 16, 2026" },
];

const AdminCopyTrading = () => {
  const [search, setSearch] = useState("");
  const filtered = proTraders.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">Copy Trading Control</h1>
            <p className="text-muted-foreground text-sm">Manage pro traders and commissions</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search traders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-secondary/30">
                  <th className="text-left p-4 font-medium">Trader</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">ROI</th>
                  <th className="text-left p-4 font-medium">Followers</th>
                  <th className="text-left p-4 font-medium">Commission</th>
                  <th className="text-left p-4 font-medium">Applied</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((trader) => (
                  <tr key={trader.email} className="border-b border-border/50 last:border-0 hover:bg-secondary/20">
                    <td className="p-4">
                      <div className="font-medium font-display">{trader.name}</div>
                      <div className="text-xs text-muted-foreground">{trader.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        trader.status === "Approved" ? "bg-profit/10 text-profit" : "bg-warning/10 text-warning"
                      }`}>{trader.status}</span>
                    </td>
                    <td className="p-4 font-medium text-profit font-display">{trader.roi}</td>
                    <td className="p-4">{trader.followers}</td>
                    <td className="p-4">{trader.commission}</td>
                    <td className="p-4 text-muted-foreground">{trader.applied}</td>
                    <td className="p-4 text-right">
                      {trader.status === "Pending" ? (
                        <div className="flex justify-end gap-1">
                          <button className="px-3 py-1 rounded bg-profit/10 text-profit text-xs font-medium hover:bg-profit/20">Approve</button>
                          <button className="px-3 py-1 rounded bg-loss/10 text-loss text-xs font-medium hover:bg-loss/20">Reject</button>
                        </div>
                      ) : (
                        <button className="p-1.5 rounded hover:bg-loss/10 text-loss" title="Revoke">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
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

export default AdminCopyTrading;
