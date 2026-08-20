import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff, UserPlus, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import authCorner from "@/assets/auth-corner.png.asset.json";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Performance Experience | Inventory Control" },
      { name: "description", content: "Acesso exclusivo ao sistema de gestão de estoque." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [qrAberto, setQrAberto] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/estoque" });
  }, [loading, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (modo === "criar") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Acesso autorizado.");
        navigate({ to: "/estoque" });
      }
    } catch (err) {
      toast.error("Falha na autenticação.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-4 animate-fade-in">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_70%)] opacity-10" />
      
      <div className="relative w-full max-w-[32rem] p-10 glass-card rounded-[2.5rem] shadow-2xl transition-all hover:shadow-[0_0_40px_-10px_var(--color-primary)] animate-scale-in">
        <header className="mb-12 text-center">
          <img src={authCorner.url} className="mx-auto w-24 mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform duration-500" alt="Logo" />
          <h1 className="text-4xl font-black tracking-tighter text-white mb-3">
            📦 INVENTORY <span className="text-primary text-glow">CONTROL</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/60 max-w-xs mx-auto">
            Performance Experience™
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                placeholder="E-mail profissional"
                className="w-full bg-card/20 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all shadow-inner text-white placeholder:text-muted-foreground/30 font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type={show ? "text" : "password"}
                placeholder="Senha de acesso"
                className="w-full bg-card/20 border border-white/5 rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all shadow-inner text-white placeholder:text-muted-foreground/30 font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary">
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            disabled={busy}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-success text-primary-foreground font-bold shadow-[0_4px_20px_-4px_var(--color-primary)] hover:shadow-[0_8px_30px_-5px_var(--color-primary)] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {busy && <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />}
            {busy ? "Validando Acesso..." : modo === "entrar" ? "Autenticar no Sistema" : "Criar Nova Conta"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
              className="text-sm text-primary hover:text-success underline transition-colors"
            >
              {modo === "entrar" ? "Ainda não tem conta? Criar acesso" : "Já possui conta? Entrar"}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm">
          <div className="flex justify-center gap-4 mb-4">
            <button onClick={() => setQrAberto(true)} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <QrCode className="h-4 w-4" /> QR Access
            </button>
          </div>
          <p className="text-muted-foreground">By Francisco Chagas © 2026</p>
          <p className="text-xs mt-1 text-muted-foreground/50">Todos os direitos reservados.</p>
        </div>
      </div>

      {qrAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card p-8 rounded-3xl border border-border shadow-2xl relative max-w-sm w-full text-center">
            <button onClick={() => setQrAberto(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-white">Acesso Rápido</h2>
            <div className="bg-white p-4 rounded-2xl inline-block mb-6">
              <QRCodeSVG value={window.location.origin} size={200} />
            </div>
            <p className="text-sm text-muted-foreground">Escaneie para acessar do celular</p>
          </div>
        </div>
      )}
    </div>
  );
}

function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
