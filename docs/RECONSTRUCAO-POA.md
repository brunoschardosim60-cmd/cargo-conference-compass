# Reconstrução POA — etapas 1, 2 e 3

## Escopo e estado da entrega

Reconstrução local da interface, na branch `codex/reconstrucao-poa`. O frontend possui fluxos interativos de avaliação com dados fictícios e estado React compartilhado durante a página aberta. Recarregar, fechar a aba ou reiniciar o servidor descarta as alterações da amostra. Não usar esta versão para registros operacionais reais.

Não foram conectados banco de dados, autenticação, armazenamento de arquivos, extração de PDF ou sistemas oficiais. As permissões descritas na interface são uma especificação de produto, não uma barreira de segurança. Não houve migração, exclusão de dados, envio de e-mail, publicação ou alteração remota do repositório.

## Etapa 1 — auditoria

| Área | Situação encontrada | Decisão |
| --- | --- | --- |
| Framework | React 19, TypeScript 5, TanStack Start/Router, Vite 8 | Preservados; rotas continuam baseadas em arquivos |
| UI | Tailwind 4, Radix/shadcn, Lucide, IBM Plex Sans/Mono | Reutilizados para componentes acessíveis e consistentes |
| Servidor | Entrada SSR, tratamento de erro, middleware CSRF | Preservados, sem simular APIs de negócio |
| Lovable | Configuração Vite/Nitro e instruções de sincronização | Preservadas; histórico remoto não alterado |
| Estado | Arrays estáticos e `useState` por página | Provider de sessão comum a conferência, pendências, notas e histórico |
| Banco / autenticação | Nenhuma implementação encontrada | Projetados para etapa 4; nenhuma credencial introduzida |
| Integrações | Infraestrutura de execução e relatório de erros Lovable; nenhuma integração operacional | Não há conexão com sistemas oficiais Luft |
| Rotas | Seis páginas com placeholders | Todas passam a apresentar conteúdo contextual e ações compatíveis com o estágio |
| Shell | `AppShell` existia, mas não envolvia o `Outlet` | Navegação integrada ao layout raiz |
| Indicadores | KPIs fixos, inconsistentes com a amostra | Métricas e progresso derivados dos registros visíveis |
| Conferência | ID inválido abria a primeira carga; salvamento apenas alterava texto de botão; concluir sem ação | Estado de operação inexistente, gravação demonstrativa compartilhada, validações e confirmação de finalização |
| Pendências | Data sem filtro funcional, atribuições isoladas, sem tratamento detalhado | Filtros funcionais, detalhe contextual, providências, referência manual e justificativa |
| Testes | Um teste de correspondência da rota inicial | Acrescentados testes de regras e do ciclo operacional integrado |

Os fixtures legados em `demo-data.ts` foram preservados. Um adaptador constrói uma amostra menor e coerente com as notas disponíveis, recalcula totais e elimina do histórico demonstrativo a afirmação de que um PDF teria sido efetivamente importado nesta versão.

## Etapa 2 — design system

Direção: estação de trabalho logística, desktop-first, sem gráficos decorativos. Sidebar fixa em marinho, superfícies brancas, fundo cinza frio e estados discretos com texto, além da cor.

| Elemento | Padrão |
| --- | --- |
| Cores | Sidebar `#11283f`; ação principal `#183c64`; fundo `#f4f6f9`; texto `#192a40` |
| Tipografia | IBM Plex Sans para leitura; IBM Plex Mono para placa e identificadores selecionados |
| Hierarquia | Contexto em texto pequeno; título 26px; texto operacional 12–14px; metadados 10–12px |
| Espaçamento | Passos de 4/8px; área de trabalho 24–32px; tabelas compactas |
| Componentes | PageHeader, Panel, DataTable, SearchBox, FilterSelect, Btn, EmptyState, StatusPill, Dialog |
| Navegação | Operação; acompanhamento; administração |
| Feedback | Validação próxima ao campo, mensagens de resultado, diálogos de confirmação |
| Acessibilidade | Link para conteúdo, foco visível, rótulos, tabelas semânticas, radio buttons, diálogos Radix, idioma pt-BR, movimento reduzido |
| Responsividade | Sidebar em diálogo em telas menores; painéis empilhados; rolagem horizontal restrita às tabelas |

