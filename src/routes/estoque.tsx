import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque Mínimo — Controle de Inventário" },
      {
        name: "description",
        content:
          "Busque por código, fabricante, tipo ou produto e verifique se há necessidade de reposição com base no estoque mínimo.",
      },
      { property: "og:title", content: "Estoque Mínimo — Controle de Inventário" },
      {
        property: "og:description",
        content:
          "Busque por código, fabricante, tipo ou produto e verifique se há necessidade de reposição com base no estoque mínimo.",
      },
    ],
  }),
  component: Estoque,
});

type Produto = {
  codigo: string;
  fabricante: string;
  tipo: string;
  produto: string;
  quantidade: number;
  minimo: number;
};

const MINIMO_PADRAO = 500;

const PRODUTOS: Produto[] = [
  { codigo: "6163", fabricante: "DELPHI", tipo: "Fabricante", produto: "Injeção/ignição", quantidade: 100, minimo: MINIMO_PADRAO },
  { codigo: "4843", fabricante: "ELGIN S/A", tipo: "Fabricante", produto: "Pilhas", quantidade: 200, minimo: MINIMO_PADRAO },
  { codigo: "115", fabricante: "EQUIPAGE/EQMAX", tipo: "Fabricante", produto: "Racks de teto", quantidade: 300, minimo: MINIMO_PADRAO },
  { codigo: "2370", fabricante: "FILTROS BRASIL", tipo: "Fabricante", produto: "Filtros cabine", quantidade: 400, minimo: MINIMO_PADRAO },
  { codigo: "6405", fabricante: "Flash Cover Capota Marítima", tipo: "Fabricante", produto: "Capota Marítima", quantidade: 500, minimo: MINIMO_PADRAO },
  { codigo: "3115", fabricante: "GRID CALOTAS", tipo: "Fabricante", produto: "Calotas", quantidade: 600, minimo: MINIMO_PADRAO },
  { codigo: "2561", fabricante: "H BUSTER", tipo: "Fabricante", produto: "Mídia/tela", quantidade: 700, minimo: MINIMO_PADRAO },
  { codigo: "355", fabricante: "HENKEL LTDA", tipo: "Fabricante", produto: "Cola/adesivos", quantidade: 800, minimo: MINIMO_PADRAO },
  { codigo: "8047", fabricante: "M3 capas", tipo: "Fabricante", produto: "Capas de volante", quantidade: 900, minimo: MINIMO_PADRAO },
  { codigo: "1497", fabricante: "Magneti Marelli", tipo: "Fabricante", produto: "Bobinas/vela", quantidade: 1000, minimo: MINIMO_PADRAO },
  { codigo: "3102", fabricante: "MULTILASER", tipo: "Fabricante", produto: "Multimídia", quantidade: 2000, minimo: MINIMO_PADRAO },
  { codigo: "953", fabricante: "NP ADESIVOS", tipo: "Fabricante", produto: "Adesivos", quantidade: 3000, minimo: MINIMO_PADRAO },
  { codigo: "2389", fabricante: "PETROBRAS (BR)", tipo: "Fabricante", produto: "Lubrificantes", quantidade: 4000, minimo: MINIMO_PADRAO },
  { codigo: "4768", fabricante: "PHILCO", tipo: "Fabricante", produto: "Pilhas/Aparelhos eletrônicos", quantidade: 5000, minimo: MINIMO_PADRAO },
  { codigo: "56", fabricante: "PIONEER", tipo: "Fabricante", produto: "Som automotivo", quantidade: 6000, minimo: MINIMO_PADRAO },
  { codigo: "1751", fabricante: "ROADSTAR", tipo: "Fabricante", produto: "Display/Telas som", quantidade: 7000, minimo: MINIMO_PADRAO },
  { codigo: "7436", fabricante: "SAINT-GOBAIN DISTRI BRASIL LTDA", tipo: "Fabricante", produto: "Caixa de som/Fones", quantidade: 8000, minimo: MINIMO_PADRAO },
  { codigo: "6127", fabricante: "SUPORTE REI", tipo: "Fabricante", produto: "Suporte/Linha pesada", quantidade: 9000, minimo: MINIMO_PADRAO },
  { codigo: "4000", fabricante: "TEC FIL", tipo: "Fabricante", produto: "Filtros de ar", quantidade: 1000, minimo: MINIMO_PADRAO },
  { codigo: "362", fabricante: "WEGA MOTORS", tipo: "Fabricante", produto: "Filtros/Palhetas", quantidade: 2000, minimo: MINIMO_PADRAO },
];

