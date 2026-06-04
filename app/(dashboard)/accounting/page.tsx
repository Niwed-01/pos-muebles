"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  BookOpen,
  Scale,
  Table2,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(value)

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))

const formatDateTime = (date: string) =>
  new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))

type Tab = "diario" | "mayor" | "balance"

const tabConfig: { id: Tab; label: string; icon: any }[] = [
  { id: "diario", label: "Diario General", icon: BookOpen },
  { id: "mayor", label: "Mayor", icon: Table2 },
  { id: "balance", label: "Balance de Comprobación", icon: Scale },
]

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("diario")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [selectedAccountId, setSelectedAccountId] = useState("")

  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ["accounting-entries", desde, hasta],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)
      params.set("limit", "100")
      const res = await fetch(`/api/accounting/entries?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json.data
    },
  })

  const { data: accountsList } = useQuery({
    queryKey: ["accounts-list"],
    queryFn: async () => {
      const res = await fetch("/api/accounting/accounts")
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json.data ?? []
    },
  })

  const { data: mayorData, isLoading: mayorLoading } = useQuery({
    queryKey: ["accounting-mayor", selectedAccountId, desde, hasta],
    queryFn: async () => {
      if (!selectedAccountId) return null
      const params = new URLSearchParams()
      params.set("accountId", selectedAccountId)
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)
      const res = await fetch(`/api/accounting/mayor?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json.data
    },
    enabled: !!selectedAccountId,
  })

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["accounting-balance", desde, hasta],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)
      const res = await fetch(`/api/accounting/balance?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json.data
    },
  })

  const flattenAccounts = (accounts: any[], prefix = ""): { id: string; codigo: string; nombre: string; nivel: number }[] => {
    const result: any[] = []
    for (const acc of accounts) {
      const codigo = acc.codigo ?? acc.id.slice(0, 8)
      result.push({ id: acc.id, codigo, nombre: acc.nombre, nivel: acc.nivel ?? 1 })
      if (acc.children?.length) {
        result.push(...flattenAccounts(acc.children, codigo))
      }
    }
    return result
  }

  const allAccounts = flattenAccounts(accountsList ?? [])

  const entries = entriesData?.items ?? []

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Contabilidad"
        description="Diario General, Mayor y Balance de Comprobación"
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-end">
            {(desde || hasta) && (
              <button
                onClick={() => { setDesde(""); setHasta("") }}
                className="h-10 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-xl transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1.5">
        {tabConfig.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === "diario" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Diario General</h2>
          </div>
          {entriesLoading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : entries.length === 0 ? (
            <EmptyState title="Sin asientos" description="No hay asientos contables en el período seleccionado." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">No.</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Descripción</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Referencia</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Cuenta</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Debe</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Haber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry: any) => (
                    entry.lineas.map((linea: any, idx: number) => (
                      <tr key={`${entry.id}-${idx}`} className="hover:bg-slate-50/70">
                        {idx === 0 && (
                          <>
                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap" rowSpan={entry.lineas.length}>
                              {formatDateTime(entry.fecha)}
                            </td>
                            <td className="px-4 py-3 text-slate-700 font-mono" rowSpan={entry.lineas.length}>
                              {entry.numero}
                            </td>
                            <td className="px-4 py-3 text-slate-700 max-w-[200px]" rowSpan={entry.lineas.length}>
                              <p className="truncate font-medium">{entry.descripcion}</p>
                              <p className="text-xs text-slate-400">{entry.user?.nombre}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs" rowSpan={entry.lineas.length}>
                              {entry.referencia || "—"}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3 text-slate-600">
                          <span className="text-xs text-slate-400">{linea.account?.codigo}</span>{" "}
                          {linea.account?.nombre}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {Number(linea.debe) > 0 ? formatCurrency(Number(linea.debe)) : ""}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {Number(linea.haber) > 0 ? formatCurrency(Number(linea.haber)) : ""}
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "mayor" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="p-5 border-b border-slate-200 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Mayor</h2>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full max-w-md px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              <option value="">Seleccionar cuenta...</option>
              {allAccounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>
                  {"  ".repeat(acc.nivel - 1)}{acc.codigo} - {acc.nombre}
                </option>
              ))}
            </select>
          </div>
          {!selectedAccountId ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Selecciona una cuenta para ver sus movimientos
            </div>
          ) : mayorLoading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : !mayorData || mayorData.movimientos?.length === 0 ? (
            <EmptyState title="Sin movimientos" description="No hay movimientos para esta cuenta en el período seleccionado." />
          ) : (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">
                  Cuenta: <strong className="text-slate-800">{mayorData.account.codigo} - {mayorData.account.nombre}</strong>
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500">Tipo: <strong className="text-slate-800">{mayorData.account.tipo}</strong></span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">No.</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Descripción</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">Debe</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">Haber</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mayorData.movimientos.map((m: any) => (
                      <tr key={m.entryId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatDate(m.fecha)}</td>
                        <td className="px-4 py-3 text-slate-700 font-mono">{m.numero}</td>
                        <td className="px-4 py-3 text-slate-600">{m.descripcion}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {m.debe > 0 ? formatCurrency(m.debe) : ""}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {m.haber > 0 ? formatCurrency(m.haber) : ""}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                          {formatCurrency(m.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 font-medium">
                      <td colSpan={3} className="px-4 py-3 text-right text-slate-600">Totales</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-800">{formatCurrency(mayorData.totalDebe)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-800">{formatCurrency(mayorData.totalHaber)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-800">{formatCurrency(mayorData.saldoFinal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "balance" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Balance de Comprobación</h2>
          </div>
          {balanceLoading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : !balanceData || balanceData.balances?.length === 0 ? (
            <EmptyState title="Sin datos" description="No hay asientos en el período seleccionado." />
          ) : (
            <div className="p-5 space-y-4">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                balanceData.cuadra ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}>
                {balanceData.cuadra ? (
                  <><CheckCircle2 className="h-4 w-4" /> Balance cuadra</>
                ) : (
                  <><XCircle className="h-4 w-4" /> Error de cuadre</>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Código</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Cuenta</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Tipo</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">Saldo Debe</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">Saldo Haber</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {balanceData.balances.map((b: any) => (
                      <tr key={b.accountId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{b.codigo}</td>
                        <td className="px-4 py-3 text-slate-700">{b.nombre}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                            {b.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {b.saldoDebe > 0 ? formatCurrency(b.saldoDebe) : ""}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {b.saldoHaber > 0 ? formatCurrency(b.saldoHaber) : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 font-bold">
                      <td colSpan={3} className="px-4 py-3 text-right text-slate-700">Totales</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-800">{formatCurrency(balanceData.totalDebe)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-800">{formatCurrency(balanceData.totalHaber)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
