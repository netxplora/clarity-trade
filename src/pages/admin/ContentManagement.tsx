import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Plus, Edit, Trash2, Megaphone, Eye, Search, Globe, 
  ArrowUpRight, LayoutTemplate, Type, Image as ImageIcon, Link as LinkIcon, 
  Save, CheckCircle, XCircle, Activity, Flag, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type ContentItem = {
  id?: string;
  type: string;
  section: string;
  title: string;
  content_html: string;
  status: 'PUBLISHED' | 'DRAFT' | 'DISABLED';
  metadata: any;
  views?: number;
  created_at?: string;
  updated_at?: string;
};

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState("announcements");
  
  // States array
  const [systemAnnouncements, setSystemAnnouncements] = useState<any[]>([]);
  const [platformContent, setPlatformContent] = useState<ContentItem[]>([]);
  
  // Loading
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Broadcast
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', type: 'GLOBAL' });

  // CMS Editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeItem, setActiveItem] = useState<ContentItem>({
    type: 'page_section',
    section: 'homepage',
    title: '',
    content_html: '',
    status: 'DRAFT',
    metadata: {}
  });

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("admin-content-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: "type=eq.GLOBAL" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "platform_content" }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Notifications
      const { data: notifs } = await supabase.from('notifications')
        .select('*')
        .eq('type', 'GLOBAL')
        .order('created_at', { ascending: false })
        .limit(20);
      if (notifs) setSystemAnnouncements(notifs);

      // Fetch CMS Content (will fail silently if user hasn't run the SQL migration yet)
      const { data: content, error } = await supabase.from('platform_content')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (content && !error) {
        setPlatformContent(content);
      } else {
        console.warn("platform_content table may not exist yet. Please run the SQL migration.");
      }
    } catch (err) {
      console.warn("Fetch data routine encountered a soft error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      toast.error('Missing fields', { description: 'Please enter a title and message.' });
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from('notifications').insert([{
        user_id: null,
        title: broadcastForm.title,
        message: broadcastForm.message,
        type: 'GLOBAL'
      }]);
      
      if (error) throw error;
      
      toast.success('Broadcast Sent', { description: 'Notification pushed to all users successfully.' });
      setBroadcastOpen(false);
      setBroadcastForm({ title: '', message: '', type: 'GLOBAL' });
      fetchData();
    } catch (err: any) {
      toast.error('Broadcast failed', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      toast.success('Announcement removed');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove announcement');
    }
  };

  const saveContent = async () => {
    if (!activeItem.title || !activeItem.content_html) {
      toast.error('Incomplete form', { description: 'Please provide a title and content body.' });
      return;
    }
    
    setIsSaving(true);
    try {
      if (activeItem.id) {
        // Update
        const { error } = await supabase.from('platform_content').update({
          title: activeItem.title,
          content_html: activeItem.content_html,
          type: activeItem.type,
          section: activeItem.section,
          status: activeItem.status,
          metadata: activeItem.metadata
        }).eq('id', activeItem.id);
        if (error) throw error;
        toast.success("Content Updated Successfully");
      } else {
        // Insert
        const { error } = await supabase.from('platform_content').insert([{
          title: activeItem.title,
          content_html: activeItem.content_html,
          type: activeItem.type,
          section: activeItem.section,
          status: activeItem.status,
          metadata: activeItem.metadata
        }]);
        if (error) throw error;
        toast.success("New Content Published");
      }
      setEditorOpen(false);
      fetchData();
    } catch (err: any) {
      if (err?.code === '42P01') {
        toast.error('Database configuration required', { description: 'Please run the cms_setup.sql script in your Supabase SQL editor first.' });
      } else {
        toast.error('Failed to save content', { description: err.message });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const deleteContent = async (id: string) => {
    try {
      const { error } = await supabase.from('platform_content').delete().eq('id', id);
      if (error) throw error;
      toast.success("Content permanently deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete content");
    }
  };

  const toggleContentStatus = async (item: ContentItem) => {
    try {
      const newStatus = item.status === 'PUBLISHED' ? 'DISABLED' : 'PUBLISHED';
      const { error } = await supabase.from('platform_content').update({ status: newStatus }).eq('id', item.id);
      if (error) throw error;
      toast.success(`Content ${newStatus.toLowerCase()}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to toggle status");
    }
  };

  const openEditor = (item?: ContentItem) => {
    setPreviewMode(false);
    if (item) {
      setActiveItem({ ...item });
    } else {
      setActiveItem({ type: 'page_section', section: 'homepage', title: '', content_html: '', status: 'DRAFT', metadata: {} });
    }
    setEditorOpen(true);
  };

  const addEditorElement = (element: string) => {
    let tag = '';
    if (element === 'h2') tag = '\n## Heading 2\n';
    if (element === 'p') tag = '\nNew paragraph...\n';
    if (element === 'b') tag = '**bold text**';
    if (element === 'img') tag = '\n![Image Description](https://...)\n';
    if (element === 'link') tag = '[Link Text](https://...)';

    setActiveItem({ ...activeItem, content_html: activeItem.content_html + tag });
  };

  const tabs = [
    { id: "announcements", label: "Communications", icon: Megaphone },
    { id: "pages", label: "Interface Content", icon: LayoutTemplate },
    { id: "blog", label: "Educational Resources", icon: FileText },
    { id: "banners", label: "Featured Banners", icon: Flag },
  ];


  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Institutional Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Platform Content Hub</h1>
            <p className="text-muted-foreground text-sm font-medium">Manage site-wide documentation, user interface copy, and system communications.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Button variant="outline" onClick={() => fetchData()} className="h-11 border-border text-[10px] font-black uppercase tracking-[0.2em] px-6 hover:bg-secondary rounded-xl transition-all group">
                <RefreshCw className={`w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} /> Sync Content
             </Button>
          </div>
        </header>


        <div className="grid lg:grid-cols-[280px_1fr] gap-12">
          {/* Navigation Tabs */}
          <aside className="lg:space-y-2 overflow-x-auto lg:overflow-visible flex lg:flex-col items-center lg:items-stretch gap-3 pb-4 lg:pb-0 scrollbar-hide shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 lg:shrink ${
                  activeTab === tab.id
                    ? "bg-primary text-white border-primary shadow-gold"
                    : "bg-card text-muted-foreground border-border hover:bg-secondary hover:border-primary/20"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'shadow-glow' : ''}`} />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Tab Content */}
          <main className="space-y-8">
            <AnimatePresence mode="wait">
              
              {/* Announcements Tab */}
              {activeTab === "announcements" && (
                <motion.div key="announcements" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-8">
                     <div className="flex items-center justify-between border-b border-border pb-6">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                           <Megaphone className="w-6 h-6" />
                         </div>
                         <div>
                           <h2 className="text-xl font-bold text-foreground">Active Broadcasts</h2>
                           <p className="text-xs text-muted-foreground mt-0.5">Manage ongoing global system notifications.</p>
                         </div>
                       </div>
                       <Button variant="hero" onClick={() => setBroadcastOpen(true)} className="h-10 text-[10px] font-black uppercase tracking-widest px-6 shadow-gold text-white">
                          <Plus className="w-4 h-4 mr-2" /> New Broadcast
                       </Button>
                     </div>

                     <div className="space-y-4">
                        {systemAnnouncements.length > 0 ? systemAnnouncements.map((a, i) => (
                            <div key={a.id} className="p-6 rounded-2xl border bg-secondary/30 hover:bg-secondary border-border flex items-start gap-6 group transition-all">
                               <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-3">
                                     <div className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20">{a.type}</div>
                                     <span className="text-[10px] font-black tracking-widest text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{a.title}</h4>
                                  <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-3xl">{a.message}</p>
                               </div>
                               <Button variant="ghost" size="icon" onClick={() => deleteAnnouncement(a.id)} className="text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="w-4 h-4" />
                               </Button>
                            </div>
                        )) : (
                            <div className="py-16 text-center border border-border border-dashed rounded-2xl">
                               <Megaphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                               <p className="text-sm font-bold text-foreground">No active broadcasts</p>
                               <p className="text-xs text-muted-foreground mt-1">Users will see alerts on their dashboards when you push a broadcast.</p>
                            </div>
                        )}
                     </div>
                  </div>
                </motion.div>
              )}

               {/* Pages & Sections Tab */}
               {activeTab === "pages" && (
                <motion.div key="pages" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="bg-card p-8 rounded-[2rem] border border-border shadow-huge space-y-10 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-primary/[0.01] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border pb-8 relative z-10">
                       <div className="flex items-center gap-5">
                         <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                           <LayoutTemplate className="w-7 h-7" />
                         </div>
                         <div>
                           <h2 className="text-2xl font-black text-foreground tracking-tight">Interface Modules</h2>
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-60">Manage primary platform copy and informational templates.</p>
                         </div>
                       </div>
                       <Button variant="hero" onClick={() => openEditor({ type: 'page_section', section: 'homepage', title: '', content_html: '', status: 'DRAFT', metadata: {} })} className="h-12 text-[10px] font-black uppercase tracking-widest px-8 shadow-gold text-white rounded-xl">
                          <Plus className="w-4 h-4 mr-2" /> Add Resource
                       </Button>
                     </div>


                     <div className="relative z-10">
                        {/* Mobile List View */}
                        <div className="lg:hidden space-y-4">
                           {platformContent.filter(c => c.type === 'page_section' || c.type === 'faq').map(item => (
                              <div key={item.id} className="p-6 rounded-2xl bg-secondary/20 border border-border group/card hover:border-primary/30 transition-all">
                                 <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center">
                                          <FileText className="w-4.5 h-4.5 text-muted-foreground" />
                                       </div>
                                       <div>
                                          <div className="text-sm font-black text-foreground uppercase tracking-tight" onClick={() => openEditor(item)}>{item.title}</div>
                                          <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{item.section.replace('_', ' ')}</div>
                                       </div>
                                    </div>
                                    {item.status === 'PUBLISHED' ? (
                                       <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-glow" />
                                    ) : (
                                       <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    )}
                                 </div>
                                 <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground/30 tracking-widest">{item.type}</span>
                                    <div className="flex gap-2">
                                       <Button variant="outline" size="icon" onClick={() => toggleContentStatus(item)} className="h-9 w-9 rounded-xl border-border bg-card">
                                          <RefreshCw className="w-3.5 h-3.5" />
                                       </Button>
                                       <Button variant="outline" size="icon" onClick={() => openEditor(item)} className="h-9 w-9 rounded-xl border-border bg-card text-primary">
                                          <Edit className="w-3.5 h-3.5" />
                                       </Button>
                                       <Button variant="outline" size="icon" onClick={() => deleteContent(item.id!)} className="h-9 w-9 rounded-xl border-border bg-card text-red-500">
                                          <Trash2 className="w-3.5 h-3.5" />
                                       </Button>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>

                        {/* Desktop Table View */}
                         <div className="hidden lg:block overflow-x-auto">
                           <table className="w-full text-sm">
                              <thead>
                                 <tr className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] bg-secondary/20 border-b border-border">
                                    <th className="py-5 pl-8 text-left">Item / Location</th>
                                    <th className="py-5 px-4 text-left">Category</th>
                                    <th className="py-5 px-4 text-center">Status</th>
                                    <th className="py-5 pr-8 text-right">Actions</th>
                                 </tr>
                              </thead>

                              <tbody className="divide-y divide-border/30">
                                 {platformContent.filter(c => c.type === 'page_section' || c.type === 'faq').map(item => (
                                    <tr key={item.id} className="hover:bg-secondary/20 transition-all group/row">
                                       <td className="py-6 pl-6">
                                          <div className="flex flex-col">
                                             <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-1">{item.section.replace('_', ' ')}</span>
                                          </div>
                                       </td>
                                       <td className="py-6 px-4">
                                          <span className="text-[9px] font-black uppercase text-muted-foreground/50 border border-border/50 px-2.5 py-1.5 rounded-lg bg-secondary/10 tracking-[0.1em]">{item.type}</span>
                                       </td>
                                       <td className="py-6 px-4 text-center">
                                          {item.status === 'PUBLISHED' ? (
                                            <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase text-green-500 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl"><CheckCircle className="w-3 h-3" /> ACTIVE</span>
                                          ) : item.status === 'DRAFT' ? (
                                            <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl"><Edit className="w-3 h-3" /> DRAFT_REV</span>
                                          ) : (
                                            <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl"><XCircle className="w-3 h-3" /> OFFLINE</span>
                                          )}
                                       </td>
                                       <td className="py-6 pr-6 text-right">
                                          <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all duration-300">
                                             <Button variant="outline" size="icon" onClick={() => toggleContentStatus(item)} className="h-10 w-10 rounded-xl border-border bg-card hover:bg-secondary shadow-sm"><RefreshCw className="w-4 h-4" /></Button>
                                             <Button variant="outline" size="icon" onClick={() => openEditor(item)} className="h-10 w-10 rounded-xl border-border bg-card text-primary hover:bg-primary/10 shadow-sm"><Edit className="w-4 h-4" /></Button>
                                             <Button variant="outline" size="icon" onClick={() => deleteContent(item.id!)} className="h-10 w-10 rounded-xl border-border bg-card text-red-500 hover:bg-red-500/10 shadow-sm"><Trash2 className="w-4 h-4" /></Button>
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
                                 {platformContent.filter(c => c.type === 'page_section' || c.type === 'faq').length === 0 && (
                                    <tr><td colSpan={4} className="py-20 text-center text-muted-foreground/30 font-black uppercase text-[10px] tracking-[0.3em]">No operational data detected.</td></tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}

              {/* Blogs */}
              {activeTab === "blog" && (
                <motion.div key="blog" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-8">
                     <div className="flex items-center justify-between border-b border-border pb-6">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                           <FileText className="w-6 h-6" />
                         </div>
                         <div>
                           <h2 className="text-xl font-bold text-foreground">Blog & Articles</h2>
                           <p className="text-xs text-muted-foreground mt-0.5">Manage educational resources and posts.</p>
                         </div>
                       </div>
                       <Button variant="hero" onClick={() => openEditor({ type: 'blog', section: 'crypto_trading', title: '', content_html: '', status: 'DRAFT', metadata: {} })} className="h-10 text-[10px] font-black uppercase tracking-widest px-6 shadow-gold text-white">
                          <Plus className="w-4 h-4 mr-2" /> Write Article
                       </Button>
                     </div>

                     <div className="grid md:grid-cols-2 gap-6">
                        {platformContent.filter(c => c.type === 'blog').map(item => (
                           <div key={item.id} className="p-6 rounded-2xl border bg-secondary/30 hover:bg-secondary border-border flex flex-col justify-between gap-4 group transition-all relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-primary"><FileText className="w-20 h-20" /></div>
                              <div className="space-y-2 z-10">
                                  <div className="flex justify-between items-start">
                                     <span className={`text-[9px] font-black uppercase border px-2 py-0.5 rounded-full ${item.status === 'PUBLISHED' ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-amber-500 border-amber-500/20 bg-amber-500/10'}`}>
                                       {item.status}
                                     </span>
                                     <span className="text-[10px] font-black text-muted-foreground tracking-widest flex items-center gap-1"><Eye className="w-3 h-3" /> {item.views} views</span>
                                  </div>
                                  <h3 className="text-base font-bold text-foreground mt-3 group-hover:text-primary transition-colors pr-8">{item.title}</h3>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(item.created_at!).toLocaleDateString()}</p>
                              </div>
                              <div className="flex gap-2 relative z-10 pt-4 border-t border-border/50">
                                 <Button variant="outline" className="flex-1 font-bold text-xs border-border bg-card shadow-sm hover:border-primary/50" onClick={() => openEditor(item)}>Edit Content</Button>
                                 <Button variant="outline" className="w-10 px-0 border-border bg-card shadow-sm hover:text-red-500 hover:bg-red-500/10" onClick={() => deleteContent(item.id!)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                           </div>
                        ))}
                        {platformContent.filter(c => c.type === 'blog').length === 0 && (
                           <div className="col-span-full py-16 text-center border border-border border-dashed rounded-2xl">
                             <p className="text-sm font-bold text-foreground">No articles published yet.</p>
                           </div>
                        )}
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "banners" && (
                <motion.div key="banners" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="bg-card p-8 rounded-3xl border border-border shadow-sm text-center py-24">
                      <Flag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
                      <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Campaign Banners</h2>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mt-2 font-medium">
                         Create highlighting banners to feature specific updates, promotions, or announcements prominently.
                      </p>
                      <Button variant="hero" onClick={() => openEditor({ type: 'banner', section: 'user_dashboard', title: '', content_html: '', status: 'PUBLISHED', metadata: {} })} className="mt-8 shadow-gold text-white font-black uppercase tracking-[0.2em] h-12 px-10 rounded-xl">
                         Create Banner
                      </Button>
                  </div>

                  
                  {platformContent.filter(c => c.type === 'banner').map(item => (
                     <div key={item.id} className="bg-primary/10 border border-primary/30 p-6 rounded-2xl flex items-center justify-between">
                        <div>
                           <h3 className="text-lg font-bold text-primary">{item.title}</h3>
                           <p className="text-sm font-medium text-foreground">{item.content_html}</p>
                           <div className="text-xs font-bold text-muted-foreground mt-2 uppercase">Status: {item.status}</div>
                        </div>
                        <div className="flex gap-2">
                           <Button variant="ghost" onClick={() => toggleContentStatus(item)} className="bg-card border border-border hover:text-primary">Toggle</Button>
                           <Button variant="ghost" onClick={() => deleteContent(item.id!)} className="bg-card border border-border text-red-500 hover:bg-red-500/10">Delete</Button>
                        </div>
                     </div>
                  ))}
                </motion.div>
              )}

            </AnimatePresence>
          </main>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContentManagement;
