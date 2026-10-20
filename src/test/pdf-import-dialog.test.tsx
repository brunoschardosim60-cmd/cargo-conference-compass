import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { OperationProvider } from "@/components/operation-provider";
import { PdfImportDialog } from "@/components/pdf-import-dialog";
import { readCargoPdf } from "@/lib/pdf-reader";
import { preservePdf } from "@/lib/pdf-documents";
import { WORKSPACE_KEY } from "@/lib/local-workspace";
vi.mock("@/lib/pdf-reader", () => ({ readCargoPdf: vi.fn() }));
vi.mock("@/lib/pdf-documents", () => ({ preservePdf: vi.fn() }));
const result = () => ({
  sha256: "b".repeat(64),
  extraction: {
    rows: [
      {
        nf: "000001",
        documento: "100-1",
        remetente: "Origem documental",
        destinatario: "Cliente teste",
        praca: "CANOAS-RS",
        previstos: 50,
        peso: 20,
        pedido: "",
        pallet: "",
        sourcePage: 3,
        sourceLine: 1,
        issues: [],
      },
    ],
    pages: 4,
    detailPages: [3],
    declaredRows: 1,
    declaredVolumes: 50,
    plates: ["TEST123"],
    driver: "Motorista teste",
    warnings: [],
  },
});
async function mount() {
  const root = createRootRoute({
    component: () => (
      <OperationProvider>
        <Outlet />
      </OperationProvider>
    ),
  });
  const home = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => <PdfImportDialog open onOpenChange={() => {}} />,
  });
  const target = createRoute({
    getParentRoute: () => root,
    path: "/conferencias/$id",
    component: () => <h1>Operação importada</h1>,
  });
  const router = createRouter({
    routeTree: root.addChildren([home, target]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(<RouterProvider router={router} />);
  const input = await screen.findByLabelText("Selecionar relação em PDF");
  fireEvent.change(input, {
    target: { files: [new File(["%PDF-test"], "relacao.pdf", { type: "application/pdf" })] },
  });
  await screen.findByText("1 notas · 50 volumes físicos");
}
describe("Revisão humana antes de importar PDF", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    let id = 0;
    vi.stubGlobal("crypto", { randomUUID: () => `test-${++id}` });
    vi.mocked(readCargoPdf).mockResolvedValue(result());
    vi.mocked(preservePdf).mockResolvedValue();
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
  });
  it("exige origem operacional e revisão; uma correção invalida a confirmação anterior", async () => {
    await mount();
    const confirm = screen.getByRole("button", { name: "Confirmar importação" });
    expect(confirm).toBeDisabled();
    expect(screen.getByLabelText("Origem da carga *")).toHaveValue("");
    fireEvent.change(screen.getByLabelText("Origem da carga *"), {
      target: { value: "Origem confirmada" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    expect(confirm).toBeEnabled();
    fireEvent.change(screen.getByLabelText("Volumes da linha 1"), { target: { value: "49" } });
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(confirm).toBeDisabled();
    expect(screen.getByLabelText("Explique o ajuste ou a diferença *")).toBeInTheDocument();
  });
  it("não cria operação quando não consegue preservar o PDF original", async () => {
    vi.mocked(preservePdf).mockRejectedValue(new Error("Armazenamento indisponível"));
    await mount();
    fireEvent.change(screen.getByLabelText("Origem da carga *"), {
      target: { value: "Origem confirmada" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar importação" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Armazenamento indisponível");
    expect(localStorage.getItem(WORKSPACE_KEY)).toBeNull();
  });
  it("grava somente após preservar o original e mantém todas as notas pendentes", async () => {
    await mount();
    fireEvent.change(screen.getByLabelText("Origem da carga *"), {
      target: { value: "Origem confirmada" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar importação" }));
    await screen.findByRole("heading", { name: "Operação importada" });
    const saved = JSON.parse(localStorage.getItem(WORKSPACE_KEY)!);
    expect(preservePdf).toHaveBeenCalledOnce();
    expect(saved.operations[0].source.sha256).toBe("b".repeat(64));
    expect(saved.notes.at(-1)).toMatchObject({
      nf: "000001",
      previstos: 50,
      encontrados: null,
      status: "pendente",
      sourcePage: 3,
    });
  });
  it("pede confirmação ao fechar uma revisão ainda não importada", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Descartar a revisão do PDF?" }),
      ).toBeInTheDocument(),
    );
    expect(preservePdf).not.toHaveBeenCalled();
  });
});
