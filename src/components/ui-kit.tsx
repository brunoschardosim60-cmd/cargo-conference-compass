import { cn } from "@/lib/utils";
import { Search, Inbox, Unplug } from "lucide-react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, actions, children, className, flush }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cn("rounded-md border bg-card", className)}>
      {title && (
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {actions}
        </header>
      )}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

export function SearchBox({ placeholder, value, onChange }: { placeholder: string; value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="relative min-w-56 flex-1">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
      />
    </div>
  );
}

export function FilterSelect({ label, options, value, onChange }: { label: string; options: [string, string][]; value?: string; onChange?: (v: string) => void }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="h-9 rounded-md border border-input bg-card px-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30"
    >
      <option value="">{label}: todos</option>
      {options.map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}

export function DataTable({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/60 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-2.5 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:px-4 [&_td]:py-2.5 [&_tr]:border-b [&_tr:last-child]:border-0 [&_tr:hover]:bg-muted/40">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <Inbox className="size-8 text-muted-foreground/60" />
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function NotConnected({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-dashed border-warning/50 bg-warning-soft px-3.5 py-2.5 text-sm text-foreground">
      <Unplug className="mt-0.5 size-4 shrink-0 text-warning" />
      <div>{children}</div>
    </div>
  );
}

export function Btn({ variant = "default", className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" }) {
  const v = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-card hover:bg-muted",
    ghost: "hover:bg-muted",
  }[variant];
  return <button {...p} className={cn("inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-sm font-medium transition-colors disabled:opacity-50", v, className)} />;
}

export function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[13px]">{children}</span>;
}
