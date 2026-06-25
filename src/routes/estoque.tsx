import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque Mínimo — Controle de Inventário" },
      {
        name: "description",
        content:
          "Busque por código, fabricante, tipo ou produto e verifique se há necessidade de reposição com base no estoque mínimo.",
      },
      { property: "og:title", content: "Estoque Mínimo — Controle de Inventário" },
      {
        property: "og:description",
        content:
          "Busque por código, fabricante, tipo ou produto e verifique se há necessidade de reposição com base no estoque mínimo.",
      },
    ],
  }),
  component: Estoque,
});

type Produto = {
  codigo: string;
  produto: string;
  fabricante: string;
  tipo: string;
  categoria: string;
  icon: string;
  quantidade: number;
  minimo: number;
};

const PRODUTOS: Produto[] = [
  {
    codigo: "AL-001",
    produto: "Arroz Integral 5kg",
    fabricante: "Tio João",
    tipo: "Grãos",
    categoria: "Alimentos",
    icon: "🍎",
    quantidade: 42,
    minimo: 50,
  },
  {
    codigo: "AL-002",
    produto: "Feijão Carioca 1kg",
    fabricante: "Camil",
    tipo: "Grãos",
    categoria: "Alimentos",
    icon: "🍎",
    quantidade: 80,
    minimo: 50,
  },
  {
    codigo: "BE-001",
    produto: "Refrigerante Cola 2L",
    fabricante: "Coca-Cola",
    tipo: "Bebida Gaseificada",
    categoria: "Bebidas",
    icon: "🥤",
    quantidade: 60,
    minimo: 75,
  },
  {
    codigo: "BE-002",
    produto: "Água Mineral 500ml",
    fabricante: "Crystal",
    tipo: "Água",
    categoria: "Bebidas",
    icon: "🥤",
    quantidade: 120,
    minimo: 75,
  },
  {
    codigo: "LI-001",
    produto: "Detergente Neutro 500ml",
    fabricante: "Ypê",
    tipo: "Limpeza Geral",
    categoria: "Limpeza",
    icon: "🧴",
    quantidade: 20,
    minimo: 30,
  },
  {
    codigo: "LI-002",
    produto: "Água Sanitária 2L",
    fabricante: "Qboa",
    tipo: "Desinfetante",
    categoria: "Limpeza",
    icon: "🧴",
    quantidade: 45,
    minimo: 30,
  },
  {
    codigo: "HI-001",
    produto: "Sabonete Líquido 250ml",
    fabricante: "Protex",
    tipo: "Higiene Pessoal",
    categoria: "Higiene",
    icon: "🧼",
    quantidade: 18,
    minimo: 40,
  },
  {
    codigo: "HI-002",
    produto: "Papel Higiênico 12 un.",
    fabricante: "Neve",
    tipo: "Higiene Pessoal",
    categoria: "Higiene",
    icon: "🧼",
    quantidade: 90,
    minimo: 40,
  },
];

const CARDS: { categoria: string; icon: string }[] = [
  { categoria: "Alimentos", icon: "🍎" },
  { categoria: "Bebidas", icon: "🥤" },
  { categoria: "Limpeza", icon: "🧴" },
  { categoria: "Higiene", icon: "🧼" },
];

function Estoque() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return PRODUTOS.filter((p) => {
      const matchCategoria = categoria ? p.categoria === categoria : true;
      const matchBusca =
        termo === "" ||
        p.codigo.toLowerCase().includes(termo) ||
        p.fabricante.toLowerCase().includes(termo) ||
        p.tipo.toLowerCase().includes(termo) ||
        p.produto.toLowerCase().includes(termo);
      return matchCategoria && matchBusca;
    });
  }, [busca, categoria]);

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Controle de Inventário
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Verificador de Estoque Mínimo
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Busque por código, fabricante, tipo ou produto e veja quais itens precisam de
            reposição.
          </p>
        </header>

        {/* Campo de busca */}
        <div className="mb-8">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
              🔎
            </span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por código, fabricante, tipo ou produto…"
              className="w-full rounded-xl border border-input bg-card px-12 py-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm text-muted-foreground transition hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
          <p className="mt-2 px-1 text-xs text-muted-foreground">
            Filtra por: Código • Fabricante • Tipo • Produto
          </p>
        </div>

        {/* 4 cards principais por categoria */}
        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CARDS.map((c) => {
            const ativo = categoria === c.categoria;
            return (
              <button
                key={c.categoria}
                type="button"
                onClick={() => setCategoria(ativo ? null : c.categoria)}
                className={`group rounded-xl border p-4 text-left transition-all ${
                  ativo
                    ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--color-primary)]"
                    : "border-border bg-card hover:border-accent hover:bg-accent/40"
                }`}
              >
                <div className="text-2xl">{c.icon}</div>
                <div className="mt-2 font-display text-sm font-semibold">{c.categoria}</div>
                <div className="text-xs text-muted-foreground">
                  {PRODUTOS.filter((p) => p.categoria === c.categoria).length} produto(s)
                </div>
              </button>
            );
          })}
        </section>

        {/* Resultados */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-lg shadow-black/20 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              {categoria ? `Categoria: ${categoria}` : "Todos os produtos"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {resultados.length} resultado(s)
            </span>
          </div>

          {resultados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado para a busca informada.
            </div>
          ) : (
            <ul className="grid gap-3">
              {resultados.map((p) => {
                const baixo = p.quantidade < p.minimo;
                return (
                  <li
                    key={p.codigo}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl">{p.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            {p.codigo}
                          </span>
                          <h3 className="font-display text-sm font-semibold text-foreground">
                            {p.produto}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <strong className="text-foreground">Fabricante:</strong> {p.fabricante}{" "}
                          • <strong className="text-foreground">Tipo:</strong> {p.tipo} •{" "}
                          <strong className="text-foreground">Categoria:</strong> {p.categoria}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
                            <div
                              className={`h-full rounded-full ${
                                baixo ? "bg-warning" : "bg-primary"
                              }`}
                              style={{
                                width: `${Math.min(100, (p.quantidade / p.minimo) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {p.quantidade} / mín. {p.minimo} un.
                          </span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          baixo
                            ? "bg-warning/15 text-warning-foreground"
                            : "bg-primary/15 text-foreground"
                        }`}
                      >
                        {baixo ? "📦 Repor" : "✅ OK"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            ← Voltar à tela de acesso
          </Link>
        </footer>
      </div>
    </div>
  );
}
