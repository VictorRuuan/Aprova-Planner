type CardProps = {
  title?: string;
  children: React.ReactNode;
};

export function Card({ title, children }: CardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {title && (
        <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
      )}

      {children}
    </div>
  );
}
