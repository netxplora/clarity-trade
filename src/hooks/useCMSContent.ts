import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface CMSContentItem {
  id: string;
  type: string;
  section: string;
  title: string;
  content_html: string;
  status: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

/**
 * useCMSContent — Hook for consuming published CMS content on any page.
 * 
 * Usage:
 *   const { items, isLoading } = useCMSContent({ section: 'homepage', type: 'page_section' });
 *   const { items: banners } = useCMSContent({ section: 'user_dashboard', type: 'banner' });
 */
export function useCMSContent(filters?: { section?: string; type?: string }) {
  const [items, setItems] = useState<CMSContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('platform_content')
        .select('*')
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false });

      if (filters?.section) {
        query = query.eq('section', filters.section);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        // Table may not exist yet — soft fail
        console.warn('CMS content fetch warning:', fetchError.message);
        setError(fetchError.message);
        setItems([]);
      } else {
        setItems(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load content');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.section, filters?.type]);

  useEffect(() => {
    fetchContent();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`cms-content-${filters?.section || 'all'}-${filters?.type || 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_content' }, () => {
        fetchContent();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchContent]);

  return { items, isLoading, error, refetch: fetchContent };
}

/**
 * useCMSBanners — Get active banner content for a specific section.
 */
export function useCMSBanners(section: string) {
  return useCMSContent({ section, type: 'banner' });
}

/**
 * useCMSAnnouncements — Get global announcements from notifications table.
 */
export function useCMSAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'GLOBAL')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      setAnnouncements(data || []);
      setIsLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('cms-global-announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: 'type=eq.GLOBAL' }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { announcements, isLoading };
}
