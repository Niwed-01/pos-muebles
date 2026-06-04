const badgeStyles: Record<string, string> = {
  ACTIVO: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  PAGADO: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  PAGADA: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  RECUPERACION: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  ATRASADO: "bg-red-50 text-red-700 border border-red-200",
  BAJO_STOCK: "bg-red-50 text-red-700 border border-red-200",
  SIN_STOCK: "bg-red-50 text-red-700 border border-red-200",
  ANULADA: "bg-red-50 text-red-700 border border-red-200",
  PENDIENTE: "bg-amber-50 text-amber-700 border border-amber-200",
  INACTIVO: "bg-slate-50 text-slate-500 border border-slate-200",
}

const badgeLabels: Record<string, string> = {
  ACTIVO: "Activo",
  PAGADO: "Pagado",
  PAGADA: "Pagada",
  ATRASADO: "Atrasado",
  BAJO_STOCK: "Bajo stock",
  SIN_STOCK: "Sin stock",
  ANULADA: "Anulada",
  PENDIENTE: "Pendiente",
  RECUPERACION: "Recuperación",
  INACTIVO: "Inactivo",
}

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
  const styles = badgeStyles[status] ?? "bg-slate-50 text-slate-500 border border-slate-200"
  const displayLabel = label ?? badgeLabels[status] ?? status

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles} ${className}`}
    >
      {displayLabel}
    </span>
  )
}
