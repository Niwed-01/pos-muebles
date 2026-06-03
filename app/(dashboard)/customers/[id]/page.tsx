"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, User, Phone, FileText, MapPin, Mail, CreditCard, ShoppingBag } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"

interface CustomerDetail {
  id: string
  nombre: string
  cedula: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  notas: string | null
  ventas: SaleItem[]
  creditos: CreditItem[]
}

interface SaleItem {
  id: string
  numero: number
  total: string
  estado: string
  creadoEn: string
  user: { id: string; nombre: string } | null
}

interface CreditItem {
  id: string
  montoTotal: string
  inicial: string
  saldo: string
  cuotas: number
  frecuencia: string
  estado: string
  tasaInteres: string
  seguro: string
  pagos: { id: string; monto: string; fecha: string; notas: string | null }[]
}

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(
    Number(value)
  )

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-slate-700 last:border-0">
      <span className="text-sm text-slate-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-200">{value}</span>
    </div>
  )
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params.id === "new"
  const customerId = isNew ? null : (params.id as string)

  const [activeTab, setActiveTab] = useState<"compras" | "creditos">("compras")

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data as CustomerDetail
    },
  })

  if (isLoading) return <LoadingSpinner className="mt-20" />

  if (!customer) {
    return (
      <div>
        <PageHeader title="Cliente no encontrado" />
        <EmptyState
          title="Cliente no encontrado"
          description="El cliente que buscas no existe o ha sido eliminado."
        />
      </div>
    )
  }

  const activeCredits = customer.creditos.filter((c) => c.estado === "ACTIVO" || c.estado === "ATRASADO")
  const creditosEnAtraso = customer.creditos.filter((c) => c.estado === "ATRASADO")

  return (
    <div>
      <PageHeader title={customer.nombre} description="Información del cliente">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Datos del Cliente</h2>
          <div className="space-y-1">
            <InfoRow label="Nombre" value={customer.nombre} />
            <InfoRow label="Cédula" value={customer.cedula ?? "—"} />
            <InfoRow label="Teléfono" value={customer.telefono ?? "—"} />
            <InfoRow label="Email" value={customer.email ?? "—"} />
            <InfoRow label="Dirección" value={customer.direccion ?? "—"} />
          </div>
          {customer.notas && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-500 mb-1">Notas</p>
              <p className="text-sm text-slate-300">{customer.notas}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Compras</p>
                <p className="text-xl font-bold text-white">{customer.ventas.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Créditos Activos</p>
                <p className="text-xl font-bold text-white">{activeCredits.length}</p>
              </div>
            </div>
            {creditosEnAtraso.length > 0 && (
              <p className="text-xs text-red-400">
                {creditosEnAtraso.length} en atraso
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="border-b border-slate-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab("compras")}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "compras"
                  ? "text-emerald-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Historial de Compras
              </div>
              {activeTab === "compras" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("creditos")}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "creditos"
                  ? "text-emerald-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Créditos Activos
                {activeCredits.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                    {activeCredits.length}
                  </span>
                )}
              </div>
              {activeTab === "creditos" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "compras" && (
            <>
              {customer.ventas.length === 0 ? (
                <EmptyState
                  title="Sin compras"
                  description="Este cliente aún no ha realizado ninguna compra."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-4 py-3 text-left font-medium text-slate-400">#</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-400">Fecha</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-400">Total</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-400">Estado</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-400">Vendedor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {customer.ventas.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3 text-slate-300 font-mono">
                            {sale.numero}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {formatDate(sale.creadoEn)}
                          </td>
                          <td className="px-4 py-3 text-slate-200 font-mono">
                            {formatCurrency(sale.total)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                sale.estado === "PAGADA"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : sale.estado === "PENDIENTE"
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {sale.estado === "PAGADA"
                                ? "Pagada"
                                : sale.estado === "PENDIENTE"
                                  ? "Pendiente"
                                  : "Anulada"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {sale.user?.nombre ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === "creditos" && (
            <>
              {customer.creditos.length === 0 ? (
                <EmptyState
                  title="Sin créditos"
                  description="Este cliente no tiene créditos registrados."
                />
              ) : (
                <div className="space-y-4">
                  {customer.creditos.map((credit) => (
                    <div
                      key={credit.id}
                      className="bg-slate-900/50 rounded-lg border border-slate-700 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-white">
                            Crédito
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            credit.estado === "PAGADO"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : credit.estado === "ATRASADO"
                                ? "bg-red-500/10 text-red-400"
                                : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {credit.estado === "PAGADO"
                            ? "Pagado"
                            : credit.estado === "ATRASADO"
                              ? "Atrasado"
                              : "Activo"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Monto Total</p>
                          <p className="text-slate-200 font-mono">
                            {formatCurrency(credit.montoTotal)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Inicial</p>
                          <p className="text-slate-200 font-mono">
                            {formatCurrency(credit.inicial)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Saldo</p>
                          <p className="text-slate-200 font-mono">
                            {formatCurrency(credit.saldo)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Cuotas</p>
                          <p className="text-slate-200 font-mono">
                            {credit.cuotas} ({credit.frecuencia})
                          </p>
                        </div>
                      </div>
                      {credit.pagos.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-xs text-slate-500 mb-2">
                            Últimos pagos
                          </p>
                          <div className="space-y-1">
                            {credit.pagos.slice(0, 3).map((pago) => (
                              <div
                                key={pago.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-slate-400">
                                  {formatDate(pago.fecha)}
                                </span>
                                <span className="text-slate-200 font-mono">
                                  {formatCurrency(pago.monto)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
