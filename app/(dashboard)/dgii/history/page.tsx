"use client"

import { useQuery } from "@tanstack/react-query"
import { History, Download, ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import Link from "next/link"

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(Number(value))

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-DO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(date))

const months: Record<string, string> = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre",
}

function formatPeriodo(p: string): string {
  const anio = p.slice(0, 4)
  const mes = p.slice(4, 6)
  return `${months[mes] || mes} ${anio}`
}

export default function DgiiHistoryPage() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["dgii-submissions"],
    queryFn: async () => {
      const res = await fetch("/api/dgii/submissions")
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json.data ?? []
    },
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader title="Historial de Declaraciones DGII" description="Archivos TXT generados">
        <Link
          href="/dgii"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </PageHeader>

      {isLoading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner /></div>
      ) : !submissions || submissions.length === 0 ? (
        <EmptyState
          icon={<History className="h-12 w-12 text-slate-400" />}
          title="Sin historial"
          description="Aún no se ha generado ningún archivo TXT para DGII."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Período</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Registros</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Monto</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">ITBIS</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Generado por</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-slate-700 font-medium whitespace-nowrap">
                      {formatPeriodo(s.periodo)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        s.tipo === "607"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        Formato {s.tipo}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-700">{s.registros}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-700">{formatCurrency(s.totalMonto)}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-blue-600">{formatCurrency(s.totalITBIS)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{s.user?.nombre || "—"}</td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDate(s.generadoEn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
