type ValidationMessageProps = {
  tone: "info" | "warning" | "error" | "success";
  children: React.ReactNode;
};

const toneClasses = {
  info: "border-sky-200 bg-sky-50 text-sky-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function ValidationMessage({ tone, children }: ValidationMessageProps) {
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${toneClasses[tone]}`}>
      {children}
    </div>
  );
}
