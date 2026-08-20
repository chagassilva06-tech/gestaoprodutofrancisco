import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { LogOut, LayoutDashboard, ShoppingCart, Search, AlertCircle, Package, ArrowLeft, ChevronRight, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { type Product, ordenarPorCodigo } from "@/lib/estoque";
import { toast } from "sonner";

export const Route = createFileRoute("/pedidos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pedidos | Performance Experience" },
      { name: "description", content: "Itens críticos aguardando reposição de estoque." },
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
      toast.error("Erro na sincronização de pedidos.");
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Consultando Itens Críticos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 animate-fade-in">
      {/* Header Premium */}
      <header className="sticky top-0 z-30 h-20 border-b border-white/5 bg-background/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate({ to: "/estoque" })} className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground transition-colors group">
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight">Módulo de Pedidos</h1>
            <p className="text-xs text-muted-foreground">Itens abaixo do mínimo padronizado</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate({ to: "/estoque" })}
            className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
          >
            <Package className="h-4 w-4" /> Voltar ao Estoque
          </button>
        </div>
      </header>

      <main className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-6 rounded-2xl border border-destructive/20 shadow-sm shadow-destructive/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <AlertCircle className="h-20 w-20 text-destructive" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-widest">Produtos em Alerta</p>
            <h3 className="text-3xl font-bold tracking-tight text-destructive">{products.length}</h3>
            <p className="text-xs text-destructive/70 mt-2">Requerem atenção imediata</p>
          </div>
          
          <div className="glass-card p-6 rounded-2xl border border-primary/20 shadow-sm shadow-primary/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-20 w-20 text-primary" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-widest">Volume Necessário</p>
            <h3 className="text-3xl font-bold tracking-tight text-primary">{totalFaltante.toLocaleString("pt-BR")}</h3>
            <p className="text-xs text-primary/70 mt-2">Unidades para atingir o mínimo</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Filtrar por produto, código ou fabricante..."
            className="w-full bg-card/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> 
              Lista de Compras
              <span className="ml-2 px-2 py-0.5 rounded-md bg-white/5 text-xs text-muted-foreground">{filtrados.length} itens</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filtrados.length === 0 ? (
              <div className="py-20 text-center glass-card rounded-3xl border border-dashed border-white/10">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold">Nenhum pedido pendente</h3>
                <p className="text-muted-foreground text-sm">Todo o estoque está operando acima do mínimo.</p>
              </div>
            ) : (
              filtrados.map((p) => {
                const falta = p.minimo - p.quantidade;
                const perc = Math.min(100, (p.quantidade / p.minimo) * 100);
                return (
                  <div key={p.id} className="glass-card p-6 rounded-2xl border border-destructive/10 hover:border-destructive/30 transition-all group shadow-sm shadow-destructive/5">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="w-14 h-14 rounded-xl bg-destructive/5 flex items-center justify-center shrink-0 border border-destructive/10">
                        <span className="text-lg font-bold text-destructive">{p.codigo}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg truncate mb-1">{p.produto}</h4>
                        <p className="text-sm text-muted-foreground truncate">{p.fabricante} • {p.tipo}</p>
                      </div>

                      <div className="w-full md:w-48 shrink-0 space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">Reposição Sugerida</span>
                          <span className="text-destructive font-bold">+{falta} un.</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-destructive transition-all duration-1000" 
                            style={{ width: `${perc}%` }} 
                          />
                        </div>
                        <p className="text-[10px] text-right text-muted-foreground italic">Atual: {p.quantidade} / Mín: {p.minimo}</p>
                      </div>

                      <div className="shrink-0">
                         <button 
                          onClick={() => navigate({ to: "/estoque", search: { busca: p.codigo } })}
                          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-muted-foreground hover:text-white"
                         >
                           <ChevronRight className="h-5 w-5" />
                         </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <footer className="p-10 border-t border-white/5 text-center space-y-4">
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed uppercase tracking-widest font-bold">
           PERFORMANCE EXPERIENCE™
        </p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          By Francisco Chagas. Inteligência em Suprimentos. © 2026
        </p>
      </footer>
    </div>
  );
}
