import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Início — Acessar Calculadora" },
      {
        name: "description",
        content: "Tela inicial para acessar a calculadora moderna estilo Windows.",
      },
      { property: "og:title", content: "Início — Acessar Calculadora" },
      {
        property: "og:description",
        content: "Tela inicial para acessar a calculadora moderna estilo Windows.",
      },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Bem-vindo
        </span>

        <div className="mt-8 text-6xl">🧮</div>

        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Calculadora Moderna
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Uma calculadora rápida e elegante, no estilo do Windows. Clique no botão
          abaixo para começar.
        </p>

        <Link
          to="/calculadora"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.98]"
        >
          🧮 Acessar Calculadora
        </Link>
      </div>
    </div>
  );
}
