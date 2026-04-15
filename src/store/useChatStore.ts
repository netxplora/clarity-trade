import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface ChatConversation {
  id: string;
  user_id: string;
  admin_id: string | null;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  // Joined fields for admin view
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  user_kyc?: string;
  user_status?: string;
  unread_count?: number;
  last_message?: string;
  last_message_at?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'user' | 'admin';
  message: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SupportFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  status: 'active' | 'inactive';
  priority: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface ChatState {
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  messages: ChatMessage[];
  faqs: SupportFAQ[];
  isLoading: boolean;
  isSending: boolean;
  chatOpen: boolean;
  unreadCount: number;

  setChatOpen: (open: boolean) => void;
  fetchUserConversation: (userId: string) => Promise<ChatConversation | null>;
  createConversation: (userId: string, subject?: string) => Promise<ChatConversation | null>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, senderId: string, senderRole: 'user' | 'admin', message: string) => Promise<void>;
  markMessagesRead: (conversationId: string, role: 'user' | 'admin') => Promise<void>;
  
  // FAQ
  fetchFAQs: (activeOnly?: boolean) => Promise<void>;
  createFAQ: (faq: Partial<SupportFAQ>) => Promise<void>;
  updateFAQ: (id: string, updates: Partial<SupportFAQ>) => Promise<void>;
  deleteFAQ: (id: string) => Promise<void>;
  incrementFAQUsage: (id: string) => Promise<void>;

  // Admin-only
  fetchAllConversations: () => Promise<void>;
  setActiveConversation: (conv: ChatConversation | null) => void;
  updateConversationStatus: (convId: string, status: string) => Promise<void>;
  assignConversation: (convId: string, adminId: string) => Promise<void>;
  deleteConversation: (convId: string) => Promise<void>;
  
  // Realtime
  subscribeToMessages: (conversationId: string) => () => void;
  subscribeToConversations: () => () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  faqs: [],
  isLoading: false,
  isSending: false,
  chatOpen: false,
  unreadCount: 0,

  setChatOpen: (open) => set({ chatOpen: open }),

  // User: fetch existing open/pending conversation
  fetchUserConversation: async (userId: string) => {
    const { data } = await supabase
      .from('support_conversations')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['open', 'pending'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      set({ activeConversation: data });
      // Count unread messages from admin
      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', data.id)
        .eq('sender_role', 'admin')
        .eq('is_read', false);
      set({ unreadCount: count || 0 });
    }
    return data;
  },

  createConversation: async (userId: string, subject = 'General Support') => {
    const { data, error } = await supabase
      .from('support_conversations')
      .insert({ user_id: userId, subject, status: 'open' })
      .select()
      .single();
    
    if (error) { console.error('Create conversation error:', error); return null; }
    set({ activeConversation: data });
    return data;
  },

  fetchMessages: async (conversationId: string) => {
    set({ isLoading: true });
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    set({ messages: data || [], isLoading: false });
  },

  sendMessage: async (conversationId, senderId, senderRole, message) => {
    set({ isSending: true });
    const { error } = await supabase.from('support_messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      sender_role: senderRole,
      message,
    });
    if (error) console.error('Send message error:', error);
    set({ isSending: false });
  },

  markMessagesRead: async (conversationId, role) => {
    const oppositeRole = role === 'user' ? 'admin' : 'user';
    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('sender_role', oppositeRole)
      .eq('is_read', false);
    
    // Update local state
    set(state => ({
      messages: state.messages.map(m =>
        m.conversation_id === conversationId && m.sender_role === oppositeRole
          ? { ...m, is_read: true }
          : m
      ),
      unreadCount: role === 'user' ? 0 : state.unreadCount
    }));
  },

  // Admin: fetch all conversations with user info
  fetchAllConversations: async () => {
    set({ isLoading: true });
    const { data: convos } = await supabase
      .from('support_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!convos) { set({ isLoading: false }); return; }

    // Enrich with user profile info and unread counts
    const userIds = [...new Set(convos.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, kyc, status')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // Get last message for each conversation
    const enriched: ChatConversation[] = [];
    for (const conv of convos) {
      const profile = profileMap.get(conv.user_id);

      // Last message
      const { data: lastMsg } = await supabase
        .from('support_messages')
        .select('message, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Unread count (messages from user that admin hasn't read)
      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('sender_role', 'user')
        .eq('is_read', false);

      enriched.push({
        ...conv,
        user_name: profile?.name || 'Unknown User',
        user_email: profile?.email || '',
        user_avatar: profile?.avatar_url || '',
        user_kyc: profile?.kyc || 'None',
        user_status: profile?.status || 'Unknown',
        unread_count: count || 0,
        last_message: lastMsg?.message || '',
        last_message_at: lastMsg?.created_at || conv.created_at
      });
    }

    set({ conversations: enriched, isLoading: false });
  },

  setActiveConversation: (conv) => set({ activeConversation: conv }),

  updateConversationStatus: async (convId, status) => {
    const updateData: any = { status };
    if (status === 'closed' || status === 'resolved') {
      updateData.closed_at = new Date().toISOString();
    }
    await supabase.from('support_conversations').update(updateData).eq('id', convId);
    set(state => ({
      conversations: state.conversations.map(c => c.id === convId ? { ...c, ...updateData } : c),
      activeConversation: state.activeConversation?.id === convId
        ? { ...state.activeConversation, ...updateData }
        : state.activeConversation
    }));
  },

  assignConversation: async (convId, adminId) => {
    await supabase.from('support_conversations').update({ admin_id: adminId, status: 'pending' }).eq('id', convId);
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === convId ? { ...c, admin_id: adminId, status: 'pending' } : c
      ),
      activeConversation: state.activeConversation?.id === convId
        ? { ...state.activeConversation, admin_id: adminId, status: 'pending' as const }
        : state.activeConversation
    }));
  },

  deleteConversation: async (convId) => {
    await supabase.from('support_messages').delete().eq('conversation_id', convId);
    await supabase.from('support_conversations').delete().eq('id', convId);
    set(state => ({
      conversations: state.conversations.filter(c => c.id !== convId),
      activeConversation: state.activeConversation?.id === convId ? null : state.activeConversation,
      messages: state.activeConversation?.id === convId ? [] : state.messages
    }));
  },

  // Realtime subscription for messages in a conversation
  subscribeToMessages: (conversationId: string) => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        set(state => {
          const exists = state.messages.some(m => m.id === newMsg.id);
          if (exists) return state;
          return {
            messages: [...state.messages, newMsg],
            unreadCount: newMsg.sender_role === 'admin' ? state.unreadCount + 1 : state.unreadCount
          };
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const updated = payload.new as ChatMessage;
        set(state => ({
          messages: state.messages.map(m => m.id === updated.id ? updated : m)
        }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  // Admin: realtime subscription for new conversations
  subscribeToConversations: () => {
    const channel = supabase
      .channel('admin-conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_conversations',
      }, () => {
        // Refetch all conversations on any change
        get().fetchAllConversations();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
      }, () => {
        // Refresh conversations to update last message & unread counts
        get().fetchAllConversations();
        // If a conversation is active, refresh its messages too
        const active = get().activeConversation;
        if (active) get().fetchMessages(active.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  // FAQ Methods
  fetchFAQs: async (activeOnly = true) => {
    let query = supabase.from('support_faqs').select('*').order('priority', { ascending: false });
    if (activeOnly) query = query.eq('status', 'active');
    const { data } = await query;
    set({ faqs: data || [] });
  },

  createFAQ: async (faq) => {
    const { data, error } = await supabase.from('support_faqs').insert(faq).select().single();
    if (error) throw error;
    if (data) {
      set(state => ({ faqs: [...state.faqs, data].sort((a, b) => b.priority - a.priority) }));
    }
  },

  updateFAQ: async (id, updates) => {
    const { error } = await supabase.from('support_faqs').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    set(state => ({
      faqs: state.faqs.map(f => f.id === id ? { ...f, ...updates } : f).sort((a, b) => b.priority - a.priority)
    }));
  },

  deleteFAQ: async (id) => {
    const { error } = await supabase.from('support_faqs').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ faqs: state.faqs.filter(f => f.id !== id) }));
  },

  incrementFAQUsage: async (id) => {
    const faq = get().faqs.find(f => f.id === id);
    if (faq) {
      const newCount = (faq.usage_count || 0) + 1;
      await supabase.from('support_faqs').update({ usage_count: newCount }).eq('id', id);
      set(state => ({
        faqs: state.faqs.map(f => f.id === id ? { ...f, usage_count: newCount } : f)
      }));
    }
  }
}));
