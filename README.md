# Conferência Logística POA

Interface interna para avaliar o fluxo de recebimento, conferência física e tratamento administrativo da filial Porto Alegre.

## Estado atual

Etapas 1–3 implementadas: auditoria, design system e frontend reconstruído. Os dados são fictícios. Alterações são mantidas em memória durante a página aberta e descartadas ao recarregar. Autenticação, permissões no backend, banco, PDFs e evidências pertencem à próxima etapa.

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

O projeto continua vinculado ao [Lovable](https://lovable.dev/projects/42f74fe8-916d-42a4-89cf-fe19887191d7). Alterações publicadas na branch conectada podem sincronizar com o editor; não reescrever histórico publicado.
