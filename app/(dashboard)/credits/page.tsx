"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { CreditCard } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import type { ColumnDef } from "@tanstack/react-table"

type CreditEstado = "ACTIVO" | "ATRASADO" | "PAGADO"

interface Credit {
  id: string
  montoTotal: string
  inicial: string
  saldo: string
  cuotas: number
  frecuencia: string
  tasaInteres: string
  seguro: string
  estado: CreditEstado
  creadoEn: string
  customer: { id: string; nombre: string; cedula: string | null }
  venta: { id: string; numero: number; total: string; creadoEn: string }
  pagos: { id: string; monto: string; fecha: string }[]
}

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(Number(value))

const tabs = [
  { key: "", label: "Todos" },
  { key: "ACTIVO", label: "Activos" },
  { key: "ATRASADO", label: "Atrasados" },
  { key: "PAGADO", label: "Pagados" },
]

function calcularProximaCuota(credit: Credit): { monto: number; fecha: string } | null {
  const saldo = Number(credit.saldo)
  if (saldo <= 0 || credit.estado === "PAGADO") return null
  const tasa = Number(credit.tasaInteres)
  const cuotas = credit.cuotas
  const seguro = Number(credit.seguro)
  const montoConInteres = saldo * (1 + tasa / 100)
  const monto = Math.round((montoConInteres / cuotas + seguro / cuotas) * 100) / 100

  const freqMap: Record<string, number> = { SEMANAL: 7, QUINCENAL: 15, MENSUAL: 30 }
  const dias = freqMap[credit.frecuencia] ?? 30
  const fechaBase = new Date(credit.venta.creadoEn)
  const cuotaIndex = credit.pagos.length
  const fecha = new Date(fechaBase.getTime() + (cuotaIndex + 1) * dias * 86400000)
  return {
    monto,
    fecha: fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "2-digit", year: "numeric" }),
  }
}

export default function CreditsPage() {
  const [activeTab, setActiveTab] = useState("")

  const { data: credits, isLoading } = useQuery({
    queryKey: ["credits", activeTab],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "200" })
      if (activeTab) params.set("estado", activeTab)
      const res = await fetch(`/api/credits?${params}`)
      const json = await res.json()
      return (json.data?.items ?? []) as Credit[]
    },
  })

  const columns = useMemo<ColumnDef<Credit>[]>(
    () => [
      {
        header: "Cliente",
        accessorKey: "customer.nombre",
        cell: ({ row }) => (
          <Link
            href={`/credits/${row.original.id}`}
            className="text-white hover:text-emerald-400 transition-colors font-medium"
          >
            {row.original.customer.nombre}
          </Link>
        ),
      },
      {
        header: "Monto Total",
        accessorKey: "montoTotal",
        cell: ({ row }) => (
          <span className="text-slate-200 font-mono">{formatCurrency(row.original.montoTotal)}</span>
        ),
      },
      {
        header: "Saldo",
        accessorKey: "saldo",
        cell: ({ row }) => (
          <span className="text-slate-200 font-mono">{formatCurrency(row.original.saldo)}</span>
        ),
      },
      {
        header: "Próxima Cuota",
        id: "proximaCuota",
        cell: ({ row }) => {
          const info = calcularProximaCuota(row.original)
          if (!info) return <span className="text-slate-500">—</span>
          return (
            <div className="text-sm">
              <p className="text-slate-200 font-mono">{formatCurrency(info.monto)}</p>
              <p className="text-xs text-slate-500">{info.fecha}</p>
            </div>
          )
        },
      },
      {
        header: "Estado",
        accessorKey: "estado",
        cell: ({ row }) => {
          return <StatusBadge status={row.original.estado} />
        },
      },
    ],
    []
  )

  if (isLoading) return <LoadingSpinner className="mt-20" />

  return (
    <div>
      <PageHeader title="Créditos" description="Gestión de créditos" />

      <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 w-fit border border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!credits || credits.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-12 w-12" />}
          title="Sin créditos"
          description={
            activeTab
              ? `No hay créditos ${tabs.find((t) => t.key === activeTab)?.label.toLowerCase()}.`
              : "No hay créditos registrados."
          }
        />
      ) : (
        <DataTable columns={columns} data={credits} pageSize={15} />
      )}
    </div>
  )
}
