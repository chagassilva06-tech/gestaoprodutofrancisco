import { useEffect, useState } from "react";
import type { Product } from "@/lib/estoque";
import { MINIMO_PADRAO } from "@/lib/estoque";

export type ProductFormData = {
  codigo: string;
  fabricante: string;
  tipo: string;
  produto: string;
  quantidade: number;
  minimo: number;
};

type Props = {
  open: boolean;
  product: Product | null;
  onSave: (data: ProductFormData) => void;
  onClose: () => void;
};

const VAZIO: ProductFormData = {
  codigo: "",
  fabricante: "",
  tipo: "Fabricante",
  produto: "",
  quantidade: 0,
  minimo: MINIMO_PADRAO,
};

export function ProductFormModal({ open, product, onSave, onClose }: Props) {
  const [form, setForm] = useState<ProductFormData>(VAZIO);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (open) {
      setErro("");
      setForm(
        product
          ? {
              codigo: product.codigo,
              fabricante: product.fabricante,
              tipo: product.tipo,
              produto: product.produto,
              quantidade: product.quantidade,
              minimo: product.minimo,
            }
          : VAZIO,
      );
    }
  }, [open, product]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.produto.trim()) {
      setErro("Informe o nome do produto.");
      return;
    }
    onSave({
      ...form,
      produto: form.produto.trim(),
      codigo: form.codigo.trim(),
      fabricante: form.fabricante.trim(),
      tipo: form.tipo.trim() || "Fabricante",
      quantidade: Math.max(0, Math.floor(form.quantidade) || 0),
      minimo: Math.max(0, Math.floor(form.minimo) || 0),
    });
  };

  const campo =
    "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="my-8 w-full max-w-lg rounded-2xl border border-primary/30 bg-card p-6 shadow-[0_0_40px_-8px_var(--color-primary)]"
      >
        <h3 className="font-display text-lg font-semibold text-foreground">
          {product ? "✏️ Editar produto" : "➕ Novo produto"}
        </h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-muted-foreground">Produto *</span>
            <input
              className={campo}
              value={form.produto}
              onChange={(e) => setForm((f) => ({ ...f, produto: e.target.value }))}
              placeholder="Ex.: Filtros de ar"
              autoFocus
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-muted-foreground">Código</span>
            <input
              className={campo}
              value={form.codigo}
              onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
              placeholder="Ex.: 4000"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-muted-foreground">Fabricante</span>
            <input
              className={campo}
              value={form.fabricante}
              onChange={(e) => setForm((f) => ({ ...f, fabricante: e.target.value }))}
              placeholder="Ex.: TEC FIL"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-muted-foreground">Tipo</span>
            <input
              className={campo}
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              placeholder="Ex.: Fabricante"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-muted-foreground">Quantidade atual</span>
            <input
              type="number"
              min={0}
              className={campo}
              value={form.quantidade}
              onChange={(e) => setForm((f) => ({ ...f, quantidade: Number(e.target.value) }))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-muted-foreground">Estoque mínimo</span>
            <input
              type="number"
              min={0}
              className={campo}
              value={form.minimo}
              onChange={(e) => setForm((f) => ({ ...f, minimo: Number(e.target.value) }))}
            />
          </label>
        </div>

        {erro && <p className="mt-3 text-sm font-medium text-destructive">{erro}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-xl border border-primary bg-primary/15 px-5 py-2.5 text-sm font-semibold text-foreground shadow-[0_0_18px_-6px_var(--color-primary)] transition hover:bg-primary/25"
          >
            💾 Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
