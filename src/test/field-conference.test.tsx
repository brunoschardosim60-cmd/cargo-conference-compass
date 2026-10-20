import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Link,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FieldConference } from "@/components/field-conference";
import { OperationProvider } from "@/components/operation-provider";
import { clientGroups } from "@/lib/client-groups";
import { createDemoState } from "@/lib/operation-model";
import { CaseCenter } from "@/components/case-center";

async function mount() {
  const root = createRootRoute({
    component: () => (
      <OperationProvider>
        <Link to="/pendencias">Ir ao administrativo</Link>
        <Outlet />
      </OperationProvider>
    ),
  });
  const route = createRoute({
    getParentRoute: () => root,
    path: "/conferir/$id",
    component: () => <FieldConference id="CF-DEMO-0142" />,
  });
  const router = createRouter({
    routeTree: root.addChildren([
      route,
      createRoute({
        getParentRoute: () => root,
        path: "/pendencias",
        component: () => <CaseCenter />,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/conferir/CF-DEMO-0142"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByRole("heading", { name: "Clientes da carga" });
}

describe("Conferência por cliente no celular", () => {
  beforeEach(() => {
    let id = 0;
    vi.stubGlobal("crypto", { randomUUID: () => `field-test-${++id}` });
    vi.stubGlobal("scrollTo", vi.fn());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
  it("agrupa destinatários apenas na carga escolhida e encontra o cliente pela NF", () => {
    const state = createDemoState();
    const groups = clientGroups(state.notes, "CF-DEMO-0142", "000184539");
    expect(groups).toHaveLength(1);
    expect(groups[0]?.rows).toHaveLength(2);
    expect(groups[0]?.expected).toBe(22);
    expect(groups[0]?.rows.every((n) => n.conferencia === "CF-DEMO-0142")).toBe(true);
    expect(clientGroups(state.notes, "CF-DEMO-0140", "000184539")).toHaveLength(0);
  });
  it("confirma volumes e volta aos clientes com o progresso atualizado", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: /Supermercado Amostra/ }));
    fireEvent.click(screen.getByRole("button", { name: /NF 000184531/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar 15 volumes" }));
    expect(await screen.findByRole("heading", { name: "Clientes da carga" })).toBeInTheDocument();
    expect(screen.getByText("6 de 9 notas conferidas")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Supermercado Amostra.*Contagem concluída/ }),
    ).toBeInTheDocument();
  });
  it("valida divergência e protege a quantidade antes de voltar", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: /Mercado Modelo POA/ }));
    fireEvent.click(screen.getByRole("button", { name: /NF 000184539/ }));
    fireEvent.click(screen.getByRole("button", { name: "Informar divergência" }));
    fireEvent.change(screen.getByLabelText("Volumes encontrados"), { target: { value: "9" } });
    fireEvent.click(screen.getByRole("button", { name: "Notas do cliente" }));
    expect(await screen.findByText("Contagem não salva")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar conferindo" }));
    expect(screen.getByLabelText("Volumes encontrados")).toHaveValue(9);
    fireEvent.click(screen.getByRole("button", { name: "Salvar e continuar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Descreva a divergência");
    fireEvent.change(screen.getByLabelText("Observação *"), {
      target: { value: "Buscar 1 caixa no pavilhão" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar e continuar" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Clientes da carga" })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /Mercado Modelo POA/ }));
    expect(
      screen.getByRole("button", { name: /NF 000184539.*Pendente de localização/ }),
    ).toBeInTheDocument();
  });
  it("leva a conta e a divergência ao administrativo sem perder o registro original após correção", async () => {
    await mount();
    fireEvent.change(screen.getByPlaceholderText("Buscar cliente, NF ou pedido"), {
      target: { value: "000184539" },
    });
    fireEvent.click(screen.getByRole("button", { name: /NF 000184539/ }));
    expect(screen.getByRole("heading", { name: "NF 000184539" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Calculadora" }));
    fireEvent.change(screen.getByLabelText("Conta"), { target: { value: "4 + 5" } });
    fireEvent.click(screen.getByRole("button", { name: "Usar 9 volumes" }));
    expect(screen.getByLabelText("Volumes encontrados")).toHaveValue(9);
    expect(screen.getByLabelText("O que aconteceu?")).toHaveValue("localizacao");
    fireEvent.change(screen.getByLabelText("Observação *"), {
      target: { value: "Buscar uma caixa no pavilhão" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar e continuar" }));
    await screen.findByRole("heading", { name: "Clientes da carga" });
    fireEvent.click(screen.getByRole("button", { name: /Mercado Modelo POA/ }));
    fireEvent.click(screen.getByRole("button", { name: /NF 000184539/ }));
    expect(screen.getByText("Já registrado: 9 volumes")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Volumes encontrados"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("O que aconteceu?"), { target: { value: "conferida" } });
    fireEvent.change(screen.getByLabelText("Observação"), {
      target: { value: "Caixa localizada no pallet P-04" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar e continuar" }));
    await screen.findByRole("heading", { name: "Clientes da carga" });
    fireEvent.click(screen.getByRole("link", { name: "Ir ao administrativo" }));
    await screen.findByRole("heading", { name: "Faltas e divergências" });
    expect(screen.getByText("10 / 10")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Registro que abriu a pendência"));
    expect(screen.getByText(/9 encontrados \/ 10 previstos/)).toBeInTheDocument();
    expect(screen.getByText("Conta original: 4 + 5")).toBeInTheDocument();
    expect(screen.getByText(/A contagem foi corrigida para sem divergência/)).toBeInTheDocument();
    expect(screen.getByText(/Conta anterior: 4 \+ 5/)).toBeInTheDocument();
  });
  it("salva observação mesmo quando todos os volumes foram encontrados", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: /Mercado Modelo POA/ }));
    fireEvent.click(screen.getByRole("button", { name: /NF 000184539/ }));
    fireEvent.change(screen.getByLabelText("Observação da contagem"), {
      target: { value: "Conferido no pallet P-04" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar 10 volumes" }));
    await screen.findByRole("heading", { name: "Clientes da carga" });
    fireEvent.click(screen.getByRole("button", { name: /Mercado Modelo POA/ }));
    fireEvent.click(screen.getByRole("button", { name: /NF 000184539/ }));
    expect(screen.getByText("Conferido no pallet P-04", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByLabelText("Observação da contagem")).toHaveValue("Conferido no pallet P-04");
  });
});
