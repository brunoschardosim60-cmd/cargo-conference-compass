import { cn } from "@/lib/utils";
import type { ConfStatus, NfStatus, OcStatus, ExtStatus } from "@/lib/demo-data";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneCls: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-neutral-soft text-muted-foreground",
};

export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-medium",
        toneCls[tone],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export const confMap: Record<ConfStatus, [string, Tone]> = {
  em_andamento: ["Em andamento", "info"],
  pausada: ["Pausada", "warning"],
  concluida: ["Concluída", "success"],
  aguardando: ["Aguardando início", "neutral"],
};
export const nfMap: Record<NfStatus, [string, Tone]> = {
  pendente: ["Não conferida", "neutral"],
  conferida: ["Conferida", "success"],
  falta: ["Falta confirmada", "danger"],
  avaria: ["Avaria", "danger"],
  excedente: ["Excedente", "warning"],
  divergencia: ["Não identificado / divergência", "warning"],
  localizacao: ["Pendente de localização", "warning"],
};
export const ocMap: Record<OcStatus, [string, Tone]> = {
  nova: ["Nova", "danger"],
  analise: ["Em análise", "info"],
  aguardando_localizacao: ["Aguardando localização", "warning"],
  aguardando_registro: ["Aguardando registro oficial", "warning"],
  aguardando_retorno: ["Aguardando retorno", "warning"],
  resolvida: ["Resolvida", "success"],
  cancelada: ["Cancelada", "neutral"],
};
export const extMap: Record<ExtStatus, [string, Tone]> = {
  identificado: ["Identificado", "info"],
  aguardando_ocorrencia: ["Aguardando ocorrência", "warning"],
  aguardando_retorno: ["Aguardando retorno", "warning"],
  encaminhado: ["Encaminhado", "success"],
  confirmacao_pendente: ["Confirmação pendente", "warning"],
};

export function StatusPill<K extends string>({
  map,
  value,
}: {
  map: Record<K, [string, Tone]>;
  value: K;
}) {
  const [label, tone] = map[value];
  return <Pill tone={tone}>{label}</Pill>;
}
