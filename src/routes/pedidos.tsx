import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { LogOut, ArrowRight, ShoppingCart, Search, AlertCircle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { type Product, ordenarPorCodigo } from "@/lib/estoque";
import { toast } from "sonner";

export const Route = createFileRoute("/pedidos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pedidos de Compra — Inventory Control" },
      {
        name: "description",
        content: "Visualize e gerencie itens que necessitam de reposição.",
      },
    ],
  }),
  component: Pedidos,
});

function Pedidos() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [busca, setBusca] = useState("");

  const carregarDados = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*");
    
    if (!error && data) {
      const criticos = (data as Product[]).filter(p => p.quantidade < p.minimo);
      setProducts(ordenarPorCodigo(criticos));
    } else if (error) {
      toast.error("Erro ao carregar itens para pedido.");
    } else {
      setProducts(ordenarPorCodigo((data as Product[]) ?? []));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/" });
    if (user) carregarDados();
  }, [authLoading, user, navigate, carregarDados]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return products.filter((p) =>
      `${p.produto} ${p.fabricante} ${p.codigo}`.toLowerCase().includes(termo)
    );
  }, [busca, products]);

  const totalFaltante = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.minimo - p.quantidade), 0);
  }, [products]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando pedidos…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20 sm:p-8">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Pedidos de Compra
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Itens com estoque abaixo do mínimo necessário.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate({ to: "/estoque" })}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-card px-4 py-2 text-sm font-semibold text-primary shadow-[0_0_18px_-6px_var(--color-primary)] transition hover:bg-primary/10"
              >
                📦 Voltar ao Estoque
              </button>
            </div>
          </div>
        </header>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-red-700/40 bg-red-950/20 p-4 shadow-[0_0_20px_-10px_rgba(239,68,68,0.5)]">
            <div className="flex items-center gap-2 text-red-200">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">Itens Críticos</span>
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-red-100">
              {products.length} <span className="text-sm font-normal text-red-300/70">produtos</span>
            </div>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 shadow-[0_0_20px_-10px_rgba(var(--color-primary),0.5)]">
            <div className="flex items-center gap-2 text-primary">
              <Package className="h-5 w-5" />
              <span className="text-sm font-semibold">Volume a Comprar</span>
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-foreground">
              {totalFaltante.toLocaleString("pt-BR")} <span className="text-sm font-normal text-muted-foreground">unidades</span>
            </div>
          </div>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar pedidos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-lg shadow-black/20 sm:p-6">
          {filtrados.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {busca ? "Nenhum pedido encontrado para esta busca." : "✅ Tudo em ordem! Nenhum item precisa de reposição."}
            </div>
          ) : (
            <ul className="grid gap-3">
              {filtrados.map((p) => (
                <li
                  key={p.id}
                  className="group rounded-xl border border-red-700/40 bg-background p-4 shadow-[0_0_15px_-5px_rgba(239,68,68,0.2)] transition-all hover:border-red-600/60"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                          {p.codigo}
                        </span>
                        <h3 className="font-display text-sm font-bold text-foreground">{p.produto}</h3>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.fabricante} • {p.tipo}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-red-400">Faltam {p.minimo - p.quantidade} un.</div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Estoque: {p.quantidade} / Mín: {p.minimo}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
                    <div
                      className="h-full bg-red-600 transition-all duration-500"
                      style={{ width: `${(p.quantidade / p.minimo) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="mt-8 flex justify-center">
          <p className="text-xs text-muted-foreground">
            Inventory Control • Módulo de Pedidos Automático
          </p>
        </footer>
      </div>
    </div>
  );
}
