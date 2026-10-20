# Revisão do conferente ao administrativo

Solicitação: facilitar o uso por funcionários com diferentes idades e familiaridade com sistemas; incluir calculadora; verificar os registros; preparar a validação com o PDF original.

## Entregue nesta revisão

- Textos principais, campos e resultados maiores no celular; alvos de toque de 44–52px; foco visível; retorno ao topo e identificação da nova nota ao mudar de etapa.
- Busca por NF/pedido abre a nota diretamente, sempre dentro da carga selecionada.
- Calculadora compartilhada entre celular e mesa desktop, com teclado de toque, correção, total e aplicação explícita. Não salva a nota automaticamente. Quantidades negativas, fracionárias, divisão por zero, valores inseguros e contas incompletas são bloqueados.
- A conta aplicada acompanha a nota e o histórico. Digitar outra quantidade remove a conta do rascunho para não associar uma expressão a um resultado diferente.
- Observação disponível também na confirmação sem divergência; contagem já registrada visível ao reabrir; aviso de rascunho e confirmação de salvamento na sessão.
- Novas pendências guardam a quantidade, situação, observação, conta, usuário demonstrativo e horário de abertura. Correções não substituem esse registro original nem encerram automaticamente a pendência.
- Administrativo distingue a última contagem do registro original e apresenta histórico do caso. A torre registra explicitamente a declaração de verificação de recebimento/resolução.
- Histórico oferece download JSON das operações, notas, pendências e eventos da sessão. O arquivo identifica claramente o ambiente de teste. Não há importação/restauração deste arquivo nesta revisão.

## Limites verificados

O estado é mantido em memória. Recarregar a página reinicia a amostra. Não existe sincronização entre aparelhos, login real, autorização no servidor, armazenamento de evidências ou auditoria durável. O ator das alterações continua sendo o usuário demonstrativo, e não uma identidade autenticada. O download é uma cópia para inspeção dos testes, não substitui o banco de dados.

As pendências antigas da amostra não possuem fotografia do registro original. A interface informa essa ausência; não reconstrói evidências que não foram armazenadas.

O PDF original ainda não foi recebido. A importação permanece marcada como “Em preparação”; nenhum campo é extraído automaticamente nesta versão. Nenhuma migração ou integração oficial foi executada.

## Validação

46 testes automatizados passam, incluindo conta inválida, precisão numérica, teclado de toque, transferência para a quantidade, busca direta, observação sem divergência e ciclo 9 → 10 volumes com registro original preservado no administrativo. TypeScript, ESLint dos arquivos alterados e build de produção verificados.

No navegador integrado: busca da NF 000184539, soma 4+5 pelo teclado, aplicação de 9 volumes, observação e salvamento; pendência disponível na central com a conta original e o evento no histórico. Download JSON inspecionado e comparado com os valores salvos. Revisão visual do celular em 390×844 e do administrativo em 1440×900.

## Próxima validação com a operação

1. Usar o PDF original completo para identificar cabeçalhos, linhas, páginas, totais e campos ausentes.
2. Confirmar se “cliente” significa remetente, destinatário ou agrupamento operacional. Atualmente o agrupamento é por destinatário.
3. Implementar extração com prévia corrigível, vínculo à operação e prevenção de duplicidades; preservar o original em armazenamento protegido.
4. Conectar autenticação, permissões no backend, persistência e sincronização antes de usar cargas reais.
5. Testar em um celular real com conferentes: localizar cliente/NF, contar pallets, registrar uma caixa a localizar, corrigir a contagem e finalizar. Validar também teclado, legibilidade e rede do pavilhão.
