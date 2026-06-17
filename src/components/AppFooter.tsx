import { Link } from "@tanstack/react-router";
import { Phone, Globe, Building2 } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-card/50">
      <div className="mx-auto max-w-xl space-y-3 px-5 py-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="font-semibold">Compass Real Estate</span>
        </div>
        <p className="italic text-foreground/80">„Когато посоката е вярна...!"</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          <a href="tel:0893366051" className="inline-flex items-center gap-1.5 hover:text-foreground">
            <Phone className="h-3.5 w-3.5" />0893 366 051
          </a>
          <a
            href="https://compassrealestate.bg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <Globe className="h-3.5 w-3.5" />compassrealestate.bg
          </a>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs">
          <Link to="/privacy" className="hover:text-foreground">Политика на поверителност</Link>
          <Link to="/help" className="hover:text-foreground">Помощ</Link>
        </div>
        <p className="pt-1 text-[11px] text-muted-foreground/70">
          © {new Date().getFullYear()} REMI AI — Real Estate Market Intelligence
        </p>
      </div>
    </footer>
  );
}