Não foi apresentado um logotipo externo como marca oficial: o cabeçalho é uma identificação tipográfica da unidade.

## Etapa 3 — telas e comportamento

- **Visão geral:** operações, progresso por NFs contadas, prioridades e últimas atividades. Indicadores refletem a base de demonstração, sem fingir métricas reais do dia.
- **Conferências:** fila por situação, busca por placa/origem/motorista/operação e responsável. Cadastro manual demonstrativo em duas etapas com revisão, validação de volumes e bloqueio de NF repetida na mesma relação.
- **Mesa de conferência:** operação, placa, doca, chegada, responsável; busca por NF/pedido/cliente/pallet; quantidade física, diferença calculada e resultado explícito; observações; salvar e avançar; pausar/retomar; confirmar finalização. Trocar de NF com rascunho abre confirmação. Operação inexistente nunca abre outra carga.
- **Central de pendências:** filtros por operação, situação, data e busca textual por NF/cliente/responsáveis; painel com contagem, contexto e evidências disponíveis; tratamento, responsável, número oficial informado manualmente e resolução justificada.
- **Torre:** reutiliza a central de casos, com contexto de acompanhamento e confirmação adicional antes de resolver no fluxo demonstrativo. É uma visão sobre os mesmos casos, não uma segunda base redundante.
- **Notas fiscais:** consulta transversal com vínculo à operação; links e busca global abrem a NF selecionada no contexto correto.
- **Outras praças:** consulta separada, situação do encaminhamento, etiqueta, destino correto, retorno e detalhe. Dados ausentes aparecem como não informados. Não há fotos artificiais nem confirmação fictícia de recebimento.
- **Histórico:** eventos de demonstração e alterações da sessão, com valores anteriores e posteriores das contagens, observações, tratamento e referência oficial.
- **Usuários:** diretório fictício pesquisável e matriz de responsabilidades planejadas. Não cria contas nem atribui acesso real.
- **Configurações:** parâmetros da primeira unidade e estado de implementação. Não oferece controles de segurança sem backend.

### Regras implementadas no demonstrador

1. Quantidades encontradas devem ser inteiras, finitas e não negativas.
2. Sem divergência exige quantidade prevista igual à encontrada.
3. Falta exige quantidade menor; excedente exige quantidade maior.
4. Divergências exigem observação. Quantidade menor não confirma falta automaticamente.
5. Operações pausadas, aguardando início ou concluídas não aceitam edição de contagem.
6. Finalização exige ao menos uma NF e todas contadas. Pendências de localização podem seguir para análise administrativa após finalizar a contagem.
7. Registro de divergência cria ou atualiza um caso aberto da mesma operação/NF. Uma correção não encerra o caso administrativo automaticamente.
8. Encerramento exige justificativa. Referência oficial é apenas informação declarada manualmente.
9. Nenhuma ação envia e-mail: é possível revisar e copiar um rascunho.

### Limites deliberados

Importação de PDF apresenta seu estágio e o fluxo previsto, mas não recebe arquivos nem simula extração. Arquivos originais/evidências e recebimentos de outras praças dependem da etapa 4. Rascunhos não salvos não sobrevivem à saída da página. Dados salvos sobrevivem à navegação interna, mas não ao recarregamento. Não há sincronização entre abas, usuários ou computadores.

O cadastro manual impede números repetidos em uma relação demonstrativa. A identidade fiscal definitiva precisa considerar emissor, série/chave e possíveis linhas repartidas em pallets; não deve usar somente o número da NF como chave global.

## Arquitetura recomendada para a etapa 4

Manter o frontend e separar um serviço de domínio no servidor, acessado por funções/rotas autenticadas. Preferir PostgreSQL como banco relacional, com armazenamento privado de objetos para PDFs e fotos e um processo assíncrono de extração. A infraestrutura concreta deve ser escolhida com os responsáveis pela hospedagem e identidade corporativa.

Modelo proposto, sem migração executada:

