import { Volume2, VolumeX } from "lucide-react";
import { useSoundStore } from "@/store/useSoundStore";

interface SoundToggleProps {
  className?: string;
  variant?: 'navbar' | 'dashboard';
}

export function SoundToggle({ className = "", variant = 'dashboard' }: SoundToggleProps) {
  const { isMuted, toggleMute } = useSoundStore();

  if (variant === 'navbar') {
    return (
      <button 
        onClick={toggleMute}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${className} ${
          isMuted 
          ? "bg-gray-100 text-gray-400 hover:bg-gray-200" 
          : "bg-blue-50 text-blue-600 hover:bg-blue-100"
        }`}
        title={isMuted ? "Enable Sounds" : "Mute Sounds"}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <button
      onClick={toggleMute}
      className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${className} ${
        isMuted
          ? "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
          : "bg-secondary text-primary border-primary/20 hover:bg-secondary/80"
      }`}
      title={isMuted ? "Enable Sounds" : "Mute Sounds"}
    >
      {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
    </button>
  );
}
