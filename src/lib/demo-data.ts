// DADOS DE DEMONSTRAÇÃO — fictícios, não representam a operação real.

export type ConfStatus = "em_andamento" | "pausada" | "concluida" | "aguardando";
export type NfStatus =
  | "pendente"
  | "conferida"
  | "falta"
  | "avaria"
  | "excedente"
  | "divergencia"
  | "localizacao";
export type OcStatus =
  | "nova"
  | "analise"
  | "aguardando_localizacao"
  | "aguardando_registro"
  | "aguardando_retorno"
  | "resolvida"
  | "cancelada";
export type ExtStatus = "identificado" | "aguardando_ocorrencia" | "aguardando_retorno" | "encaminhado" | "confirmacao_pendente";

export interface Conferencia {
  id: string;
  origem: string;
  chegada: string;
  motorista: string;
  placa: string;
  doca?: string;
  responsavel: string;
  notas: number;
  volumes: number;
  conferidos: number;
  status: ConfStatus;
}

export interface NotaFiscal {
  nf: string;
  conferencia: string;
  pedido: string;
  remetente: string;
  destinatario: string;
  praca: string;
  pallet: string;
  previstos: number;
  encontrados: number | null;
  peso: number;
  status: NfStatus;
  registradoPor?: string;
  registradoEm?: string;
}

export interface Ocorrencia {
  id: string;
  nf: string;
  conferencia: string;
  cliente: string;
  tipo: NfStatus;
  registradoPor: string;
  registradoEm: string;
  responsavel?: string;
  status: OcStatus;
  proximaAcao: string;
  comentarios: number;
}

export interface Extraviado {
  id: string;
  nf: string;
  origem: string;
  destino: string;
  volumes: number;
  etiqueta: string;
  oc75?: string;
  carretaRetorno?: string;
  encaminhamento?: string;
  status: ExtStatus;
  foto: boolean;
}

export interface Evento {
  id: string;
  quando: string;
  usuario: string;
  tipo: string;
  descricao: string;
  ref: string;
}

export const conferencias: Conferencia[] = [
  { id: "CF-DEMO-0142", origem: "Cajamar/SP", chegada: "19/10 06:40", motorista: "J. Silva (demo)", placa: "ABC-1D23", doca: "D04", responsavel: "Marcos A.", notas: 48, volumes: 612, conferidos: 401, status: "em_andamento" },
  { id: "CF-DEMO-0141", origem: "Curitiba/PR", chegada: "19/10 05:15", motorista: "R. Souza (demo)", placa: "QWE-4F56", doca: "D02", responsavel: "Carla M.", notas: 31, volumes: 288, conferidos: 288, status: "concluida" },
  { id: "CF-DEMO-0140", origem: "Joinville/SC", chegada: "19/10 04:50", motorista: "P. Lima (demo)", placa: "RTY-7G89", responsavel: "Diego F.", notas: 22, volumes: 190, conferidos: 74, status: "pausada" },
  { id: "CF-DEMO-0139", origem: "Guarulhos/SP", chegada: "18/10 22:10", motorista: "A. Costa (demo)", placa: "UIO-0H12", doca: "D01", responsavel: "Marcos A.", notas: 57, volumes: 803, conferidos: 803, status: "concluida" },
  { id: "CF-DEMO-0138", origem: "Betim/MG", chegada: "19/10 08:30", motorista: "L. Rocha (demo)", placa: "PAS-3J45", responsavel: "—", notas: 40, volumes: 455, conferidos: 0, status: "aguardando" },
];

