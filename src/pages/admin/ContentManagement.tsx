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
    { id: "announcements", label: "Broadcasts & Alerts", icon: Megaphone },
    { id: "pages", label: "Pages & Sections", icon: LayoutTemplate },
    { id: "blog", label: "Blog & Articles", icon: FileText },
    { id: "banners", label: "Banners & Highlights", icon: Flag },
  ];

  return (
    <AdminLayout>
      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="bg-card border-border sm:max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/50">
             <div>
                <DialogTitle className="text-foreground text-xl">Content Editor</DialogTitle>
                <DialogDescription>Modify platform content using rich structuring.</DialogDescription>
             </div>
             <div className="flex items-center gap-3">
                <div className="flex bg-secondary rounded-lg p-1 mr-4 border border-border">
                   <button onClick={() => setPreviewMode(false)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${!previewMode ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}>Editor</button>
                   <button onClick={() => setPreviewMode(true)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${previewMode ? 'bg-card text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}>Preview</button>
                </div>
                <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={isSaving} className="border-border">Cancel</Button>
                <Button variant="hero" onClick={saveContent} disabled={isSaving} className="shadow-gold text-white px-6">
                   {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
                </Button>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
             <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-2">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Document Title</Label>
                   <Input value={activeItem.title} onChange={e => setActiveItem({...activeItem, title: e.target.value})} placeholder="e.g. Hero Section Heading" className="bg-secondary/50 border-border text-lg font-bold h-12" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Visibility Status</Label>
                   <select 
                      value={activeItem.status} 
                      onChange={e => setActiveItem({...activeItem, status: e.target.value as any})}
                      className="w-full h-12 rounded-xl bg-secondary/50 border border-border text-foreground px-4 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                   >
                     <option value="PUBLISHED">Published (Live)</option>
                     <option value="DRAFT">Draft (Hidden)</option>
                     <option value="DISABLED">Disabled</option>
                   </select>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Content Type</Label>
                   <select 
                      value={activeItem.type} 
                      onChange={e => setActiveItem({...activeItem, type: e.target.value as any})}
                      className="w-full h-12 rounded-xl bg-secondary/50 border border-border text-foreground px-4 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                   >
                     <option value="page_section">Page Section</option>
                     <option value="blog">Blog Article</option>
                     <option value="banner">Banner Highlight</option>
                     <option value="faq">FAQ Entry</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Target Section</Label>
                   <select 
                      value={activeItem.section} 
                      onChange={e => setActiveItem({...activeItem, section: e.target.value})}
                      className="w-full h-12 rounded-xl bg-secondary/50 border border-border text-foreground px-4 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                   >
                     <option value="homepage">Homepage</option>
                     <option value="user_dashboard">User Dashboard</option>
                     <option value="admin_dashboard">Admin Dashboard</option>
                     <option value="copy_trading">Copy Trading Page</option>
                     <option value="support">Support Hub</option>
                     <option value="wallet">Wallet & Deposits</option>
                   </select>
                </div>
             </div>

             <div className="space-y-3">
                <div className="flex items-center justify-between">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Content Body (Markdown Supported)</Label>
                   {!previewMode && (
                      <div className="flex items-center gap-1 bg-secondary rounded-lg border border-border p-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => addEditorElement('h2')}><Type className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground font-serif font-black" onClick={() => addEditorElement('b')}>B</Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => addEditorElement('link')}><LinkIcon className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => addEditorElement('img')}><ImageIcon className="w-3.5 h-3.5" /></Button>
                      </div>
                   )}
                </div>

                {previewMode ? (
                   <div className="min-h-[400px] w-full rounded-2xl border border-border bg-card p-6 prose prose-sm prose-invert max-w-none shadow-sm h-full overflow-y-auto">
                     {activeItem.content_html ? (
                       <div className="whitespace-pre-wrap">{activeItem.content_html}</div>
                     ) : (
                       <div className="text-muted-foreground/30 italic text-center py-20 font-bold">Preview is empty...</div>
                     )}
                   </div>
                ) : (
                   <Textarea 
                     value={activeItem.content_html} 
                     onChange={e => setActiveItem({...activeItem, content_html: e.target.value})} 
                     className="min-h-[400px] bg-secondary/30 border-border text-foreground p-6 text-sm font-mono leading-relaxed focus:bg-card transition-colors resize-y shadow-inner" 
                     placeholder="Write your content here..." 
                   />
                )}
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[425px]">
          <DialogHeader>
             <DialogTitle className="text-foreground">New Broadcast</DialogTitle>
             <DialogDescription>Send a global notification to all users.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label className="text-foreground text-xs font-bold">Broadcast Subject</Label>
                <Input value={broadcastForm.title} onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})} placeholder="e.g. Scheduled Maintenance" className="bg-secondary/50 border-border text-foreground" />
             </div>
             <div className="space-y-2">
                <Label className="text-foreground text-xs font-bold">Message Content</Label>
                <Textarea value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} placeholder="Enter details..." className="h-32 bg-secondary/50 border-border text-foreground resize-none" />
             </div>
          </div>
          <div className="flex justify-end gap-3">
             <Button variant="outline" onClick={() => setBroadcastOpen(false)} disabled={isSaving} className="border-border">Cancel</Button>
             <Button variant="hero" onClick={handleBroadcast} disabled={isSaving} className="shadow-gold text-white font-bold w-full uppercase tracking-wider text-xs">
                {isSaving ? 'Broadcasting...' : 'Push to Users'}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-10 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
            <p className="text-muted-foreground text-sm mt-2">Create pages, edit copy, manage articles, and broadcast to users.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" onClick={() => fetchData()} className="h-11 border-border bg-card text-sm font-medium px-6 shadow-sm hover:bg-secondary">
               <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin text-primary' : ''}`} /> Refresh Data
             </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-12">
          {/* Sidebar Tabs */}
          <aside className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all border ${
                  activeTab === tab.id
                    ? "bg-primary text-white border-primary shadow-gold"
                    : "bg-card text-muted-foreground border-border hover:bg-secondary hover:border-primary/20"
                }`}
              >
                <tab.icon className="w-4 h-4" />
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
                  <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-8">
                     <div className="flex items-center justify-between border-b border-border pb-6">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                           <LayoutTemplate className="w-6 h-6" />
                         </div>
                         <div>
                           <h2 className="text-xl font-bold text-foreground">Platform Pages</h2>
                           <p className="text-xs text-muted-foreground mt-0.5">Edit copy and texts for core application pathways.</p>
                         </div>
                       </div>
                       <Button variant="hero" onClick={() => openEditor({ type: 'page_section', section: 'homepage', title: '', content_html: '', status: 'DRAFT', metadata: {} })} className="h-10 text-[10px] font-black uppercase tracking-widest px-6 shadow-gold text-white">
                          <Plus className="w-4 h-4 mr-2" /> Inject Module
                       </Button>
                     </div>

                     <div className="overflow-x-auto">
                        <table className="w-full">
                           <thead>
                              <tr className="border-b border-border text-left">
                                 <th className="pb-3 px-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Section / Title</th>
                                 <th className="pb-3 px-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Type</th>
                                 <th className="pb-3 px-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Status</th>
                                 <th className="pb-3 px-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Controls</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-border">
                              {platformContent.filter(c => c.type === 'page_section' || c.type === 'faq').map(item => (
                                 <tr key={item.id} className="hover:bg-secondary/40 transition-colors group">
                                    <td className="p-4">
                                       <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors cursor-pointer" onClick={() => openEditor(item)}>{item.title}</div>
                                       <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{item.section.replace('_', ' ')}</div>
                                    </td>
                                    <td className="p-4">
                                       <span className="bg-secondary border border-border px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">{item.type}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                       {item.status === 'PUBLISHED' ? (
                                         <span className="text-[10px] font-black uppercase text-green-500 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full"><CheckCircle className="w-3 h-3 inline mr-1" /> Published</span>
                                       ) : item.status === 'DRAFT' ? (
                                         <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full"><Edit className="w-3 h-3 inline mr-1" /> Draft</span>
                                       ) : (
                                         <span className="text-[10px] font-black uppercase text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full"><XCircle className="w-3 h-3 inline mr-1" /> Disabled</span>
                                       )}
                                    </td>
                                    <td className="p-4 text-right">
                                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button variant="ghost" size="icon" onClick={() => toggleContentStatus(item)} className="h-8 w-8 text-muted-foreground hover:text-foreground border border-border bg-card shadow-sm"><RefreshCw className="w-3.5 h-3.5" /></Button>
                                          <Button variant="ghost" size="icon" onClick={() => openEditor(item)} className="h-8 w-8 text-primary hover:bg-primary/10 border border-border bg-card shadow-sm"><Edit className="w-3.5 h-3.5" /></Button>
                                          <Button variant="ghost" size="icon" onClick={() => deleteContent(item.id!)} className="h-8 w-8 text-red-500 hover:bg-red-500/10 border border-border bg-card shadow-sm"><Trash2 className="w-3.5 h-3.5" /></Button>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                              {platformContent.filter(c => c.type === 'page_section' || c.type === 'faq').length === 0 && (
                                 <tr><td colSpan={4} className="py-12 text-center text-muted-foreground italic text-xs">No active page content modules injected yet.</td></tr>
                              )}
                           </tbody>
                        </table>
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

              {/* Banners */}
              {activeTab === "banners" && (
                <motion.div key="banners" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-8 text-center py-20">
                      <Flag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h2 className="text-xl font-bold text-foreground">Promotional Banners</h2>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                         Create aggressive marketing injects that force-render priority banners at the top of the user dashboards or copy trading matrices.
                      </p>
                      <Button variant="hero" onClick={() => openEditor({ type: 'banner', section: 'user_dashboard', title: '', content_html: '', status: 'PUBLISHED', metadata: {} })} className="mt-4 shadow-gold text-white font-black uppercase tracking-widest">
                         Deploy Banner Campaign
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
