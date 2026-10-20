import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function CampoFrame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-screen max-w-[480px] bg-card">{children}</div>;
}

export function CampoTop({ back, onBack, title, sub, right }: { back?: string; onBack?: () => void; title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-primary text-primary-foreground">
      <div className="grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 px-2">
        {back ? (
          <Link to={back} onClick={(e) => { if (onBack) { e.preventDefault(); onBack(); } }} className="grid size-11 place-items-center rounded-md hover:bg-primary-foreground/10" aria-label="Voltar">
            <ChevronLeft className="size-5" />
          </Link>
        ) : <span className="w-2" />}
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold">{title}</div>
          {sub && <div className="truncate text-xs opacity-75">{sub}</div>}
        </div>
        <div className="pr-1">{right}</div>
      </div>
    </header>
  );
}

export function DemoTag() {
  return <span className="rounded-sm border border-primary-foreground/30 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider opacity-80">Demo</span>;
}

export function Progress({ value, tone = "bg-primary" }: { value: number; tone?: string }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
