import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acesso — Verificador de Estoque Mínimo" },
      {
        name: "description",
        content:
          "Tela de acesso ao Verificador de Estoque Mínimo. Informe a senha para entrar.",
      },
      { property: "og:title", content: "Acesso — Verificador de Estoque Mínimo" },
      {
        property: "og:description",
        content:
          "Tela de acesso ao Verificador de Estoque Mínimo. Informe a senha para entrar.",
      },
    ],
  }),
  component: Index,
});

const PASSWORD = "1234";

function Index() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password === PASSWORD) {
      setError(false);
      navigate({ to: "/estoque" });
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Área restrita
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Acessar Estoque
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Informe a senha de acesso para abrir o Verificador de Estoque Mínimo.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20 sm:p-8"
        >
          <div className="grid gap-5">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Digite a senha"
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-lg text-muted-foreground transition hover:text-foreground"
                >
                  {show ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive">
                Senha incorreta. Tente novamente.
              </p>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99]"
            >
              Acessar Estoque →
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acesso protegido por senha
        </p>
      </div>
    </div>
  );
}
