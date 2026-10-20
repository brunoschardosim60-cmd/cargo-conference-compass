export function pdfAssetOptions(version: string) {
  const base = new URL(`/pdfjs/${version}/`, window.location.origin).href;
  return {
    wasmUrl: `${base}wasm/`,
    standardFontDataUrl: `${base}standard_fonts/`,
    useSystemFonts: false,
  };
}
