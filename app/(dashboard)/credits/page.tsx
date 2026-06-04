"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { pdf } from "@react-pdf/renderer"
import { 
  CreditCard, 
  Search, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Eye, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download,
  X 
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { generateSchedule } from "@/lib/credit-calc"
import { Receipt } from "@/components/shared/Receipt"

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(Number(value))

export default function CreditsPage() {
  const router = useRouter()
  
  // Active Filters State
  const [search, setSearch] = useState("")
  const [dropdownEstado, setDropdownEstado] = useState("ALL")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  
  // Tab State
  const [activeTab, setActiveTab] = useState("ALL") // "ALL" | "ACTIVO" | "ATRASADO" | "PAGADO" | "RECUPERACION"

  // PDF Generation loading helper
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null)

  // Fetch all credits (up to 1000) for instant filter client-side operations
  const { data: rawCredits = [], isLoading, isRefetching } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const res = await fetch("/api/credits?limit=1000")
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Error al cargar créditos")
      return json.data?.items ?? []
    },
  })

  // Client-side calculations for each credit (Schedule details & Days overdue)
  const creditsWithDetails = useMemo(() => {
    return rawCredits.map((credit: any) => {
      let proximaCuotaInfo = null
      let diasAtraso = 0
      
      const saldo = Number(credit.saldo)
      if (saldo > 0 && credit.estado !== "PAGADO") {
        try {
          const schedule = generateSchedule({
            montoTotal: Number(credit.montoTotal),
            inicial: Number(credit.inicial),
            tasaInteres: Number(credit.tasaInteres),
            cuotas: credit.cuotas,
            frecuencia: credit.frecuencia,
            seguroPorCuota: Number(credit.seguro),
            tipoSeguro: credit.tipoSeguro,
            valorSeguro: Number(credit.valorSeguro),
            fechaVenta: new Date(credit.venta.creadoEn),
            gastosLegales: Number(credit.gastosLegales || 0),
            modalidadGastos: credit.modalidadGastos,
          })

          const abonos = credit.pagos.filter((p: any) => p.notas !== "Pago inicial")
          const cuotasPagadas = abonos.length
          const proxima = schedule[cuotasPagadas]

          if (proxima) {
            const hoy = new Date()
            const atrasada = hoy > proxima.fecha
            
            if (atrasada) {
              const diffTime = Math.abs(hoy.getTime() - proxima.fecha.getTime())
              diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            }

            proximaCuotaInfo = {
              monto: proxima.totalCuota,
              fecha: proxima.fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "2-digit", year: "numeric" }),
              atrasada
            }
          }
        } catch (e) {
          console.error("Error computing schedule for credit id", credit.id, e)
        }
      }

      // If there are overdue days, state is dynamically set to ATRASADO
      let estadoCalculado = credit.estado
      if (saldo > 0 && diasAtraso > 0) {
        estadoCalculado = "ATRASADO"
      } else if (saldo <= 0) {
        estadoCalculado = "PAGADO"
      }

      return {
        ...credit,
        estado: estadoCalculado,
        diasAtraso,
        proximaCuota: proximaCuotaInfo,
      }
    })
  }, [rawCredits])

  // Count metrics for quick tabs based on calculated state
  const counters = useMemo(() => {
    return {
      ALL: creditsWithDetails.length,
      ACTIVO: creditsWithDetails.filter(c => c.estado === "ACTIVO").length,
      ATRASADO: creditsWithDetails.filter(c => c.estado === "ATRASADO").length,
      PAGADO: creditsWithDetails.filter(c => c.estado === "PAGADO").length,
      RECUPERACION: creditsWithDetails.filter(c => c.estado === "RECUPERACION").length,
    }
  }, [creditsWithDetails])

  // Filter implementation (logical AND combining Search, Dropdown, Tabs, Date Range)
  const filteredCredits = useMemo(() => {
    return creditsWithDetails.filter((credit) => {
      // 1. Search text
      if (search) {
        const text = search.toLowerCase()
        const matchName = credit.customer.nombre.toLowerCase().includes(text)
        const matchCedula = credit.customer.cedula?.toLowerCase().includes(text) || false
        if (!matchName && !matchCedula) return false
      }

      // 2. Dropdown State
      if (dropdownEstado !== "ALL") {
        if (credit.estado !== dropdownEstado) return false
      }

      // 3. Tab State
      if (activeTab !== "ALL") {
        if (credit.estado !== activeTab) return false
      }

      // 4. Date range filters (based on sale date)
      if (desde || hasta) {
        const dateVenta = new Date(credit.venta.creadoEn)
        
        if (desde) {
          const limitDesde = new Date(desde)
          if (dateVenta < limitDesde) return false
        }
        
        if (hasta) {
          const limitHasta = new Date(hasta)
          limitHasta.setHours(23, 59, 59, 999)
          if (dateVenta > limitHasta) return false
        }
      }

      return true
    })
  }, [creditsWithDetails, search, dropdownEstado, activeTab, desde, hasta])

  // Clear filters
  const handleClearFilters = () => {
    setSearch("")
    setDropdownEstado("ALL")
    setDesde("")
    setHasta("")
    setActiveTab("ALL")
  }

  // PDF download trigger
  const handleDownloadContract = async (e: React.MouseEvent, saleId: string, creditId: string, creditNum: number) => {
    e.stopPropagation() // Prevent row click event
    setGeneratingPdfId(creditId)
    
    try {
      const res = await fetch(`/api/sales/${saleId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Error al obtener detalles de la venta")
      
      const saleData = json.data
      
      // Render Receipt Component as PDF Blob
      const blob = await pdf(<Receipt sale={saleData} format="a4" />).toBlob()
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement("a")
      link.href = url
      link.download = `contrato-credito-${creditNum}.pdf`
      link.click()
      
      toast.success("Contrato descargado exitosamente")
    } catch (err: any) {
      console.error(err)
      toast.error("Error al generar PDF: " + err.message)
    } finally {
      setGeneratingPdfId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader 
        title="Créditos" 
        description="Seguimiento de amortización, cobros y administración de cartera"
      />

      {/* BARRA DE FILTROS (siempre visible) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-emerald-600" />
            Filtros de búsqueda
          </h3>
          {isRefetching && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />
              Sincronizando...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Búsqueda por cliente */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente / Cédula</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nombre o Cédula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-slate-50 hover:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Selector de estado */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de crédito</label>
            <select
              value={dropdownEstado}
              onChange={(e) => setDropdownEstado(e.target.value)}
              className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-slate-50 hover:bg-white transition-colors"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVO">Al día (Activo)</option>
              <option value="ATRASADO">Atrasado</option>
              <option value="PAGADO">Pagado</option>
              <option value="RECUPERACION">Recuperación</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="space-y-1.5 flex gap-3 items-end">
            <div className="space-y-1.5 flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-slate-50 hover:bg-white transition-colors"
              />
            </div>
            
            {/* Limpiar Filtros */}
            {(search || dropdownEstado !== "ALL" || desde || hasta || activeTab !== "ALL") && (
              <button
                onClick={handleClearFilters}
                className="h-10 px-4 border border-slate-350 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
                title="Limpiar filtros"
              >
                <X className="h-4 w-4" />
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABS DE ESTADO RÁPIDO */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border transition-all whitespace-nowrap ${
            activeTab === "ALL"
              ? "bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-950/10"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
          }`}
        >
          <span>Todos</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "ALL" ? "bg-slate-700 text-slate-100" : "bg-slate-100 text-slate-500"}`}>
            {counters.ALL}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ACTIVO")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border transition-all whitespace-nowrap ${
            activeTab === "ACTIVO"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-950/10"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          <span>Al día</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "ACTIVO" ? "bg-emerald-700 text-emerald-100" : "bg-slate-100 text-slate-500"}`}>
            {counters.ACTIVO}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ATRASADO")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border transition-all whitespace-nowrap ${
            activeTab === "ATRASADO"
              ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-950/10"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Atrasados</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "ATRASADO" ? "bg-red-700 text-red-100" : "bg-slate-100 text-slate-500"}`}>
            {counters.ATRASADO}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("PAGADO")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border transition-all whitespace-nowrap ${
            activeTab === "PAGADO"
              ? "bg-slate-500 text-white border-slate-500 shadow-md shadow-slate-950/10"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Pagados</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "PAGADO" ? "bg-slate-600 text-slate-100" : "bg-slate-100 text-slate-500"}`}>
            {counters.PAGADO}
          </span>
        </button>
        
        <button
          onClick={() => setActiveTab("RECUPERACION")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border transition-all whitespace-nowrap ${
            activeTab === "RECUPERACION"
              ? "bg-indigo-650 text-white border-indigo-650 shadow-md shadow-indigo-950/10"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Recuperación</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "RECUPERACION" ? "bg-indigo-700 text-indigo-100" : "bg-slate-100 text-slate-500"}`}>
            {counters.RECUPERACION}
          </span>
        </button>
      </div>

      {/* TABLA DE CRÉDITOS */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : filteredCredits.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-12 w-12 text-slate-400" />}
          title="No se encontraron créditos"
          description="Ajusta los filtros de búsqueda o registra nuevos créditos desde el POS."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cédula</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Monto total</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Saldo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Próx. cuota</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Monto cuota</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCredits.map((credit) => {
                  const isAtrasado = credit.estado === "ATRASADO"
                  
                  return (
                    <tr 
                      key={credit.id}
                      onClick={() => router.push(`/credits/${credit.id}`)}
                      className={`cursor-pointer hover:bg-slate-50/70 transition-colors ${
                        isAtrasado ? "bg-red-50/50 hover:bg-red-50/80" : ""
                      }`}
                    >
                      {/* Cliente */}
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {credit.customer.nombre}
                      </td>
                      
                      {/* Cédula */}
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap font-mono">
                        {credit.customer.cedula || "—"}
                      </td>
                      
                      {/* Teléfono */}
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {credit.customer.telefono || "—"}
                      </td>
                      
                      {/* Monto Total */}
                      <td className="px-6 py-4 text-sm text-right font-mono text-slate-700 whitespace-nowrap">
                        {formatCurrency(credit.montoTotal)}
                      </td>
                      
                      {/* Saldo */}
                      <td className="px-6 py-4 text-sm text-right font-semibold font-mono text-slate-800 whitespace-nowrap">
                        {formatCurrency(credit.saldo)}
                      </td>
                      
                      {/* Próx. Cuota */}
                      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {credit.proximaCuota?.fecha || <span className="text-slate-400">—</span>}
                      </td>
                      
                      {/* Monto Cuota */}
                      <td className="px-6 py-4 text-sm text-right font-mono text-slate-700 whitespace-nowrap">
                        {credit.proximaCuota ? formatCurrency(credit.proximaCuota.monto) : "—"}
                      </td>
                      
                      {/* Estado */}
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={credit.estado} />
                          {isAtrasado && credit.diasAtraso > 0 && (
                            <span className="px-2 py-0.5 text-xs font-bold text-red-650 bg-red-100 rounded-full">
                              {credit.diasAtraso} días
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Acciones Rápidas */}
                      <td className="px-6 py-4 text-sm text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-2">
                          {/* Ver */}
                          <button
                            onClick={() => router.push(`/credits/${credit.id}`)}
                            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-all"
                            title="Ver detalles"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>
                          
                          {/* Registrar Pago */}
                          {credit.estado !== "PAGADO" && (
                            <button
                              onClick={() => router.push(`/credits/${credit.id}?pay=true`)}
                              className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-xl transition-all"
                              title="Registrar pago"
                            >
                              <DollarSign className="h-4.5 w-4.5" />
                            </button>
                          )}
                          
                          {/* Ver Contrato */}
                          <button
                            onClick={(e) => handleDownloadContract(e, credit.saleId, credit.id, credit.venta.numero)}
                            disabled={generatingPdfId === credit.id}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                            title="Ver / Descargar contrato"
                          >
                            {generatingPdfId === credit.id ? (
                              <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                            ) : (
                              <FileText className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </div>
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
