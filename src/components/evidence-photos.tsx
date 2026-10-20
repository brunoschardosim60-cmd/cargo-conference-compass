import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import type { Evidence } from "@/lib/operation-model";
import { Btn } from "./ui-kit";

export function EvidencePhotos({
  photos,
  onChange,
}: {
  photos: Evidence[];
  onChange?: (photos: Evidence[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function attach(file?: File) {
    if (!file || !onChange) return;
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 15 * 1024 * 1024
    ) {
      setError("Escolha uma foto JPG, PNG ou WebP de até 15 MB.");
      return;
    }
    setBusy(true);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const ratio = Math.min(1, 1400 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * ratio);
      canvas.height = Math.round(image.height * ratio);
      const context = canvas.getContext("2d");
      if (!context) throw new Error();
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      onChange([
        ...photos,
        {
          id: crypto.randomUUID(),
          name: file.name,
          createdAt: new Date().toISOString(),
          data: canvas.toDataURL("image/jpeg", 0.8),
        },
      ]);
    } catch {
      setError("Não foi possível abrir a foto. Tente outra imagem.");
    } finally {
      URL.revokeObjectURL(url);
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div className="evidence-photos">
      {!!photos.length && (
        <div className="evidence-grid">
          {photos.map((photo) => (
            <figure key={photo.id}>
              <a href={photo.data} download={photo.name}>
                <img src={photo.data} alt={`Foto anexada: ${photo.name}`} />
              </a>
              {onChange && (
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remover foto ${photo.name}`}
                  onClick={() => onChange(photos.filter((p) => p.id !== photo.id))}
                >
                  <X size={17} />
                </button>
              )}
            </figure>
          ))}
        </div>
      )}
      {onChange && (
        <>
          <input
            ref={input}
            className="sr-only"
            tabIndex={-1}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            aria-label="Foto da etiqueta ou mercadoria"
            onChange={(e) => void attach(e.target.files?.[0])}
          />
          <Btn
            type="button"
            variant="outline"
            disabled={busy || photos.length >= 3}
            onClick={() => input.current?.click()}
          >
            <Camera size={18} />
            {busy ? "Preparando foto…" : "Fotografar / anexar"}
          </Btn>
          <p className="calculator-hint">
            Até 3 fotos por registro, reduzidas para este teste local. Toque na foto para baixar.
          </p>
        </>
      )}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}
