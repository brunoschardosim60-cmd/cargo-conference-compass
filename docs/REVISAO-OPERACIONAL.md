# Revisão operacional — 20/10/2026

## Interface

- Navegação principal: Conferências, Faltas e divergências, Outras praças e Histórico. Usuários/configurações em Administração, área secundária. Nenhum fluxo de torre.
- Início e listagem de conferências compartilham a mesma página. Busca por NF, pedido, cliente, placa, motorista, origem e operação; filtros recolhidos por responsável, chegada e pendências abertas.
- Tabela com notas conferidas, responsável, doca/chegada, situação e link direto para pendências da operação. Abrir, Continuar ou Consultar conforme a situação.
- Conferente mantém interface própria: carga → cliente → nota. Busca pela NF desde a lista de cargas. Contagem, observação, foto, rascunho local e calculadora permanecem disponíveis.
- Calculadora opcional: aritmética de volumes e grupos de caixas/produtos separados, comparação e confirmação antes de aplicar. Produtos nunca confirmam automaticamente volumes.
- Central de faltas mantém registro original, fotos, tratamento e validação administrativa das descobertas. Filtros recolhidos, links diretos por operação/caso.
- Outras praças agora permite cadastrar e atualizar identificação, destino, responsável, fotos, observações, veículo e saída. Recebimento exige confirmação manual separada e data. Busca por NF, identificação, cliente, destino e data de identificação ou saída.
- Histórico pesquisa contexto do registro (NF/cliente/destino/identificação), usuário e data. Eventos expansíveis levam diretamente ao volume, pendência ou conferência. Fotos adicionadas permanecem nos eventos mesmo se retiradas do registro atual.

## Dados e limites

Funcionalidades interativas gravam no navegador, com falha de gravação sinalizada e detecção de alterações em outra aba. Os dados de avaliação já existentes são preservados. A inclusão de outras praças é aditiva; a leitura da versão antiga não sobrescreve o armazenamento.

As cargas de exemplo e o usuário são demonstrativos. Não há login individual, autorização de backend, armazenamento privado, sincronização entre aparelhos ou auditoria protegida. A interface não simula registro oficial na Luft. Cadastro manual funciona; extração/importação de PDF continua pendente.

Contrato tipado do futuro serviço e plano relacional/autorização/sincronização em `backend-contract.ts` e `PERSISTENCIA-CENTRALIZADA.md`. Nenhum endpoint ou banco foi configurado nesta revisão.

## Validação

Testes de domínio incluem identificação → envio → recebimento, datas inválidas, ordem cronológica, dados obrigatórios, preservação de fotos/eventos, separação de faltas locais, migração não destrutiva, busca e filtro de chegada. Suíte existente cobre calculadora, rascunhos, divergências, retomada, localização/validação e fechamento.

Verificação no navegador em 1440 × 950 e 390 × 844: navegação administrativa, cadastro/saída/recebimento de outra praça, persistência após recarregar, pesquisa histórica e fluxo mobile carga → cliente → nota/calculadora.

Próxima etapa: conectar autenticação, banco e storage privado; validar permissões e concorrência em dois aparelhos antes de liberar a operação real. Depois implementar importação do PDF com revisão humana, documento original preservado e deduplicação.
