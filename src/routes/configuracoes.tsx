import { meta } from "@/lib/meta";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, ShieldCheck, FileText, Database, Info } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui-kit";
import { Pill } from "@/components/status";
export const Route = createFileRoute("/configuracoes")({
  head: () => meta("Configurações", "Conferência logística interna da filial POA."),
  component: Page,
});
function Row({ title, text, value }: { title: string; text: string; value: React.ReactNode }) {
  return (
    <div className="setting-row">
      <div>
        <strong className="font-medium">{title}</strong>
        <small>{text}</small>
      </div>
      {value}
    </div>
  );
}
function Page() {
  return (
    <>
      <div className="eyebrow">ADMINISTRAÇÃO / AMBIENTE</div>
      <PageHeader
        title="Configurações"
        subtitle="Escopo da unidade, regras operacionais e preparação para a próxima etapa."
      />
      <div className="settings-grid">
        <Panel
          title="Unidade operacional"
          actions={<Building2 size={16} className="text-muted-foreground" />}
        >
          <Row
            title="Filial"
            text="Primeira unidade atendida pela aplicação."
            value={<span>Porto Alegre · POA</span>}
          />
          <Row
            title="Fuso horário"
            text="Horário dos novos registros nesta demonstração."
            value={<span>America/Sao_Paulo</span>}
          />
          <Row
            title="Outras filiais"
            text="Arquitetura preparada para expansão; operação multi-filial fora desta versão."
            value={<Pill tone="neutral">Futuro</Pill>}
          />
        </Panel>
        <Panel
          title="Dados e segurança"
          actions={<Database size={16} className="text-muted-foreground" />}
        >
          <Row
            title="Persistência"
            text="Registros e PDFs originais salvos neste navegador. Não compartilha dados entre aparelhos; limpar os dados do navegador remove esses arquivos e registros."
            value={<Pill tone="warning">Aparelho local</Pill>}
          />
          <Row
            title="Autenticação e permissões"
            text="Exigem serviço de identidade e validação em todas as ações no servidor."
            value={<Pill tone="neutral">Etapa 4</Pill>}
          />
          <Row
            title="Auditoria"
            text="Histórico local preservado entre recargas. Auditoria protegida no servidor ainda não conectada."
            value={<Pill tone="neutral">Etapa 4</Pill>}
          />
        </Panel>
        <Panel
          title="Regras da conferência"
          actions={<ShieldCheck size={16} className="text-muted-foreground" />}
        >
          <Row
            title="Identidade por operação"
            text="Notas e pendências mantêm vínculo explícito com a carga de origem."
            value={<Pill tone="success">Na interface</Pill>}
          />
          <Row
            title="Validação da contagem"
            text="Quantidades inteiras e não negativas; divergências precisam de observação."
            value={<Pill tone="success">Na interface</Pill>}
          />
          <Row
            title="Finalização"
            text="Exige todas as notas contadas e uma confirmação explícita."
            value={<Pill tone="success">Na interface</Pill>}
          />
        </Panel>
        <Panel
          title="Documentos e sistemas oficiais"
          actions={<FileText size={16} className="text-muted-foreground" />}
        >
          <Row
            title="Importação de PDF"
            text="Modelo DAMDFE detalhado: leitura multipágina local, revisão obrigatória, bloqueio por hash e PDF original preservado. Sem OCR para imagens."
            value={<Pill tone="success">Leitor local</Pill>}
          />
          <Row
            title="Códigos oficiais"
            text="Nenhum código validado nesta versão. Catálogo dependerá da confirmação da operação."
            value={<Pill tone="warning">A validar</Pill>}
          />
          <Row
            title="Integração Luft"
            text="Nenhuma integração oficial conectada. Informações oficiais são lançadas externamente."
            value={<Pill tone="neutral">Manual</Pill>}
          />
        </Panel>
      </div>
      <div className="info-strip mt-5">
        <Info size={17} className="shrink-0" />
        Esta tela documenta os parâmetros atuais. Edição de permissões e parâmetros será
        disponibilizada com autenticação administrativa no backend.
      </div>
    </>
  );
}
