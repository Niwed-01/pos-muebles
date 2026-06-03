"use client"

import { useQuery } from "@tanstack/react-query"
import {
  DollarSign,
  ShoppingBag,
  CreditCard,
  Users,
  TrendingUp,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { DataTable } from "@/components/shared/data-table"
import type { ColumnDef } from "@tanstack/react-table"

const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(
    value ?? 0
  )

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))

interface TopProducto {
  id: string
  nombre: string
  cantidad: number
  total: number
}

interface UltimaVenta {
  id: string
  numero: number
  total: string
  estado: string
  metodoPago: string
  creadoEn: string
  customer: { nombre: string }
  user: { nombre: string }
}

const estadoBadge: Record<string, string> = {
  PAGADA: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PENDIENTE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ANULADA: "bg-red-500/10 text-red-400 border-red-500/20",
}

const metodoPagoLabel: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  CREDITO: "Crédito",
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-mono font-medium">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard")
      const json = await res.json()
      return json.data
    },
    refetchInterval: 30000,
  })

  if (isLoading) return <LoadingSpinner className="mt-20" />

  const topProductos: TopProducto[] = data?.topProductos ?? []
  const ultimasVentas: UltimaVenta[] = data?.ultimasVentas ?? []
  const ventas7Dias: { fecha: string; total: number }[] = data?.ventas7Dias ?? []

  const topColumns: ColumnDef<TopProducto>[] = [
    {
      header: "#",
      id: "rank",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-500 w-6">
          #{row.index + 1}
        </span>
      ),
    },
    {
      header: "Producto",
      accessorKey: "nombre",
      cell: ({ row }) => (
        <span className="text-slate-200">{row.original.nombre}</span>
      ),
    },
    {
      header: "Vendidos",
      accessorKey: "cantidad",
      cell: ({ row }) => (
        <span className="text-slate-200 font-mono">{row.original.cantidad}</span>
      ),
    },
    {
      header: "Total",
      accessorKey: "total",
      cell: ({ row }) => (
        <span className="text-slate-200 font-mono">
          {formatCurrency(row.original.total)}
        </span>
      ),
    },
  ]

  const ventasColumns: ColumnDef<UltimaVenta>[] = [
    {
      header: "#",
      accessorKey: "numero",
      cell: ({ row }) => (
        <span className="text-slate-300 font-mono">{row.original.numero}</span>
      ),
    },
    {
      header: "Cliente",
      accessorKey: "customer.nombre",
      cell: ({ row }) => <span className="text-slate-200">{row.original.customer.nombre}</span>,
    },
    {
      header: "Total",
      accessorKey: "total",
      cell: ({ row }) => (
        <span className="text-slate-200 font-mono">{formatCurrency(row.original.total)}</span>
      ),
    },
    {
      header: "Pago",
      accessorKey: "metodoPago",
      cell: ({ row }) => (
        <span className="text-slate-400">{metodoPagoLabel[row.original.metodoPago] ?? row.original.metodoPago}</span>
      ),
    },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
            estadoBadge[row.original.estado] ?? ""
          }`}
        >
          {row.original.estado === "PAGADA"
            ? "Pagada"
            : row.original.estado === "PENDIENTE"
              ? "Pendiente"
              : "Anulada"}
        </span>
      ),
    },
    {
      header: "Fecha",
      accessorKey: "creadoEn",
      cell: ({ row }) => (
        <span className="text-slate-400 text-xs">{formatDate(row.original.creadoEn)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Resumen del negocio" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas Hoy"
          value={formatCurrency(data?.ventasHoy?.total)}
          icon={DollarSign}
        />
        <StatCard
          title="Ventas del Mes"
          value={formatCurrency(data?.ventasMes?.total)}
          icon={ShoppingBag}
        />
        <StatCard
          title="Créditos Activos"
          value={data?.creditosActivos?.count ?? 0}
          icon={CreditCard}
        />
        <StatCard
          title="Clientes Nuevos"
          value={data?.clientesNuevosMes ?? 0}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">
              Ventas Últimos 7 Días
            </h2>
          </div>
          {ventas7Dias.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ventas7Dias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(val) => {
                      const d = new Date(val + "T00:00:00")
                      return d.toLocaleDateString("es-DO", {
                        weekday: "short",
                        day: "numeric",
                      })
                    }}
                    stroke="#475569"
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    stroke="#475569"
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              No hay ventas en los últimos 7 días
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">
            Top 5 Productos
          </h2>
          {topProductos.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
              Sin ventas esta semana
            </div>
          ) : (
            <div className="space-y-3">
              {topProductos.map((producto, i) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500 w-6">
                      #{i + 1}
                    </span>
                    <span className="text-sm text-slate-200">
                      {producto.nombre}
                    </span>
                  </div>
                  <span className="text-sm text-slate-400">
                    {producto.cantidad} vendidos
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h2 className="text-lg font-semibold text-white mb-4">
          Últimas Ventas
        </h2>
        {ultimasVentas.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
            No hay ventas registradas
          </div>
        ) : (
          <DataTable columns={ventasColumns} data={ultimasVentas} pageSize={5} />
        )}
      </div>
    </div>
  )
}
