import { useState, useEffect } from "react";
import { Globe } from "lucide-react";

// Add declaration for Weglot global
declare global {
  interface Window {
    Weglot: any;
  }
}

const LANGUAGES = [
  { code: "en", label: "Platform Default (English)", short: "EN" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "es", label: "Español", short: "ES" },
  { code: "de", label: "Deutsch", short: "DE" }
];

interface LanguageSwitcherProps {
  variant?: "default" | "transparent";
}

const LanguageSwitcher = ({ variant = "default" }: LanguageSwitcherProps) => {
  const [currentLang, setCurrentLang] = useState("en");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkWeglot = setInterval(() => {
      if (window.Weglot) {
        window.Weglot.on("languageChanged", (newLang: string) => {
          setCurrentLang(newLang);
        });
        
        const initialLang = window.Weglot.getCurrentLang() || "en";
        setCurrentLang(initialLang);
        clearInterval(checkWeglot);
      }
    }, 500);

    return () => clearInterval(checkWeglot);
  }, []);

  const switchLanguage = (code: string) => {
    if (window.Weglot) {
      window.Weglot.switchTo(code);
    }
    setCurrentLang(code);
    setIsOpen(false);
  };

  const currentLangData = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  const buttonClass = variant === "transparent" 
    ? "flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 hover:border-white/50 text-xs font-bold uppercase tracking-wider text-white transition-all bg-black/10 backdrop-blur-sm"
    : "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border hover:border-primary/50 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all";

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
        aria-label="Change Language"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{currentLangData.short}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-huge overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            <div className="py-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => switchLanguage(lang.code)}
                  className={`w-full text-left px-4 py-2 text-xs font-bold transition-all ${
                    currentLang === lang.code 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{lang.label}</span>
                    {currentLang === lang.code && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
