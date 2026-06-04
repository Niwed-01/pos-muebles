"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(Number(value))

type RecoveryStatus = "EN_PROCESO" | "RECUPERADO" | "RESUELTO" | "DESISTIDO"

const statusTabs: { value: RecoveryStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "EN_PROCESO", label: "En Proceso" },
  { value: "RECUPERADO", label: "Recuperado" },
  { value: "RESUELTO", label: "Resuelto" },
  { value: "DESISTIDO", label: "Desistido" },
]

export default function RecoveryPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<RecoveryStatus | "ALL">("ALL")

  const { data: recoveries = [], isLoading, isRefetching } = useQuery({
    queryKey: ["recoveries"],
    queryFn: async () => {
      const res = await fetch("/api/recovery?limit=500")
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Error al cargar recuperaciones")
      return json.data ?? []
    },
  })

  const filtered = useMemo(() => {
    return recoveries.filter((r: any) => {
      if (activeTab !== "ALL" && r.estado !== activeTab) return false
      if (search) {
        const text = search.toLowerCase()
        const nombre = r.credit?.customer?.nombre?.toLowerCase() ?? ""
        const cedula = r.credit?.customer?.cedula?.toLowerCase() ?? ""
        if (!nombre.includes(text) && !cedula.includes(text)) return false
      }
      return true
    })
  }, [recoveries, activeTab, search])

  const counters = useMemo(() => {
    const c: Record<string, number> = { ALL: recoveries.length }
    for (const r of recoveries) {
      const estado = (r as any).estado || "EN_PROCESO"
      c[estado] = (c[estado] || 0) + 1
    }
    return c
  }, [recoveries])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Recuperación de Muebles"
        description="Gestión de procesos de cobro y recuperación de muebles por incumplimiento"
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-indigo-600" />
            Filtros de búsqueda
          </h3>
          {isRefetching && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />
              Sincronizando...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente / Cédula</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nombre o Cédula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-slate-50 hover:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex items-end justify-end">
            {search && (
              <button
                onClick={() => setSearch("")}
                className="h-10 px-4 border border-slate-350 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5"
              >
                <X className="h-4 w-4" />
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border transition-all whitespace-nowrap ${
              activeTab === tab.value
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-950/10"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.value ? "bg-indigo-700 text-indigo-100" : "bg-slate-100 text-slate-500"}`}>
              {counters[tab.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12 text-slate-400" />}
          title="No hay procesos de recuperación"
          description="Los créditos atrasados pueden enviarse a recuperación desde la página de créditos."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cédula</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mueble(s)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Saldo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Días</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((rec: any) => {
                  const saldo = Number(rec.credit?.saldo ?? 0)
                  const items: Array<{ nombre?: string; productId?: string; cantidad?: number }> = rec.credit?.venta?.items ?? []
                  const productosNombres = items.map((i: any) => i.nombre || i.productId).join(", ")
                  const diasEnProceso = rec.fechaInicio
                    ? Math.ceil((Date.now() - new Date(rec.fechaInicio).getTime()) / (1000 * 60 * 60 * 24))
                    : 0
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => router.push(`/recovery/${rec.id}`)}
                      className="cursor-pointer hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {rec.credit?.customer?.nombre ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap font-mono">
                        {rec.credit?.customer?.cedula || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">
                        {productosNombres || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {formatCurrency(saldo)}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {rec.estado === "EN_PROCESO" ? (
                          <span className="px-2 py-0.5 text-xs font-bold text-red-650 bg-red-100 rounded-full">
                            {diasEnProceso} días
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <StatusBadge status={rec.estado} />
                      </td>
                      <td className="px-6 py-4 text-sm text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => router.push(`/recovery/${rec.id}`)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                          title="Ver detalles"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
