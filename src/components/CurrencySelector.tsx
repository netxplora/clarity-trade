import { useStore } from '../store/useStore';
import { DollarSign, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
];

export function CurrencySelector() {
  const { displayCurrency, setCurrency } = useStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 border-border/50 hover:bg-primary/5 rounded-full transition-all">
          <span className="text-base text-muted-foreground">
            {currencies.find(c => c.code === displayCurrency)?.flag || '🇺🇸'}
          </span>
          <span className="text-xs font-bold text-foreground">
            {displayCurrency}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl bg-card border-border shadow-huge animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
        <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 mb-1">
          Select Currency
        </div>
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr.code)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-all-scroll transition-colors ${
              displayCurrency === curr.code ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{curr.flag}</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">{curr.code}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{curr.name}</span>
              </div>
            </div>
            {displayCurrency === curr.code && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
