const badgeStyles: Record<string, string> = {
  ACTIVO: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  PAGADO: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  PAGADA: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  ATRASADO: "bg-red-500/10 text-red-400 border border-red-500/20",
  BAJO_STOCK: "bg-red-500/10 text-red-400 border border-red-500/20",
  SIN_STOCK: "bg-red-500/10 text-red-400 border border-red-500/20",
  ANULADA: "bg-red-500/10 text-red-400 border border-red-500/20",
  PENDIENTE: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  INACTIVO: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
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
  INACTIVO: "Inactivo",
}

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
  const styles = badgeStyles[status] ?? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
  const displayLabel = label ?? badgeLabels[status] ?? status

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles} ${className}`}
    >
      {displayLabel}
    </span>
  )
}