export const notas: NotaFiscal[] = [
  { nf: "000184512", conferencia: "CF-DEMO-0142", pedido: "PD-77120", remetente: "Indústria Exemplo Ltda", destinatario: "Mercado Modelo POA", praca: "POA Centro", pallet: "P-01", previstos: 12, encontrados: 12, peso: 84.2, status: "conferida", registradoPor: "Marcos A.", registradoEm: "07:12" },
  { nf: "000184513", conferencia: "CF-DEMO-0142", pedido: "PD-77121", remetente: "Indústria Exemplo Ltda", destinatario: "Farmácia Demo Canoas", praca: "Canoas", pallet: "P-01", previstos: 8, encontrados: 6, peso: 41.0, status: "falta", registradoPor: "Marcos A.", registradoEm: "07:18" },
  { nf: "000184520", conferencia: "CF-DEMO-0142", pedido: "PD-77128", remetente: "Distribuidora Fictícia SA", destinatario: "Loja Teste Gravataí", praca: "Gravataí", pallet: "P-02", previstos: 20, encontrados: 20, peso: 132.5, status: "avaria", registradoPor: "Marcos A.", registradoEm: "07:31" },
  { nf: "000184527", conferencia: "CF-DEMO-0142", pedido: "PD-77133", remetente: "Distribuidora Fictícia SA", destinatario: "Atacado Simulado", praca: "POA Norte", pallet: "P-03", previstos: 5, encontrados: 7, peso: 22.8, status: "excedente", registradoPor: "Marcos A.", registradoEm: "07:40" },
  { nf: "000184531", conferencia: "CF-DEMO-0142", pedido: "PD-77140", remetente: "Indústria Exemplo Ltda", destinatario: "Supermercado Amostra", praca: "Viamão", pallet: "P-03", previstos: 15, encontrados: null, peso: 98.0, status: "localizacao", registradoPor: "Marcos A.", registradoEm: "07:52" },
  { nf: "000184534", conferencia: "CF-DEMO-0142", pedido: "PD-77142", remetente: "Comércio Demo Ltda", destinatario: "Loja Teste Alvorada", praca: "Alvorada", pallet: "P-04", previstos: 3, encontrados: 3, peso: 9.6, status: "divergencia", registradoPor: "Marcos A.", registradoEm: "08:02" },
  { nf: "000184539", conferencia: "CF-DEMO-0142", pedido: "PD-77150", remetente: "Comércio Demo Ltda", destinatario: "Mercado Modelo POA", praca: "POA Centro", pallet: "P-04", previstos: 10, encontrados: null, peso: 55.1, status: "pendente" },
  { nf: "000184541", conferencia: "CF-DEMO-0142", pedido: "PD-77152", remetente: "Indústria Exemplo Ltda", destinatario: "Farmácia Demo Canoas", praca: "Canoas", pallet: "P-05", previstos: 6, encontrados: null, peso: 18.3, status: "pendente" },
  { nf: "000184548", conferencia: "CF-DEMO-0142", pedido: "PD-77160", remetente: "Distribuidora Fictícia SA", destinatario: "Atacado Simulado", praca: "POA Norte", pallet: "P-05", previstos: 24, encontrados: null, peso: 160.0, status: "pendente" },
  { nf: "000183990", conferencia: "CF-DEMO-0141", pedido: "PD-76002", remetente: "Fábrica Amostra", destinatario: "Loja Teste Esteio", praca: "Esteio", pallet: "P-02", previstos: 9, encontrados: 9, peso: 40.0, status: "conferida", registradoPor: "Carla M.", registradoEm: "05:58" },
];

export const ocorrencias: Ocorrencia[] = [
  { id: "OC-DEMO-311", nf: "000184513", conferencia: "CF-DEMO-0142", cliente: "Farmácia Demo Canoas", tipo: "falta", registradoPor: "Marcos A.", registradoEm: "19/10 07:18", status: "nova", proximaAcao: "Pesquisar NF no sistema oficial", comentarios: 0 },
  { id: "OC-DEMO-310", nf: "000184520", conferencia: "CF-DEMO-0142", cliente: "Loja Teste Gravataí", tipo: "avaria", registradoPor: "Marcos A.", registradoEm: "19/10 07:31", responsavel: "Ana P.", status: "analise", proximaAcao: "Anexar fotos e preparar comunicado", comentarios: 2 },
  { id: "OC-DEMO-309", nf: "000184531", conferencia: "CF-DEMO-0142", cliente: "Supermercado Amostra", tipo: "localizacao", registradoPor: "Marcos A.", registradoEm: "19/10 07:52", responsavel: "Ana P.", status: "aguardando_localizacao", proximaAcao: "Aguardar varredura no pavilhão", comentarios: 1 },
  { id: "OC-DEMO-305", nf: "000183871", conferencia: "CF-DEMO-0139", cliente: "Atacado Simulado", tipo: "falta", registradoPor: "Marcos A.", registradoEm: "18/10 23:40", responsavel: "Bruno T.", status: "aguardando_registro", proximaAcao: "Registrar ocorrência no sistema oficial", comentarios: 3 },
  { id: "OC-DEMO-298", nf: "000183702", conferencia: "CF-DEMO-0139", cliente: "Mercado Modelo POA", tipo: "excedente", registradoPor: "Carla M.", registradoEm: "18/10 23:55", responsavel: "Torre", status: "aguardando_retorno", proximaAcao: "Confirmação da torre", comentarios: 4 },
  { id: "OC-DEMO-290", nf: "000183544", conferencia: "CF-DEMO-0136", cliente: "Loja Teste Esteio", tipo: "falta", registradoPor: "Diego F.", registradoEm: "17/10 15:20", responsavel: "Ana P.", status: "resolvida", proximaAcao: "—", comentarios: 5 },
  { id: "OC-DEMO-284", nf: "000183410", conferencia: "CF-DEMO-0135", cliente: "Comércio Demo", tipo: "divergencia", registradoPor: "Carla M.", registradoEm: "17/10 09:02", responsavel: "Bruno T.", status: "cancelada", proximaAcao: "Cancelada: etiqueta lida incorretamente", comentarios: 2 },
];

