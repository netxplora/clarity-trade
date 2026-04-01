import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative w-10 h-10 rounded-lg border bg-secondary border-border hover:bg-secondary/80 transition-all group"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-muted-foreground group-hover:text-foreground" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-muted-foreground group-hover:text-foreground" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border shadow-huge rounded-xl p-1.5 min-w-[120px]">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${theme === 'light' ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${theme === 'dark' ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${theme === 'system' ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
