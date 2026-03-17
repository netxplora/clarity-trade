import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Edit, Trash2, Megaphone } from "lucide-react";

const blogPosts = [
  { title: "How to Start Copy Trading in 2026", status: "Published", date: "Mar 10, 2026", views: "2.4K" },
  { title: "Understanding Crypto Market Cycles", status: "Published", date: "Mar 5, 2026", views: "1.8K" },
  { title: "Risk Management for Beginners", status: "Draft", date: "Mar 14, 2026", views: "-" },
];

const announcements = [
  { title: "Scheduled Maintenance — March 20", type: "System", date: "Mar 17" },
  { title: "New Trading Pair: SOL/USDT Added", type: "Feature", date: "Mar 15" },
  { title: "Reduced Fees for Pro Traders", type: "Promo", date: "Mar 12" },
];

const ContentManagement = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Content Management</h1>
          <p className="text-muted-foreground text-sm">Manage blog posts and announcements</p>
        </div>

        {/* Blog */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold font-display">Blog Posts</h2>
            </div>
            <Button variant="hero" size="sm"><Plus className="w-4 h-4 mr-1" /> New Post</Button>
          </div>
          <div className="space-y-3">
            {blogPosts.map((post) => (
              <div key={post.title} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex-1">
                  <div className="font-medium font-display text-sm">{post.title}</div>
                  <div className="text-xs text-muted-foreground">{post.date} · {post.views} views</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    post.status === "Published" ? "bg-profit/10 text-profit" : "bg-warning/10 text-warning"
                  }`}>{post.status}</span>
                  <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Edit className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded hover:bg-loss/10 text-loss"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold font-display">Announcements</h2>
            </div>
            <Button variant="hero" size="sm"><Plus className="w-4 h-4 mr-1" /> New</Button>
          </div>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.title} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <div className="font-medium font-display text-sm">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.date}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">{a.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContentManagement;
