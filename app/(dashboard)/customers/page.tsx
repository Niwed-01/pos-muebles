"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Search, Users } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import type { ColumnDef } from "@tanstack/react-table"

interface Customer {
  id: string
  nombre: string
  cedula: string | null
  telefono: string | null
  email: string | null
  _count: {
    ventas: number
    creditos: number
  }
}

export default function CustomersPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const queryParams = new URLSearchParams()
  if (debouncedSearch) queryParams.set("search", debouncedSearch)
  queryParams.set("limit", "200")

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers", debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`/api/customers?${queryParams.toString()}`)
      const json = await res.json()
      return json.data?.items ?? []
    },
  })

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        header: "Nombre",
        accessorKey: "nombre",
        cell: ({ row }) => (
          <Link
            href={`/customers/${row.original.id}`}
            className="text-white hover:text-emerald-400 transition-colors font-medium"
          >
            {row.original.nombre}
          </Link>
        ),
      },
      {
        header: "Cédula",
        accessorKey: "cedula",
        cell: ({ row }) => (
          <span className="text-slate-400">{row.original.cedula ?? "—"}</span>
        ),
      },
      {
        header: "Teléfono",
        accessorKey: "telefono",
        cell: ({ row }) => (
          <span className="text-slate-400">{row.original.telefono ?? "—"}</span>
        ),
      },
      {
        header: "Compras",
        id: "compras",
        cell: ({ row }) => (
          <span className="text-slate-200 font-mono">{row.original._count.ventas}</span>
        ),
      },
      {
        header: "Créditos",
        id: "creditos",
        cell: ({ row }) => (
          <span className="font-mono">{row.original._count.creditos}</span>
        ),
      },
    ],
    []
  )

  if (isLoading) return <LoadingSpinner className="mt-20" />

  return (
    <div>
      <PageHeader title="Clientes" description="Gestiona tus clientes" />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nombre o cédula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
        />
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title={search ? "Sin resultados" : "No hay clientes"}
          description={
            search
              ? "Intenta con otro nombre o cédula."
              : "Registra tu primer cliente para comenzar."
          }
        />
      ) : (
        <DataTable columns={columns} data={customers} pageSize={15} />
      )}
    </div>
  )
}
