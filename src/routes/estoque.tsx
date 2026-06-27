import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  CATEGORIAS_EXEMPLO,
  PRODUTOS_EXEMPLO,
  type Category,
  type Movement,
  type Product,
} from "@/lib/estoque";
import { exportarCSV, exportarPDF } from "@/lib/export-estoque";
import { ConfirmModal } from "@/components/estoque/ConfirmModal";
import { ProductFormModal, type ProductFormData } from "@/components/estoque/ProductFormModal";
import { CategoryModal } from "@/components/estoque/CategoryModal";
import { HistoryModal } from "@/components/estoque/HistoryModal";

export const Route = createFileRoute("/estoque")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Estoque Mínimo — Controle de Inventário" },
      {
        name: "description",
        content:
          "Gerencie produtos, categorias e o histórico de movimentações com dados salvos na nuvem.",
      },
    ],
  }),
  component: Estoque,
});

type Confirmacao = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
};

function Estoque() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  const [busca, setBusca] = useState("");
  const [filtroCard, setFiltroCard] = useState<string | null>(null);
  const [filtroRepor, setFiltroRepor] = useState<"repor" | "ok" | null>(null);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [reposicoes, setReposicoes] = useState<Record<string, string>>({});

  const [productModal, setProductModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirmacao>({
    open: false,
    title: "",
    onConfirm: () => {},
  });

  // Proteção de rota
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/" });
  }, [authLoading, user, navigate]);

  const carregarDados = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    const [prod, cat, mov] = await Promise.all([
      supabase.from("products").select("*").order("produto", { ascending: true }),
      supabase.from("categories").select("*").order("nome", { ascending: true }),
      supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(150),
    ]);
    if (prod.error || cat.error || mov.error) {
      toast.error("Erro ao carregar os dados da nuvem.");
    }
    setProducts((prod.data as Product[]) ?? []);
    setCategories((cat.data as Category[]) ?? []);
    setMovements((mov.data as Movement[]) ?? []);
    setCarregando(false);
  }, [user]);

  useEffect(() => {
    if (user) carregarDados();
  }, [user, carregarDados]);

  // ---- Operações de estoque ----
  const aplicarQuantidade = useCallback(
    async (product: Product, novaBruta: number, acao: string) => {
      if (!user) return;
      const nova = Math.max(0, Math.floor(novaBruta));
      const anterior = product.quantidade;
      const { error } = await supabase
        .from("products")
        .update({ quantidade: nova })
        .eq("id", product.id);
      if (error) {
        toast.error("Não foi possível atualizar o estoque.");
        return;
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, quantidade: nova } : p)),
      );
      const movInsert = {
        user_id: user.id,
        product_id: product.id,
        produto_nome: product.produto,
        codigo: product.codigo,
        acao,
        delta: nova - anterior,
        quantidade_anterior: anterior,
        quantidade_nova: nova,
      };
      const { data } = await supabase
        .from("stock_movements")
        .insert(movInsert)
        .select()
        .single();
      if (data) setMovements((prev) => [data as Movement, ...prev]);
    },
    [user],
  );

  const ajustarEstoque = (product: Product, sinal: 1 | -1) => {
    const valor = Number(reposicoes[product.id]);
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }
    const nova = Math.max(0, Math.min(product.minimo, product.quantidade + sinal * valor));
    aplicarQuantidade(product, nova, sinal > 0 ? "entrada" : "saida");
    setReposicoes((prev) => ({ ...prev, [product.id]: "" }));
  };

  const completarMinimo = (product: Product) =>
    aplicarQuantidade(product, product.minimo, "completar");

  const completarTodos = async () => {
    const alvos = resultados.filter((p) => p.quantidade < p.minimo);
    if (alvos.length === 0) {
      toast.info("Nenhum item precisa de reposição na lista atual.");
      return;
    }
    for (const p of alvos) await aplicarQuantidade(p, p.minimo, "completar");
    toast.success(`${alvos.length} item(ns) completados até o mínimo.`);
  };

  const zerarEstoque = () => {
    setConfirm({
      open: true,
      title: "Zerar todo o estoque?",
      description:
        "A quantidade de TODOS os produtos será definida como 0. Cada alteração ficará registrada no histórico. Esta ação não pode ser desfeita.",
      confirmLabel: "Zerar tudo",
      danger: true,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        for (const p of products) {
          if (p.quantidade !== 0) await aplicarQuantidade(p, 0, "zerar");
        }
        toast.success("Estoque zerado.");
      },
    });
  };

  // ---- CRUD de produtos ----
  const salvarProduto = async (form: ProductFormData) => {
    if (!user) return;
    const editando = productModal.product;
    if (editando) {
      const { error } = await supabase.from("products").update(form).eq("id", editando.id);
      if (error) {
        toast.error("Erro ao salvar o produto.");
        return;
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === editando.id ? { ...p, ...form } : p)),
      );
      if (form.quantidade !== editando.quantidade) {
        const mov = {
          user_id: user.id,
          product_id: editando.id,
          produto_nome: form.produto,
          codigo: form.codigo,
          acao: "ajuste",
          delta: form.quantidade - editando.quantidade,
          quantidade_anterior: editando.quantidade,
          quantidade_nova: form.quantidade,
        };
        const { data } = await supabase.from("stock_movements").insert(mov).select().single();
        if (data) setMovements((prev) => [data as Movement, ...prev]);
      }
      toast.success("Produto atualizado.");
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert({ ...form, user_id: user.id })
        .select()
        .single();
      if (error || !data) {
        toast.error("Erro ao criar o produto.");
        return;
      }
      const novo = data as Product;
      setProducts((prev) =>
        [...prev, novo].sort((a, b) => a.produto.localeCompare(b.produto)),
      );
      const mov = {
        user_id: user.id,
        product_id: novo.id,
        produto_nome: novo.produto,
        codigo: novo.codigo,
        acao: "criar",
        delta: novo.quantidade,
        quantidade_anterior: 0,
        quantidade_nova: novo.quantidade,
      };
      const { data: movData } = await supabase
        .from("stock_movements")
        .insert(mov)
        .select()
        .single();
      if (movData) setMovements((prev) => [movData as Movement, ...prev]);
      toast.success("Produto criado.");
    }
    setProductModal({ open: false, product: null });
  };

  const excluirProduto = (product: Product) => {
    setConfirm({
      open: true,
      title: `Excluir "${product.produto}"?`,
      description: "O produto será removido permanentemente do estoque.",
      confirmLabel: "Excluir",
      danger: true,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        const { error } = await supabase.from("products").delete().eq("id", product.id);
        if (error) {
          toast.error("Erro ao excluir o produto.");
          return;
        }
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        if (user) {
          const mov = {
            user_id: user.id,
            product_id: null,
            produto_nome: product.produto,
            codigo: product.codigo,
            acao: "excluir",
            delta: -product.quantidade,
            quantidade_anterior: product.quantidade,
            quantidade_nova: 0,
          };
          const { data } = await supabase.from("stock_movements").insert(mov).select().single();
          if (data) setMovements((prev) => [data as Movement, ...prev]);
        }
        toast.success("Produto excluído.");
      },
    });
  };

  // ---- Categorias ----
  const adicionarCategoria = async (nome: string, icon: string, termo: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("categories")
      .insert({ user_id: user.id, nome, icon, termo })
      .select()
      .single();
    if (error) {
      toast.error(
        error.code === "23505" ? "Já existe uma categoria com esse nome." : "Erro ao criar categoria.",
      );
      return;
    }
    setCategories((prev) => [...prev, data as Category].sort((a, b) => a.nome.localeCompare(b.nome)));
    toast.success("Categoria adicionada.");
  };

  const excluirCategoria = (cat: Category) => {
    setConfirm({
      open: true,
      title: `Excluir categoria "${cat.nome}"?`,
      description: "Os produtos não são apagados — apenas o filtro de categoria é removido.",
      confirmLabel: "Excluir",
      danger: true,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        const { error } = await supabase.from("categories").delete().eq("id", cat.id);
        if (error) {
          toast.error("Erro ao excluir categoria.");
          return;
        }
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        if (filtroCard === cat.termo) setFiltroCard(null);
        toast.success("Categoria excluída.");
      },
    });
  };

  // ---- Dados de exemplo ----
  const carregarExemplos = async () => {
    if (!user) return;
    const { error: e1 } = await supabase
      .from("products")
      .insert(PRODUTOS_EXEMPLO.map((p) => ({ ...p, user_id: user.id })));
    await supabase
      .from("categories")
      .insert(CATEGORIAS_EXEMPLO.map((c) => ({ ...c, user_id: user.id })));
    if (e1) {
      toast.error("Erro ao carregar dados de exemplo.");
      return;
    }
    toast.success("Dados de exemplo carregados.");
    carregarDados();
  };

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  // ---- Derivados ----
  const sugestoes = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (termo === "") return [];
    const valores = new Set<string>();
    for (const p of products) {
      for (const campo of [p.produto, p.fabricante, p.tipo, p.codigo]) {
        if (campo.toLowerCase().includes(termo)) valores.add(campo);
      }
    }
    return Array.from(valores).slice(0, 6);
  }, [busca, products]);

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const card = filtroCard?.toLowerCase() ?? null;
    return products.filter((p) => {
      const alvo = `${p.produto} ${p.tipo} ${p.fabricante}`.toLowerCase();
      const matchCard = card ? alvo.includes(card) : true;
      const matchBusca =
        termo === "" ||
        p.codigo.toLowerCase().includes(termo) ||
        p.fabricante.toLowerCase().includes(termo) ||
        p.tipo.toLowerCase().includes(termo) ||
        p.produto.toLowerCase().includes(termo);
      const precisaRepor = p.quantidade < p.minimo;
      const matchRepor =
        filtroRepor === null ? true : filtroRepor === "repor" ? precisaRepor : !precisaRepor;
      return matchCard && matchBusca && matchRepor;
    });
  }, [busca, filtroCard, filtroRepor, products]);

  const totalProdutos = products.length;
  const totalItens = products.reduce((soma, p) => soma + p.quantidade, 0);
  const itensAbaixo = products.filter((p) => p.quantidade < p.minimo).length;

  if (authLoading || (!user && carregando)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  const btnAcao =
    "rounded-xl border px-5 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5";

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary shadow-[0_0_18px_-6px_var(--color-primary)]">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
            Controle de Inventário
          </span>
          <p className="mt-2 text-xs font-medium tracking-wide text-muted-foreground">
            By Francisco Chagas
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Gestão de produtos
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Dados salvos na nuvem. Gerencie produtos, categorias e o histórico de movimentações.
          </p>
        </header>

        {/* Alerta / contador */}
        <div
          className={`mb-6 flex items-center justify-center gap-3 rounded-xl border px-5 py-3 text-sm font-semibold ${
            itensAbaixo > 0
              ? "border-red-700/60 bg-red-950/30 text-red-200 shadow-[0_0_24px_-6px_rgba(153,27,27,0.85)]"
              : "border-primary/40 bg-primary/10 text-foreground shadow-[0_0_18px_-6px_var(--color-primary)]"
          }`}
        >
          {itensAbaixo > 0 ? (
            <>🔴 {itensAbaixo} {itensAbaixo === 1 ? "item está" : "itens estão"} abaixo do mínimo</>
          ) : (
            <>✅ Todos os itens estão acima do estoque mínimo</>
          )}
        </div>

        {/* Barra de ferramentas */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setProductModal({ open: true, product: null })}
            className="rounded-xl border border-primary bg-primary/15 px-3 py-3 text-sm font-semibold text-foreground shadow-[0_0_18px_-6px_var(--color-primary)] transition hover:bg-primary/25"
          >
            ➕ Novo produto
          </button>
          <button
            type="button"
            onClick={() => setCategoryOpen(true)}
            className="rounded-xl border border-primary/40 bg-card px-3 py-3 text-sm font-semibold text-foreground shadow-[0_0_18px_-6px_var(--color-primary)] transition hover:bg-primary/10"
          >
            🗂️ Categorias
          </button>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="rounded-xl border border-primary/40 bg-card px-3 py-3 text-sm font-semibold text-foreground shadow-[0_0_18px_-6px_var(--color-primary)] transition hover:bg-primary/10"
          >
            🕘 Histórico
          </button>
          <button
            type="button"
            onClick={sair}
            className="rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
          >
            🚪 Sair
          </button>
        </div>

        {/* Exportação */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => exportarCSV(resultados, filtroRepor === "repor")}
            className="rounded-xl border border-primary/40 bg-card px-3 py-2.5 text-xs font-semibold text-foreground transition hover:bg-primary/10"
          >
            📊 Exportar Excel (CSV)
          </button>
          <button
            type="button"
            onClick={() => exportarPDF(resultados, filtroRepor === "repor")}
            className="rounded-xl border border-primary/40 bg-card px-3 py-2.5 text-xs font-semibold text-foreground transition hover:bg-primary/10"
          >
            📄 Exportar PDF
          </button>
          <button
            type="button"
            onClick={() =>
              exportarPDF(
                products.filter((p) => p.quantidade < p.minimo),
                true,
              )
            }
            className="col-span-2 rounded-xl border border-red-900/50 bg-card px-3 py-2.5 text-xs font-semibold text-red-200 transition hover:bg-red-950/30"
          >
            📄 PDF dos itens a repor
          </button>
        </div>

        {/* Campo de busca */}
        <div className="mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setMostrarSugestoes(false);
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
          >
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
                🔎
              </span>
              <input
                type="search"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setMostrarSugestoes(true);
                }}
                onFocus={() => setMostrarSugestoes(true)}
                onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
                placeholder="Buscar por código, fabricante, tipo ou produto…"
                autoComplete="off"
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
              {mostrarSugestoes && sugestoes.length > 0 && (
                <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-primary/40 bg-card shadow-[0_0_20px_-4px_var(--color-primary)]">
                  {sugestoes.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setBusca(s);
                          setMostrarSugestoes(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-primary/10"
                      >
                        <span className="text-muted-foreground">🔎</span>
                        <span>{s}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-[0_0_18px_-6px_var(--color-primary)] transition hover:opacity-90"
            >
              🔎 Buscar
            </button>
          </form>
        </div>

        {/* Resumo */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-primary/30 bg-card px-5 py-4 shadow-[0_0_18px_-6px_var(--color-primary)] sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <div className="font-display text-sm font-semibold text-foreground">
                Resumo do estoque
              </div>
              <div className="text-xs text-muted-foreground">Itens cadastrados no momento</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-primary">{totalProdutos}</div>
              <div className="text-xs text-muted-foreground">Produtos</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-primary">
                {totalItens.toLocaleString("pt-BR")}
              </div>
              <div className="text-xs text-muted-foreground">Itens (un.)</div>
            </div>
          </div>
        </div>

        {/* Categorias (cards de filtro) */}
        {categories.length > 0 && (
          <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((c) => {
              const ativo = filtroCard === c.termo;
              const total = products.filter((p) =>
                `${p.produto} ${p.tipo} ${p.fabricante}`.toLowerCase().includes(c.termo),
              ).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFiltroCard(ativo ? null : c.termo)}
                  className={`group rounded-xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 ${
                    ativo
                      ? "border-primary bg-primary/10 shadow-[0_0_24px_-2px_var(--color-primary),inset_0_0_0_1px_var(--color-primary)]"
                      : "border-primary/30 bg-card shadow-[0_0_18px_-6px_var(--color-primary)] hover:border-primary/60 hover:bg-primary/5"
                  }`}
                >
                  <div className="text-2xl">{c.icon}</div>
                  <div className="mt-2 font-display text-sm font-semibold">{c.nome}</div>
                  <div className="text-xs text-muted-foreground">{total} produto(s)</div>
                </button>
              );
            })}
          </section>
        )}

        {/* Filtros / ações em lote */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={() => setFiltroRepor(filtroRepor === "repor" ? null : "repor")}
            className={`${btnAcao} ${
              filtroRepor === "repor"
                ? "border-red-600 bg-red-950/40 text-red-200 shadow-[0_0_28px_-2px_rgba(153,27,27,0.9)]"
                : "border-red-900/50 bg-card text-foreground shadow-[0_0_18px_-6px_rgba(153,27,27,0.8)] hover:bg-red-950/20"
            }`}
          >
            🔴 Precisa repor
          </button>
          <button
            type="button"
            onClick={() => setFiltroRepor(filtroRepor === "ok" ? null : "ok")}
            className={`${btnAcao} ${
              filtroRepor === "ok"
                ? "border-primary bg-primary/15 text-foreground shadow-[0_0_28px_-2px_var(--color-primary)]"
                : "border-primary/40 bg-card text-foreground shadow-[0_0_18px_-6px_var(--color-primary)] hover:bg-primary/10"
            }`}
          >
            ✅ Não precisa repor
          </button>
          <button
            type="button"
            onClick={() => {
              setFiltroCard(null);
              setFiltroRepor(null);
              setBusca("");
            }}
            className={`${btnAcao} border-primary/40 bg-card text-foreground shadow-[0_0_18px_-6px_var(--color-primary)] hover:bg-primary/10`}
          >
            📦 Carregar tudo
          </button>
          <button
            type="button"
            onClick={completarTodos}
            className={`${btnAcao} border-primary bg-primary/15 text-foreground shadow-[0_0_18px_-6px_var(--color-primary)] hover:bg-primary/25`}
          >
            ✅ Completar estoque (todos)
          </button>
          <button
            type="button"
            onClick={zerarEstoque}
            className={`${btnAcao} border-red-600 bg-red-950/40 text-red-200 shadow-[0_0_18px_-6px_rgba(153,27,27,0.9)] hover:bg-red-900/50`}
          >
            🗑️ Zerar estoque
          </button>
        </div>

        {/* Lista */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-lg shadow-black/20 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              {filtroCard
                ? `Filtro: ${categories.find((c) => c.termo === filtroCard)?.nome ?? filtroCard}`
                : "Todos os produtos"}
            </h2>
            <span className="text-xs text-muted-foreground">{resultados.length} resultado(s)</span>
          </div>

          {carregando ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Carregando produtos…
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Você ainda não tem produtos cadastrados.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setProductModal({ open: true, product: null })}
                  className="rounded-xl border border-primary bg-primary/15 px-5 py-2.5 text-sm font-semibold text-foreground shadow-[0_0_18px_-6px_var(--color-primary)] transition hover:bg-primary/25"
                >
                  ➕ Criar primeiro produto
                </button>
                <button
                  type="button"
                  onClick={carregarExemplos}
                  className="rounded-xl border border-primary/40 bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-primary/10"
                >
                  📥 Carregar dados de exemplo
                </button>
              </div>
            </div>
          ) : resultados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado para a busca informada.
            </div>
          ) : (
            <ul className="grid gap-3">
              {resultados.map((p) => {
                const atual = p.quantidade;
                const baixo = atual < p.minimo;
                const acima = atual > p.minimo;
                return (
                  <li
                    key={p.id}
                    className={`rounded-xl border bg-background p-4 transition-all duration-300 ${
                      baixo
                        ? "border-red-700/60 shadow-[0_0_24px_-2px_rgba(153,27,27,0.85)]"
                        : "border-primary/20 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            {p.codigo || "—"}
                          </span>
                          <h3 className="font-display text-sm font-semibold text-foreground">
                            {p.produto}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <strong className="text-foreground">Fabricante:</strong> {p.fabricante}{" "}
                          • <strong className="text-foreground">Tipo:</strong> {p.tipo}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setProductModal({ open: true, product: p })}
                          aria-label="Editar"
                          className="rounded-lg border border-primary/40 px-2.5 py-1 text-xs font-semibold text-foreground transition hover:bg-primary/10"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => excluirProduto(p)}
                          aria-label="Excluir"
                          className="rounded-lg border border-red-900/50 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-950/40"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${baixo ? "bg-warning" : "bg-primary"}`}
                          style={{ width: `${Math.min(100, (atual / Math.max(1, p.minimo)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {atual} / mín. {p.minimo} un.
                      </span>
                    </div>

                    <div
                      className={`mt-3 flex flex-wrap items-center gap-2 rounded-lg border p-2 ${
                        baixo || acima
                          ? "border-warning/30 bg-warning/5"
                          : "border-primary/30 bg-primary/5"
                      }`}
                    >
                      <span className="text-xs font-medium text-foreground">
                        {baixo
                          ? `Faltam ${p.minimo - atual} un.`
                          : acima
                            ? `⚠️ Excedeu em ${atual - p.minimo} un.`
                            : "✅ Estoque completo (100%)"}
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={reposicoes[p.id] ?? ""}
                        onChange={(e) =>
                          setReposicoes((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") ajustarEstoque(p, 1);
                        }}
                        placeholder="Qtd."
                        className="h-8 w-24 rounded-md border border-input bg-background px-2 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-ring/40"
                      />
                      <button
                        type="button"
                        onClick={() => ajustarEstoque(p, 1)}
                        className="h-8 rounded-md border border-primary/40 bg-primary/10 px-3 text-xs font-semibold text-foreground transition hover:bg-primary/20"
                      >
                        ➕ Entrada
                      </button>
                      <button
                        type="button"
                        onClick={() => ajustarEstoque(p, -1)}
                        disabled={atual <= 0}
                        className="h-8 rounded-md border border-warning/40 bg-warning/10 px-3 text-xs font-semibold text-foreground transition hover:bg-warning/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ➖ Saída
                      </button>
                      <button
                        type="button"
                        onClick={() => completarMinimo(p)}
                        disabled={atual >= p.minimo}
                        className="h-8 rounded-md border border-primary bg-primary/15 px-3 text-xs font-semibold text-foreground transition hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ⤴️ Completar mínimo
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-card px-6 py-3 text-sm font-semibold text-primary shadow-[0_0_24px_-8px_var(--color-primary)] transition hover:bg-primary/10 sm:w-auto"
          >
            ↑ Voltar ao Início
          </button>
          <button
            type="button"
            onClick={sair}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-card px-6 py-3 text-sm font-semibold text-primary shadow-[0_0_24px_-8px_var(--color-primary)] transition hover:bg-primary/10 sm:w-auto"
          >
            🚪 Sair da conta
          </button>
        </footer>
      </div>

      <ProductFormModal
        open={productModal.open}
        product={productModal.product}
        onSave={salvarProduto}
        onClose={() => setProductModal({ open: false, product: null })}
      />
      <CategoryModal
        open={categoryOpen}
        categories={categories}
        onAdd={adicionarCategoria}
        onDelete={excluirCategoria}
        onClose={() => setCategoryOpen(false)}
      />
      <HistoryModal
        open={historyOpen}
        movements={movements}
        onClose={() => setHistoryOpen(false)}
      />
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.confirmLabel}
        danger={confirm.danger}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
      />
    </div>
  );
}
