import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, ClipboardCheck, FileText, AlertTriangle, PackageSearch, Siren,
  History, Users, Settings, Search, Menu, X, Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups = [
  { label: "Operação", items: [
    { to: "/", label: "Início", icon: LayoutDashboard },
    { to: "/conferencias", label: "Operações", icon: ClipboardCheck },
    { to: "/notas", label: "Notas fiscais", icon: FileText },
  ] },
  { label: "Tratativas", items: [
    { to: "/pendencias", label: "Pendências e faltas", icon: AlertTriangle },
    { to: "/ocorrencias", label: "Ocorrências", icon: Siren },
    { to: "/extraviados", label: "Extraviados", icon: PackageSearch },
  ] },
  { label: "Sistema", items: [
    { to: "/historico", label: "Histórico", icon: History },
    { to: "/usuarios", label: "Usuários", icon: Users },
    { to: "/configuracoes", label: "Configurações", icon: Settings },
  ] },
] as const;

const titles: Record<string, string> = Object.fromEntries(groups.flatMap((g) => g.items.map((n) => [n.to, n.label])));

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path.startsWith("/campo")) return <>{children}</>;
  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
  const title = titles[path] ?? (path.startsWith("/conferencias/") ? "Operação" : "");

  const sidebar = (
    <aside className="flex h-full w-56 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-12 items-center gap-2 px-4">
        <span className="size-2 rounded-full bg-sidebar-primary" />
        <span className="text-sm font-semibold tracking-tight text-sidebar-accent-foreground">Conferência POA</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {groups.map((g) => (
          <div key={g.label} className="mt-4">
            <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted">{g.label}</div>
            {g.items.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                className={cn("flex h-8 items-center gap-2.5 rounded-sm px-2 text-[13px] transition-colors hover:bg-sidebar-accent",
                  isActive(n.to) && "bg-sidebar-accent font-medium text-sidebar-accent-foreground")}>
                <n.icon className={cn("size-4 shrink-0", isActive(n.to) ? "text-sidebar-primary" : "opacity-70")} />
                <span className="truncate">{n.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="space-y-2 border-t border-sidebar-border p-3">
        <Link to="/campo" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] hover:bg-sidebar-accent">
          <Smartphone className="size-4 opacity-70" />Tela do conferente
        </Link>
        <div className="px-2 text-[11px] text-sidebar-muted">Demonstração · dados fictícios</div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen w-full">
      <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-56">{sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b bg-card px-4 lg:px-6">
          <button className="rounded-sm p-1.5 hover:bg-muted lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className="text-sm"><span className="text-muted-foreground">Filial POA</span><span className="mx-2 text-border">/</span><span className="font-medium">{title}</span></div>
          <div className="relative ml-auto hidden w-full max-w-xs md:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Buscar NF, pedido ou placa" className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
          <div className="flex items-center gap-2 border-l pl-3 text-sm">
            <div className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">AP</div>
            <span className="hidden sm:inline">Ana P.</span>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
