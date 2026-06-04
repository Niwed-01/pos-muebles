"use client"

import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  TrendingUp,
  Receipt,
  FileText,
  Calculator,
  RefreshCw,
  Download,
  FileSpreadsheet,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Upload,
  History,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import Link from "next/link"

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(Number(value))

const months = [
  { value: 1, label: "Enero" }, { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" }, { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" }, { value: 6, label: "Junio" },
  { value: 7, label: "Julio" }, { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" }, { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" }, { value: 12, label: "Diciembre" },
]

const tiposBien = [
  { value: "01", label: "Gastos de personal" },
  { value: "02", label: "Gastos por trabajos, suministros y servicios" },
  { value: "03", label: "Arrendamientos" },
  { value: "04", label: "Gastos de activos fijos" },
  { value: "05", label: "Gastos de representación" },
  { value: "06", label: "Otras deducciones admitidas" },
  { value: "07", label: "Gastos financieros" },
  { value: "08", label: "Gastos extraordinarios" },
  { value: "09", label: "Compras y gastos que formarán parte del costo de venta" },
  { value: "10", label: "Adquisiciones de activos" },
  { value: "11", label: "Gastos de seguros" },
]

const formasPago = [
  { value: "1", label: "Efectivo" },
  { value: "2", label: "Cheques/Transferencias/Depósito" },
  { value: "3", label: "Tarjeta crédito/débito" },
  { value: "4", label: "Compra a crédito" },
  { value: "5", label: "Permuta" },
  { value: "6", label: "Notas de crédito" },
  { value: "7", label: "Mixto" },
]

const metodoLabel: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  CREDITO: "Crédito",
}

function getDefaultPeriod() {
  const now = new Date()
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return { mes: prev.getMonth() + 1, anio: prev.getFullYear() }
}

type Tab = "607" | "606"

interface ValidationResult {
  ok: boolean
  errores: string[]
  advertencias: string[]
}

