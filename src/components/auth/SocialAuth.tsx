import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";

const SocialAuth = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    setLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(`Error connecting to ${provider}: ${error.message}`);
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 w-full mt-8">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-4 text-muted-foreground font-bold tracking-widest">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Button
          variant="outline"
          disabled={!!loading}
          onClick={() => handleSocialLogin('google')}
          className="h-12 rounded-xl border-border bg-white hover:bg-secondary hover:border-primary/20 transition-all group"
        >
          {loading === 'google' ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
          )}
        </Button>

        <Button
          variant="outline"
          disabled={!!loading}
          onClick={() => handleSocialLogin('apple')}
          className="h-12 rounded-xl border-border bg-white hover:bg-secondary hover:border-primary/20 transition-all group"
        >
          {loading === 'apple' ? (
            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform fill-slate-900" viewBox="0 0 384 512">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
          )}
        </Button>

        <Button
          variant="outline"
          disabled={!!loading}
          onClick={() => handleSocialLogin('facebook')}
          className="h-12 rounded-xl border-border bg-white hover:bg-secondary hover:border-primary/20 transition-all group"
        >
          {loading === 'facebook' ? (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SocialAuth;