| Entidade | Responsabilidade / relacionamento |
| --- | --- |
| branches | Identidade da filial; somente POA ativa inicialmente |
| users / roles / memberships | Identidade autenticada, perfil e vínculo com filial |
| receiving_operations | UUID, referência humana, filial, carreta, origem, chegada, doca e estado |
| operation_assignments | Conferentes autorizados por operação |
| import_jobs / source_documents | Original privado, hash, operação, páginas, estado de extração e revisão |
| operation_invoices / cargo_lines | NF no contexto da operação; emissor, série/chave, pedidos, pallet, cliente, praça, rota, região, CTC/CTR, previsão, volumes e peso nullable |
| count_revisions | Resultado por linha/NF, observações, autor, tempo de servidor, versão anterior; revisões preservadas |
| discrepancies / case_updates | Caso administrativo, responsável, próxima ação, providências e justificativa |
| official_references | Código/número informado, quem confirmou manualmente e quando; sem inferir integração |
| misplaced_volumes / transfers / receipts | Outras praças, identificação, destino, saída, carreta e confirmação de recebimento |
| attachments | Metadados, objeto privado, autor, vínculo a operação/caso/volume |
| audit_events | Evento append-only com identidade, antes/depois, correlação e data confiável |

Usar chaves estrangeiras, `NOT NULL` apenas onde semanticamente obrigatório, `CHECK` para quantidades e restrições compostas de unicidade. A documentação do [PostgreSQL sobre constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) fundamenta esses mecanismos; a identidade composta exata deverá ser validada com documentos reais.

Autorizar toda leitura/escrita no servidor por perfil, filial e vínculo à operação; negar por padrão. A interface não deve decidir autorização. A recomendação segue as práticas da [OWASP para autorização](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html). A identidade do autor deve vir da sessão, nunca do payload do navegador.

Gravar revisão, divergência e auditoria na mesma transação. Usar versão otimista da linha para detectar contagens concorrentes; rejeitar conflitos com opção de comparar os registros. Criar chave de idempotência para importação e operações repetidas. Finalizar por transação após verificar a versão e a completude da relação. Reabertura/correção pós-finalização exige política de perfil e justificativa explícita a validar com a operação.

Para PDFs: validar extensão, assinatura e tamanho; limitar páginas/custo; manter o arquivo original privado, fora da área pública; usar URLs temporárias e controle de acesso em cada download. Seguir a [OWASP para upload de arquivos](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html). Extração multipágina deve retornar texto bruto, página/posição de origem, campos nullable e avisos de ambiguidade. PDFs digitalizados podem exigir OCR. Não enviar documentos a provedores externos sem uma decisão explícita de integração.

Importação em duas fases: extrair para staging; depois revisar e confirmar a publicação das linhas por transação. Hash ajuda a detectar o mesmo arquivo, mas não basta para deduplicar notas; revisão humana e identidade fiscal por operação continuam necessárias.

Próxima sequência recomendada: identidade e autorização → persistência/auditoria → contagem e tratamento transacionais → anexos privados → importação com revisão → piloto POA. Os códigos oficiais e a regra de confirmação no destino precisam de validação operacional antes de ativar os módulos correspondentes.

## Arquivos da implementação

| Grupo | Arquivos |
| --- | --- |
| Layout e design system | `src/styles.css`, `src/components/app-shell.tsx`, `ui-kit.tsx`, `status.tsx`, `ui/dialog.tsx`, `src/routes/__root.tsx` |
| Componentes operacionais novos | `src/components/operation-provider.tsx`, `operation-table.tsx`, `new-operation.tsx`, `case-center.tsx`, `unsaved-changes.tsx` |
| Modelo, contexto de demonstração e validação | `src/lib/operation-model.ts`, `src/lib/operation-context.ts` |
| Páginas reconstruídas | `src/routes/index.tsx`, `conferencias.index.tsx`, `conferencias.$id.tsx`, `notas.tsx`, `pendencias.tsx`, `ocorrencias.tsx`, `extraviados.tsx`, `historico.tsx`, `usuarios.tsx`, `configuracoes.tsx` |
| Testes novos | `src/test/operation-model.test.ts`, `src/test/operation-provider.test.tsx` |
| Documentação | `README.md`, `docs/RECONSTRUCAO-POA.md`, `docs/VALIDACAO.md` |
| Evidências visuais | `docs/screenshots/visao-geral.png`, `docs/screenshots/conferencia.png` |

Versões, dependências, configurações Vite/Nitro/TypeScript e integrações existentes não foram substituídas. Os componentes shadcn não utilizados foram preservados para evitar remoções fora do escopo.
