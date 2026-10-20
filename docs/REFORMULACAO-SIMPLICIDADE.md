# Reformulação operacional — 20/10/2026

## Entrega

- Conferente: duas tarefas persistentes na navegação inferior, Conferir cargas e Consultar faltas. Carga > cliente > nota; pesquisa direta por NF ou pedido. Quantidade prevista e ações de confirmação à frente; pallet, praça, remetente e histórico nos detalhes.
- Administrativo: lista de operações abertas, filtro de chegadas de hoje, pesquisa por placa/NF/cliente, prioridades e histórico recente. Retirado destaque duplicado da carga e indicadores repetidos. Outras praças mantém consulta e detalhes, sem quatro cartões de indicadores.
- Torre removida da navegação, perfis selecionáveis e fluxo próprio. O endereço antigo /ocorrencias redireciona para /pendencias. Registros históricos legados preservados.
- Calculadora opcional com duas dimensões: volumes físicos e produtos nas caixas. Produtos aceitam linhas de caixas × unidades, quantidade esperada opcional e confirmação explícita. Nunca atualizam volumes ou situação da NF. A conta de produtos é preservada na nota, no registro original da pendência e no histórico.
- Consulta de faltas por NF, cliente, data e destino. Aviso de localização com quantidade, observação e fotos. Original preservado. Administrativo valida ou não confirma com justificativa; o encerramento continua separado e fica bloqueado enquanto houver localização pendente.
- Fotos por câmera/seletor do celular, até três por registro. Cópias JPEG reduzidas para a avaliação local; originais protegidos e armazenamento compartilhado ainda dependem do backend.
- Rascunho de contagem salvo automaticamente no navegador com feedback, recuperação por nota e proteção contra restauração de versão anterior à última contagem confirmada. Resultado confirmado salvo localmente antes do feedback de sucesso. Falha de espaço não altera a contagem confirmada. Dados locais inválidos são preservados; gravações detectam estado alterado em outra aba.

## Limites reais

Este ainda é um ambiente de avaliação, identificado nas telas. Não há autenticação real, backend de permissões, sincronização celular/computador, bloqueio multiusuário ou auditoria imutável. O armazenamento no navegador NÃO oferece esses recursos, não é criptografado pelo aplicativo e pode ser apagado pelas configurações do navegador. Não usar para dados operacionais de produção. A confirmação administrativa implementada demonstra o fluxo, não uma barreira de autorização.

Nenhuma migração de banco foi executada. Nenhum serviço da Luft foi integrado. Nenhum e-mail é enviado. As referências oficiais continuam manuais. PDF ainda não é importado pela aplicação. Outras praças continua como consulta demonstrativa, sem cadastro/retorno compartilhado.

## PDF recebido nesta revisão

Inspeção local de um DAMDFE de quatro páginas. Cabeçalho com 36 CT-e; relação nas páginas 3 e 4 com 53 linhas e soma de 1.484 volumes, correspondente ao total impresso. Esses totais não representam quantidades de medicamentos.

Mapeamento observado: Doc, NF, Remetente, Destinatário, Destino, Endereço, Vol., Peso e Val. NF. Pedido, pallet, doca e chegada não estão disponíveis como colunas nessa relação e devem permanecer vazios até preenchimento humano. Emissão e previsão de início da viagem não são chegada. O marcador asterisco é identificado como perecível neste documento. Nomes abreviados e variantes de destinatários exigem revisão antes de consolidar clientes; não unir automaticamente por aproximação. A cópia original e seus dados identificáveis não foram incorporados ao repositório nem à demonstração publicada.

## Próxima etapa

1. Conectar projeto de banco relacional, identidade individual e armazenamento privado de documentos/evidências.
2. Aplicar permissões no servidor, controle de versão por registro e trilha de auditoria protegida; verificar dois aparelhos simultâneos e falhas de conexão.
3. Extrair este formato multipágina com prévia editável, chave documental/hash para duplicidade, verificação de totais e conservação do original. Somente liberar a operação após revisão humana.
4. Conectar cadastro e retorno de outras praças ao mesmo backend.

## Arquivos principais

- src/components/app-shell.tsx, src/routes/index.tsx, src/task-flow.css: navegação e painel administrativo.
- src/components/field-conference.tsx, src/hooks/use-note-draft.ts: contagem móvel e rascunhos.
- src/components/count-calculator.tsx, src/lib/product-count.ts: calculadora por dimensão.
- src/components/field-shortages.tsx, src/routes/conferir.faltas.tsx, src/components/case-center.tsx: consulta, localização e validação.
- src/components/evidence-photos.tsx: captura e prévia local de fotos.
- src/lib/operation-model.ts, src/lib/operation-context.ts, src/components/operation-provider.tsx, src/lib/local-workspace.ts: registros, histórico e persistência local de avaliação.
- Demais rotas ajustadas: conferencias.$id, ocorrencias, usuarios, configuracoes, extraviados, historico e __root. Cadastro manual e avisos de salvamento atualizados.
- src/test/scope-revision.test.tsx e testes existentes: contagem, cálculo, descoberta, validação, preservação e falhas de armazenamento.

## Validação executada

- 55 testes em 7 arquivos aprovados; inclui cálculo misto de 308 unidades, confirmação explícita, isolamento entre produtos/volumes, preservação do original, validação administrativa, recarga, rascunho automático, falha de quota e conflito de outra aba.
- TypeScript sem erros; ESLint nos arquivos alterados sem erros; build de produção aprovado.
- Navegador em 390 × 844 e 1440 × 1000: carga > cliente > busca de NF, cálculo de produtos, contagem divergente, consulta de faltas, localização, recarga e validação administrativa. Contagem e pendência permanecem separadas após a validação.
- PDF inspecionado por extração textual e renderização das páginas relevantes; 53 linhas somadas, total de 1.484 volumes conferido.
- Captura física da câmera e colaboração entre aparelhos não foram testadas. Esta versão não fornece colaboração em tempo real.