export default function DGIIPage() {
  const defaultPeriod = getDefaultPeriod()
  const queryClient = useQueryClient()
  const [selectedMes, setSelectedMes] = useState(defaultPeriod.mes)
  const [selectedAnio, setSelectedAnio] = useState(defaultPeriod.anio)
  const [queryMes, setQueryMes] = useState(defaultPeriod.mes)
  const [queryAnio, setQueryAnio] = useState(defaultPeriod.anio)
  const [activeTab, setActiveTab] = useState<Tab>("607")
  const [showValidation, setShowValidation] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [generating, setGenerating] = useState(false)

  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [pForm, setPForm] = useState({
    ncf: "", rncProveedor: "", descripcion: "", tipoBien: "09",
    fechaComprobante: "", pagada: false, fechaPago: "",
    montoBienes: "0", montoServicios: "0", itbisFacturado: "0", formaPago: "1",
  })

  const { data: data607, isLoading: loading607 } = useQuery({
    queryKey: ["dgii-607", queryMes, queryAnio],
    queryFn: async () => {
      const res = await fetch(`/api/dgii/607?mes=${queryMes}&anio=${queryAnio}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json.data
    },
    enabled: activeTab === "607",
  })

  const { data: data606, isLoading: loading606 } = useQuery({
    queryKey: ["dgii-606", queryMes, queryAnio],
    queryFn: async () => {
      const res = await fetch(`/api/dgii/606?mes=${queryMes}&anio=${queryAnio}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json.data
    },
    enabled: activeTab === "606",
  })

  const createPurchaseMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ncf: pForm.ncf,
          rncProveedor: pForm.rncProveedor,
          descripcion: pForm.descripcion || null,
          tipoBien: pForm.tipoBien,
          fechaComprobante: pForm.fechaComprobante,
          fechaPago: pForm.pagada ? pForm.fechaPago : null,
          montoBienes: Number(pForm.montoBienes),
          montoServicios: Number(pForm.montoServicios),
          itbisFacturado: Number(pForm.itbisFacturado),
          formaPago: pForm.formaPago,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Error al registrar compra")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dgii-606", queryMes, queryAnio] })
      setShowPurchaseForm(false)
      setPForm({ ncf: "", rncProveedor: "", descripcion: "", tipoBien: "09", fechaComprobante: "", pagada: false, fechaPago: "", montoBienes: "0", montoServicios: "0", itbisFacturado: "0", formaPago: "1" })
      toast.success("Compra registrada exitosamente")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deletePurchaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/purchases?id=${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dgii-606", queryMes, queryAnio] })
      toast.success("Compra eliminada")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleCalcular = useCallback(() => {
    setQueryMes(selectedMes)
    setQueryAnio(selectedAnio)
  }, [selectedMes, selectedAnio])

  const validate607 = useCallback((): ValidationResult => {
    const errores: string[] = []
    const advertencias: string[] = []
    const detalle = data607?.detalle ?? []
    if (!detalle.length) { errores.push("No hay ventas en el período seleccionado."); return { ok: false, errores, advertencias } }
    const sinNcf = detalle.filter((v: any) => !v.ncf)
    if (sinNcf.length) errores.push(`${sinNcf.length} venta(s) no tienen NCF generado.`)
    const grandesSinCliente = detalle.filter((v: any) => Number(v.total) >= 250000 && !v.cedula)
    if (grandesSinCliente.length) errores.push(`${grandesSinCliente.length} venta(s) >= RD$250,000 no tienen datos del cliente (obligatorio NG 10-18).`)
    return { ok: errores.length === 0, errores, advertencias }
  }, [data607])

  const validate606 = useCallback((): ValidationResult => {
    const errores: string[] = []
    const advertencias: string[] = []
    const compras = data606?.compras ?? []
    if (!compras.length) { errores.push("No hay compras en el período seleccionado."); return { ok: false, errores, advertencias } }
    for (const c of compras) {
      if (!/^\d{9}$/.test(c.rncProveedor.replace(/-/g, ""))) errores.push(`RNC inválido: ${c.rncProveedor}`)
      const ncfClean = c.ncf.replace(/-/g, "")
      if (ncfClean.length !== 11 && ncfClean.length !== 13) errores.push(`NCF con longitud incorrecta: ${c.ncf} (${ncfClean.length} caracteres)`)
      if (c.fechaPago && new Date(c.fechaPago) < new Date(c.fechaComprobante)) errores.push(`Fecha de pago anterior al comprobante: ${c.ncf}`)
    }
    return { ok: errores.length === 0, errores, advertencias }
  }, [data606])

  const handleGenerate = useCallback(async () => {
    const validation = activeTab === "607" ? validate607() : validate606()
    setValidationResult(validation)
    setShowValidation(true)
    if (!validation.ok) return

    setGenerating(true)
    try {
      const res = await fetch(`/api/dgii/${activeTab.toLowerCase()}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes: queryMes, anio: queryAnio }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.message || json.error || "Error al generar archivo")
      }
      const blob = await res.blob()
      const fileName = (res.headers.get("Content-Disposition")?.match(/filename="?([^"]+)"?/) ?? [])[1] ?? `DGII_F_${activeTab}_${queryMes}_${queryAnio}.TXT`
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
      toast.success(`Archivo ${fileName} descargado exitosamente`)
      queryClient.invalidateQueries({ queryKey: ["dgii-submissions"] })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }, [activeTab, queryMes, queryAnio, validate607, validate606, queryClient])

  const periodoLabel = `${months.find(m => m.value === queryMes)?.label} ${queryAnio}`

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Declaración DGII"
        description="Formatos 606 y 607 según Norma General 07-2018 / 05-2019"
      >
        <Link
          href="/dgii/history"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
        >
          <History className="h-4 w-4" />
          Historial
        </Link>
      </PageHeader>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mes</label>
            <select value={selectedMes} onChange={e => setSelectedMes(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Año</label>
            <input type="number" value={selectedAnio} onChange={e => setSelectedAnio(Number(e.target.value))}
              min={2020} max={2100}
              className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>
          <button onClick={handleCalcular}
            className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 mt-5">
            <RefreshCw className={`h-4 w-4 ${loading607 || loading606 ? "animate-spin" : ""}`} />
            Calcular
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1.5">
        <button onClick={() => setActiveTab("607")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border transition-all whitespace-nowrap ${activeTab === "607" ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
          <Upload className="h-4 w-4" />
          Formato 607 — Ventas
        </button>
        <button onClick={() => setActiveTab("606")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border transition-all whitespace-nowrap ${activeTab === "606" ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
          <Download className="h-4 w-4" />
          Formato 606 — Compras
        </button>
      </div>

      {activeTab === "607" && (
        <>
          {loading607 ? <div className="py-20 flex justify-center"><LoadingSpinner /></div> :
          !data607 ? <EmptyState icon={<Receipt className="h-12 w-12 text-slate-400" />} title="Sin datos" description="Presiona Calcular para ver el reporte 607." /> :
          data607.cantidadVentas === 0 ? <EmptyState icon={<Calendar />} title="Sin ventas" description={`No hay ventas en ${periodoLabel}.`} /> :
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
                  <p className="text-xs text-slate-500">Total Ventas</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(data607.resumen.totalVentas)}</p>
                <p className="text-xs text-slate-400 mt-1">{data607.cantidadVentas} facturas</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center"><Receipt className="h-5 w-5 text-blue-600" /></div>
                  <p className="text-xs text-slate-500">ITBIS a Declarar</p>
                </div>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(data607.resumen.totalITBIS)}</p>
                <p className="text-xs text-slate-400 mt-1">Base: {formatCurrency(data607.resumen.totalBaseImponible)}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center"><Calculator className="h-5 w-5 text-amber-600" /></div>
                  <p className="text-xs text-slate-500">Base Imponible</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(data607.resumen.totalBaseImponible)}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center"><FileText className="h-5 w-5 text-purple-600" /></div>
                  <p className="text-xs text-slate-500">Cantidad Facturas</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{data607.cantidadVentas}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Desglose por Método de Pago</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-200">
                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Método</th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-slate-500 uppercase">Monto</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(data607.resumen.ventasPorMetodo).map(([met, monto]: [string, any]) => (
                      <tr key={met}><td className="px-4 py-2 text-slate-700">{metodoLabel[met] || met}</td><td className="px-4 py-2 text-right font-mono text-slate-700">{formatCurrency(monto)}</td></tr>
                    ))}
                    <tr className="border-t-2 border-slate-300 font-bold">
                      <td className="px-4 py-2 text-slate-800">TOTAL</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-800">{formatCurrency(data607.resumen.totalVentas)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">Ventas del Período ({data607.detalle.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">NCF</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Cédula/RNC</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Base</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">ITBIS</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Total</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Método</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {data607.detalle.slice(0, 10).map((v: any) => (
                      <tr key={v.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{v.ncf || "—"}</td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{new Date(v.fecha).toLocaleDateString("es-DO")}</td>
                        <td className="px-4 py-3 text-slate-800 font-medium">{v.cliente}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{v.cedula || "—"}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">{formatCurrency(v.subtotal)}</td>
                        <td className="px-4 py-3 text-right font-mono text-blue-600">{formatCurrency(v.itbis)}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">{formatCurrency(v.total)}</td>
                        <td className="px-4 py-3 text-slate-600">{metodoLabel[v.metodoPago] || v.metodoPago}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data607.detalle.length > 10 && (
                <div className="p-4 text-center text-sm text-slate-400">Mostrando 10 de {data607.detalle.length} facturas</div>
              )}
            </div>

            <div className="flex gap-3 flex-wrap">
              <button onClick={handleGenerate} disabled={generating}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors">
                {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {generating ? "Generando..." : "Generar archivo TXT 607 para DGII"}
              </button>
            </div>
          </>}
        </>
      )}

      {activeTab === "606" && (
        <>
          {loading606 ? <div className="py-20 flex justify-center"><LoadingSpinner /></div> :
          <>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <button onClick={() => setShowPurchaseForm(!showPurchaseForm)}
                className="flex items-center justify-between w-full text-left">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-emerald-600" /> Registrar Compra
                </h3>
                {showPurchaseForm ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {showPurchaseForm && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">RNC Proveedor</label>
                    <input value={pForm.rncProveedor} onChange={e => setPForm(p => ({ ...p, rncProveedor: e.target.value }))}
                      placeholder="000000000" maxLength={9}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Descripción</label>
                    <input value={pForm.descripcion} onChange={e => setPForm(p => ({ ...p, descripcion: e.target.value }))}
                      placeholder="Nombre del proveedor o descripción"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">NCF</label>
                    <input value={pForm.ncf} onChange={e => setPForm(p => ({ ...p, ncf: e.target.value }))}
                      placeholder="B01XXXXXXXX"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Bien/Servicio</label>
                    <select value={pForm.tipoBien} onChange={e => setPForm(p => ({ ...p, tipoBien: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                      {tiposBien.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Fecha Comprobante</label>
                    <input type="date" value={pForm.fechaComprobante} onChange={e => setPForm(p => ({ ...p, fechaComprobante: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Forma de Pago</label>
                    <select value={pForm.formaPago} onChange={e => setPForm(p => ({ ...p, formaPago: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                      {formasPago.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Monto Bienes (sin ITBIS)</label>
                    <input type="number" step="0.01" value={pForm.montoBienes} onChange={e => {
                      const mb = Number(e.target.value)
                      setPForm(p => ({ ...p, montoBienes: e.target.value, itbisFacturado: (mb * 0.18).toFixed(2) }))
                    }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Monto Servicios (sin ITBIS)</label>
                    <input type="number" step="0.01" value={pForm.montoServicios} onChange={e => setPForm(p => ({ ...p, montoServicios: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">ITBIS Facturado</label>
                    <input type="number" step="0.01" value={pForm.itbisFacturado} onChange={e => setPForm(p => ({ ...p, itbisFacturado: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                      <input type="checkbox" checked={pForm.pagada} onChange={e => setPForm(p => ({ ...p, pagada: e.target.checked }))}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                      ¿Ya fue pagada?
                    </label>
                    {pForm.pagada && (
                      <input type="date" value={pForm.fechaPago} onChange={e => setPForm(p => ({ ...p, fechaPago: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    )}
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => createPurchaseMutation.mutate()}
                      disabled={!pForm.ncf || !pForm.rncProveedor || !pForm.fechaComprobante || createPurchaseMutation.isPending}
                      className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                      {createPurchaseMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Registrar Compra
                    </button>
                  </div>
                </div>
              )}
            </div>

            {data606?.compras?.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <p className="text-xs text-slate-500">Total Bienes</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(data606.resumen.totalBienes)}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <p className="text-xs text-slate-500">Total Servicios</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(data606.resumen.totalServicios)}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <p className="text-xs text-slate-500">ITBIS</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(data606.resumen.totalITBIS)}</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">Compras del Período ({data606.compras.length})</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Fecha</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Proveedor</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">NCF</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Tipo</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500">Bienes</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500">Servicios</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500">ITBIS</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Pago</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-500"></th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {data606.compras.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{new Date(c.fechaComprobante).toLocaleDateString("es-DO")}</td>
                            <td className="px-4 py-3 text-slate-800">{c.descripcion || c.rncProveedor}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.ncf}</td>
                            <td className="px-4 py-3 text-slate-600">{c.tipoBien}</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-700">{formatCurrency(c.montoBienes)}</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-700">{formatCurrency(c.montoServicios)}</td>
                            <td className="px-4 py-3 text-right font-mono text-blue-600">{formatCurrency(c.itbisFacturado)}</td>
                            <td className="px-4 py-3 text-slate-600">{formasPago.find(f => f.value === c.formaPago)?.label || c.formaPago}</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => { if (confirm("¿Eliminar esta compra?")) deletePurchaseMutation.mutate(c.id) }}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 font-bold">
                          <td colSpan={4} className="px-4 py-3 text-right text-slate-700">Totales</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-800">{formatCurrency(data606.resumen.totalBienes)}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-800">{formatCurrency(data606.resumen.totalServicios)}</td>
                          <td className="px-4 py-3 text-right font-mono text-blue-600">{formatCurrency(data606.resumen.totalITBIS)}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <button onClick={handleGenerate} disabled={generating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors">
                  {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {generating ? "Generando..." : "Generar archivo TXT 606 para DGII"}
                </button>
              </>
            )}
          </>}
        </>
      )}

      {showValidation && validationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-lg mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Validación previa</h3>
            {validationResult.ok ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">Todo correcto — el archivo está listo para generar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {validationResult.errores.map((err, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg text-red-700">
                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{err}</p>
                  </div>
                ))}
                {validationResult.advertencias.map((adv, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg text-amber-700">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{adv}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowValidation(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors">
                Cerrar
              </button>
              {validationResult.ok && (
                <button onClick={() => { setShowValidation(false); handleGenerate() }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                  <Download className="h-4 w-4" /> Generar y Descargar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
