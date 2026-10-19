# Publicação na Vercel

A configuração Lovable permanece preservada. O Nitro existente produz o formato Build Output API da Vercel quando compilado com `NITRO_PRESET=vercel`.

## Publicação pelo GitHub

O projeto `cargo-conference-compass` está conectado ao repositório na conta Vercel `brunoschardosim60-cmds-projects`. A branch de produção configurada é `codex/reconstrucao-poa`. Novos commits enviados a essa branch disparam a publicação automática, com o preset TanStack Start detectado pela Vercel.

Domínio atribuído ao projeto: https://cargo-conference-compass.vercel.app

Para uma publicação pelo painel, abra Deployments no projeto e acompanhe a compilação do commit desejado. Verifique o commit e o estado Ready antes de considerar a versão disponível. A branch `main` continua preservada para o fluxo existente do Lovable.

## Publicar a versão local revisada

No PowerShell, na pasta do projeto:

```powershell
npx vercel login
npx vercel link
$env:NITRO_PRESET = 'vercel'
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Falha na compilação' }
} finally {
  Remove-Item Env:NITRO_PRESET -ErrorAction SilentlyContinue
}
npx vercel deploy --prebuilt --prod
```

O comando de publicação envia os artefatos em `.vercel/output`, incluindo a função SSR e os arquivos estáticos. Não depende de enviar a branch local ao GitHub. A pasta `.vercel` é ignorada pelo Git, pois contém a associação local com a conta/projeto e arquivos gerados.

## Validação

- Verificar o estado Ready na Vercel.
- Verificar HTTP 200 na raiz, em `/conferencias`, em `/conferencias/CF-DEMO-0142` e em `/pendencias`.
- Abrir a aplicação publicada e confirmar renderização e navegação no navegador.

Esta publicação continua sendo uma demonstração com dados fictícios e estado em memória. Recarregar a página reinicia os dados; autenticação, banco de dados e importação real de PDFs pertencem à próxima etapa.
