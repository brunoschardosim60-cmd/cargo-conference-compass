import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CaseCenter } from "@/components/case-center";
import { OperationProvider } from "@/components/operation-provider";

function mount(tower = false) {
  const root = createRootRoute({
    component: () => (
      <OperationProvider>
        <Link to="/historico">Sair para histórico</Link>
        <Outlet />
      </OperationProvider>
    ),
  });
  const cases = createRoute({
    getParentRoute: () => root,
    path: "/pendencias",
    component: () => <CaseCenter tower={tower} />,
  });
  const history = createRoute({
    getParentRoute: () => root,
    path: "/historico",
    component: () => <h1>Destino histórico</h1>,
  });
  const router = createRouter({
    routeTree: root.addChildren([cases, history]),
    history: createMemoryHistory({ initialEntries: ["/pendencias"] }),
  });
  render(<RouterProvider router={router} />);
  return screen.findByLabelText("Providência tomada / próxima ação");
}

describe("Proteção dos tratamentos administrativos", () => {
  beforeEach(() => {
    let id = 0;
    vi.stubGlobal("crypto", { randomUUID: () => `case-test-${++id}` });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("preserva rascunho ao cancelar filtro e só o descarta após confirmação", async () => {
    const action = await mount();
    fireEvent.change(action, { target: { value: "Consultar pavilhão" } });
    const search = screen.getByPlaceholderText("Buscar NF, cliente, responsável ou pendência");
    fireEvent.change(search, { target: { value: "sem resultado" } });
    expect(await screen.findByText("Há um tratamento não salvo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(action).toHaveValue("Consultar pavilhão");
    expect(search).toHaveValue("");
    fireEvent.change(search, { target: { value: "sem resultado" } });
    fireEvent.click(screen.getByRole("button", { name: "Descartar e continuar" }));
    expect(await screen.findByText("Nenhuma pendência encontrada")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
    expect(await screen.findByLabelText("Providência tomada / próxima ação")).toHaveValue("");
  });

  it("protege troca de caso e mantém providência salva ao voltar", async () => {
    const action = await mount();
    fireEvent.change(action, { target: { value: "Buscar no pallet P-02" } });
    fireEvent.click(screen.getByRole("button", { name: "NF 000184520" }));
    fireEvent.click(await screen.findByRole("button", { name: "Continuar editando" }));
    expect(action).toHaveValue("Buscar no pallet P-02");
    fireEvent.change(screen.getByLabelText("Responsável"), { target: { value: "Ana P." } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar tratamento" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Salvar tratamento" })).toBeDisabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "NF 000184520" }));
    expect(screen.queryByText("Há um tratamento não salvo")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "NF 000184513" }));
    expect(screen.getByLabelText("Providência tomada / próxima ação")).toHaveValue(
      "Buscar no pallet P-02",
    );
  });

  it("bloqueia navegação de rota enquanto o tratamento não foi salvo", async () => {
    const action = await mount();
    fireEvent.change(action, { target: { value: "Verificação em andamento" } });
    fireEvent.click(screen.getByRole("link", { name: "Sair para histórico" }));
    expect(await screen.findByText("Há alterações não salvas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(action).toHaveValue("Verificação em andamento");
    fireEvent.click(await screen.findByRole("link", { name: "Sair para histórico" }));
    fireEvent.click(await screen.findByRole("button", { name: "Descartar e sair" }));
    expect(await screen.findByRole("heading", { name: "Destino histórico" })).toBeInTheDocument();
  });

  it("exige confirmação de recebimento na torre antes de resolver", async () => {
    const action = await mount(true);
    fireEvent.change(action, { target: { value: "Volume recebido" } });
    fireEvent.change(screen.getByLabelText("Responsável"), { target: { value: "Torre" } });
    fireEvent.change(screen.getByLabelText("Situação interna"), { target: { value: "resolvida" } });
    fireEvent.change(screen.getByLabelText("Justificativa do encerramento *"), {
      target: { value: "Conferido no destino" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar tratamento" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Confirme a verificação do recebimento");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Salvar tratamento" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "NF 000184513" })).not.toBeInTheDocument(),
    );
  });
});
