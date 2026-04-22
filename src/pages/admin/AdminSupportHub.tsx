import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useChatStore, ChatConversation, SupportFAQ } from '@/store/useChatStore';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  MessageSquare, Send, Search, CheckCheck, Check, Clock,
  CircleDot, CircleCheck, Archive, Trash2, UserCheck,
  ChevronDown, X, Loader2, ShieldCheck, Mail, Calendar, User, RefreshCw,
  HelpCircle, Plus, Pencil, ToggleLeft, ToggleRight, ArrowUpDown, BarChart3,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-500/10 text-green-600 border-green-500/20',
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  resolved: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  closed: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
};

const STATUS_ICONS: Record<string, any> = {
  open: CircleDot,
  pending: Clock,
  resolved: CircleCheck,
  closed: Archive
};

const FAQ_CATEGORIES = ['Deposits', 'Withdrawals', 'KYC', 'Copy Trading', 'Account', 'Technical', 'General'];


const AdminSupportHub = () => {
  const user = useStore(state => state.user);
  const {
    conversations, activeConversation, messages, faqs, isLoading, isSending,
    fetchAllConversations, setActiveConversation, fetchMessages, fetchFAQs,
    sendMessage, markMessagesRead, updateConversationStatus,
    assignConversation, deleteConversation, createFAQ, updateFAQ, deleteFAQ,
    subscribeToMessages, subscribeToConversations
  } = useChatStore();

  // Main view state: 'conversations' or 'faqs'
  const [activeTab, setActiveTab] = useState<'conversations' | 'faqs'>('conversations');

  // Chat state
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // FAQ state
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('all');
  const [editingFAQ, setEditingFAQ] = useState<SupportFAQ | null>(null);
  const [showFAQForm, setShowFAQForm] = useState(false);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'General', priority: 0, status: 'active' as 'active' | 'inactive' });
  const [faqDeleteConfirm, setFaqDeleteConfirm] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubMsgRef = useRef<(() => void) | null>(null);
  const unsubConvRef = useRef<(() => void) | null>(null);

  // Load data on mount
  useEffect(() => {
    fetchAllConversations();
    fetchFAQs(false); // false = fetch all, including inactive for admin
    unsubConvRef.current = subscribeToConversations();
    return () => {
      if (unsubConvRef.current) unsubConvRef.current();
      if (unsubMsgRef.current) unsubMsgRef.current();
    };
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation?.id) {
      fetchMessages(activeConversation.id);
      markMessagesRead(activeConversation.id, 'admin');
      if (unsubMsgRef.current) unsubMsgRef.current();
      unsubMsgRef.current = subscribeToMessages(activeConversation.id);
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeConversation?.id && messages.length > 0) {
      markMessagesRead(activeConversation.id, 'admin');
    }
  }, [messages.length]);

  // Chat handlers
  const handleSend = async () => {
    if (!inputValue.trim() || !activeConversation?.id || !user?.id) return;
    const msg = inputValue.trim();
    setInputValue('');
    await sendMessage(activeConversation.id, user.id, 'admin', msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDelete = async (convId: string) => {
    await deleteConversation(convId);
    setShowDeleteConfirm(null);
  };

  // FAQ handlers
  const handleSaveFAQ = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      toast.error('Missing fields', { description: 'Please provide both question and answer.' });
      return;
    }

    try {
      if (editingFAQ) {
        await updateFAQ(editingFAQ.id, faqForm);
        toast.success("FAQ Updated successfully");
      } else {
        await createFAQ(faqForm);
        toast.success("FAQ Created successfully");
      }

      setFaqForm({ question: '', answer: '', category: 'General', priority: 0, status: 'active' });
      setEditingFAQ(null);
      setShowFAQForm(false);
    } catch (err: any) {
      toast.error("Failed to save FAQ", { description: err.message || "An error occurred." });
    }
  };

  const handleEditFAQ = (faq: SupportFAQ) => {
    setEditingFAQ(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      priority: faq.priority,
      status: faq.status
    });
    setShowFAQForm(true);
  };

  const handleDeleteFAQ = async (id: string) => {
    await deleteFAQ(id);
    setFaqDeleteConfirm(null);
  };

  const handleToggleFAQStatus = async (faq: SupportFAQ) => {
    await updateFAQ(faq.id, { status: faq.status === 'active' ? 'inactive' : 'active' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatFullTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filtered lists
  const filteredConvos = conversations.filter(c => {
    const matchesSearch = !searchQuery ||
      c.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.last_message?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredFAQs = faqs.filter(f => {
    const matchesSearch = !faqSearch ||
      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearch.toLowerCase());
    const matchesCategory = faqCategoryFilter === 'all' || f.category === faqCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-7.5rem)] flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 shrink-0">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black text-foreground tracking-tight">Support Hub</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
                {activeTab === 'conversations'
                  ? <>{conversations.length} Active Tickets {totalUnread > 0 && <span className="text-primary tracking-normal"> · {totalUnread} Unread</span>}</>
                  : <>{faqs.length} Knowledge Base Articles</>
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Navigation */}
            <div className="flex bg-secondary/50 rounded-2xl p-1 border border-border flex-1 lg:flex-none">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 ${
                  activeTab === 'conversations' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Tickets</span>
                {totalUnread > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-lg bg-primary text-white text-[9px] font-black flex items-center justify-center shadow-gold">{totalUnread}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('faqs')}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 ${
                  activeTab === 'faqs' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Knowledge Base</span>
              </button>
            </div>

            <Button variant="outline" size="icon" onClick={() => { fetchAllConversations(); fetchFAQs(false); }} className="h-12 w-12 rounded-2xl border-border shrink-0 hover:bg-secondary">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ========== CONVERSATIONS VIEW ========== */}
        {activeTab === 'conversations' && (
          <div className="flex-1 grid grid-cols-12 gap-0 border border-border rounded-[2.5rem] overflow-hidden bg-card min-h-0 shadow-2xl relative">
            {/* Ticket List Sidebar */}
            <div className={`${activeConversation ? 'hidden lg:flex' : 'flex'} col-span-12 lg:col-span-4 xl:col-span-3 border-r border-border flex-col min-h-0 bg-secondary/10`}>
              <div className="p-6 border-b border-border space-y-4 shrink-0 bg-card/50 backdrop-blur-sm">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tickets..." className="h-12 pl-11 text-[11px] font-black uppercase tracking-widest bg-card border-border rounded-xl focus:ring-8 focus:ring-primary/5 transition-all" />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {['all', 'open', 'pending', 'resolved', 'closed'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${statusFilter === s ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' : 'bg-card text-muted-foreground hover:text-foreground border-border'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading && conversations.length === 0 ? (
                  <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-primary/20 animate-spin" /></div>
                ) : filteredConvos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4 border border-border/50">
                      <MessageSquare className="w-8 h-8 text-muted-foreground/20" />
                    </div>
                    <p className="text-sm font-black text-foreground uppercase tracking-tight">No tickets found</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-2 uppercase tracking-widest font-bold leading-relaxed">{searchQuery ? 'Adjust your search parameters' : 'New tickets will appear here'}</p>
                  </div>
                ) : (
                  filteredConvos.map(conv => {
                    const isActive = activeConversation?.id === conv.id;
                    const StatusIcon = STATUS_ICONS[conv.status] || CircleDot;
                    return (
                      <button key={conv.id} onClick={() => setActiveConversation(conv)} className={`w-full text-left p-6 border-b border-border transition-all hover:bg-card/80 group ${isActive ? 'bg-card border-l-4 border-l-primary shadow-sm z-10' : ''}`}>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform">
                            {conv.user_avatar ? <img src={conv.user_avatar} className="w-full h-full object-cover" /> : <div className="text-sm font-black text-muted-foreground">{conv.user_name?.charAt(0) || 'U'}</div>}
                            {conv.status === 'open' && <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-secondary shadow-sm" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <span className="text-sm font-black text-foreground truncate tracking-tight group-hover:text-primary transition-colors">{conv.user_name}</span>
                              <span className="text-[10px] font-black text-muted-foreground/40 shrink-0 tabular-nums">{formatTime(conv.last_message_at || conv.updated_at)}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate leading-relaxed line-clamp-1">{conv.last_message || 'New conversation started'}</p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] border ${STATUS_COLORS[conv.status]}`}>
                                <StatusIcon className="w-2.5 h-2.5" />{conv.status}
                              </span>
                              {(conv.unread_count || 0) > 0 && <span className="px-2 py-1 rounded-lg bg-primary text-white text-[9px] font-black shadow-gold">{conv.unread_count} New</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Center Chat Interface */}
            <div className={`${activeConversation ? 'flex' : 'hidden lg:flex'} col-span-12 lg:col-span-8 xl:col-span-6 flex-col min-h-0 bg-card`}>
              {activeConversation ? (
                <>
                  <div className="px-8 py-5 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md z-20 shrink-0">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" onClick={() => setActiveConversation(null)} className="lg:hidden h-10 w-10 rounded-xl mr-1">
                        <X className="w-5 h-5 text-muted-foreground" />
                      </Button>
                      <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-sm font-black text-primary overflow-hidden relative shadow-sm">
                        {activeConversation.user_avatar ? <img src={activeConversation.user_avatar} className="w-full h-full object-cover" /> : activeConversation.user_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="text-[13px] font-black text-foreground uppercase tracking-tight">{activeConversation.user_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm" />
                          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-60">Active Session</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:block relative">
                        <button onClick={() => setShowStatusMenu(!showStatusMenu)} className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all hover:brightness-110 ${STATUS_COLORS[activeConversation.status]}`}>
                          Status: {activeConversation.status}<ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {showStatusMenu && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
                            <div className="absolute right-0 mt-3 w-56 bg-card border border-border rounded-[2rem] shadow-huge z-50 p-3 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-4 duration-200">
                              {['open', 'pending', 'resolved', 'closed'].map(s => (
                                <button key={s} onClick={() => { updateConversationStatus(activeConversation.id, s); setShowStatusMenu(false); }} className={`w-full text-left px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${activeConversation.status === s ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'}`}>{s}</button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <button onClick={() => setShowDeleteConfirm(activeConversation.id)} className="w-12 h-12 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all active:scale-90 shadow-sm">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {showDeleteConfirm === activeConversation.id && (
                    <div className="mx-6 mt-6 p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                          <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-red-600 uppercase tracking-tight">Delete conversation?</p>
                          <p className="text-[10px] text-red-500/60 uppercase tracking-widest font-black mt-1">This action cannot be undone.</p>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(null)} className="h-12 px-8 text-[10px] font-black uppercase tracking-widest flex-1 sm:flex-none rounded-2xl border-red-500/10 hover:bg-red-500/5">Cancel</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(activeConversation.id)} className="h-12 px-8 text-[10px] font-black uppercase tracking-widest flex-1 sm:flex-none rounded-2xl shadow-lg shadow-red-500/20">Delete Forever</Button>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide bg-secondary/5">
                    {messages.map((msg, idx) => {
                      const isAdmin = msg.sender_role === 'admin';
                      const showAvatar = idx === 0 || messages[idx-1].sender_role !== msg.sender_role;
                      return (
                        <div key={msg.id} className={`flex gap-3.5 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          {!isAdmin && (
                            <div className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0 mt-1 text-[10px] font-black text-muted-foreground overflow-hidden">
                              {showAvatar ? (activeConversation.user_avatar ? <img src={activeConversation.user_avatar} className="w-full h-full object-cover" /> : activeConversation.user_name?.charAt(0) || 'U') : null}
                            </div>
                          )}
                          <div className={`max-w-[85%] sm:max-w-[70%] rounded-[1.5rem] px-5 py-4 shadow-sm relative group/msg ${isAdmin ? 'bg-primary text-white rounded-br-sm' : 'bg-card border border-border rounded-bl-sm text-foreground'}`}>
                            {!isAdmin && <div className="text-[8px] font-black uppercase tracking-[0.2em] mb-2 opacity-40">User Message</div>}
                            <p className="text-xs leading-[1.6] whitespace-pre-wrap break-words font-medium">{msg.message}</p>
                            <div className={`flex items-center gap-2 mt-3 opacity-60 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[9px] font-black tabular-nums">{formatFullTime(msg.created_at)}</span>
                              {isAdmin && (msg.is_read ? <CheckCheck className="w-3 h-3 text-white" /> : <Check className="w-3 h-3 text-white/50" />)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="shrink-0 p-6 bg-card border-t border-border mt-auto">
                    {activeConversation.status === 'closed' ? (
                      <div className="text-center py-4 bg-secondary/20 rounded-[1.5rem] border border-dashed border-border px-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">This support ticket is currently closed</p>
                        <Button variant="outline" size="sm" className="mt-4 text-[10px] font-black uppercase tracking-widest px-8 h-10 rounded-xl" onClick={() => updateConversationStatus(activeConversation.id, 'open')}>Reopen Ticket</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 relative group">
                           <Input 
                             value={inputValue} 
                             onChange={(e) => setInputValue(e.target.value)} 
                             onKeyDown={handleKeyDown} 
                             placeholder="Type a message..." 
                             className="h-14 text-sm bg-secondary/50 border-border rounded-2xl pl-6 pr-12 focus:ring-8 focus:ring-primary/5 font-medium" 
                           />
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full transition-colors ${inputValue.trim() ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
                           </div>
                        </div>
                        <Button 
                          onClick={handleSend} 
                          disabled={!inputValue.trim() || isSending} 
                          className="h-14 w-14 rounded-2xl shrink-0 p-0 shadow-gold group active:scale-95 transition-transform"
                        >
                          {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-secondary/5">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-card border border-border shadow-huge flex items-center justify-center mb-6 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <MessageSquare className="w-8 h-8 text-muted-foreground/20 group-hover:text-primary/40 transition-colors" />
                  </div>
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Ticket Selection</h3>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-black opacity-40 mt-3 leading-relaxed max-w-xs">Select a support ticket from the list to view the conversation and reply.</p>
                </div>
              )}
            </div>

            {/* Right Sidebar — User Information */}
            <div className={`${activeConversation ? 'hidden 2xl:flex' : 'hidden'} col-span-12 xl:col-span-3 border-l border-border flex-col min-h-0 overflow-y-auto bg-secondary/10`}>
              {activeConversation ? (
                <div className="p-10 space-y-10">
                  <div className="flex flex-col items-center text-center pb-10 border-b border-border">
                    <div className="w-28 h-28 rounded-[2.5rem] bg-card border border-border flex items-center justify-center text-3xl font-black text-foreground mb-6 overflow-hidden shadow-huge ring-8 ring-secondary/50">
                      {activeConversation.user_avatar ? <img src={activeConversation.user_avatar} className="w-full h-full object-cover" /> : activeConversation.user_name?.charAt(0) || 'U'}
                    </div>
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{activeConversation.user_name}</h3>
                    <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.1em] mt-2 opacity-50 tabular-nums">{activeConversation.user_email}</p>
                    <div className="flex items-center gap-2.5 mt-6">
                       <Badge className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-secondary text-foreground border-border">{activeConversation.priority || 'Normal'} Priority</Badge>
                       <Badge className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-primary/10 text-primary border-primary/20">Verified Account</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] pl-1 opacity-40">User Information</h4>
                    {[
                      { icon: ShieldCheck, label: 'Verification Status', value: activeConversation.user_kyc || 'Unverified', color: (activeConversation.user_kyc === 'Verified' || activeConversation.user_kyc === 'Approved') ? 'text-green-500' : 'text-amber-500' },
                      { icon: Mail, label: 'Email Address', value: activeConversation.user_email },
                      { icon: Calendar, label: 'Account Created', value: new Date(activeConversation.created_at).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }) },
                      { icon: CircleDot, label: 'Account Status', value: activeConversation.user_status || 'Active', color: activeConversation.user_status === 'Active' ? 'text-green-500' : 'text-red-500' },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="p-5 rounded-3xl bg-card border border-border shadow-sm group hover:border-primary/20 transition-all hover:translate-x-1">
                        <div className="flex items-center gap-3 mb-2.5">
                           <Icon className="w-3.5 h-3.5 text-primary opacity-60" />
                           <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{label}</span>
                        </div>
                        <div className={`text-[11px] font-black leading-tight break-all ${color || 'text-foreground'}`}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] pl-1 opacity-40">Analytics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-[2rem] bg-card border border-border text-center shadow-sm">
                        <div className="text-3xl font-black text-foreground tabular-nums tracking-tighter">{messages.length}</div>
                        <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1.5 opacity-60">Messages</div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-card border border-border text-center shadow-sm">
                        <div className="text-3xl font-black text-primary tabular-nums tracking-tighter">Gold</div>
                        <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1.5 opacity-60">Tier</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border pb-10">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] pl-1 opacity-40">Ticket Actions</h4>
                    <Button variant="outline" className="w-full justify-start gap-4 text-[10px] font-black uppercase tracking-widest h-14 rounded-2xl border-border group hover:bg-blue-500/5 hover:border-blue-500/20" onClick={() => updateConversationStatus(activeConversation.id, 'resolved')}>
                       <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <CircleCheck className="w-5 h-5 text-blue-500" />
                       </div>
                       Mark as Resolved
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-4 text-[10px] font-black uppercase tracking-widest h-14 rounded-2xl border-border group hover:bg-zinc-500/5 hover:border-zinc-500/20" onClick={() => updateConversationStatus(activeConversation.id, 'closed')}>
                       <div className="w-10 h-10 rounded-xl bg-zinc-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Archive className="w-5 h-5 text-zinc-500" />
                       </div>
                       Close Ticket
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-20">
                  <User className="w-12 h-12 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Metadata Empty</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== FAQ MANAGEMENT VIEW ========== */}
        {activeTab === 'faqs' && (
          <div className="flex-1 border border-border rounded-2xl overflow-hidden bg-card flex flex-col min-h-0">
            {/* FAQ Toolbar */}
            <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 bg-secondary/10">
              <div className="flex items-center gap-3 flex-1 w-full">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input value={faqSearch} onChange={(e) => setFaqSearch(e.target.value)} placeholder="Search FAQs..." className="h-9 pl-9 text-xs bg-card border-border rounded-lg" />
                </div>
                <div className="flex gap-1 flex-wrap">
                  <button onClick={() => setFaqCategoryFilter('all')} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${faqCategoryFilter === 'all' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-secondary border border-transparent'}`}>All</button>
                  {FAQ_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setFaqCategoryFilter(cat)} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${faqCategoryFilter === cat ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-secondary border border-transparent'}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <Button size="sm" onClick={() => { setEditingFAQ(null); setFaqForm({ question: '', answer: '', category: 'General', priority: 0, status: 'active' }); setShowFAQForm(true); }} className="gap-2 text-xs font-bold shrink-0">
                <Plus className="w-3.5 h-3.5" /> Add FAQ
              </Button>
            </div>

            {/* FAQ Form Modal */}
            {showFAQForm && (
              <div className="p-5 border-b border-border bg-secondary/5 shrink-0">
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">{editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}</h3>
                    <button onClick={() => { setShowFAQForm(false); setEditingFAQ(null); }} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Question</label>
                      <Input value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} placeholder="Enter the question..." className="h-10 text-sm bg-card border-border" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Answer</label>
                      <textarea value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} placeholder="Enter the auto-response answer..." rows={4} className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors resize-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Category</label>
                      <select value={faqForm.category} onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })} className="w-full h-10 px-3 rounded-xl bg-card border border-border text-sm text-foreground outline-none focus:border-primary/50 transition-colors">
                        {FAQ_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Priority (Higher = Shown First)</label>
                      <Input type="number" value={faqForm.priority} onChange={(e) => setFaqForm({ ...faqForm, priority: parseInt(e.target.value) || 0 })} className="h-10 text-sm bg-card border-border" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setFaqForm({ ...faqForm, status: faqForm.status === 'active' ? 'inactive' : 'active' })} className="flex items-center gap-2 text-xs font-bold">
                        {faqForm.status === 'active'
                          ? <><ToggleRight className="w-5 h-5 text-green-500" /><span className="text-green-600">Active</span></>
                          : <><ToggleLeft className="w-5 h-5 text-muted-foreground" /><span className="text-muted-foreground">Inactive</span></>
                        }
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setShowFAQForm(false); setEditingFAQ(null); }} className="text-xs">Cancel</Button>
                      <Button size="sm" onClick={handleSaveFAQ} disabled={!faqForm.question.trim() || !faqForm.answer.trim()} className="text-xs font-bold gap-1.5">
                        {editingFAQ ? 'Update FAQ' : 'Create FAQ'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FAQ Scroll Area */}
            <div className="flex-1 overflow-y-auto bg-secondary/5">
              {filteredFAQs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center px-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-card border border-border shadow-huge flex items-center justify-center mb-6">
                    <HelpCircle className="w-10 h-10 text-muted-foreground/20" />
                  </div>
                  <p className="text-sm font-black text-foreground uppercase tracking-tight">No Articles Found</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-2 uppercase tracking-widest font-bold leading-relaxed max-w-xs">Create your first knowledge base article to provide instant answers.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-card border-b border-border z-10 shadow-sm">
                        <tr>
                          <th className="text-left px-10 py-6 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Article & Content</th>
                          <th className="text-left px-6 py-6 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] w-[180px]">Category</th>
                          <th className="text-center px-6 py-6 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] w-[120px]">Priority</th>
                          <th className="text-center px-6 py-6 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] w-[120px]">Views</th>
                          <th className="text-center px-6 py-6 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] w-[140px]">Status</th>
                          <th className="text-right px-10 py-6 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] w-[180px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {filteredFAQs.map(faq => (
                          <tr key={faq.id} className="hover:bg-card transition-all group">
                            <td className="px-10 py-8">
                              <div className="text-sm font-black text-foreground tracking-tight max-w-xl group-hover:text-primary transition-colors">{faq.question}</div>
                              <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed max-w-xl font-medium opacity-70 group-hover:opacity-100 transition-opacity">{faq.answer}</p>
                            </td>
                            <td className="px-6 py-8">
                              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/50 border border-border text-[9px] font-black text-foreground uppercase tracking-widest shadow-sm">
                                <Tag className="w-3 h-3 text-primary" />{faq.category}
                              </span>
                            </td>
                            <td className="px-6 py-8 text-center">
                              <span className="text-xs font-black text-foreground tabular-nums tracking-tighter bg-secondary/30 px-3 py-1.5 rounded-xl border border-border">LVL {faq.priority}</span>
                            </td>
                            <td className="px-6 py-8 text-center tabular-nums font-black text-xs text-muted-foreground opacity-60">
                              {faq.usage_count || 0}
                            </td>
                            <td className="px-6 py-8 text-center">
                              <button onClick={() => handleToggleFAQStatus(faq)} className="transition-transform active:scale-90">
                                {faq.status === 'active'
                                  ? <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-widest border border-green-500/20 shadow-sm"><ToggleRight className="w-4 h-4 shadow-gold" />Online</span>
                                  : <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary text-muted-foreground text-[9px] font-black uppercase tracking-widest border border-border"><ToggleLeft className="w-4 h-4" />Offline</span>
                                }
                              </button>
                            </td>
                            <td className="px-10 py-8 text-right">
                              <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <Button variant="outline" size="icon" onClick={() => handleEditFAQ(faq)} className="h-12 w-12 rounded-2xl border-border hover:bg-primary/10 hover:text-primary transition-all shadow-sm">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                {faqDeleteConfirm === faq.id ? (
                                  <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
                                    <Button size="sm" onClick={() => handleDeleteFAQ(faq.id)} className="h-12 px-6 bg-red-500 hover:bg-red-600 text-white font-black text-[10px] rounded-2xl shadow-lg shadow-red-500/20">Confirm</Button>
                                    <Button variant="outline" size="icon" onClick={() => setFaqDeleteConfirm(null)} className="h-12 w-12 rounded-2xl border-border">✕</Button>
                                  </div>
                                ) : (
                                  <Button variant="outline" size="icon" onClick={() => setFaqDeleteConfirm(faq.id)} className="h-12 w-12 rounded-2xl border-border hover:bg-red-500/10 hover:text-red-500 transition-all shadow-sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden p-6 space-y-4">
                     {filteredFAQs.map(faq => (
                        <div key={faq.id} className="p-6 rounded-[2rem] bg-card border border-border shadow-sm space-y-6">
                           <div className="space-y-2">
                              <div className="flex justify-between items-start gap-4">
                                 <Badge className="text-[8px] font-black uppercase tracking-widest bg-secondary text-foreground shrink-0">{faq.category}</Badge>
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   onClick={() => handleToggleFAQStatus(faq)}
                                   className={`h-8 w-14 rounded-full border transition-all ${faq.status === 'active' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted border-border text-muted-foreground opacity-40'}`}
                                 >
                                    {faq.status === 'active' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                 </Button>
                              </div>
                              <h4 className="text-sm font-black text-foreground tracking-tight leading-snug">{faq.question}</h4>
                              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed opacity-80">{faq.answer}</p>
                           </div>
                           
                           <div className="flex items-center justify-between pt-6 border-t border-border">
                              <div className="flex items-center gap-6">
                                 <div className="text-center">
                                    <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Priority</div>
                                    <div className="text-sm font-black text-foreground tabular-nums">#{faq.priority}</div>
                                 </div>
                                 <div className="text-center">
                                    <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Impact</div>
                                    <div className="text-sm font-black text-primary tabular-nums">{faq.usage_count || 0}</div>
                                 </div>
                              </div>
                              <div className="flex gap-2">
                                 <Button variant="outline" size="icon" onClick={() => handleEditFAQ(faq)} className="h-12 w-12 rounded-2xl border-border">
                                    <Pencil className="w-4 h-4" />
                                 </Button>
                                 <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => faqDeleteConfirm === faq.id ? handleDeleteFAQ(faq.id) : setFaqDeleteConfirm(faq.id)} 
                                    className={`h-12 w-12 rounded-2xl border-border transition-all ${faqDeleteConfirm === faq.id ? 'bg-red-500 border-transparent text-white' : 'hover:bg-red-500/10 hover:text-red-500'}`}
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </Button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
                </>
              )}
            </div>

            {/* FAQ Stats Footer */}
            <div className="p-6 border-t border-border bg-secondary/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                  <span className="text-foreground">{faqs.filter(f => f.status === 'active').length}</span> Articles Published
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                  <span className="text-foreground">{faqs.filter(f => f.status === 'inactive').length}</span> In Draft Mode
                </div>
                <div className="flex items-center gap-2 text-[10px] text-primary uppercase tracking-widest font-black">
                  <span className="font-black">{faqs.reduce((sum, f) => sum + (f.usage_count || 0), 0)}</span> Total Resolutions
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-40">System knowledge base is synchronized across all user touchpoints.</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSupportHub;
