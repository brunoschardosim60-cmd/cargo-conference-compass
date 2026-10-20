# Conferência Logística POA

Interface interna para avaliar o fluxo de recebimento, conferência física e tratamento administrativo da filial Porto Alegre.

## Estado atual

Fluxo principal: importar a relação DAMDFE em PDF, revisar notas e volumes, confirmar a operação e conferir por cliente/destino no celular. PDFs com texto no modelo detalhado têm leitura multipágina no navegador. O original é preservado em IndexedDB e pode ser baixado na operação; duplicidades são bloqueadas pelo hash do arquivo.

Registros, contagens e evidências locais persistem entre recargas. As operações de exemplo continuam identificáveis pelo prefixo `CF-DEMO`; operações manuais/importadas usam `CF-LOCAL`. Login individual, permissões no servidor, banco compartilhado e sincronização entre aparelhos ainda não estão conectados. PDFs digitalizados não têm OCR nesta versão.

- [Importação de PDF e validação do fluxo](docs/IMPORTACAO-PDF.md)
- [Preparação para persistência centralizada](docs/PERSISTENCIA-CENTRALIZADA.md)

- [Auditoria, arquitetura e arquivos modificados](docs/RECONSTRUCAO-POA.md)
- [Verificações e roteiro de avaliação](docs/VALIDACAO.md)

## Desenvolvimento

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

## Verificação

```sh
npx tsc --noEmit
npm test
npm run build
```

React, TypeScript, TanStack Start/Router, Tailwind, Radix e Vite. A configuração de execução do Lovable foi mantida.

O repositório mantém `bun.lock`; para instalação reproduzível com Bun use `bun install --frozen-lockfile`. A dependência PDF.js é carregada somente ao selecionar um PDF ou abrir sua prévia.

O projeto continua vinculado ao [Lovable](https://lovable.dev/projects/42f74fe8-916d-42a4-89cf-fe19887191d7). Alterações publicadas na branch conectada podem sincronizar com o editor; não reescrever histórico publicado.
