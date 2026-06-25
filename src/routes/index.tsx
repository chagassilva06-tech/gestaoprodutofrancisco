import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Estoque Mínimo — Controle de Inventário" },
      {
        name: "description",
        content:
          "Verifique rapidamente se um produto precisa de reposição com base no estoque mínimo por categoria.",
      },
      { property: "og:title", content: "Estoque Mínimo — Controle de Inventário" },
      {
        property: "og:description",
        content:
          "Verifique rapidamente se um produto precisa de reposição com base no estoque mínimo por categoria.",
      },
    ],
  }),
  component: Index,
});

type CategoryKey = "alimentos" | "bebidas" | "limpeza";

const CATEGORIES: { key: CategoryKey; label: string; min: number; icon: string }[] = [
  { key: "alimentos", label: "Alimentos", min: 50, icon: "🍎" },
  { key: "bebidas", label: "Bebidas", min: 75, icon: "🥤" },
  { key: "limpeza", label: "Limpeza", min: 30, icon: "🧴" },
];

type Result =
  | { type: "error"; message: string }
  | { type: "low"; product: string; quantity: number; min: number; category: string }
  | { type: "ok"; product: string; quantity: number; min: number; category: string };

function Index() {
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState<CategoryKey | "">("");
  const [quantity, setQuantity] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const selected = useMemo(
    () => CATEGORIES.find((c) => c.key === category) ?? null,
    [category],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (product.trim() === "" || category === "" || quantity.trim() === "") {
      setResult({ type: "error", message: "Preencha todas as informações corretamente." });
      return;
    }

    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty)) {
      setResult({ type: "error", message: "Informe uma quantidade válida." });
      return;
    }

    const cat = CATEGORIES.find((c) => c.key === category)!;
    const name = product.trim().toLowerCase();

    if (qty < cat.min) {
      setResult({ type: "low", product: name, quantity: qty, min: cat.min, category: cat.label });
    } else {
      setResult({ type: "ok", product: name, quantity: qty, min: cat.min, category: cat.label });
    }
  }

  function reset() {
    setProduct("");
    setCategory("");
    setQuantity("");
    setResult(null);
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Controle de Inventário
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Verificador de Estoque Mínimo
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Informe o produto, a categoria e a quantidade atual para saber se é hora de
            solicitar reposição.
          </p>
        </header>

        <section className="mb-8 grid grid-cols-3 gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`group rounded-xl border p-4 text-left transition-all ${
                category === c.key
                  ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--color-primary)]"
                  : "border-border bg-card hover:border-accent hover:bg-accent/40"
              }`}
            >
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-2 font-display text-sm font-semibold">{c.label}</div>
              <div className="text-xs text-muted-foreground">mín. {c.min} un.</div>
            </button>
          ))}
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20 sm:p-8"
        >
          <div className="grid gap-5">
            <div>
              <label htmlFor="product" className="mb-2 block text-sm font-medium">
                Nome do produto
              </label>
              <input
                id="product"
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Ex.: Arroz integral"
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-medium">
                  Categoria
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryKey | "")}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40"
                >
                  <option value="">Selecione…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="mb-2 block text-sm font-medium">
                  Quantidade atual
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ex.: 40"
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40"
                />
              </div>
            </div>

            {selected && (
              <p className="text-xs text-muted-foreground">
                Estoque mínimo para <strong className="text-foreground">{selected.label}</strong>:{" "}
                {selected.min} unidades.
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99]"
              >
                Verificar estoque
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-border bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground transition hover:bg-accent"
              >
                Limpar
              </button>
            </div>
          </div>
        </form>

        {result && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
            {result.type === "error" && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive-foreground">
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <p className="font-medium">{result.message}</p>
                </div>
              </div>
            )}

            {result.type === "low" && (
              <div className="rounded-2xl border border-warning/40 bg-warning/10 p-6">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">📦</span>
                  <div>
                    <h2 className="font-display text-lg font-semibold capitalize text-foreground">
                      Solicitar {result.product} à equipe
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Temos apenas <strong className="text-foreground">{result.quantity}</strong>{" "}
                      unidades — abaixo do mínimo de {result.min} para {result.category}.
                    </p>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-warning"
                        style={{
                          width: `${Math.min(100, (result.quantity / result.min) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result.type === "ok" && (
              <div className="rounded-2xl border border-primary/40 bg-primary/10 p-6">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">✅</span>
                  <div>
                    <h2 className="font-display text-lg font-semibold capitalize text-foreground">
                      Estoque de {result.product} está normal
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <strong className="text-foreground">{result.quantity}</strong> unidades em
                      estoque — acima do mínimo de {result.min} para {result.category}.
                    </p>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.min(100, (result.quantity / result.min) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Estoque mínimo configurável por categoria · Alimentos 50 · Bebidas 75 · Limpeza 30
        </footer>
      </div>
    </div>
  );
}
