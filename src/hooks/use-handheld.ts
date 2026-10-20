import { useSyncExternalStore } from "react";

const query = "(max-width: 720px)";
function subscribe(listener: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
// Presentation only: permissions must come from the authenticated backend.
export function useHandheld() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
