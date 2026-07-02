import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, KeyRound, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import authBg from "@/assets/auth-bg.png.asset.json";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso — Inventory Control" },
      {
        name: "description",
        content:
          "Tela de acesso ao Inventory Control. Informe e-mail e senha para entrar na nuvem.",
      },
      { property: "og:title", content: "Acesso — Inventory Control" },
      {
        property: "og:description",
        content:
          "Tela de acesso ao Inventory Control. Informe e-mail e senha para entrar na nuvem.",
      },
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
  const [emailDuplicado, setEmailDuplicado] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/estoque" });
  }, [loading, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const mail = email.trim();
    if (!mail || !password) {
      toast.error("Informe e-mail e senha.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setBusy(true);
    try {
      if (modo === "criar") {
        const { data, error } = await supabase.auth.signUp({
          email: mail,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) {
          if (
            error.message.includes("already registered") ||
            error.message.includes("already been registered") ||
            error.message.includes("User already")
          ) {
            setEmailDuplicado(true);
            return;
          }
          throw error;
        }
        // Supabase não retorna erro para e-mail já cadastrado (proteção anti-enumeração):
        // nesse caso o usuário volta sem "identities". Detectamos e bloqueamos a criação.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setEmailDuplicado(true);
          return;
        }
        if (data.session) {
          toast.success("Conta criada! Entrando…");
          navigate({ to: "/estoque" });
        } else {
          toast.success("Conta criada! Verifique seu e-mail para confirmar e depois entre.");
          setModo("entrar");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (error) throw error;
        toast.success("Acesso liberado!");
        navigate({ to: "/estoque" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha na autenticação.";
      toast.error(
        msg.includes("Invalid login credentials")
          ? "E-mail ou senha incorretos."
          : msg.includes("already registered")
            ? "Este e-mail já está cadastrado. Faça login."
            : msg,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot() {
    if (busy) return;
    const mail = email.trim();
    if (!mail) {
      toast.error("Informe seu e-mail para receber o link de redefinição.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(mail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Enviamos um link de redefinição para o seu e-mail.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao enviar o link.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-background">
      {/* Fundo fixo: nunca se move ao rolar ou alternar entre Entrar e Criar conta */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${authBg.url}")` }}
      />
      {/* Camada escura para manter o auto-relevo e a legibilidade sobre a imagem verde */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background/85 via-background/75 to-background/90 backdrop-blur-[1px]" />
      {/* Área de conteúdo: é a única que rola quando o cartão é maior que a tela */}
      <div className="relative z-10 flex h-full items-center justify-center overflow-y-auto px-4 py-12">
        <div className="w-full max-w-[30.5rem]">



        <header className="mb-8 text-center">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-widest shadow-[0_0_18px_-6px_var(--color-primary)] transition-colors duration-300 ${
              modo === "criar"
                ? "border-success/50 bg-success/10 text-success"
                : "border-primary/40 bg-card text-primary"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full shadow-[0_0_10px_var(--color-primary)] transition-colors duration-300 ${
                modo === "criar" ? "bg-success" : "bg-primary"
              }`}
            />
            {modo === "entrar" ? "Área restrita" : "Novo cadastro"}
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            📦 Inventory Control
          </h1>
          <p className="mt-3 text-base font-normal text-foreground">
            {modo === "entrar" ? "Entre com sua conta" : "Criar nova conta"}
          </p>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {modo === "entrar"
              ? "Informe seu e-mail e senha para abrir o Inventory Control na nuvem."
              : "Crie sua conta para salvar o estoque na nuvem e acessar de qualquer aparelho."}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-white/5 bg-card p-8 shadow-[12px_12px_28px_rgba(0,0,0,0.55),-10px_-10px_24px_rgba(255,255,255,0.08)] transition-all duration-500 ease-out hover:border-white/30 hover:shadow-[12px_12px_28px_rgba(0,0,0,0.55),-10px_-10px_24px_rgba(255,255,255,0.08),0_0_24px_rgba(255,255,255,0.12)] sm:p-10"
        >
          {/* Alternância Entrar / Criar conta */}
          <div className="mb-7 grid grid-cols-2 gap-2 rounded-2xl bg-card p-1.5 shadow-[inset_4px_4px_10px_rgba(0,0,0,0.5),inset_-4px_-4px_10px_rgba(255,255,255,0.07)]">
            {(["entrar", "criar"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModo(m)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  modo === m
                    ? "bg-gradient-to-br from-primary to-success text-primary-foreground shadow-[0_0_18px_-6px_var(--color-primary)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "entrar" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {/* Aviso destacado ao alternar para Criar conta */}
          {modo === "criar" && (
            <div
              key="banner-criar"
              className="mb-7 flex animate-in fade-in slide-in-from-top-2 items-center gap-3 rounded-2xl border border-success/50 bg-success/10 px-4 py-3 text-sm font-medium text-success duration-300"
            >
              <UserPlus className="h-5 w-5 shrink-0" />
              Você está criando uma nova conta. Preencha os dados abaixo para cadastrar.
            </div>
          )}

          <div className="grid gap-7">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                E-mail
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-1 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.55),inset_-6px_-6px_12px_rgba(255,255,255,0.07)] transition focus-within:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.6),inset_-6px_-6px_12px_rgba(255,255,255,0.08),0_0_18px_-4px_var(--color-primary)]">
                <Mail className="h-5 w-5 shrink-0 text-primary" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="w-full border-0 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Senha
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-1 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.55),inset_-6px_-6px_12px_rgba(255,255,255,0.07)] transition focus-within:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.6),inset_-6px_-6px_12px_rgba(255,255,255,0.08),0_0_18px_-4px_var(--color-primary)]">
                <Lock className="h-5 w-5 shrink-0 text-primary" />
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete={modo === "criar" ? "new-password" : "current-password"}
                  className="w-full border-0 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:text-primary"
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {modo === "entrar" && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgot}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Esqueceu a senha?
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-success px-5 py-4 text-sm font-semibold text-primary-foreground shadow-[6px_6px_16px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.05),0_0_28px_-6px_var(--color-primary)] transition hover:shadow-[6px_6px_18px_rgba(0,0,0,0.55),0_0_36px_-4px_var(--color-primary)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Aguarde…" : modo === "entrar" ? "Acessar Estoque" : "Criar conta"}
              {modo === "entrar" ? (
                <ArrowRight className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acesso protegido por e-mail e senha • dados salvos na nuvem
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          By Francisco Chagas — todos os direitos reservados 2026
        </p>
      </div>
      </div>



      {emailDuplicado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setEmailDuplicado(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-[1.75rem] border border-warning/40 bg-card p-7 text-center shadow-[0_0_40px_-8px_var(--color-primary)] duration-200"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-warning/50 bg-warning/10 text-warning">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-foreground">E-mail já cadastrado</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Você já cadastrou esse e-mail. Entre com um novo e-mail ou recupere sua senha de
              acesso.
            </p>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmailDuplicado(false);
                  setModo("entrar");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-success px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_28px_-6px_var(--color-primary)] transition active:scale-[0.99]"
              >
                <ArrowRight className="h-4 w-4" />
                Fazer login
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmailDuplicado(false);
                  setModo("entrar");
                  void handleForgot();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-background px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                <KeyRound className="h-4 w-4" />
                Recuperar senha
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmailDuplicado(false);
                  setEmail("");
                }}
                className="mt-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                Usar outro e-mail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
