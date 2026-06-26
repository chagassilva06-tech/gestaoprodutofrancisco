import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { User, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acesso — Verificador de Estoque Mínimo" },
      {
        name: "description",
        content:
          "Tela de acesso ao Verificador de Estoque Mínimo. Informe usuário e senha para entrar.",
      },
      { property: "og:title", content: "Acesso — Verificador de Estoque Mínimo" },
      {
        property: "og:description",
        content:
          "Tela de acesso ao Verificador de Estoque Mínimo. Informe usuário e senha para entrar.",
      },
    ],
  }),
  component: Index,
});

const USERNAME = "Francisco";
const PASSWORD = "35540033";

function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (user.trim() === USERNAME && password === PASSWORD) {
      setError(false);
      navigate({ to: "/estoque" });
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary shadow-[0_0_18px_-6px_var(--color-primary)]">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
            Área restrita
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Product Management
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Informe seu usuário e senha para abrir o Verificador de Estoque Mínimo.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-background p-8 shadow-[12px_12px_28px_rgba(0,0,0,0.55),-10px_-10px_24px_rgba(255,255,255,0.04)] sm:p-10"
        >
          <div className="grid gap-7">
            <div>
              <label htmlFor="user" className="mb-2 block text-sm font-medium">
                Usuário
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-background px-4 py-1 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.55),inset_-6px_-6px_12px_rgba(255,255,255,0.04)] transition focus-within:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.6),inset_-6px_-6px_12px_rgba(255,255,255,0.05),0_0_18px_-4px_var(--color-primary)]">
                <User className="h-5 w-5 shrink-0 text-primary" />
                <input
                  id="user"
                  type="text"
                  value={user}
                  onChange={(e) => {
                    setUser(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Digite o usuário"
                  autoComplete="username"
                  className="w-full border-0 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Senha
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-background px-4 py-1 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.55),inset_-6px_-6px_12px_rgba(255,255,255,0.04)] transition focus-within:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.6),inset_-6px_-6px_12px_rgba(255,255,255,0.05),0_0_18px_-4px_var(--color-primary)]">
                <Lock className="h-5 w-5 shrink-0 text-primary" />
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Digite a senha"
                  autoComplete="current-password"
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

            {error && (
              <p className="text-center text-sm font-medium text-destructive">
                Usuário ou senha incorretos. Tente novamente.
              </p>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-success px-5 py-4 text-sm font-semibold text-primary-foreground shadow-[6px_6px_16px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.05),0_0_28px_-6px_var(--color-primary)] transition hover:shadow-[6px_6px_18px_rgba(0,0,0,0.55),0_0_36px_-4px_var(--color-primary)] active:scale-[0.99]"
            >
              Acessar Estoque
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acesso protegido por usuário e senha
        </p>
      </div>
    </div>
  );
}
