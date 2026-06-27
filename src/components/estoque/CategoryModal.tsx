import { useState } from "react";
import type { Category } from "@/lib/estoque";

type Props = {
  open: boolean;
  categories: Category[];
  onAdd: (nome: string, icon: string, termo: string) => void;
  onDelete: (cat: Category) => void;
  onClose: () => void;
};

export function CategoryModal({ open, categories, onAdd, onDelete, onClose }: Props) {
  const [nome, setNome] = useState("");
  const [icon, setIcon] = useState("📦");
  const [termo, setTermo] = useState("");

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onAdd(nome.trim(), icon.trim() || "📦", (termo.trim() || nome.trim()).toLowerCase());
    setNome("");
    setIcon("📦");
    setTermo("");
  };

  const campo =
    "rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-lg rounded-2xl border border-primary/30 bg-card p-6 shadow-[0_0_40px_-8px_var(--color-primary)]">
        <h3 className="font-display text-lg font-semibold text-foreground">🗂️ Categorias</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Categorias funcionam como filtros rápidos. O “termo” é a palavra usada para encontrar os
          produtos.
        </p>

        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[80px_1fr_1fr_auto]">
          <input
            className={campo}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="Ícone"
            aria-label="Ícone"
          />
          <input
            className={campo}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome (ex.: Filtros)"
            aria-label="Nome"
          />
          <input
            className={campo}
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Termo de busca (ex.: filtro)"
            aria-label="Termo"
          />
          <button
            type="submit"
            className="rounded-xl border border-primary bg-primary/15 px-4 py-2.5 text-sm font-semibold text-foreground shadow-[0_0_18px_-6px_var(--color-primary)] transition hover:bg-primary/25"
          >
            ➕ Add
          </button>
        </form>

        <ul className="mt-5 grid max-h-64 gap-2 overflow-y-auto">
          {categories.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Nenhuma categoria cadastrada.
            </li>
          ) : (
            categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{c.icon}</span>
                  <span className="font-medium text-foreground">{c.nome}</span>
                  <span className="text-xs text-muted-foreground">• {c.termo}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(c)}
                  className="rounded-lg border border-red-900/50 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-950/40"
                >
                  🗑️ Excluir
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
