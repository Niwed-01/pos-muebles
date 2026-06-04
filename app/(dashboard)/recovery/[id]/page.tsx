"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { pdf } from "@react-pdf/renderer"
import { ArrowLeft, Plus, CheckCircle, XCircle, Download, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { DemandLetter } from "@/components/shared/demand-letter"

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(Number(value))

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))

const formatDateShort = (date: string) =>
  new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))

const recoverySteps = [
  { tipo: "AVISO_ESCRITO", label: "Aviso escrito", icon: "📋" },
  { tipo: "LLAMADA", label: "Llamada", icon: "📞" },
  { tipo: "VISITA", label: "Visita", icon: "🚪" },
  { tipo: "NOTIFICACION_LEGAL", label: "Notif. legal", icon: "⚖️" },
  { tipo: "RECUPERACION", label: "Recuperado", icon: "✅" },
]

const tipoLabels: Record<string, string> = {
  AVISO_ESCRITO: "Aviso escrito",
  LLAMADA: "Llamada telefónica",
  VISITA: "Visita domiciliaria",
  NOTIFICACION_LEGAL: "Notificación legal",
  RECUPERACION: "Recuperación",
}

interface RecoveryAction {
  id: string
  tipo: string
  descripcion: string
  fecha: string
  user: { nombre: string }
}

interface RecoveryDetail {
  id: string
  motivo: string
  estado: string
  fechaInicio: string
  fechaCierre: string | null
  credit: {
    id: string
    saleId: string
    montoTotal: string
    inicial: string
    saldo: string
    cuotas: number
    frecuencia: string
    estado: string
    customer: { id: string; nombre: string; cedula: string | null; telefono: string | null; direccion: string | null }
    venta: { id: string; numero: number; creadoEn: string; items: any[] }
    pagos: Array<{ monto: string; fecha: string }>
  }
  acciones: RecoveryAction[]
  user: { nombre: string }
  totalPagado: number
  diasAtraso: number
  productos: any[]
}

