import { useBlocker } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Btn } from "./ui-kit";

/** Navigation protection only; this is not persistence or a security boundary. */
export function UnsavedChanges({ dirty, onDiscard }: { dirty: boolean; onDiscard?: () => void }) {
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    withResolver: true,
    enableBeforeUnload: dirty,
  });
  return (
    <Dialog
      open={blocker.status === "blocked"}
      onOpenChange={(open) => {
        if (!open) blocker.reset?.();
      }}
    >
      <DialogContent>
        <DialogTitle>Há alterações não salvas</DialogTitle>
        <DialogDescription>
          Volte para salvar o registro ou descarte o rascunho antes de sair desta tela.
        </DialogDescription>
        <div className="flex justify-end gap-2">
          <Btn variant="outline" onClick={() => blocker.reset?.()}>
            Continuar editando
          </Btn>
          <Btn
            onClick={() => {
              onDiscard?.();
              blocker.proceed?.();
            }}
          >
            Descartar e sair
          </Btn>
        </div>
      </DialogContent>
    </Dialog>
  );
}
