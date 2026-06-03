import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
}

export function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">{title}</span>
        <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
          <Icon className="h-5 w-5 text-emerald-400" />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend && (
          <span className={`text-sm mb-0.5 ${trend.positive ? "text-emerald-400" : "text-red-400"}`}>
            {trend.positive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  )
}
