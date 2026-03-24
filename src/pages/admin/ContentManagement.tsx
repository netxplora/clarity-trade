import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Edit, Trash2, Megaphone, Eye, Search, Filter, Globe, Share2, Zap, ArrowUpRight, Newspaper, Radio } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const blogPosts = [
  { title: "How to Start Copy Trading in 2026", status: "PUBLISHED", date: "Mar 10, 2026", views: "2.4K", category: "Strategy" },
  { title: "Understanding Crypto Market Cycles", status: "PUBLISHED", date: "Mar 5, 2026", views: "1.8K", category: "Markets" },
  { title: "Risk Management for Beginners", status: "DRAFT", date: "Mar 14, 2026", views: "-", category: "Education" },
];

const announcements = [
  { title: "Scheduled Maintenance — March 20", type: "System", date: "Mar 17", priority: "HIGH" },
  { title: "New Trading Pair: SOL/USDT Added", type: "Feature", date: "Mar 15", priority: "MEDIUM" },
  { title: "Reduced Fees for Pro Traders", type: "Promo", date: "Mar 12", priority: "LOW" },
];

const ContentManagement = () => {
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [systemAnnouncements, setSystemAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await supabase.from('notifications')
        .select('*')
        .eq('type', 'GLOBAL')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setSystemAnnouncements(data);
    } catch (err) {}
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('Missing fields', { description: 'Please enter a title and message.' });
      return;
    }
    
    setIsBroadcasting(true);
    try {
      const { error } = await supabase.from('notifications').insert([{
        user_id: null,
        title: broadcastTitle,
        message: broadcastMessage,
        type: 'GLOBAL'
      }]);
      
      if (error) throw error;
      
      toast.success('Broadcast Sent', { description: 'Notification pushed to all users successfully.' });
      setBroadcastOpen(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      fetchAnnouncements();
    } catch (err: any) {
      toast.error('Broadcast failed', { description: err.message });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <AdminLayout>
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[425px]">
          <DialogHeader>
             <DialogTitle className="text-foreground">New Broadcast</DialogTitle>
             <DialogDescription>Send a global notification to all users.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label className="text-foreground">Title</Label>
                <Input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} placeholder="e.g. Scheduled Maintenance" className="bg-secondary/20 border-border text-foreground" />
             </div>
             <div className="space-y-2">
                <Label className="text-foreground">Message</Label>
                <Textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="Enter details..." className="h-24 bg-secondary/20 border-border text-foreground" />
             </div>
          </div>
          <div className="flex justify-end gap-3">
             <Button variant="outline" onClick={() => setBroadcastOpen(false)} disabled={isBroadcasting} className="border-border text-foreground">Cancel</Button>
             <Button onClick={handleBroadcast} disabled={isBroadcasting} className="bg-primary text-black font-semibold hover:bg-primary/90">
                {isBroadcasting ? 'Sending...' : 'Publish Broadcast'}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="space-y-10 p-2 lg:p-6 font-sans">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
          <div>
             <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
             <p className="text-muted-foreground text-sm mt-2">Manage blog posts, announcements, and platform content.</p>
           </div>
           <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="h-11 border-border bg-card text-sm font-medium px-6 shadow-sm hover:bg-secondary"
                onClick={() => toast.info("Search focused", { description: "Use the filter bar for refined results." })}
              >
                 <Search className="w-4 h-4 mr-2" /> Search
              </Button>
              <Button 
                variant="hero" 
                className="h-11 text-sm font-medium px-6 text-white shadow-gold"
                onClick={() => toast.success("Editor ready", { description: "You are now in drafting mode." })}
              >
                 <Plus className="w-4 h-4 mr-2" /> New Post
              </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
            {/* Blog Posts */}
            <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-3">
                      <Radio className="w-5 h-5 text-primary animate-pulse" />
                       <h2 className="text-lg font-bold text-foreground">Blog Posts</h2>
                   </div>
                   <div className="flex items-center gap-2">
                       <Button variant="outline" className="h-8 border-border bg-card text-xs font-medium px-3" onClick={() => toast.info("Showing all posts")}>All</Button>
                       <Button variant="outline" className="h-8 border-none text-xs font-medium px-3 opacity-50" onClick={() => toast.info("Showing published posts")}>Published</Button>
                       <Button variant="outline" className="h-8 border-none text-xs font-medium px-3 opacity-50" onClick={() => toast.info("Showing draft posts")}>Drafts</Button>
                   </div>
                </div>

                <div className="space-y-4">
                    {blogPosts.map((post, i) => (
                        <motion.div 
                           key={post.title}
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: i * 0.1 }}
                           className="glass-card p-6 group hover:border-primary/20 transition-all duration-500 bg-secondary/10 flex items-center gap-6"
                        >
                           <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-huge">
                              <FileText className="w-8 h-8" />
                           </div>
                           <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                 <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{post.category}</span>
                                 <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${post.status === 'PUBLISHED' ? 'text-green-700 bg-green-100' : 'text-amber-700 bg-amber-100'}`}>{post.status}</span>
                              </div>
                               <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors cursor-pointer">{post.title}</h3>
                               <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-2">{post.date}</span>
                                  <span className="flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> {post.views} views</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="outline" className="h-10 w-10 p-0 border-white/5 bg-secondary/50 text-white rounded-xl" onClick={() => toast.success("Post open in editor")}>
                                 <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" className="h-10 w-10 p-0 border-white/5 bg-secondary/50 text-loss rounded-xl hover:bg-loss/10" onClick={() => toast.success("Post moved to trash")}>
                                 <Trash2 className="w-4 h-4" />
                              </Button>
                           </div>
                        </motion.div>
                    ))}
                </div>
                
                <div className="pt-6 flex justify-center">
                    <Button variant="outline" className="h-11 border-border bg-card text-xs font-medium px-6 shadow-sm hover:bg-secondary" onClick={() => toast.success("Loaded older articles")}>
                       Load More
                   </Button>
                </div>
            </div>

            {/* Announcements (Broadcasts) */}
            <div className="lg:col-span-4 space-y-6">
                <div className="flex items-center justify-between px-2 h-10">
                   <div className="flex items-center gap-3">
                      <Megaphone className="w-5 h-5 text-primary" />
                       <h2 className="text-lg font-bold text-foreground">Announcements</h2>
                   </div>
                   <Plus className="w-5 h-5 text-muted-foreground/30 cursor-pointer hover:text-primary transition-colors" onClick={() => setBroadcastOpen(true)} />
                </div>

                <div className="space-y-4">
                    {systemAnnouncements.length > 0 ? systemAnnouncements.map((a, i) => (
                        <motion.div 
                           key={a.id}
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: 0.3 + i * 0.1 }}
                           className={`p-6 rounded-[2rem] border relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 bg-secondary/20 border-white/5`}
                        >
                           <div className="flex flex-col gap-4 relative z-10">
                              <div className="flex items-center justify-between">
                                 <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest text-primary bg-primary/10`}>
                                    {a.type}
                                 </div>
                                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                              </div>
                              <h4 className={`text-sm font-bold tracking-widest uppercase transition-colors group-hover:text-white text-muted-foreground`}>
                                 {a.title}
                              </h4>
                              <p className="text-xs text-muted-foreground/60">{a.message}</p>
                              <div className="flex items-center gap-2 text-[8px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-500 cursor-pointer">
                                  Live <ArrowUpRight className="w-3 h-3" />
                              </div>
                           </div>
                           <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                               <Globe className="w-16 h-16 text-primary" />
                           </div>
                        </motion.div>
                    )) : (
                        <div className="p-8 text-center text-muted-foreground border border-white/5 rounded-2xl">
                           <p className="text-sm font-bold">No announcements yet</p>
                        </div>
                    )}
                </div>


                <div className="p-8 rounded-[2rem] bg-secondary/5 border border-white/5 flex flex-col items-center text-center">
                    <Zap className="w-8 h-8 text-primary/40 mb-4" />
                     <div className="text-xs font-medium text-muted-foreground mb-4">Content Performance</div>
                     <div className="text-xl font-bold text-foreground">Total Reach: 18.4K</div>
                     <p className="text-xs text-muted-foreground mt-4 leading-relaxed">Content is distributed to all active users across the platform.</p>
                </div>
            </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContentManagement;
