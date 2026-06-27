import type { Movement } from "@/lib/estoque";
import { ACAO_LABEL } from "@/lib/estoque";

type Props = {
  open: boolean;
  movements: Movement[];
  onClose: () => void;
};

function fmtData(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function HistoryModal({ open, movements, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-primary/30 bg-card p-6 shadow-[0_0_40px_-8px_var(--color-primary)]">
        <h3 className="font-display text-lg font-semibold text-foreground">
          🕘 Histórico de movimentações
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro de entradas, saídas e ajustes do estoque.
        </p>

        <ul className="mt-4 grid max-h-[60vh] gap-2 overflow-y-auto">
          {movements.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma movimentação registrada ainda.
            </li>
          ) : (
            movements.map((m) => {
              const positivo = m.delta > 0;
              const neutro = m.delta === 0;
              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {m.codigo || "—"}
                      </span>
                      <span className="font-medium text-foreground">{m.produto_nome}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {ACAO_LABEL[m.acao] ?? m.acao} • {fmtData(m.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    {!neutro && (
                      <div
                        className={`font-display text-sm font-bold ${
                          positivo ? "text-primary" : "text-red-400"
                        }`}
                      >
                        {positivo ? "+" : ""}
                        {m.delta.toLocaleString("pt-BR")}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {m.quantidade_anterior.toLocaleString("pt-BR")} →{" "}
                      {m.quantidade_nova.toLocaleString("pt-BR")}
                    </div>
                  </div>
                </li>
              );
            })
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