export default function RecoveryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const recoveryId = params.id as string

  const [showActionModal, setShowActionModal] = useState(false)
  const [actionTipo, setActionTipo] = useState("AVISO_ESCRITO")
  const [actionDesc, setActionDesc] = useState("")

  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeEstado, setCloseEstado] = useState<"RECUPERADO" | "RESUELTO" | "DESISTIDO">("RECUPERADO")
  const [devolverStock, setDevolverStock] = useState(false)

  const [generatingPdf, setGeneratingPdf] = useState(false)

  const { data: recovery, isLoading } = useQuery({
    queryKey: ["recovery", recoveryId],
    queryFn: async () => {
      const res = await fetch(`/api/recovery/${recoveryId}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data as RecoveryDetail
    },
  })

  const actionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/recovery/${recoveryId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: actionTipo, descripcion: actionDesc }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Error al registrar acción")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recovery", recoveryId] })
      queryClient.invalidateQueries({ queryKey: ["recoveries"] })
      setShowActionModal(false)
      setActionTipo("AVISO_ESCRITO")
      setActionDesc("")
      toast.success("Acción registrada exitosamente")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/recovery/${recoveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: closeEstado, devolverStock }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Error al cerrar caso")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recovery", recoveryId] })
      queryClient.invalidateQueries({ queryKey: ["recoveries"] })
      queryClient.invalidateQueries({ queryKey: ["credits"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setShowCloseModal(false)
      setDevolverStock(false)
      const msg =
        closeEstado === "RECUPERADO"
          ? "Mueble marcado como recuperado"
          : closeEstado === "RESUELTO"
          ? "Caso resuelto (cliente pagó)"
          : "Caso desistido"
      toast.success(msg)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const actionTypesUsed = useMemo(
    () => new Set((recovery?.acciones ?? []).map((a) => a.tipo)),
    [recovery]
  )

  const handleDownloadDemandLetter = async () => {
    if (!recovery) return
    setGeneratingPdf(true)
    try {
      const blob = await pdf(
        <DemandLetter
          customerName={recovery.credit.customer.nombre}
          cedula={recovery.credit.customer.cedula ?? ""}
          direccion={recovery.credit.customer.direccion ?? ""}
          productos={recovery.productos}
          montoAdeudado={Number(recovery.credit.saldo)}
          diasAtraso={recovery.diasAtraso}
          numeroCredito={recovery.credit.venta.numero}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `carta-demanda-${recovery.credit.venta.numero}.pdf`
      link.click()
      toast.success("Carta de demanda generada exitosamente")
    } catch (err: any) {
      toast.error("Error al generar PDF: " + err.message)
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (isLoading) return <LoadingSpinner className="mt-20" />

  if (!recovery) {
    return (
      <div>
        <PageHeader title="Recuperación no encontrada" />
        <EmptyState title="No encontrado" description="El proceso de recuperación no existe." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={`Recuperación #${recovery.credit.venta.numero}`} description={recovery.credit.customer.nombre}>
        <button
          onClick={() => router.push("/recovery")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Línea de tiempo</h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
              <div className="space-y-6">
                {recoverySteps.map((step, idx) => {
                  const completed = actionTypesUsed.has(step.tipo)
                  const actionsForType = recovery.acciones.filter((a) => a.tipo === step.tipo)
                  return (
                    <div key={step.tipo} className="relative pl-10">
                      <div
                        className={`absolute left-2.5 top-0 w-3.5 h-3.5 rounded-full border-2 ${
                          completed
                            ? "bg-indigo-600 border-indigo-600"
                            : "bg-white border-slate-300"
                        } z-10`}
                      >
                        {completed && (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${completed ? "text-indigo-700" : "text-slate-400"}`}>
                          {step.icon} {step.label}
                        </p>
                        {actionsForType.map((action) => (
                          <div key={action.id} className="mt-1 text-xs text-slate-500 space-y-0.5">
                            <p>{action.descripcion}</p>
                            <p className="text-slate-400">
                              {formatDate(action.fecha)} — {action.user.nombre}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Historial de acciones</h2>
            {recovery.acciones.length === 0 ? (
              <p className="text-sm text-slate-400">No hay acciones registradas aún.</p>
            ) : (
              <div className="space-y-3">
                {[...recovery.acciones].reverse().map((action) => (
                  <div key={action.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {tipoLabels[action.tipo] || action.tipo}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">{action.descripcion}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(action.fecha)} — {action.user.nombre}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Información del crédito</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Cliente</p>
                <p className="font-medium text-slate-800">{recovery.credit.customer.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Cédula</p>
                <p className="font-mono text-slate-700">{recovery.credit.customer.cedula || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Teléfono</p>
                <p className="text-slate-700">{recovery.credit.customer.telefono || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Dirección</p>
                <p className="text-slate-700">{recovery.credit.customer.direccion || "—"}</p>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">Saldo pendiente</p>
                <p className="text-xl font-bold text-red-600 font-mono">{formatCurrency(recovery.credit.saldo)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Días de atraso</p>
                <p className="text-lg font-bold text-amber-600">{recovery.diasAtraso} días</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Estado</p>
                <div className="mt-1">
                  <StatusBadge status={recovery.estado} />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500">Iniciado por</p>
                <p className="text-slate-700">{recovery.user.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Fecha de inicio</p>
                <p className="text-slate-700">{formatDateShort(recovery.fechaInicio)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Motivo</p>
                <p className="text-slate-700">{recovery.motivo}</p>
              </div>
            </div>
          </div>

          {recovery.estado === "EN_PROCESO" && (
            <div className="space-y-3">
              <button
                onClick={() => setShowActionModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                + Registrar acción
              </button>

              <button
                onClick={handleDownloadDemandLetter}
                disabled={generatingPdf}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {generatingPdf ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Generar carta de demanda
              </button>

              <button
                onClick={() => {
                  setCloseEstado("RECUPERADO")
                  setDevolverStock(true)
                  setShowCloseModal(true)
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Marcar como recuperado
              </button>

              <button
                onClick={() => {
                  setCloseEstado("RESUELTO")
                  setDevolverStock(false)
                  setShowCloseModal(true)
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Caso resuelto (pagó)
              </button>

              <button
                onClick={() => {
                  setCloseEstado("DESISTIDO")
                  setDevolverStock(false)
                  setShowCloseModal(true)
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Desistir caso
              </button>
            </div>
          )}
        </div>
      </div>

      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Registrar Acción</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de acción</label>
                <select
                  value={actionTipo}
                  onChange={(e) => setActionTipo(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                >
                  <option value="AVISO_ESCRITO">Aviso escrito</option>
                  <option value="LLAMADA">Llamada telefónica</option>
                  <option value="VISITA">Visita domiciliaria</option>
                  <option value="NOTIFICACION_LEGAL">Notificación legal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
                <textarea
                  value={actionDesc}
                  onChange={(e) => setActionDesc(e.target.value)}
                  placeholder="Detalle de la acción realizada..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowActionModal(false)
                  setActionDesc("")
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => actionMutation.mutate()}
                disabled={!actionDesc || actionMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {actionMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Acción"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {closeEstado === "RECUPERADO"
                ? "Marcar como recuperado"
                : closeEstado === "RESUELTO"
                ? "Caso resuelto"
                : "Desistir caso"}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {closeEstado === "RECUPERADO"
                ? "El mueble será recuperado. Se marcará el crédito como pagado."
                : closeEstado === "RESUELTO"
                ? "El cliente pagó la deuda. El crédito volverá a estado pagado."
                : "El proceso será cancelado. El crédito volverá a estado activo."}
            </p>

            <div className="space-y-4">
              {closeEstado === "RECUPERADO" && (
                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={devolverStock}
                    onChange={(e) => setDevolverStock(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Devolver al inventario</p>
                    <p className="text-xs text-slate-500">Los muebles recuperados volverán al stock disponible</p>
                  </div>
                </label>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => closeMutation.mutate()}
                disabled={closeMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {closeMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