export const extraviados: Extraviado[] = [
  { id: "EX-DEMO-051", nf: "000771203", origem: "Cajamar/SP", destino: "Florianópolis/SC", volumes: 2, etiqueta: "FLN-0332 / CTC 99812", status: "identificado", foto: true },
  { id: "EX-DEMO-050", nf: "000562210", origem: "Curitiba/PR", destino: "Caxias do Sul/RS", volumes: 1, etiqueta: "CXS-1120", status: "aguardando_ocorrencia", foto: true },
  { id: "EX-DEMO-048", nf: "Sem NF legível", origem: "Guarulhos/SP", destino: "Pelotas/RS", volumes: 4, etiqueta: "PEL-0091 (parcial)", oc75: "75-DEMO-4410", status: "aguardando_retorno", foto: false },
  { id: "EX-DEMO-045", nf: "000449812", origem: "Betim/MG", destino: "Joinville/SC", volumes: 3, etiqueta: "JVL-7781", oc75: "75-DEMO-4398", carretaRetorno: "XYZ-9K87", encaminhamento: "17/10", status: "encaminhado", foto: true },
  { id: "EX-DEMO-041", nf: "000390022", origem: "Cajamar/SP", destino: "Blumenau/SC", volumes: 1, etiqueta: "BNU-2203", oc75: "75-DEMO-4371", carretaRetorno: "LMN-2B34", encaminhamento: "15/10", status: "confirmacao_pendente", foto: true },
];

export const eventos: Evento[] = [
  { id: "e1", quando: "19/10 08:02", usuario: "Marcos A.", tipo: "divergencia", descricao: "Divergência de identificação registrada na NF 000184534", ref: "CF-DEMO-0142" },
  { id: "e2", quando: "19/10 07:58", usuario: "Ana P.", tipo: "revisao", descricao: "Ocorrência OC-DEMO-310 revisada pelo administrativo", ref: "OC-DEMO-310" },
  { id: "e3", quando: "19/10 07:40", usuario: "Marcos A.", tipo: "excedente", descricao: "Volume excedente identificado na NF 000184527 (+2)", ref: "CF-DEMO-0142" },
  { id: "e4", quando: "19/10 07:18", usuario: "Marcos A.", tipo: "falta", descricao: "Falta registrada na NF 000184513 (esperado 8, encontrado 6)", ref: "CF-DEMO-0142" },
  { id: "e5", quando: "19/10 07:05", usuario: "Marcos A.", tipo: "inicio", descricao: "Conferência CF-DEMO-0142 iniciada", ref: "CF-DEMO-0142" },
  { id: "e6", quando: "19/10 06:52", usuario: "Ana P.", tipo: "pdf", descricao: "PDF da relação de carga importado (6 páginas, 48 NFs)", ref: "CF-DEMO-0142" },
  { id: "e7", quando: "19/10 06:20", usuario: "Torre", tipo: "localizado", descricao: "Volume da NF 000183544 localizado e recebimento confirmado", ref: "OC-DEMO-290" },
  { id: "e8", quando: "19/10 06:05", usuario: "Carla M.", tipo: "concluida", descricao: "Conferência CF-DEMO-0141 concluída sem pendências", ref: "CF-DEMO-0141" },
  { id: "e9", quando: "18/10 23:41", usuario: "Marcos A.", tipo: "correcao", descricao: "Quantidade corrigida na NF 000183871 (10 → 9), valor anterior mantido no histórico", ref: "CF-DEMO-0139" },
  { id: "e10", quando: "18/10 22:15", usuario: "Ana P.", tipo: "criada", descricao: "Conferência CF-DEMO-0139 criada", ref: "CF-DEMO-0139" },
];

export const usuarios = [
  { nome: "Marcos A.", email: "marcos@demo.local", perfil: "Conferente", filial: "POA", ativo: true },
  { nome: "Carla M.", email: "carla@demo.local", perfil: "Conferente", filial: "POA", ativo: true },
  { nome: "Diego F.", email: "diego@demo.local", perfil: "Conferente", filial: "POA", ativo: true },
  { nome: "Ana P.", email: "ana@demo.local", perfil: "Administrativo", filial: "POA", ativo: true },
  { nome: "Bruno T.", email: "bruno@demo.local", perfil: "Administrativo", filial: "POA", ativo: true },
  { nome: "Torre Operacional", email: "torre@demo.local", perfil: "Torre operacional", filial: "Todas", ativo: true },
  { nome: "Admin Sistema", email: "admin@demo.local", perfil: "Administrador", filial: "Todas", ativo: true },
];
