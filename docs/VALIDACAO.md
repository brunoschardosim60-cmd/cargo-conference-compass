# Validação da reconstrução

Verificações realizadas em 19/10/2026, no checkout local da branch `codex/reconstrucao-poa`.

## Verificações automatizadas

| Verificação | Resultado |
| --- | --- |
| `npx tsc --noEmit` | Passou |
| `npm test` | 29 testes passaram em 5 arquivos após a experiência móvel |
| `npm run build` | Build de produção client/SSR/Nitro concluído |
| ESLint nos arquivos TS/TSX novos e modificados | Zero erros; quatro avisos `react-refresh/only-export-components` nos mapas exportados pelo componente legado de status |
| Prettier nos arquivos de implementação alterados | Aplicado |
| `git diff --check` | Sem erros de whitespace |

O build emite um aviso de `vite-tsconfig-paths`: a versão instalada do Vite oferece resolução nativa. O plugin faz parte da configuração Lovable preservada; não foi removido isoladamente.

## Revisão funcional posterior

Correções aplicadas em 19/10/2026:

- Tratamentos não salvos agora exigem confirmação de descarte ao trocar de caso, filtrar ou sair da rota. Cancelar mantém os campos; salvar libera a navegação.
- A fila de próxima nota inclui registros a localizar que ainda não possuem quantidade encontrada. A mesma regra determina progresso e finalização.
- Pausar exige salvar a contagem em edição, evitando deixar um rascunho bloqueado para salvamento.
- O total encontrado da operação acompanha as alterações das notas.
- Salvar uma nota sem mudanças não cria nova pendência após resolução nem duplica seu histórico.
- Operações concluídas não voltam para aguardando; selecionar o estado atual não gera evento.
- Edições parciais de tratamento registram os valores efetivamente preservados, inclusive referência oficial e providência. Repetir a atualização sem mudanças não duplica eventos.

Nove testes de regressão foram adicionados. Quatro exercitam a central com React Testing Library, jsdom e o roteador real: descarte de filtro, troca de caso e retomada do salvo, proteção de navegação e confirmação de recebimento pela torre. Os demais verificam fila incompleta, agregado por operação, repetição de salvamento, transições e histórico parcial. TypeScript, ESLint dos sete arquivos TS/TSX desta revisão e build de produção passaram. As verificações de navegador abaixo pertencem à validação inicial; nesta revisão a interação foi revalidada pelos testes automatizados.

Cobertura adicionada: quantidades inválidas; diferença entre contagem correta, localização, falta e excedente; observação obrigatória; notas com mesmo número em operações diferentes; ausência de duplicação de caso aberto; revisão preservando contagem e observação anteriores; localização sem encerramento automático; bloqueio de operação concluída; finalização incompleta ou vazia; criação/início/pausa/retomada/finalização; encerramento com justificativa; referência oficial como declaração manual. O teste de rota inicial existente continua passando.

## Verificações no navegador

Chrome desktop e navegador integrado do Codex; breakpoint estreito de 390px e desktop de 1440px. O documento apresentou `scrollWidth === clientWidth` nas verificações estreita e desktop. Tabelas largas têm sua própria rolagem.

- Dashboard e navegação agrupada renderizados; menu responsivo com foco e fechamento.
- Páginas de conferências, notas, pendências, torre, outras praças, histórico, usuários e configurações renderizadas.
- Busca global por `000184513` abriu a NF correspondente na operação `CF-DEMO-0142`, com contagem 6 de 8.
- Contagem divergente sem observação bloqueada com mensagem clara.
- Troca de NF com rascunho abriu confirmação; voltar permitiu completar e salvar o registro.
- Navegação para outro módulo com contagem não salva abriu confirmação de descarte.
- Salvar e avançar atualizou a relação e criou pendência na central administrativa.
- Encerramento sem justificativa foi bloqueado; resolução justificada atualizou a fila e gerou evento no histórico.
- Nova operação manual com uma NF de 50 volumes foi criada, iniciada e conferida com 49 encontrados, mantendo o resultado como pendente de localização.
- Finalização exigiu confirmação, bloqueou a edição posterior e manteve a divergência para análise administrativa.
- Chegada não preenchida permaneceu como não informada.

Durante edição com HMR, foi identificada uma recriação inconsistente do contexto React. O contexto/hook foram movidos para `src/lib/operation-context.ts`, separados do componente Provider. A verificação após novo carregamento e navegação/busca não apresentou novos erros de console.

Capturas: [visão geral](screenshots/visao-geral.png) e [mesa de conferência](screenshots/conferencia.png).

## Como avaliar localmente

### Experiência do conferente no celular

Em `/conferir`, o conferente usa uma interface dedicada: cargas → destinatários → notas → contagem. A página inicial também exibe essa interface em larguras de até 720px. Isso é uma escolha de apresentação, não controle de acesso; o vínculo entre usuário autenticado e suas cargas depende do backend futuro.

Agrupamento atual: destinatário, sempre dentro da operação selecionada. A lista distingue contagem concluída de contagem com divergência. A confirmação da quantidade prevista é explícita; divergências exigem quantidade e observação. Finalização, estados e auditoria usam o mesmo modelo da interface administrativa.

Validação em Chrome a 390×844: lista de cargas, clientes e tela de contagem renderizadas; sem rolagem horizontal na contagem (`scrollWidth === clientWidth`). Três testes adicionais cobrem isolamento do agrupamento, confirmação com progresso atualizado e divergência com proteção do rascunho. O botão administrativo de PDF está marcado como “Em preparação” e explica envio → revisão → liberação; não lê nem envia arquivos nesta versão.

1. Executar `npm install`, caso as dependências não estejam instaladas.
2. Executar `npm run dev -- --host 127.0.0.1 --port 4173` na pasta do repositório.
3. Abrir `http://127.0.0.1:4173`.
4. Em Conferências, abrir `CF-DEMO-0142`; registrar uma NF pendente e verificar a central e o histórico.
5. Para testar um ciclo completo, criar uma nova operação manual com uma ou duas notas, iniciar, contar, salvar e finalizar.
6. Recarregar a página para reiniciar a amostra.

Essas verificações não equivalem a homologação com documentos reais, teste de carga, auditoria de segurança ou validação de permissões no servidor. Esses serviços ainda não estão implementados nesta etapa de frontend.
