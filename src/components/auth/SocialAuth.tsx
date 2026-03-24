import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Provider = "google" | "facebook";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function SocialAuth({ mode = "login" }: { mode?: "login" | "register" }) {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

  const handleOAuthSignIn = async (provider: Provider) => {
    setLoadingProvider(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoadingProvider(null);
      }
      // If successful, the browser redirects to the OAuth provider automatically.
    } catch (err: any) {
      toast.error(err.message || `Failed to sign in with ${provider}`);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          or continue with
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuthSignIn("google")}
          disabled={loadingProvider !== null}
          className="flex items-center justify-center gap-2.5 h-12 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingProvider === "google" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              Google
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleOAuthSignIn("facebook")}
          disabled={loadingProvider !== null}
          className="flex items-center justify-center gap-2.5 h-12 bg-[#1877F2] border border-[#1877F2] rounded-xl text-sm font-semibold text-white hover:bg-[#166FE5] hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingProvider === "facebook" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <FacebookIcon />
              Facebook
            </>
          )}
        </button>
      </div>

      <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
        By continuing with a social account, you agree to our{" "}
        <a href="/terms-of-service" className="text-primary hover:underline">Terms</a>{" "}
        and{" "}
        <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>.
      </p>
    </div>
  );
}
