# Preparação para dados compartilhados

## Estado verificado

Não existe cliente de banco, serviço de identidade, endpoint autenticado, storage privado ou canal de sincronização conectado nesta versão. `OperationProvider` usa `local-workspace.ts` e localStorage. O ator é explicitamente demonstrativo. O modo local serve à avaliação; não fornece autorização, colaboração entre aparelhos ou auditoria protegida.

Nenhuma migração ou mudança de infraestrutura de produção foi executada. Não foram criadas credenciais nem gravados segredos.

## Separações preparadas

- Regras de nota, localização e outras praças em funções de domínio independentes de React.
- Estado de outras praças separado de notas e faltas locais, com migração aditiva da amostra antiga. A leitura não sobrescreve o conteúdo anterior.
- Versão incremental por volume de outra praça. Alterações mantêm eventos e imagens adicionadas no histórico.
- Contrato `src/lib/backend-contract.ts`: sessão autenticada, comandos tipados, idempotência (`requestId`), versão esperada, confirmação de commit, leitura incremental e evidências privadas. Este contrato não é uma integração instalada.

## Modelo relacional recomendado

| Entidade                       | Vínculos e restrições                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| branches                       | POA inicial; sem fluxo multi-filial nesta fase                                                 |
| profiles                       | user_id do provedor de identidade, branch_id, papel e ativo                                    |
| operations                     | UUID, filial, carreta, origem, chegada, doca, estado e versão                                  |
| operation_assignments          | operação + usuário autorizado; conferente acessa somente operações atribuídas                  |
| cargo_notes                    | operação, NF, documento de transporte/emitente quando presentes; NF isolada não é chave global |
| counts                         | nota, encontrados, situação, observação, autor e versão                                        |
| product_counts / product_lines | cálculo auxiliar de produtos; nunca substitui volumes físicos                                  |
| cases                          | operação + nota, snapshot da abertura, tratamento e responsável                                |
| discoveries                    | pendência, quantidade, observação, conferente e decisão administrativa separada                |
| other_place_volumes            | identificação, destino, responsável, identificação/envio/recebimento e versão                  |
| evidence                       | UUID, entidade proprietária, caminho privado, hash, tipo MIME, tamanho e autor                 |
| documents / import_batches     | PDF original, hash, páginas, extração, revisão e confirmação humana                            |
| audit_events                   | entidade, antes/depois, ator autenticado, instante do servidor e request_id                    |

Identificadores, chaves estrangeiras e índices por operação/NF, cliente/destino e datas devem existir no banco. Chave de deduplicação de importação: filial + hash/documento; revisar repetição de NF dentro do mesmo documento antes de persistir.

## Escrita e sincronização

1. Autenticar no servidor e obter filial/papel da sessão. Ignorar ator enviado pelo cliente.
2. Validar atribuição, permissão, transição, quantidades, evidências e versão atual.
3. Em transação, atualizar a entidade com `WHERE version = expected_version`, incrementar versão e acrescentar evento. Conflito retorna 409, sem sobrescrever.
4. Deduplicar comandos por request_id. Falha de rede mantém a operação como “envio não confirmado”; não exibir “salvo”.
5. Emitir atualização somente após commit. Eventos em tempo real invalidam consultas; reconexão busca cursor/versões para recuperar lacunas.
6. Rascunho local continua identificado como rascunho, nunca substitui estado confirmado no servidor. Não enviar automaticamente rascunhos de demonstração para produção.

## Autorização mínima a validar

Conferente registra contagens de cargas atribuídas, consulta faltas permitidas e informa localização. Administrativo cadastra operações, revisa importação, trata casos, valida descobertas e confirma recebimento. Administrador gerencia usuários e parâmetros. Encerramento administrativo exige justificativa e validação de descobertas pendentes. Torre fora do escopo.

Fotos/PDFs em storage privado, leitura por URL temporária após verificação de acesso. Validar tamanho, conteúdo e MIME no servidor. Eventos de auditoria não aceitam update/delete pelo aplicativo comum.

## Critério de conexão

Configurar o projeto de banco/identidade, implementar o contrato e trocar os handlers síncronos locais por mutações assíncronas com estados de envio e confirmação. Validar contas com papéis distintos, dois aparelhos simultâneos, conflito de versão, sessão expirada, reconexão, retry duplicado, acesso indevido a evidências e backup/restauração. Até isso estar conectado, manter o aviso de avaliação local.
