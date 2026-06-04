"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, UploadCloud, Download, Loader2, X, FileText, Calendar, Filter, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { QueryError } from "@/components/shared/query-error"

export default function PettyCashPage() {
  const queryClient = useQueryClient()
  
  // Modals status
  const [openExpenseModal, setOpenExpenseModal] = useState(false)
  const [openReplenishModal, setOpenReplenishModal] = useState(false)
  
  // Filters status
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [tipo, setTipo] = useState("")
  const [page, setPage] = useState(1)
  const limit = 20
  
  // Forms status
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ descripcion: "", monto: "" })
  const [replenishForm, setReplenishForm] = useState({ monto: "", descripcion: "" })

  // Fetch data with active filters
  const {
    data: response,
    isLoading,
    error,
    isRefetching
  } = useQuery({
    queryKey: ["petty-cash", desde, hasta, tipo, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (desde) params.append("desde", desde)
      if (hasta) params.append("hasta", hasta)
      if (tipo) params.append("tipo", tipo)
      params.append("page", page.toString())
      params.append("limit", limit.toString())

      const res = await fetch(`/api/petty-cash/report?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Error al cargar datos")
      return json.data
    },
  })

  const cajaChica = response?.cajaChica
  const movimientos = response?.items || []
  const totalMovimientos = response?.total || 0

  // Mutation to register expense (REEMBOLSO)
  const expenseMutation = useMutation({
    mutationFn: async () => {
      if (!expenseForm.descripcion || !expenseForm.monto) {
        throw new Error("Completa todos los campos requeridos")
      }
      const monto = parseFloat(expenseForm.monto)
      if (isNaN(monto) || monto <= 0) {
        throw new Error("El monto debe ser un número positivo")
      }

      if (cajaChica && monto > parseFloat(cajaChica.saldoActual)) {
        throw new Error(`Saldo insuficiente. Saldo disponible: RD$ ${parseFloat(cajaChica.saldoActual).toFixed(2)}`)
      }

      let comprobante = undefined

      // Upload receipt file if selected
      if (selectedFile) {
        setIsUploading(true)
        try {
          const formData = new FormData()
          formData.append("file", selectedFile)
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })
          const uploadJson = await uploadRes.json()
          if (!uploadRes.ok) throw new Error(uploadJson.message || "Error al subir comprobante")
          comprobante = uploadJson.data?.url
        } catch (err: any) {
          throw new Error("Error al subir archivo de comprobante: " + err.message)
        } finally {
          setIsUploading(false)
        }
      }

      const res = await fetch("/api/petty-cash/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: expenseForm.descripcion,
          monto,
          comprobante,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Error al registrar gasto")
      return json.data
    },
    onSuccess: () => {
      toast.success("Gasto registrado exitosamente")
      setOpenExpenseModal(false)
      setExpenseForm({ descripcion: "", monto: "" })
      setSelectedFile(null)
      queryClient.invalidateQueries({ queryKey: ["petty-cash"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Mutation to replenish fund (REPOSICION)
  const replenishMutation = useMutation({
    mutationFn: async () => {
      if (!replenishForm.monto || !replenishForm.descripcion) {
        throw new Error("Completa todos los campos requeridos")
      }
      const monto = parseFloat(replenishForm.monto)
      if (isNaN(monto) || monto <= 0) {
        throw new Error("El monto debe ser un número positivo")
      }

      if (cajaChica) {
        const nuevoSaldo = parseFloat(cajaChica.saldoActual) + monto
        if (nuevoSaldo > parseFloat(cajaChica.fondoAsignado)) {
          throw new Error(
            `El saldo total resultante (RD$ ${nuevoSaldo.toFixed(2)}) no puede superar el fondo asignado (RD$ ${parseFloat(
              cajaChica.fondoAsignado
            ).toFixed(2)})`
          )
        }
      }

      const res = await fetch("/api/petty-cash/replenish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto,
          descripcion: replenishForm.descripcion,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Error al reponer fondo")
      return json.data
    },
    onSuccess: () => {
      toast.success("Fondo repuesto exitosamente")
      setOpenReplenishModal(false)
      setReplenishForm({ monto: "", descripcion: "" })
      queryClient.invalidateQueries({ queryKey: ["petty-cash"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Export Excel / CSV of current period
  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams()
      if (desde) params.append("desde", desde)
      if (hasta) params.append("hasta", hasta)
      if (tipo) params.append("tipo", tipo)
      params.append("limit", "1000") // Max limit for full range report export

      const res = await fetch(`/api/petty-cash/report?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error("Error al obtener datos del reporte")

      const items = json.data?.items || []
      
      // UTF-8 BOM to make Excel render accents/characters properly
      let csv = "\uFEFFFecha,Descripción,Tipo,Monto,Usuario,Comprobante\n"

      items.forEach((item: any) => {
        const fecha = new Date(item.fecha).toLocaleDateString("es-DO")
        const tipoMov = item.tipo
        const monto = parseFloat(item.monto).toFixed(2)
        const usuario = item.user?.nombre || "Desconocido"
        const comprobanteUrl = item.comprobante || ""
        csv += `"${fecha}","${item.descripcion.replace(/"/g, '""')}","${tipoMov}","${monto}","${usuario}","${comprobanteUrl}"\n`
      })

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `reporte-caja-chica-${desde || "inicio"}-a-${hasta || "fin"}.csv`
      link.click()

      toast.success("Reporte del período exportado exitosamente")
    } catch (error) {
      toast.error("Error al exportar el reporte")
    }
  }

  const handleClearFilters = () => {
    setDesde("")
    setHasta("")
    setTipo("")
    setPage(1)
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <QueryError message={error.message} />

  const saldoDisponible = cajaChica ? parseFloat(cajaChica.saldoActual) : 0
  const fondoAsignado = cajaChica ? parseFloat(cajaChica.fondoAsignado) : 0
  const gastado = Math.max(0, fondoAsignado - saldoDisponible)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader title="Caja Chica" description="Supervisión, gastos y reposición del fondo de caja chica" />

      {/* Card superior de Saldo disponible */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 md:p-8 shadow-md border border-emerald-500/20">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
          <UploadCloud className="h-64 w-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <p className="text-emerald-100 text-sm font-medium tracking-wide uppercase">Saldo disponible</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              RD$ {saldoDisponible.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-emerald-50/80 text-xs md:text-sm font-medium">
              Fondo asignado: <span className="font-bold text-white">RD$ {fondoAsignado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</span>
              <span className="mx-2">|</span>
              Gastado: <span className="font-bold text-red-200">RD$ {gastado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
          
          {/* Dos botones: [+ Registrar gasto] [↑ Reponer fondo] */}
          <div className="flex gap-3">
            <button
              onClick={() => setOpenExpenseModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-red-950/20"
            >
              <Plus className="h-4.5 w-4.5" />
              Registrar Gasto
            </button>
            <button
              onClick={() => setOpenReplenishModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-950/20"
            >
              <UploadCloud className="h-4.5 w-4.5" />
              Reponer Fondo
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <Filter className="h-4 w-4 text-emerald-600" />
            Filtrar movimientos
          </div>
          {isRefetching && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />
              Actualizando...
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha Desde</label>
            <div className="relative">
              <input
                type="date"
                value={desde}
                onChange={(e) => {
                  setDesde(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-slate-50 hover:bg-white transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha Hasta</label>
            <div className="relative">
              <input
                type="date"
                value={hasta}
                onChange={(e) => {
                  setHasta(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-slate-50 hover:bg-white transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo de movimiento</label>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-slate-50 hover:bg-white transition-colors"
            >
              <option value="">Todos</option>
              <option value="REEMBOLSO">Reembolso (Gasto)</option>
              <option value="REPOSICION">Reposición</option>
              <option value="AJUSTE">Ajuste</option>
            </select>
          </div>
          <div className="flex gap-2">
            {(desde || hasta || tipo) && (
              <button
                onClick={handleClearFilters}
                className="w-full sm:w-auto px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción / Comprobante</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientos.length > 0 ? (
                movimientos.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(item.fecha).toLocaleDateString("es-DO", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-medium">{item.descripcion}</span>
                        {item.comprobante && (
                          <a
                            href={item.comprobante}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-150 transition-colors w-fit"
                          >
                            <FileText className="h-3 w-3" />
                            Comprobante
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.tipo === "REEMBOLSO"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : item.tipo === "REPOSICION"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {item.tipo}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm text-right font-bold whitespace-nowrap ${
                      item.tipo === "REEMBOLSO" ? "text-red-600" : "text-emerald-600"
                    }`}>
                      {item.tipo === "REEMBOLSO" ? "-" : "+"} RD$ {parseFloat(item.monto).toLocaleString("es-DO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {item.user?.nombre || "Usuario"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No se encontraron movimientos para el período o filtros seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalMovimientos > limit && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            <p className="text-xs md:text-sm text-slate-500">
              Mostrando {movimientos.length} de {totalMovimientos} movimientos
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 border border-slate-350 bg-white rounded-xl text-sm font-medium hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= totalMovimientos}
                className="px-3.5 py-1.5 border border-slate-350 bg-white rounded-xl text-sm font-medium hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Al fondo: Exportar Excel del período */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-100/80 border border-slate-200 rounded-2xl shadow-inner mt-4">
        <div className="text-center sm:text-left space-y-1">
          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 justify-center sm:justify-start">
            <Calendar className="h-4 w-4 text-slate-500" />
            Exportación de período
          </h4>
          <p className="text-xs text-slate-500">
            Descarga todos los movimientos del filtro actual ({desde || "inicio"} al {hasta || "hoy"})
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-95"
        >
          <Download className="h-4.5 w-4.5 text-slate-500" />
          Exportar Excel
        </button>
      </div>

      {/* Modal: Registrar Gasto */}
      {openExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                  <Plus className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Registrar Gasto</h3>
              </div>
              <button
                onClick={() => setOpenExpenseModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Ingresa los datos para descontar un gasto de la caja chica. Recuerda que no puede exceder el saldo disponible.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                expenseMutation.mutate()
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  placeholder="Ej: Compra de café, papelería, botellones de agua..."
                  value={expenseForm.descripcion}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, descripcion: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider">
                  Monto (RD$) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">RD$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expenseForm.monto}
                    onChange={(e) => setExpenseForm({ ...expenseForm, monto: e.target.value })}
                    className="w-full pl-12 pr-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider">
                  Foto de Comprobante (Opcional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                    <div className="flex text-sm text-slate-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-semibold text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-550"
                      >
                        <span>Subir un archivo</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">PNG, JPG, PDF hasta 10MB</p>
                  </div>
                </div>
                {selectedFile && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border text-xs text-slate-600">
                    <span className="truncate max-w-[80%] font-medium">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setOpenExpenseModal(false)}
                  disabled={expenseMutation.isPending || isUploading}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={expenseMutation.isPending || isUploading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-650 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-red-950/10 disabled:opacity-50"
                >
                  {(expenseMutation.isPending || isUploading) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {isUploading ? "Subiendo..." : "Registrar Gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reponer Fondo */}
      {openReplenishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-550/10 flex items-center justify-center text-emerald-600">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Reponer Fondo</h3>
              </div>
              <button
                onClick={() => setOpenReplenishModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Agrega dinero al fondo actual de la caja chica. Recuerda que no se puede exceder el límite establecido por el fondo asignado.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                replenishMutation.mutate()
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider">
                  Monto (RD$) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">RD$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={replenishForm.monto}
                    onChange={(e) =>
                      setReplenishForm({ ...replenishForm, monto: e.target.value })
                    }
                    className="w-full pl-12 pr-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  placeholder="Ej: Reposición quincenal de caja chica..."
                  value={replenishForm.descripcion}
                  onChange={(e) =>
                    setReplenishForm({ ...replenishForm, descripcion: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setOpenReplenishModal(false)}
                  disabled={replenishMutation.isPending}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={replenishMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-950/10 disabled:opacity-50"
                >
                  {replenishMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Reponer Fondo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
