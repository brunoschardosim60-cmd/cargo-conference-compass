import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ClipboardCheck,
  FileText,
  AlertTriangle,
  PackageSearch,
  History,
  Users,
  Settings,
  Search,
  Menu,
  ArrowUpRight,
  ChevronRight,
  Smartphone,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useOperations } from "@/lib/operation-context";
import { cn } from "@/lib/utils";
import { useHandheld } from "@/hooks/use-handheld";

const groups = [
  {
    label: "OPERAÇÃO POA",
    items: [
      { to: "/conferencias", label: "Conferências", icon: ClipboardCheck },
      { to: "/pendencias", label: "Faltas e divergências", icon: AlertTriangle },
      { to: "/extraviados", label: "Outras praças", icon: PackageSearch },
      { to: "/historico", label: "Histórico", icon: History },
    ],
  },
] as const;
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const handheld = useHandheld();
  const { state } = useOperations();
  const [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState("");
  const title =
    groups
      .flatMap((g) => [...g.items])
      .find((n) => n.to === path.replace(/\/$/, "") || n.to === path)?.label ||
    (path === "/"
      ? "Conferências"
      : path === "/usuarios"
        ? "Usuários e acessos"
        : path === "/configuracoes"
          ? "Configurações"
          : "Detalhes da operação");
  const term = query.trim().toLowerCase();
  const results = term
    ? state.notes
        .filter((n) =>
          [n.nf, n.pedido, n.destinatario, n.conferencia].join(" ").toLowerCase().includes(term),
        )
        .slice(0, 8)
    : [];
  const operations = term
    ? state.operations
        .filter((o) => [o.id, o.placa, o.origem].join(" ").toLowerCase().includes(term))
        .slice(0, 4)
    : [];
  const sidebar = (
    <>
      <Link to="/" className="brand" onClick={() => setMobile(false)}>
        <span className="brand-unit">
          POA
          <span />
        </span>
        <span className="brand-caption">
          LUFT<small>CONTROLE DE CARGAS</small>
        </span>
      </Link>
      <div className="branch">
        <div>
          <span>Porto Alegre</span>
          <small>Recebimento & conferência</small>
        </div>
      </div>
      <nav className="nav-groups" aria-label="Navegação principal">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="nav-heading">{g.label}</p>
            {g.items.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMobile(false)}
                className={cn(
                  "nav-item",
                  (path.startsWith(n.to) || (n.to === "/conferencias" && path === "/")) && "active",
                )}
              >
                <n.icon size={17} />
                <span>{n.label}</span>
                {n.to === "/pendencias" && (
                  <span className="nav-count">
                    {
                      state.cases.filter((c) => !["resolvida", "cancelada"].includes(c.status))
                        .length
                    }
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <details className="secondary-navigation">
        <summary>
          <Settings size={17} />
          Administração
        </summary>
        <Link to="/usuarios" className="nav-item" onClick={() => setMobile(false)}>
          <Users size={17} />
          Usuários e acessos
        </Link>
        <Link to="/configuracoes" className="nav-item" onClick={() => setMobile(false)}>
          <Settings size={17} />
          Configurações
        </Link>
        <p>Acessos demonstrativos. Permissões individuais aguardam conexão.</p>
      </details>
      <div className="sidebar-footer">
        <span className="avatar">AP</span>
        <div>
          <strong>Ana P.</strong>
          <small>Perfil de demonstração</small>
        </div>
        <span className="demo-dot" />
      </div>
    </>
  );
  if (path.startsWith("/conferir") || (handheld && path === "/"))
    return (
      <div className="field-layout">
        <a href="#main" className="skip-link">
          Ir para o conteúdo
        </a>
        <header className="field-topbar">
          <Link to="/conferir" className="field-brand">
            <strong>
              POA
              <span className="unit-mark" />
            </strong>
            <span className="field-brand-caption">LUFT / CONFERÊNCIA</span>
          </Link>
          <Link to="/conferencias" className="field-admin-link">
            Adm. <ArrowUpRight size={14} />
          </Link>
        </header>
        <div className="field-demo">
          <span>AVALIAÇÃO LOCAL</span> Registros neste aparelho · sem sincronização
        </div>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <nav className="field-bottom-nav" aria-label="Tarefas do conferente">
          <Link to="/conferir" className={path !== "/conferir/faltas" ? "active" : ""}>
            <ClipboardCheck size={21} />
            Conferir cargas
          </Link>
          <Link to="/conferir/faltas" className={path === "/conferir/faltas" ? "active" : ""}>
            <PackageSearch size={21} />
            Consultar faltas
          </Link>
        </nav>
      </div>
    );
  return (
    <div className="app-layout">
      <a href="#main" className="skip-link">
        Ir para o conteúdo
      </a>
      <aside className="desktop-sidebar">{sidebar}</aside>
      <Dialog open={mobile} onOpenChange={setMobile}>
        <DialogContent className="mobile-sidebar">
          <DialogTitle className="sr-only">Navegação</DialogTitle>
          <DialogDescription className="sr-only">Módulos da operação POA</DialogDescription>
          {sidebar}
        </DialogContent>
      </Dialog>
      <div className="app-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobile(true)}
            aria-label="Abrir navegação"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            Operação POA <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <button
            className="global-search"
            aria-label="Buscar NF, pedido ou placa"
            onClick={() => setSearch(true)}
          >
            <Search size={16} />
            <span>Buscar NF, pedido ou placa</span>
          </button>
          <span className="topbar-label">Uso interno</span>
          <Link to="/conferir" className="table-link whitespace-nowrap">
            <Smartphone size={16} />
            Tela do conferente
          </Link>
        </header>
        <div className="demo-banner">
          <span className="demo-label">AVALIAÇÃO LOCAL</span>
          <span>
            Registros salvos neste navegador · sem login ou sincronização entre aparelhos.
          </span>
          <Link to="/configuracoes">
            Sobre este ambiente <ArrowUpRight size={13} />
          </Link>
        </div>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer className="page-footer">
          <span>Luft · Conferência logística</span>
          <span>Filial POA · Ambiente de avaliação</span>
        </footer>
      </div>
      <Dialog open={search} onOpenChange={setSearch}>
        <DialogContent>
          <DialogTitle>Busca operacional</DialogTitle>
          <DialogDescription>
            Localize a nota ou a operação. A mesma NF pode existir em operações diferentes.
          </DialogDescription>
          <label className="sr-only" htmlFor="global-search">
            Buscar
          </label>
          <input
            id="global-search"
            autoFocus
            className="field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="NF, pedido, cliente, operação ou placa"
          />
          <div className="search-results">
            {operations.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setSearch(false);
                  navigate({ to: "/conferencias/$id", params: { id: o.id } });
                }}
              >
                <ClipboardCheck size={18} />
                <span>
                  <strong>{o.id}</strong>
                  <small>
                    {o.placa} · {o.origem}
                  </small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
            {results.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setSearch(false);
                  navigate({
                    to: "/conferencias/$id",
                    params: { id: n.conferencia },
                    search: { nota: n.id },
                  });
                }}
              >
                <FileText size={18} />
                <span>
                  <strong>NF {n.nf}</strong>
                  <small>
                    {n.destinatario} · {n.conferencia}
                  </small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
            {term && !results.length && !operations.length && (
              <p className="muted py-6">Nenhum resultado. Confira os números ou tente a placa.</p>
            )}
            {!term && (
              <p className="muted py-6">Comece digitando para consultar a base de demonstração.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
