import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useChatStore, ChatConversation, SupportFAQ } from '@/store/useChatStore';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
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

const FAQ_CATEGORIES = ['Deposits', 'Withdrawals', 'KYC', 'Copy Trading', 'Account Issues', 'Technical Support', 'General'];

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
      <div className="h-[calc(100vh-7rem)] flex flex-col">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Support Hub</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeTab === 'conversations'
                  ? <>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}{totalUnread > 0 && <span className="text-primary font-bold"> · {totalUnread} unread</span>}</>
                  : <>{faqs.length} FAQ entr{faqs.length !== 1 ? 'ies' : 'y'}</>
                }
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-secondary rounded-xl p-1 border border-border">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'conversations' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Conversations
                {totalUnread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center">{totalUnread}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('faqs')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'faqs' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                FAQ Management
              </button>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => { fetchAllConversations(); fetchFAQs(false); }} className="gap-2 text-xs font-bold">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* ========== CONVERSATIONS VIEW ========== */}
        {activeTab === 'conversations' && (
          <div className="flex-1 grid grid-cols-12 gap-0 border border-border rounded-2xl overflow-hidden bg-card min-h-0">
            {/* LEFT PANEL — Conversation List */}
            <div className="col-span-3 border-r border-border flex flex-col min-h-0">
              <div className="p-3 border-b border-border space-y-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search conversations..." className="h-9 pl-9 text-xs bg-secondary border-border rounded-lg" />
                </div>
                <div className="flex gap-1">
                  {['all', 'open', 'pending', 'resolved', 'closed'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} className={`flex-1 px-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${statusFilter === s ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-secondary border border-transparent'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {isLoading && conversations.length === 0 ? (
                  <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
                ) : filteredConvos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/20 mb-3" />
                    <p className="text-xs font-bold text-muted-foreground">No conversations found</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{searchQuery ? 'Try a different search term' : 'Waiting for user messages'}</p>
                  </div>
                ) : (
                  filteredConvos.map(conv => {
                    const isActive = activeConversation?.id === conv.id;
                    const StatusIcon = STATUS_ICONS[conv.status] || CircleDot;
                    return (
                      <button key={conv.id} onClick={() => setActiveConversation(conv)} className={`w-full text-left p-4 border-b border-border/50 transition-all hover:bg-secondary/50 ${isActive ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 text-xs font-bold text-foreground overflow-hidden">
                            {conv.user_avatar ? <img src={conv.user_avatar} className="w-full h-full object-cover" /> : conv.user_name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-foreground truncate">{conv.user_name}</span>
                              <span className="text-[9px] text-muted-foreground shrink-0">{formatTime(conv.last_message_at || conv.updated_at)}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{conv.last_message || 'No messages yet'}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${STATUS_COLORS[conv.status]}`}>
                                <StatusIcon className="w-2.5 h-2.5" />{conv.status}
                              </span>
                              {(conv.unread_count || 0) > 0 && <span className="w-4.5 h-4.5 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center">{conv.unread_count}</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* CENTER PANEL — Chat */}
            <div className="col-span-6 flex flex-col min-h-0">
              {activeConversation ? (
                <>
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-secondary/20 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
                        {activeConversation.user_avatar ? <img src={activeConversation.user_avatar} className="w-full h-full object-cover" /> : activeConversation.user_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{activeConversation.user_name}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{activeConversation.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button onClick={() => setShowStatusMenu(!showStatusMenu)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${STATUS_COLORS[activeConversation.status]}`}>
                          {activeConversation.status}<ChevronDown className="w-3 h-3" />
                        </button>
                        {showStatusMenu && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
                            <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-xl shadow-lg z-50 p-1.5">
                              {['open', 'pending', 'resolved', 'closed'].map(s => (
                                <button key={s} onClick={() => { updateConversationStatus(activeConversation.id, s); setShowStatusMenu(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold capitalize hover:bg-secondary transition-colors">{s}</button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      {!activeConversation.admin_id && (
                        <Button variant="outline" size="sm" onClick={() => user?.id && assignConversation(activeConversation.id, user.id)} className="text-[10px] font-bold uppercase tracking-wider h-8 px-3">
                          <UserCheck className="w-3.5 h-3.5 mr-1" /> Assign to Me
                        </Button>
                      )}
                      <button onClick={() => setShowDeleteConfirm(activeConversation.id)} className="w-8 h-8 rounded-lg bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {showDeleteConfirm === activeConversation.id && (
                    <div className="px-5 py-3 bg-red-500/5 border-b border-red-500/10 flex items-center justify-between shrink-0">
                      <p className="text-xs text-red-600 font-bold">Delete this conversation permanently?</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(null)} className="h-7 text-[10px]">Cancel</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(activeConversation.id)} className="h-7 text-[10px]">Delete</Button>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {messages.map((msg) => {
                      const isAdmin = msg.sender_role === 'admin';
                      return (
                        <div key={msg.id} className={`flex gap-2.5 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          {!isAdmin && (
                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold overflow-hidden">
                              {activeConversation.user_avatar ? <img src={activeConversation.user_avatar} className="w-full h-full object-cover" /> : activeConversation.user_name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${isAdmin ? 'bg-primary text-white rounded-br-md' : 'bg-card border border-border rounded-bl-md text-foreground'}`}>
                            <div className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${isAdmin ? 'text-white/60' : 'text-muted-foreground'}`}>{isAdmin ? 'Admin' : 'User'}</div>
                            <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-[9px] ${isAdmin ? 'text-white/50' : 'text-muted-foreground'}`}>{formatFullTime(msg.created_at)}</span>
                              {isAdmin && (msg.is_read ? <CheckCheck className="w-3 h-3 text-white/80" /> : <Check className="w-3 h-3 text-white/50" />)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="shrink-0 border-t border-border bg-card p-4">
                    {activeConversation.status === 'closed' ? (
                      <div className="text-center py-2">
                        <p className="text-xs text-muted-foreground">This conversation is closed.</p>
                        <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => updateConversationStatus(activeConversation.id, 'open')}>Reopen Conversation</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your reply..." className="h-10 text-sm bg-secondary border-border rounded-xl" />
                        <Button onClick={handleSend} disabled={!inputValue.trim() || isSending} className="h-10 w-10 rounded-xl shrink-0 p-0">
                          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center mb-4 border border-border/50">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">Select a Conversation</h3>
                  <p className="text-xs text-muted-foreground max-w-[260px]">Choose a conversation from the left panel to view messages and respond to users.</p>
                </div>
              )}
            </div>

            {/* RIGHT PANEL — User Info */}
            <div className="col-span-3 border-l border-border flex flex-col min-h-0 overflow-y-auto">
              {activeConversation ? (
                <div className="p-5 space-y-5">
                  <div className="flex flex-col items-center text-center pt-4 pb-6 border-b border-border">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-foreground mb-3 overflow-hidden">
                      {activeConversation.user_avatar ? <img src={activeConversation.user_avatar} className="w-full h-full object-cover" /> : activeConversation.user_name?.charAt(0) || 'U'}
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{activeConversation.user_name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{activeConversation.user_email}</p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account Details</h4>
                    {[
                      { icon: User, label: 'Account ID', value: String(activeConversation.user_id).substring(0, 12) + '...', mono: true },
                      { icon: ShieldCheck, label: 'KYC Status', value: activeConversation.user_kyc || 'Not Verified', color: (activeConversation.user_kyc === 'Verified' || activeConversation.user_kyc === 'Approved') ? 'text-green-600' : 'text-amber-600' },
                      { icon: Mail, label: 'Email', value: activeConversation.user_email },
                      { icon: Calendar, label: 'Conversation Started', value: new Date(activeConversation.created_at).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }) },
                      { icon: CircleDot, label: 'Account Status', value: activeConversation.user_status || 'Unknown', color: activeConversation.user_status === 'Active' ? 'text-green-600' : 'text-red-600' },
                    ].map(({ icon: Icon, label, value, color, mono }) => (
                      <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{label}</div>
                          <div className={`text-[11px] font-bold mt-0.5 ${color || 'text-foreground'} ${mono ? 'font-mono' : ''} truncate max-w-[160px]`}>{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-3 border-t border-border">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Conversation Info</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-secondary/30 border border-border text-center">
                        <div className="text-lg font-black text-foreground">{messages.length}</div>
                        <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Messages</div>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/30 border border-border text-center">
                        <div className="text-lg font-black text-foreground capitalize">{activeConversation.priority}</div>
                        <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Priority</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-3 border-t border-border">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quick Actions</h4>
                    {activeConversation.status !== 'resolved' && <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs font-bold h-9" onClick={() => updateConversationStatus(activeConversation.id, 'resolved')}><CircleCheck className="w-3.5 h-3.5 text-blue-500" /> Mark as Resolved</Button>}
                    {activeConversation.status !== 'closed' && <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs font-bold h-9" onClick={() => updateConversationStatus(activeConversation.id, 'closed')}><Archive className="w-3.5 h-3.5 text-zinc-500" /> Close Conversation</Button>}
                    {(activeConversation.status === 'closed' || activeConversation.status === 'resolved') && <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs font-bold h-9" onClick={() => updateConversationStatus(activeConversation.id, 'open')}><RefreshCw className="w-3.5 h-3.5 text-green-500" /> Reopen</Button>}
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs font-bold h-9 text-red-500 hover:text-red-600 hover:bg-red-500/5" onClick={() => setShowDeleteConfirm(activeConversation.id)}><Trash2 className="w-3.5 h-3.5" /> Delete Conversation</Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <User className="w-8 h-8 text-muted-foreground/20 mb-3" />
                  <p className="text-xs font-bold text-muted-foreground">User Info</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Select a conversation to view user details</p>
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

            {/* FAQ Table */}
            <div className="flex-1 overflow-y-auto">
              {filteredFAQs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <HelpCircle className="w-10 h-10 text-muted-foreground/20 mb-4" />
                  <p className="text-sm font-bold text-muted-foreground">No FAQs found</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Create your first FAQ to enable auto-responses in the live chat.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-secondary/30 border-b border-border z-10">
                    <tr>
                      <th className="text-left px-5 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Question</th>
                      <th className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest w-[130px]">Category</th>
                      <th className="text-center px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest w-[70px]">Priority</th>
                      <th className="text-center px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest w-[70px]">Used</th>
                      <th className="text-center px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest w-[80px]">Status</th>
                      <th className="text-right px-5 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest w-[120px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFAQs.map(faq => (
                      <tr key={faq.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="text-xs font-bold text-foreground leading-relaxed">{faq.question}</div>
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{faq.answer}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 border border-border text-[9px] font-bold text-foreground">
                            <Tag className="w-2.5 h-2.5 text-muted-foreground" />{faq.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground">
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />{faq.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground">
                            <BarChart3 className="w-3 h-3 text-muted-foreground" />{faq.usage_count || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => handleToggleFAQStatus(faq)} className="group/toggle">
                            {faq.status === 'active'
                              ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 text-green-600 text-[9px] font-bold border border-green-500/20"><ToggleRight className="w-3 h-3" />Active</span>
                              : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-500/10 text-zinc-500 text-[9px] font-bold border border-zinc-500/20"><ToggleLeft className="w-3 h-3" />Inactive</span>
                            }
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditFAQ(faq)} className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 transition-all" title="Edit">
                              <Pencil className="w-3 h-3 text-muted-foreground" />
                            </button>
                            {faqDeleteConfirm === faq.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleDeleteFAQ(faq.id)} className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center text-[9px] font-bold">✓</button>
                                <button onClick={() => setFaqDeleteConfirm(null)} className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-[9px] font-bold">✕</button>
                              </div>
                            ) : (
                              <button onClick={() => setFaqDeleteConfirm(faq.id)} className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/20 transition-all" title="Delete">
                                <Trash2 className="w-3 h-3 text-muted-foreground" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* FAQ Stats Footer */}
            <div className="p-4 border-t border-border bg-secondary/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{faqs.filter(f => f.status === 'active').length}</span> active
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{faqs.filter(f => f.status === 'inactive').length}</span> inactive
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{faqs.reduce((sum, f) => sum + (f.usage_count || 0), 0)}</span> total uses
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">Active FAQs will be shown to users automatically in the live chat widget.</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSupportHub;
