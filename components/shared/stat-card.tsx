import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
}

export function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500">{title}</span>
        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
          <Icon className="h-5 w-5 text-emerald-600" />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        {trend && (
          <span className={`text-sm mb-0.5 ${trend.positive ? "text-emerald-600" : "text-red-600"}`}>
            {trend.positive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  )
}
