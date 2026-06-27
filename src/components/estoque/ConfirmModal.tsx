type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-primary/30 bg-card p-6 shadow-[0_0_40px_-8px_var(--color-primary)]">
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              danger
                ? "rounded-xl border border-red-600 bg-red-950/50 px-4 py-2.5 text-sm font-semibold text-red-200 shadow-[0_0_18px_-6px_rgba(153,27,27,0.9)] transition hover:bg-red-900/60"
                : "rounded-xl border border-primary bg-primary/15 px-4 py-2.5 text-sm font-semibold text-foreground shadow-[0_0_18px_-6px_var(--color-primary)] transition hover:bg-primary/25"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
