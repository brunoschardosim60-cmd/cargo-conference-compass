// Original documents remain in IndexedDB on this device; no public uploads or external service.
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("poa-original-documents-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("pdfs");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("Não foi possível abrir o armazenamento de PDFs neste navegador."));
    request.onblocked = () =>
      reject(new Error("Feche outras abas deste sistema e tente novamente."));
  });
}
export async function preservePdf(sha256: string, file: Blob) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("pdfs", "readwrite");
      tx.objectStore("pdfs").put(file, sha256);
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () =>
        reject(
          new Error(
            "Não foi possível preservar o PDF original. A operação não foi criada; verifique o espaço disponível.",
          ),
        );
    });
  } finally {
    db.close();
  }
}
export async function originalPdf(sha256: string): Promise<Blob> {
  const db = await database();
  try {
    return await new Promise<Blob>((resolve, reject) => {
      const request = db.transaction("pdfs", "readonly").objectStore("pdfs").get(sha256);
      request.onsuccess = () =>
        request.result instanceof Blob
          ? resolve(request.result)
          : reject(
              new Error(
                "O PDF original não está disponível neste aparelho. Use o navegador em que ele foi importado.",
              ),
            );
      request.onerror = () => reject(new Error("Não foi possível ler o PDF original."));
    });
  } finally {
    db.close();
  }
}
