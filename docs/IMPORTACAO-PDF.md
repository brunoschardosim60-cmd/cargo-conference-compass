# Relação PDF como entrada principal

## Uso

1. Conferências → Importar relação → selecionar PDF.
2. O leitor percorre as páginas e identifica a tabela Doc / NF / Remetente / Destinatário / Destino / Endereço / Vol. / Peso.
3. Administrativo confirma a origem, placa e motorista. Chegada, doca e responsável ficam vazios quando ausentes. Emissão e início de viagem nunca são convertidos em chegada.
4. Revisar as linhas, pesquisar NFs, corrigir dados e consultar a página original na prévia. Ampliar página permite ler a impressão miúda do documento sem reduzir os campos da aplicação. Notas e volumes inválidos ou duplicados bloqueiam confirmação. Totais divergentes ou não identificados exigem justificativa.
5. Confirmar revisão de todas as páginas. O original é preservado antes de criar a operação. Todas as notas começam sem contagem e pendentes.
6. O conferente encontra a carga no celular e vê clientes separados por destino. A NF abre a contagem física, calculadora, fotos e divergências já existentes.

## Campos e preservação

Cada linha mantém NF, documento de transporte, remetente, destinatário, destino, volumes, peso quando legível e página/linha de origem. Pedido e pallet não são inferidos. Campos corrigidos ficam na relação revisada; o original imutável, identificado pelo SHA-256, permanece disponível para confronto.

Deduplicação do arquivo inteiro por hash no estado persistido; NF + documento não pode se repetir na mesma operação. Mesmo número de NF em documentos diferentes não é fundido automaticamente. Nomes semelhantes de destinatários não são unidos por aproximação; o administrativo pode corrigir os nomes na revisão.

O leitor não usa a quantidade de CT-e do cabeçalho como quantidade de notas ou volumes. Não interpreta instruções em texto do PDF como ações do sistema.

## Escopo e limites

PDF.js 6.4.299, worker empacotado pelo Vite, processamento local sem APIs externas. Modelo principal: DAMDFE detalhado com texto extraível. Até 20 MB e 100 páginas por arquivo para limitar consumo de memória. PDFs com senha, inválidos, somente imagem ou com tabela não reconhecida geram mensagem clara, sem criar dados. OCR e outros leiautes não estão implementados.

`scripts/prepare-pdfjs.mjs` copia codecs WASM/fallback e fontes padrão, com as licenças, do pacote instalado para assets locais versionados antes de dev/build. A prévia usa esses recursos da mesma origem; não depende de CDNs para imagens, códigos impressos e fontes do original. Assets gerados não são versionados no Git.

Dados da relação persistem em localStorage; PDF original em IndexedDB (`poa-original-documents-v1`). Limpar dados do navegador remove ambos. O backup JSON inclui os metadados, mas não os arquivos PDF: baixar o original pela operação. Nenhum PDF pessoal ou dado da relação foi incluído no repositório ou enviado para um serviço de extração.

Ainda não há autenticação, autorização no servidor ou sincronização: o administrativo e os conferentes em aparelhos diferentes dependem da próxima etapa de backend. O ator de auditoria continua explicitamente demonstrativo.

## Verificações executadas

- Arquivo fornecido: quatro páginas, tabelas nas páginas 3 e 4. As 53 NFs e respectivas quantidades exibidas na prévia foram comparadas, linha a linha, com leitura independente por pdfplumber: todas coincidiram; soma de 1.484 volumes.
- Confirmação cria uma operação com 53 notas pendentes, preservada após recarregar.
- Download do PDF original comparado por SHA-256: idêntico ao arquivo enviado.
- Testes cobrem tabelas multipágina, totais, campos ambíguos, ausência de texto, duplicidades, validação antes de persistir, revisão invalidada após correção, falha ao guardar o original, confirmação, vínculo à operação e agrupamento por destino.
- Interface verificada em computador e viewport mobile de 360 × 800. Tabelas administrativas passam a usar 12–14 px e informações secundárias 13 px. Campos mobile usam 16 px ou mais; calculadora com rótulos maiores e remoção de linha com alvo de toque de 44 px.
