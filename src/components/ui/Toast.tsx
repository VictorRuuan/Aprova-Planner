import { CheckCircle2, XCircle } from "lucide-react";

export type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

type ToastProps = {
  toast: ToastState;
  onClose: () => void;
};

export function Toast({ toast, onClose }: ToastProps) {
  if (!toast) return null;

  const Icon = toast.type === "success" ? CheckCircle2 : XCircle;

  return (
    <div className="fixed right-4 top-4 z-50">
      <div
        className={[
          "flex max-w-sm items-start gap-3 rounded-2xl border bg-white p-4 text-sm shadow-xl dark:bg-slate-900",
          toast.type === "success"
            ? "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300"
            : "border-red-200 text-red-700 dark:border-red-900 dark:text-red-300",
        ].join(" ")}
      >
        <Icon size={20} />
        <p className="flex-1">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
          aria-label="Fechar aviso"
        >
          x
        </button>
      </div>
    </div>
  );
}
