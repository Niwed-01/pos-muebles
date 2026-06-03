"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CreditCard, DollarSign, BadgeCheck, Calendar } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"

interface Payment {
  id: string
  monto: string
  fecha: string
  notas: string | null
  acumulado?: number
}

interface ScheduleRow {
  cuota: number
  fecha: string
  capital: number
  interes: number
  seguro: number
  totalCuota: number
  saldoRestante: number
  pagada: boolean
  atrasada: boolean
}

interface CreditDetail {
  id: string
  montoTotal: string
  inicial: string
  saldo: string
  cuotas: number
  frecuencia: string
  tasaInteres: string
  seguro: string
  estado: string
  customer: { id: string; nombre: string; cedula: string | null; telefono: string | null }
  venta: { id: string; numero: number; total: string; creadoEn: string }
  pagos: Payment[]
  schedule: ScheduleRow[]
  resumen: {
    montoFinanciado: number
    cuotaFijaSinSeguro: number
    cuotaConSeguro: number
    totalAPagar: number
    totalIntereses: number
    totalSeguros: number
  }
}

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(Number(value))

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))

const estadoBadge: Record<string, string> = {
  ACTIVO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ATRASADO: "bg-red-500/10 text-red-400 border-red-500/20",
  PAGADO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
}

export default function CreditDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const creditId = params.id as string

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pagoMonto, setPagoMonto] = useState("")
  const [pagoNotas, setPagoNotas] = useState("")

  const { data: credit, isLoading } = useQuery({
    queryKey: ["credit", creditId],
    queryFn: async () => {
      const res = await fetch(`/api/credits/${creditId}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data as CreditDetail
    },
  })

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/credits/${creditId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto: Number(pagoMonto),
          notas: pagoNotas || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Error al registrar pago")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit", creditId] })
      queryClient.invalidateQueries({ queryKey: ["credits"] })
      setShowPaymentModal(false)
      setPagoMonto("")
      setPagoNotas("")
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const totalPagado = useMemo(
    () => (credit ? credit.pagos.reduce((sum, p) => sum + Number(p.monto), 0) : 0),
    [credit]
  )

  if (isLoading) return <LoadingSpinner className="mt-20" />

  if (!credit) {
    return (
      <div>
        <PageHeader title="Crédito no encontrado" />
        <EmptyState title="Crédito no encontrado" description="El crédito no existe o ha sido eliminado." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={`Crédito #${credit.venta.numero}`} description={credit.customer.nombre}>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Monto Original</p>
              <p className="text-xl font-bold text-white">{formatCurrency(credit.montoTotal)}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Pagado</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalPagado)}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <BadgeCheck className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Saldo</p>
              <p className="text-xl font-bold text-white">{formatCurrency(credit.saldo)}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Estado</p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mt-1 ${
                  estadoBadge[credit.estado] ?? ""
                }`}
              >
                {credit.estado === "ACTIVO"
                  ? "Activo"
                  : credit.estado === "ATRASADO"
                    ? "Atrasado"
                    : "Pagado"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <p className="text-xs text-slate-500 mb-1">Cuota fija (sin seguro)</p>
          <p className="text-lg font-bold text-white font-mono">{formatCurrency(credit.resumen.cuotaFijaSinSeguro)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <p className="text-xs text-slate-500 mb-1">Cuota + seguro</p>
          <p className="text-lg font-bold text-white font-mono">{formatCurrency(credit.resumen.cuotaConSeguro)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <p className="text-xs text-slate-500 mb-1">Total intereses</p>
          <p className="text-lg font-bold text-white font-mono">{formatCurrency(credit.resumen.totalIntereses)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <p className="text-xs text-slate-500 mb-1">Total seguros</p>
          <p className="text-lg font-bold text-white font-mono">{formatCurrency(credit.resumen.totalSeguros)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <p className="text-xs text-slate-500 mb-1">Total a pagar</p>
          <p className="text-lg font-bold text-emerald-400 font-mono">{formatCurrency(credit.resumen.totalAPagar)}</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Calendario de Pagos (Amortización Francesa)</h2>
          {credit.estado !== "PAGADO" && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <DollarSign className="h-4 w-4" />
              Registrar Pago
            </button>
          )}
        </div>

        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-3 py-3 text-left font-medium text-slate-400">#</th>
                <th className="px-3 py-3 text-left font-medium text-slate-400">Fecha</th>
                <th className="px-3 py-3 text-right font-medium text-slate-400">Capital</th>
                <th className="px-3 py-3 text-right font-medium text-slate-400">Interés</th>
                <th className="px-3 py-3 text-right font-medium text-slate-400">Seguro</th>
                <th className="px-3 py-3 text-right font-medium text-slate-400">Total Cuota</th>
                <th className="px-3 py-3 text-right font-medium text-slate-400">Saldo</th>
                <th className="px-3 py-3 text-center font-medium text-slate-400">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {credit.schedule.map((row) => (
                <tr key={row.cuota} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-3 py-3 text-slate-300 font-mono">{row.cuota}</td>
                  <td className="px-3 py-3 text-slate-300 whitespace-nowrap">
                    {new Date(row.fecha).toLocaleDateString("es-DO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-200 font-mono">
                    {formatCurrency(row.capital)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-200 font-mono">
                    {formatCurrency(row.interes)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-200 font-mono">
                    {formatCurrency(row.seguro)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-200 font-mono font-medium">
                    {formatCurrency(row.totalCuota)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-400 font-mono text-xs">
                    {formatCurrency(row.saldoRestante)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {row.pagada ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Pagada
                      </span>
                    ) : row.atrasada ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        Atrasada
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        Pendiente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700 font-medium">
                <td colSpan={2} className="px-3 py-3 text-right text-slate-400">Totales</td>
                <td className="px-3 py-3 text-right text-slate-200 font-mono">
                  {formatCurrency(credit.schedule.reduce((sum, r) => sum + r.capital, 0))}
                </td>
                <td className="px-3 py-3 text-right text-slate-200 font-mono">
                  {formatCurrency(credit.schedule.reduce((sum, r) => sum + r.interes, 0))}
                </td>
                <td className="px-3 py-3 text-right text-slate-200 font-mono">
                  {formatCurrency(credit.schedule.reduce((sum, r) => sum + r.seguro, 0))}
                </td>
                <td className="px-3 py-3 text-right text-slate-200 font-mono">
                  {formatCurrency(credit.schedule.reduce((sum, r) => sum + r.totalCuota, 0))}
                </td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Registrar Pago</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Monto del Pago
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pagoMonto}
                  onChange={(e) => setPagoMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Saldo pendiente: {formatCurrency(credit.saldo)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Cuota actual: {formatCurrency(credit.resumen.cuotaConSeguro)}
                </p>
                <p className="mt-1 text-xs text-amber-400">
                  Si paga más de la cuota, el exceso se aplica al capital
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={pagoNotas}
                  onChange={(e) => setPagoNotas(e.target.value)}
                  placeholder="Nota o referencia"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPagoMonto("")
                  setPagoNotas("")
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => paymentMutation.mutate()}
                disabled={!pagoMonto || Number(pagoMonto) <= 0 || paymentMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {paymentMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Pago"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
