import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — Controle de Inventário" },
      {
        name: "description",
        content: "Defina uma nova senha para acessar o Controle de Inventário na nuvem.",
      },
      { property: "og:title", content: "Redefinir senha — Controle de Inventário" },
      {
        property: "og:description",
        content: "Defina uma nova senha para acessar o Controle de Inventário na nuvem.",
      },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // O link de recuperação chega com um evento de recuperação de senha
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha redefinida! Entrando…");
      navigate({ to: "/estoque" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao redefinir a senha.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[30.5rem]">
        <header className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary shadow-[0_0_18px_-6px_var(--color-primary)]">
            <ShieldCheck className="h-4 w-4" />
            Nova senha
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Redefinir senha
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {ready
              ? "Digite e confirme sua nova senha para voltar a acessar o estoque."
              : "Abra esta página pelo link enviado ao seu e-mail para redefinir a senha."}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-transparent bg-background p-8 shadow-[12px_12px_28px_rgba(0,0,0,0.55),-10px_-10px_24px_rgba(255,255,255,0.04)] sm:p-10"
        >
          <div className="grid gap-7">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Nova senha
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-background px-4 py-1 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.55),inset_-6px_-6px_12px_rgba(255,255,255,0.04)]">
                <Lock className="h-5 w-5 shrink-0 text-primary" />
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete="new-password"
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
            </div>

            <div>
              <label htmlFor="confirm" className="mb-2 block text-sm font-medium">
                Confirmar senha
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-background px-4 py-1 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.55),inset_-6px_-6px_12px_rgba(255,255,255,0.04)]">
                <Lock className="h-5 w-5 shrink-0 text-primary" />
                <input
                  id="confirm"
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                  className="w-full border-0 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !ready}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-success px-5 py-4 text-sm font-semibold text-primary-foreground shadow-[6px_6px_16px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.05),0_0_28px_-6px_var(--color-primary)] transition hover:shadow-[6px_6px_18px_rgba(0,0,0,0.55),0_0_36px_-4px_var(--color-primary)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Aguarde…" : "Salvar nova senha"}
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="text-center text-xs text-muted-foreground transition hover:text-primary"
            >
              Voltar para o acesso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
