import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, ClipboardCheck, FileText, AlertTriangle, PackageSearch, Siren,
  History, Users, Settings, Search, Menu, X, ChevronDown, Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard },
  { to: "/conferencias", label: "Conferências", icon: ClipboardCheck },
  { to: "/notas", label: "Notas fiscais", icon: FileText },
  { to: "/pendencias", label: "Pendências e faltas", icon: AlertTriangle },
  { to: "/extraviados", label: "Extraviados de outras praças", icon: PackageSearch },
  { to: "/ocorrencias", label: "Ocorrências", icon: Siren },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/usuarios", label: "Usuários e permissões", icon: Users },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

const titles: Record<string, string> = Object.fromEntries(nav.map((n) => [n.to, n.label]));

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
  const title = titles[path] ?? (path.startsWith("/conferencias/") ? "Conferência" : "");

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="grid size-8 place-items-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
          <Truck className="size-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-sidebar-accent-foreground">Conferência</div>
          <div className="text-[11px] uppercase tracking-wider text-sidebar-muted">Gestão operacional</div>
        </div>
      </div>
      <div className="px-3 pt-4">
        <button className="flex w-full items-center justify-between rounded-sm border border-sidebar-border px-3 py-2 text-left text-sm">
          <span>
            <span className="block text-[11px] uppercase tracking-wider text-sidebar-muted">Filial</span>
            Porto Alegre — POA
          </span>
          <ChevronDown className="size-4 text-sidebar-muted" />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={() => setOpen(false)}
            className={cn(
              "relative flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
              isActive(n.to) && "bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary",
            )}
          >
            <n.icon className="size-4 shrink-0 opacity-80" />
            <span className="truncate">{n.label}</span>
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border px-4 py-3 text-[11px] text-sidebar-muted">
        Ambiente de demonstração · dados fictícios
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen w-full">
      <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64">{sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-4 lg:px-6">
          <button className="rounded-sm p-1.5 hover:bg-muted lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className="text-sm font-medium text-muted-foreground">
            POA <span className="mx-1.5 text-border">/</span>
            <span className="text-foreground">{title}</span>
          </div>
          <div className="relative ml-auto hidden w-full max-w-sm md:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Buscar NF, pedido, placa, ocorrência…" className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
          <div className="flex items-center gap-2.5 border-l pl-3">
            <div className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">AP</div>
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-medium">Ana P.</div>
              <div className="text-xs text-muted-foreground">Administrativo</div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
