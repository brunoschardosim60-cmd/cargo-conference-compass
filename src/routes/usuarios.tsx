import { meta } from "@/lib/meta";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, LockKeyhole } from "lucide-react";
import {
  PageHeader,
  Panel,
  DataTable,
  SearchBox,
  FilterSelect,
  EmptyState,
} from "@/components/ui-kit";
import { usuarios } from "@/lib/demo-data";
import { Pill } from "@/components/status";
export const Route = createFileRoute("/usuarios")({
  head: () => meta("Usuários e acessos", "Conferência logística interna da filial POA."),
  component: Page,
});
const roles = [
  ["Conferente", "Conferências autorizadas", "Contagem, divergências e histórico próprio"],
  [
    "Administrativo",
    "Recebimento e tratamento",
    "Operações, importação, pendências e comunicações",
  ],
  ["Torre operacional", "Acompanhamento", "Localizações e confirmações autorizadas"],
  ["Administrador", "Gestão do sistema", "Usuários, permissões, parâmetros e auditoria"],
] as const;
function Page() {
  const [q, setQ] = useState(""),
    [role, setRole] = useState("");
  const rows = usuarios.filter(
    (u) =>
      (!role || u.perfil === role) &&
      [u.nome, u.email].join(" ").toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="eyebrow">ADMINISTRAÇÃO / CONTROLE DE ACESSO</div>
      <PageHeader
        title="Usuários e acessos"
        subtitle="Perfis previstos para separar as responsabilidades da operação."
      />
      <div className="info-strip mb-5">
        <LockKeyhole size={18} className="shrink-0" />
        <span>
          Diretório demonstrativo. Login individual e permissões de backend ainda não estão ativos.
          Os perfis abaixo descrevem o acesso planejado e não concedem autorização real.
        </span>
      </div>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Buscar nome ou e-mail" />
        <FilterSelect
          label="Perfil"
          value={role}
          onChange={setRole}
          options={roles.map((r) => [r[0], r[0]])}
        />
      </div>
      <Panel title="Pessoas da operação" flush>
        {rows.length ? (
          <DataTable
            head={[
              "Usuário",
              "E-mail de exemplo",
              "Perfil previsto",
              "Escopo",
              "Situação na amostra",
            ]}
          >
            {rows.map((u) => (
              <tr key={u.email}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="avatar">{u.nome.slice(0, 2).toUpperCase()}</span>
                    <span className="font-medium">{u.nome}</span>
                  </div>
                </td>
                <td className="text-muted-foreground">{u.email}</td>
                <td>{u.perfil}</td>
                <td>{u.filial === "Todas" ? "POA nesta versão" : u.filial}</td>
                <td>
                  <Pill tone="neutral">Demonstração</Pill>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <EmptyState title="Nenhum usuário encontrado" text="Tente outro nome ou perfil." />
        )}
      </Panel>
      <Panel title="Responsabilidades por perfil" className="mt-5" flush>
        <DataTable head={["Perfil", "Área de atuação", "Responsabilidades previstas"]}>
          {roles.map((r) => (
            <tr key={r[0]}>
              <td>
                <span className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-info" />
                  {r[0]}
                </span>
              </td>
              <td>{r[1]}</td>
              <td>{r[2]}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </>
  );
}
