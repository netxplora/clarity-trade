import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Send, CheckCheck, Check, HelpCircle, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useChatStore, SupportFAQ } from '@/store/useChatStore';
import { Button } from '@/components/ui/button';

// Map route paths to relevant FAQ categories for smart suggestions
const ROUTE_CATEGORY_MAP: Record<string, string[]> = {
  '/dashboard/wallet': ['Deposits', 'Withdrawals'],
  '/dashboard/trading': ['Copy Trading', 'General'],
  '/dashboard/copy-trading': ['Copy Trading'],
  '/dashboard/kyc': ['KYC'],
  '/dashboard/settings': ['Account Issues'],
  '/dashboard/analytics': ['General'],
};

const LiveChatWidget = () => {
  const user = useStore(state => state.user);
  const location = useLocation();
  const {
    chatOpen, setChatOpen,
    activeConversation, messages, faqs, isLoading, isSending, unreadCount,
    fetchUserConversation, createConversation, fetchMessages, fetchFAQs,
    sendMessage, markMessagesRead, subscribeToMessages, incrementFAQUsage
  } = useChatStore();

  const [inputValue, setInputValue] = useState('');
  const [showFAQ, setShowFAQ] = useState(true);
  const [faqCategory, setFaqCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Fetch FAQs on mount
  useEffect(() => {
    fetchFAQs(true);
  }, []);

  // Smart category selection based on current route
  useEffect(() => {
    const path = location.pathname;
    for (const [route, categories] of Object.entries(ROUTE_CATEGORY_MAP)) {
      if (path.startsWith(route)) {
        setFaqCategory(categories[0]);
        return;
      }
    }
    setFaqCategory(null);
  }, [location.pathname]);

  // Initialize conversation on open
  useEffect(() => {
    if (chatOpen && user?.id) {
      (async () => {
        const existing = await fetchUserConversation(user.id);
        if (existing) {
          await fetchMessages(existing.id);
          await markMessagesRead(existing.id, 'user');
          setShowFAQ(false);
        } else {
          setShowFAQ(true);
        }
      })();
    }
  }, [chatOpen, user?.id]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (activeConversation?.id) {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = subscribeToMessages(activeConversation.id);
    }
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [activeConversation?.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages read when window is open and messages change
  useEffect(() => {
    if (chatOpen && activeConversation?.id) {
      markMessagesRead(activeConversation.id, 'user');
    }
  }, [chatOpen, messages.length]);

  const handleSend = async () => {
    if (!inputValue.trim() || !user?.id) return;
    const msg = inputValue.trim();
    setInputValue('');

    let convId = activeConversation?.id;
    if (!convId) {
      const conv = await createConversation(user.id, 'Support Request');
      if (!conv) return;
      convId = conv.id;
      setShowFAQ(false);
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = subscribeToMessages(convId);
    }

    await sendMessage(convId, user.id, 'user', msg);
  };

  const handleFAQClick = async (faq: SupportFAQ) => {
    if (!user?.id) return;

    // Track usage
    incrementFAQUsage(faq.id);

    // Create or reuse conversation
    const conv = activeConversation || await createConversation(user.id, faq.category || 'FAQ');
    if (!conv) return;
    setShowFAQ(false);

    if (!activeConversation) {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = subscribeToMessages(conv.id);
    }

    // Send the user's question
    await sendMessage(conv.id, user.id, 'user', faq.question);

    // Auto-respond with the FAQ answer after a short delay to feel natural
    setTimeout(async () => {
      // We insert the auto-response as an "admin" message so it appears on the left
      // using the system (we use the user's own ID but with admin role for the auto-reply)
      const { data: adminProfile } = await (await import('@/lib/supabase')).supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      const responderId = adminProfile?.id || user.id;
      await sendMessage(conv.id, responderId, 'admin', faq.answer + '\n\nIf you need further assistance, feel free to continue this conversation.');
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Sort FAQs: prioritize route-relevant categories, then by priority
  const sortedFAQs = [...faqs].sort((a, b) => {
    if (faqCategory) {
      const aMatch = a.category === faqCategory ? 1 : 0;
      const bMatch = b.category === faqCategory ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
    }
    return b.priority - a.priority;
  });

  // Get unique categories from FAQs
  const categories = [...new Set(faqs.map(f => f.category))];

  const isSupportHub = location.pathname.startsWith('/admin/support');

  if (!user || isSupportHub) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
          aria-label="Open support chat"
        >
          <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-primary text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-none">Live Support</h3>
                <p className="text-[10px] font-medium text-white/70 mt-0.5 uppercase tracking-wider">
                  {activeConversation ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Online
                    </span>
                  ) : 'Start a conversation'}
                </p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-secondary/20">
            {/* Welcome message */}
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%] shadow-sm">
                <p className="text-xs text-foreground leading-relaxed">
                  Welcome to Clarity Trade Support. How can we help you today?
                </p>
                <span className="text-[9px] text-muted-foreground mt-1 block">Support Team</span>
              </div>
            </div>

            {/* FAQ Suggestions from Database */}
            {showFAQ && messages.length === 0 && (
              <div className="space-y-2 pl-9">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  Common Questions
                  {faqCategory && <span className="text-primary ml-1">· {faqCategory}</span>}
                </p>

                {/* Category filter pills */}
                {categories.length > 1 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    <button
                      onClick={() => setFaqCategory(null)}
                      className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
                        !faqCategory ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary/50 text-muted-foreground border border-transparent hover:bg-secondary'
                      }`}
                    >
                      All
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFaqCategory(cat)}
                        className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
                          faqCategory === cat ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary/50 text-muted-foreground border border-transparent hover:bg-secondary'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-1.5 max-h-[250px] overflow-y-auto">
                  {(faqCategory ? sortedFAQs.filter(f => f.category === faqCategory) : sortedFAQs).slice(0, 8).map((faq) => (
                    <button
                      key={faq.id}
                      onClick={() => handleFAQClick(faq)}
                      className="text-left px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all group flex items-center gap-2"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      <span className="flex-1 leading-relaxed">{faq.question}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => { setShowFAQ(false); inputRef.current?.focus(); }}
                    className="text-left px-3.5 py-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs font-bold text-primary hover:bg-primary/10 transition-all flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    Other — Type your message
                  </button>
                </div>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => {
              const isUser = msg.sender_role === 'user';
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    isUser
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-card border border-border rounded-bl-md text-foreground'
                  }`}>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-[9px] ${isUser ? 'text-white/60' : 'text-muted-foreground'}`}>
                        {formatTime(msg.created_at)}
                      </span>
                      {isUser && (
                        msg.is_read
                          ? <CheckCheck className="w-3 h-3 text-white/80" />
                          : <Check className="w-3 h-3 text-white/50" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="shrink-0 border-t border-border bg-card p-3">
            {activeConversation?.status === 'closed' || activeConversation?.status === 'resolved' ? (
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground">This conversation has been {activeConversation.status}.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={async () => {
                    if (user?.id) {
                      const conv = await createConversation(user.id, 'New Support Request');
                      if (conv) {
                        setShowFAQ(true);
                        if (unsubRef.current) unsubRef.current();
                        unsubRef.current = subscribeToMessages(conv.id);
                      }
                    }
                  }}
                >
                  Start New Conversation
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 h-10 px-4 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isSending}
                  className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LiveChatWidget;
