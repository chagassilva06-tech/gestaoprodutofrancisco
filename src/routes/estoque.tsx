import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LogOut, LayoutDashboard, ShoppingCart, Search, Plus, History, FileText, Package, CheckCircle2, AlertCircle, ChevronRight, Menu, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  type Category,
  type Movement,
  type Product,
  ordenarPorCodigo,
} from "@/lib/estoque";
import { exportarCSV, exportarPDF } from "@/lib/export-estoque";
import type { ProductFormData } from "@/components/estoque/ProductFormModal";
import inventoryLogo from "@/assets/inventory-logo.png.asset.json";

const ConfirmModal = lazy(() =>
  import("@/components/estoque/ConfirmModal").then((m) => ({ default: m.ConfirmModal })),
);
const ProductFormModal = lazy(() =>
  import("@/components/estoque/ProductFormModal").then((m) => ({ default: m.ProductFormModal })),
);
const CategoryModal = lazy(() =>
  import("@/components/estoque/CategoryModal").then((m) => ({ default: m.CategoryModal })),
);
const HistoryModal = lazy(() =>
  import("@/components/estoque/HistoryModal").then((m) => ({ default: m.HistoryModal })),
);

export const Route = createFileRoute("/estoque")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Performance Dashboard | Inventory Control" },
      { name: "description", content: "Painel de controle de alta performance para gestão de inventário." },
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
  const [reposicoes, setReposicoes] = useState<Record<string, string>>({});
  const [sidebarAberta, setSidebarAberta] = useState(true);

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
      toast.error("Erro na sincronização com a nuvem.");
    }
    setProducts(ordenarPorCodigo((prod.data as Product[]) ?? []));
    setCategories((cat.data as Category[]) ?? []);
    setMovements((mov.data as Movement[]) ?? []);
    setCarregando(false);
  }, [user]);

  useEffect(() => {
    if (user) carregarDados();
  }, [user, carregarDados]);

  const aplicarQuantidade = useCallback(
    async (product: Product, novaBruta: number, acao: string) => {
      if (!user) return;
      const nova = Math.max(0, Math.floor(novaBruta));
      const anterior = product.quantidade;
      
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, quantidade: nova } : p)),
      );

      const { error } = await supabase
        .from("products")
        .update({ quantidade: nova })
        .eq("id", product.id);
      
      if (error) {
        toast.error("Falha na atualização. Revertendo...");
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, quantidade: anterior } : p)),
        );
        return;
      }

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
      toast.error("Informe uma métrica válida.");
      return;
    }
    if (sinal > 0 && product.quantidade >= product.minimo) {
      toast.error("Capacidade Máxima Atingida");
      return;
    }
    const nova = Math.max(0, Math.min(product.minimo, product.quantidade + sinal * valor));
    aplicarQuantidade(product, nova, sinal > 0 ? "entrada" : "saida");
    setReposicoes((prev) => ({ ...prev, [product.id]: "" }));
  };

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
        ordenarPorCodigo(prev.map((p) => (p.id === editando.id ? { ...p, ...form } : p))),
      );
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
      setProducts((prev) => ordenarPorCodigo([...prev, data as Product]));
      toast.success("Produto criado.");
    }
    setProductModal({ open: false, product: null });
  };

  const adicionarCategoria = async (nome: string, icon: string, termo: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("categories")
      .insert({ user_id: user.id, nome, icon, termo })
      .select()
      .single();
    if (error) {
      toast.error("Erro ao criar categoria.");
      return;
    }
    setCategories((prev) => [...prev, data as Category].sort((a, b) => a.nome.localeCompare(b.nome)));
    toast.success("Categoria adicionada.");
  };

  const excluirCategoria = (cat: Category) => {
    setConfirm({
      open: true,
      title: `Excluir categoria "${cat.nome}"?`,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, open: false }));
        await supabase.from("categories").delete().eq("id", cat.id);
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        toast.success("Categoria excluída.");
      },
    });
  };

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const card = filtroCard?.toLowerCase() ?? null;
    return products
      .filter((p) => {
        const alvo = `${p.produto} ${p.tipo} ${p.fabricante}`.toLowerCase();
        const matchCard = card ? alvo.includes(card) : true;
        const matchBusca = termo === "" || p.codigo.toLowerCase().includes(termo) || p.fabricante.toLowerCase().includes(termo) || p.produto.toLowerCase().includes(termo);
        const precisaRepor = p.quantidade < p.minimo;
        const matchRepor = filtroRepor === null ? true : filtroRepor === "repor" ? precisaRepor : !precisaRepor;
        return matchCard && matchBusca && matchRepor;
      })
      .sort((a, b) => (a.codigo || "").localeCompare(b.codigo || "", undefined, { numeric: true }));
  }, [busca, filtroCard, filtroRepor, products]);

  const stats = useMemo(() => ({
    total: products.length,
    unidades: products.reduce((s, p) => s + p.quantidade, 0),
    criticos: products.filter(p => p.quantidade < p.minimo).length,
    percentual: products.length ? Math.round((products.filter(p => p.quantidade >= p.minimo).length / products.length) * 100) : 100
  }), [products]);

  if (authLoading || (carregando && !products.length)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Sincronizando Performance Experience™...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
      <aside className={`fixed inset-y-0 left-0 z-40 transition-all duration-500 ease-in-out border-r border-white/5 bg-card/80 backdrop-blur-xl ${sidebarAberta ? 'w-64' : 'w-20'} hidden md:flex flex-col`}>
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-success flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 border border-white/10 group-hover:premium-glow transition-all">
              <div className="relative">
                <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-white rounded-full animate-pulse shadow-sm" />
              </div>
            </div>
            <div className={`flex flex-col transition-opacity duration-300 ${sidebarAberta ? 'opacity-100' : 'opacity-0'}`}>
              <span className="font-display font-black text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">INVENTORY</span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-primary -mt-1 uppercase">Control Center</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'dash', label: 'Dashboard', icon: LayoutDashboard, active: !filtroRepor, onClick: () => setFiltroRepor(null) },
            { id: 'orders', label: 'Pedidos', icon: ShoppingCart, onClick: () => navigate({ to: '/pedidos' }) },
            { id: 'history', label: 'Histórico', icon: History, onClick: () => setHistoryOpen(true) },
          ].map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex items-center gap-4 w-full p-3 rounded-xl transition-all duration-300 group ${item.active ? 'bg-primary/10 text-primary shadow-sm shadow-primary/10' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon className={`h-5 w-5 shrink-0 ${item.active ? 'text-primary' : 'group-hover:scale-110 transition-transform'}`} />
              <span className={`font-medium transition-opacity duration-300 ${sidebarAberta ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={sair} className="flex items-center gap-4 w-full p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all group">
            <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className={`font-medium ${sidebarAberta ? 'block' : 'hidden'}`}>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-500 ${sidebarAberta ? 'md:ml-64' : 'md:ml-20'}`}>
        <header className="sticky top-0 z-30 h-20 border-b border-white/5 bg-background/80 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarAberta(!sidebarAberta)} className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground transition-colors md:flex hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight leading-none mb-1">Gestão de Performance</h1>
              <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">Live Cloud Data Sourcing</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <div className="relative h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
                <span className="absolute inset-0 rounded-full bg-primary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary truncate max-w-[150px]">
                {user?.email?.split('@')[0]}
              </span>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-full text-muted-foreground relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            </button>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total de SKUs', value: stats.total, icon: Package, color: 'primary' },
              { label: 'Itens Críticos', value: stats.criticos, icon: AlertCircle, color: stats.criticos > 0 ? 'destructive' : 'success' },
              { label: 'Unidades em Stock', value: stats.unidades, icon: LayoutDashboard, color: 'primary' },
              { label: 'Eficiência de Stock', value: `${stats.percentual}%`, icon: CheckCircle2, color: 'success' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                  </div>
                  <div className={`p-2 rounded-lg bg-${stat.color}/10 text-${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Pesquisar por Código, Produto ou Fabricante..."
                className="w-full bg-card/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all shadow-inner"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setProductModal({ open: true, product: null })}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-4 rounded-2xl font-bold hover:premium-glow transition-all active:scale-95"
              >
                <Plus className="h-5 w-5" /> Novo Produto
              </button>
              <button 
                onClick={() => setHistoryOpen(true)}
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all"
                title="Histórico"
              >
                <History className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> 
                {filtroRepor === 'repor' ? 'Itens para Reposição' : 'Inventário Completo'}
                <span className="ml-2 px-2 py-0.5 rounded-md bg-white/5 text-xs text-muted-foreground">{resultados.length} resultados</span>
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <button onClick={() => exportarPDF(resultados, filtroRepor === 'repor')} className="px-3 py-1.5 hover:bg-white/5 rounded-lg border border-white/5 transition-colors">PDF</button>
                <button onClick={() => exportarCSV(resultados, filtroRepor === 'repor')} className="px-3 py-1.5 hover:bg-white/5 rounded-lg border border-white/5 transition-colors">CSV</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {resultados.map((p) => {
                const perc = Math.min(100, (p.quantidade / p.minimo) * 100);
                const isCritical = p.quantidade < p.minimo;
                return (
                  <div key={p.id} className={`glass-card p-4 rounded-2xl border transition-all hover:translate-x-1 ${isCritical ? 'border-destructive/20 hover:border-destructive/40 shadow-sm shadow-destructive/5' : 'border-white/5 hover:border-primary/30 shadow-sm shadow-black/20'}`}>
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                        <span className="text-xl font-bold text-muted-foreground">{p.codigo}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg truncate">{p.produto}</h4>
                          {isCritical && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive uppercase tracking-widest border border-destructive/20">Crítico</span>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{p.fabricante} • {p.tipo}</p>
                      </div>

                      <div className="w-full md:w-48 shrink-0 space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">Status do Estoque</span>
                          <span className={isCritical ? 'text-destructive' : 'text-primary'}>{p.quantidade} / {p.minimo}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={`h-full transition-all duration-1000 ${isCritical ? 'bg-destructive' : 'bg-primary'}`} 
                            style={{ width: `${perc}%` }} 
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-black/20 rounded-xl border border-white/5 p-1">
                          <button 
                            onClick={() => ajustarEstoque(p, -1)}
                            className="p-2 hover:text-destructive transition-colors"
                          >
                            <span className="text-xl leading-none">−</span>
                          </button>
                          <input 
                            type="number"
                            className="w-12 bg-transparent text-center font-bold outline-none text-sm"
                            value={reposicoes[p.id] || ""}
                            onChange={(e) => setReposicoes(prev => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder="0"
                          />
                          <button 
                            onClick={() => ajustarEstoque(p, 1)}
                            className="p-2 hover:text-primary transition-colors"
                          >
                            <span className="text-xl leading-none">+</span>
                          </button>
                        </div>
                        <button 
                          onClick={() => setProductModal({ open: true, product: p })}
                          className="p-3 hover:bg-white/5 rounded-xl transition-all"
                        >
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="p-10 border-t border-white/5 text-center space-y-4">
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed uppercase tracking-widest font-bold">
             PERFORMANCE EXPERIENCE™
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            By Francisco Chagas. Engenharia de Gestão de Inventário de Alta Precisão. © 2026 Todos os direitos reservados.
          </p>
        </footer>
      </main>

      <Suspense>
        {confirm.open && (
          <ConfirmModal
            open={confirm.open}
            onCancel={() => setConfirm(prev => ({ ...prev, open: false }))}
            onConfirm={confirm.onConfirm}
            title={confirm.title}
            description={confirm.description}
            confirmLabel={confirm.confirmLabel}
            danger={confirm.danger}
          />
        )}
        {productModal.open && (
          <ProductFormModal
            open={productModal.open}
            onClose={() => setProductModal({ open: false, product: null })}
            onSave={salvarProduto}
            product={productModal.product}
          />
        )}
        {categoryOpen && (
          <CategoryModal
            open={categoryOpen}
            onClose={() => setCategoryOpen(false)}
            categories={categories}
            onAdd={adicionarCategoria}
            onDelete={excluirCategoria}
          />
        )}
        {historyOpen && (
          <HistoryModal
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            movements={movements}
          />
        )}
      </Suspense>
    </div>
  );
}
