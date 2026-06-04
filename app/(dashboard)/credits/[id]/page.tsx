"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CreditCard, DollarSign, BadgeCheck, Calendar, AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { toast } from "sonner"

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

export default function CreditDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const creditId = params.id as string

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pagoMonto, setPagoMonto] = useState("")
  const [pagoNotas, setPagoNotas] = useState("")

  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [recoveryMotivo, setRecoveryMotivo] = useState("")

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
      toast.success("Pago registrado exitosamente")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const recoveryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/credits/${creditId}/recovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motivo: recoveryMotivo,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Error al enviar a recuperación")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit", creditId] })
      queryClient.invalidateQueries({ queryKey: ["credits"] })
      setShowRecoveryModal(false)
      setRecoveryMotivo("")
      toast.success("Crédito enviado a recuperación")
    },
    onError: (error: Error) => {
      toast.error(error.message)
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Monto Original</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(credit.montoTotal)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Pagado</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(totalPagado)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <BadgeCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Saldo</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(credit.saldo)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Estado</p>
              <div className="mt-1">
                <StatusBadge status={credit.estado} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Cuota fija (sin seguro)</p>
          <p className="text-lg font-bold text-slate-800 font-mono">{formatCurrency(credit.resumen.cuotaFijaSinSeguro)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Cuota + seguro</p>
          <p className="text-lg font-bold text-slate-800 font-mono">{formatCurrency(credit.resumen.cuotaConSeguro)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total intereses</p>
          <p className="text-lg font-bold text-slate-800 font-mono">{formatCurrency(credit.resumen.totalIntereses)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total seguros</p>
          <p className="text-lg font-bold text-slate-800 font-mono">{formatCurrency(credit.resumen.totalSeguros)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total a pagar</p>
          <p className="text-lg font-bold text-emerald-600 font-mono">{formatCurrency(credit.resumen.totalAPagar)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Calendario de Pagos (Amortización Francesa)</h2>
          <div className="flex items-center gap-2">
            {credit.estado === "ATRASADO" && (
              <button
                onClick={() => setShowRecoveryModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <AlertTriangle className="h-4 w-4" />
                Registro de Recuperación
              </button>
            )}
            {credit.estado !== "PAGADO" && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                Registrar Pago
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 py-3 text-left font-medium text-slate-500">#</th>
                <th className="px-3 py-3 text-left font-medium text-slate-500">Fecha</th>
                <th className="px-3 py-3 text-right font-medium text-slate-500">Capital</th>
                <th className="px-3 py-3 text-right font-medium text-slate-500">Interés</th>
                <th className="px-3 py-3 text-right font-medium text-slate-500">Seguro</th>
                <th className="px-3 py-3 text-right font-medium text-slate-500">Total Cuota</th>
                <th className="px-3 py-3 text-right font-medium text-slate-500">Saldo</th>
                <th className="px-3 py-3 text-center font-medium text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {credit.schedule.map((row) => (
                <tr key={row.cuota} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 text-slate-600 font-mono">{row.cuota}</td>
                  <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                    {new Date(row.fecha).toLocaleDateString("es-DO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-700 font-mono">
                    {formatCurrency(row.capital)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-700 font-mono">
                    {formatCurrency(row.interes)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-700 font-mono">
                    {formatCurrency(row.seguro)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-700 font-mono font-medium">
                    {formatCurrency(row.totalCuota)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-400 font-mono text-xs">
                    {formatCurrency(row.saldoRestante)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {row.pagada ? (
                      <StatusBadge status="PAGADO" label="Pagada" />
                    ) : row.atrasada ? (
                      <StatusBadge status="ATRASADO" label="Atrasada" />
                    ) : (
                      <StatusBadge status="PENDIENTE" label="Pendiente" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 font-medium">
                <td colSpan={2} className="px-3 py-3 text-right text-slate-500">Totales</td>
                <td className="px-3 py-3 text-right text-slate-700 font-mono">
                  {formatCurrency(credit.schedule.reduce((sum, r) => sum + r.capital, 0))}
                </td>
                <td className="px-3 py-3 text-right text-slate-700 font-mono">
                  {formatCurrency(credit.schedule.reduce((sum, r) => sum + r.interes, 0))}
                </td>
                <td className="px-3 py-3 text-right text-slate-700 font-mono">
                  {formatCurrency(credit.schedule.reduce((sum, r) => sum + r.seguro, 0))}
                </td>
                <td className="px-3 py-3 text-right text-slate-700 font-mono">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Registrar Pago</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Monto del Pago
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pagoMonto}
                  onChange={(e) => setPagoMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Saldo pendiente: {formatCurrency(credit.saldo)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Cuota actual: {formatCurrency(credit.resumen.cuotaConSeguro)}
                </p>
                <p className="mt-1 text-xs text-amber-600">
                  Si paga más de la cuota, el exceso se aplica al capital
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={pagoNotas}
                  onChange={(e) => setPagoNotas(e.target.value)}
                  placeholder="Nota o referencia"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => paymentMutation.mutate()}
                disabled={!pagoMonto || Number(pagoMonto) <= 0 || paymentMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
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

      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Registro de Recuperación</h3>
            <p className="text-sm text-slate-500 mb-4">
              Este crédito será marcado como <strong>Recuperación</strong>. 
              El cliente pasará a un proceso de cobro administrativo o judicial.
            </p>

            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>Saldo pendiente:</strong> {formatCurrency(credit.saldo)}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Motivo de la recuperación
                </label>
                <textarea
                  value={recoveryMotivo}
                  onChange={(e) => setRecoveryMotivo(e.target.value)}
                  placeholder="Describa el motivo del proceso de recuperación..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRecoveryModal(false)
                  setRecoveryMotivo("")
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => recoveryMutation.mutate()}
                disabled={!recoveryMotivo || recoveryMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {recoveryMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar Recuperación"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