const CARDS: { titulo: string; icon: string; termo: string }[] = [
  { titulo: "Filtros de ar", icon: "🌀", termo: "filtro" },
  { titulo: "Mídia Player", icon: "📺", termo: "mídia" },
  { titulo: "Calotas", icon: "🛞", termo: "calota" },
  { titulo: "Palhetas", icon: "🧹", termo: "palheta" },
];

function Estoque() {
  const [busca, setBusca] = useState("");
  const [filtroCard, setFiltroCard] = useState<string | null>(null);
  const [filtroRepor, setFiltroRepor] = useState<"repor" | "ok" | null>(null);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  // Quantidades atuais (com ajustes manuais aplicados)
  const [quantidades, setQuantidades] = useState<Record<string, number>>(
    () => Object.fromEntries(PRODUTOS.map((p) => [p.codigo, p.quantidade])),
  );
  // Valores digitados em cada campo "completar estoque"
  const [reposicoes, setReposicoes] = useState<Record<string, string>>({});

  const ajustarEstoque = (codigo: string, minimo: number, sinal: 1 | -1) => {
    const valor = Number(reposicoes[codigo]);
    if (!Number.isFinite(valor) || valor <= 0) return;
    setQuantidades((prev) => {
      const atual = prev[codigo] ?? 0;
      // Não permite passar do mínimo padronizado nem ficar abaixo de 0
      const novo = Math.max(0, Math.min(minimo, atual + sinal * valor));
      return { ...prev, [codigo]: novo };
    });
    setReposicoes((prev) => ({ ...prev, [codigo]: "" }));
  };

  // Completa um único produto até a quantidade mínima padronizada cadastrada
  const completarMinimo = (codigo: string, minimo: number) => {
    setQuantidades((prev) => ({ ...prev, [codigo]: minimo }));
    setReposicoes((prev) => ({ ...prev, [codigo]: "" }));
  };

  // Completa TODOS os produtos atualmente listados até o mínimo padronizado
  const completarTodosMinimo = () => {
    setQuantidades((prev) => {
      const novo = { ...prev };
      for (const p of resultados) novo[p.codigo] = p.minimo;
      return novo;
    });
  };

  const zerarEstoque = () => {
    if (
      !window.confirm(
        "Tem certeza que deseja zerar o estoque de TODOS os produtos cadastrados? Esta ação não pode ser desfeita.",
      )
    )
      return;
    setQuantidades(Object.fromEntries(PRODUTOS.map((p) => [p.codigo, 0])));
  };

  const sugestoes = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (termo === "") return [];
    const valores = new Set<string>();
    for (const p of PRODUTOS) {
      for (const campo of [p.produto, p.fabricante, p.tipo, p.codigo]) {
        if (campo.toLowerCase().includes(termo)) valores.add(campo);
      }
    }
    return Array.from(valores).slice(0, 6);
  }, [busca]);

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const card = filtroCard?.toLowerCase() ?? null;
    return PRODUTOS.filter((p) => {
      const alvo = `${p.produto} ${p.tipo} ${p.fabricante}`.toLowerCase();
      const matchCard = card ? alvo.includes(card) : true;
      const matchBusca =
        termo === "" ||
        p.codigo.toLowerCase().includes(termo) ||
        p.fabricante.toLowerCase().includes(termo) ||
        p.tipo.toLowerCase().includes(termo) ||
        p.produto.toLowerCase().includes(termo);
      const atual = quantidades[p.codigo] ?? p.quantidade;
      const precisaRepor = atual < p.minimo;
      const matchRepor =
        filtroRepor === null
          ? true
          : filtroRepor === "repor"
            ? precisaRepor
            : !precisaRepor;
      return matchCard && matchBusca && matchRepor;
    });
  }, [busca, filtroCard, filtroRepor, quantidades]);

  const totalProdutos = PRODUTOS.length;
  const totalItens = Object.values(quantidades).reduce((soma, q) => soma + q, 0);


  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary shadow-[0_0_18px_-6px_var(--color-primary)]">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
            Controle de Inventário
          </span>
          <p className="mt-2 text-xs font-medium tracking-wide text-muted-foreground">
            By Francisco Chagas
          </p>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Gestão de produtos
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Busque por código, fabricante, tipo ou produto e veja quais itens precisam de
            reposição.
          </p>
        </header>

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

              {/* Sugestões de autocompletar */}
              {mostrarSugestoes && sugestoes.length > 0 && (
                <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-primary/40 bg-card shadow-[0_0_20px_-4px_var(--color-primary)] animate-fade-in">
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
          <p className="mt-2 px-1 text-xs text-muted-foreground">
            Filtra por: Código • Fabricante • Tipo • Produto
          </p>
        </div>


        {/* Card resumo do estoque */}
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
              <div className="font-display text-2xl font-bold text-primary">
                {totalProdutos}
              </div>
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

        {/* 4 cards principais por produto */}
        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CARDS.map((c) => {
            const ativo = filtroCard === c.termo;
            const total = PRODUTOS.filter((p) =>
              `${p.produto} ${p.tipo} ${p.fabricante}`.toLowerCase().includes(c.termo),
            ).length;
            return (
              <button
                key={c.titulo}
                type="button"
                onClick={() => setFiltroCard(ativo ? null : c.termo)}
                className={`group rounded-xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 ${
                  ativo
                    ? "border-primary bg-primary/10 shadow-[0_0_24px_-2px_var(--color-primary),inset_0_0_0_1px_var(--color-primary)]"
                    : "border-primary/30 bg-card shadow-[0_0_18px_-6px_var(--color-primary)] hover:border-primary/60 hover:bg-primary/5 hover:shadow-[0_0_28px_-4px_var(--color-primary)]"
                }`}
              >
                <div className="text-2xl">{c.icon}</div>
                <div className="mt-2 font-display text-sm font-semibold">{c.titulo}</div>
                <div className="text-xs text-muted-foreground">{total} produto(s)</div>
              </button>
            );
          })}
        </section>

        {/* Botões de ação / filtros */}
        <div className="mb-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => setFiltroRepor(filtroRepor === "repor" ? null : "repor")}
            className={`rounded-xl border px-6 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
              filtroRepor === "repor"
                ? "border-red-600 bg-red-950/40 text-red-200 shadow-[0_0_28px_-2px_rgba(153,27,27,0.9)]"
                : "border-red-900/50 bg-card text-foreground shadow-[0_0_18px_-6px_rgba(153,27,27,0.8)] hover:border-red-700 hover:bg-red-950/20 hover:shadow-[0_0_28px_-4px_rgba(153,27,27,0.9)]"
            }`}
          >
            🔴 Precisa repor
          </button>
          <button
            type="button"
            onClick={() => setFiltroRepor(filtroRepor === "ok" ? null : "ok")}
            className={`rounded-xl border px-6 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
              filtroRepor === "ok"
                ? "border-primary bg-primary/15 text-foreground shadow-[0_0_28px_-2px_var(--color-primary)]"
                : "border-primary/40 bg-card text-foreground shadow-[0_0_18px_-6px_var(--color-primary)] hover:border-primary/70 hover:bg-primary/10 hover:shadow-[0_0_28px_-4px_var(--color-primary)]"
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
            className="rounded-xl border border-primary/40 bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-[0_0_18px_-6px_var(--color-primary)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/70 hover:bg-primary/10 hover:shadow-[0_0_28px_-4px_var(--color-primary)]"
          >
            📦 Carregar tudo
          </button>
          <button
            type="button"
            onClick={completarTodosMinimo}
            className="rounded-xl border border-primary bg-primary/15 px-6 py-3 text-sm font-semibold text-foreground shadow-[0_0_18px_-6px_var(--color-primary)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/25 hover:shadow-[0_0_28px_-2px_var(--color-primary)]"
          >
            ✅ Completar estoque (todos)
          </button>
          <button
            type="button"
            onClick={zerarEstoque}
            className="rounded-xl border border-red-600 bg-red-950/40 px-6 py-3 text-sm font-semibold text-red-200 shadow-[0_0_18px_-6px_rgba(153,27,27,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-900/50 hover:shadow-[0_0_28px_-2px_rgba(153,27,27,0.95)]"
          >
            🗑️ Zerar estoque
          </button>
        </div>


        {/* Resultados */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-lg shadow-black/20 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              {filtroCard
                ? `Filtro: ${CARDS.find((c) => c.termo === filtroCard)?.titulo}`
                : "Todos os produtos"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {resultados.length} resultado(s)
            </span>
          </div>

          {resultados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado para a busca informada.
            </div>
          ) : (
            <ul className="grid gap-3">
              {resultados.map((p) => {
                const atual = quantidades[p.codigo] ?? p.quantidade;
                const baixo = atual < p.minimo;
                const acima = atual > p.minimo;
                return (
                  <li
                    key={p.codigo}
                    className={`rounded-xl border bg-background p-4 transition-all duration-300 ${
                      baixo
                        ? "border-red-700/60 shadow-[0_0_24px_-2px_rgba(153,27,27,0.85)] hover:border-red-600 hover:shadow-[0_0_32px_0px_rgba(153,27,27,0.95)]"
                        : "border-primary/20 hover:border-primary/50 hover:shadow-[0_0_22px_-6px_var(--color-primary)]"
                    }`}
                  >

                    <div className="flex items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            {p.codigo}
                          </span>
                          <h3 className="font-display text-sm font-semibold text-foreground">
                            {p.produto}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <strong className="text-foreground">Fabricante:</strong> {p.fabricante}{" "}
                          • <strong className="text-foreground">Tipo:</strong> {p.tipo}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
                            <div
                              className={`h-full rounded-full ${
                                baixo ? "bg-warning" : "bg-primary"
                              }`}
                              style={{
                                width: `${Math.min(100, (atual / p.minimo) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {atual} / mín. {p.minimo} un.
                          </span>
                        </div>

                        {/* Completar / ajustar estoque (sempre disponível) */}
                        <div
                          className={`mt-3 flex flex-wrap items-center gap-2 rounded-lg border p-2 ${
                            baixo || acima
                              ? "border-warning/30 bg-warning/5"
                              : "border-primary/30 bg-primary/5"
                          }`}
                        >
                          <span
                            className={`text-xs font-medium ${
                              baixo
                                ? "text-warning-foreground"
                                : acima
                                  ? "text-warning-foreground"
                                  : "text-foreground"
                            }`}
                          >
                            {baixo
                              ? `Faltam ${p.minimo - atual} un.`
                              : acima
                                ? `⚠️ Estoque ${Math.round((atual / p.minimo) * 100)}% (excedeu em ${atual - p.minimo} un.) — insira apenas o mínimo (${p.minimo} un.)`
                                : "✅ Estoque completo (100%)"}
                          </span>

                          <input
                            type="number"
                            min={1}
                            value={reposicoes[p.codigo] ?? ""}
                            onChange={(e) =>
                              setReposicoes((prev) => ({
                                ...prev,
                                [p.codigo]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") ajustarEstoque(p.codigo, p.minimo, 1);
                            }}
                            placeholder="Qtd."
                            className="h-8 w-24 rounded-md border border-input bg-background px-2 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-ring/40"
                          />
                          <button
                            type="button"
                            onClick={() => ajustarEstoque(p.codigo, p.minimo, 1)}
                            disabled={atual >= p.minimo}
                            className="h-8 rounded-md border border-primary/40 bg-primary/10 px-3 text-xs font-semibold text-foreground transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            ➕ {baixo ? "Completar estoque" : "Adicionar quantidade"}
                          </button>
                          <button
                            type="button"
                            onClick={() => ajustarEstoque(p.codigo, p.minimo, -1)}
                            disabled={atual <= 0}
                            className="h-8 rounded-md border border-warning/40 bg-warning/10 px-3 text-xs font-semibold text-foreground transition hover:bg-warning/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            ➖ Diminuir quantidade
                          </button>
                          <button
                            type="button"
                            onClick={() => completarMinimo(p.codigo, p.minimo)}
                            disabled={atual >= p.minimo}
                            className="h-8 rounded-md border border-primary bg-primary/15 px-3 text-xs font-semibold text-foreground transition hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            ✅ Completar ao mínimo ({p.minimo})
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setReposicoes((prev) => ({
                                ...prev,
                                [p.codigo]: String(p.minimo),
                              }))
                            }
                            className="h-8 rounded-md px-2 text-xs text-muted-foreground transition hover:text-foreground"
                          >
                            Preencher mínimo
                          </button>
                        </div>


                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          baixo
                            ? "bg-warning/15 text-warning-foreground"
                            : "bg-primary/15 text-foreground"
                        }`}
                      >
                        {baixo ? "📦 Repor" : "✅ OK"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="mt-10 text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-card px-6 py-3 text-sm font-semibold text-primary shadow-[0_0_24px_-8px_var(--color-primary)] transition hover:bg-primary/10 hover:shadow-[0_0_32px_-6px_var(--color-primary)] active:scale-[0.99]"
          >
            ← Voltar à tela de acesso
          </Link>
        </footer>
      </div>
    </div>
  );
}
