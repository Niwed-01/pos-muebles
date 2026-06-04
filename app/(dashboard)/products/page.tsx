"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Plus, Search, ImageOff, Package } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import type { ColumnDef } from "@tanstack/react-table"

interface Category {
  id: string
  nombre: string
  slug: string
}

interface Product {
  id: string
  nombre: string
  descripcion: string | null
  categoryId: string
  categoria: Category
  costo: string
  precio: string
  stock: number
  stockMinimo: number
  activo: boolean
  imagenes: string[]
}

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(
    Number(value)
  )

export default function ProductsPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [stockFilter, setStockFilter] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", debouncedSearch, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (categoryFilter) params.set("categoryId", categoryFilter)
      params.set("activo", "true")
      params.set("limit", "200")
      const res = await fetch(`/api/products?${params.toString()}`)
      const json = await res.json()
      return json.data?.items ?? []
    },
  })

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      const json = await res.json()
      return json.data ?? []
    },
  })

  const filteredProducts = useMemo(() => {
    if (!productsData) return []
    let items = productsData as Product[]
    if (stockFilter === "bajo") {
      items = items.filter((p) => p.stock > 0 && p.stock <= p.stockMinimo)
    } else if (stockFilter === "sin_stock") {
      items = items.filter((p) => p.stock === 0)
    }
    return items
  }, [productsData, stockFilter])

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        header: "Imagen",
        accessorKey: "imagenes",
        cell: ({ row }) => {
          const img = row.original.imagenes?.[0]
          return img ? (
            <img
              src={img}
              alt={row.original.nombre}
              className="h-10 w-10 rounded-lg object-cover border border-slate-200"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
              <ImageOff className="h-4 w-4 text-slate-400" />
            </div>
          )
        },
      },
      {
        header: "Nombre",
        accessorKey: "nombre",
        cell: ({ row }) => (
          <Link
            href={`/products/${row.original.id}`}
            className="text-slate-800 hover:text-emerald-600 transition-colors font-medium"
          >
            {row.original.nombre}
          </Link>
        ),
      },
      {
        header: "Categoría",
        accessorKey: "categoria",
        cell: ({ row }) => (
          <span className="text-slate-500">{row.original.categoria.nombre}</span>
        ),
      },
      {
        header: "Stock",
        accessorKey: "stock",
        cell: ({ row }) => {
          const stock = row.original.stock
          const minimo = row.original.stockMinimo
          const isLow = stock <= minimo
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                stock === 0
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : isLow
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {stock}
            </span>
          )
        },
      },
      {
        header: "Precio",
        accessorKey: "precio",
        cell: ({ row }) => (
          <span className="text-slate-700 font-mono">
            {formatCurrency(row.original.precio)}
          </span>
        ),
      },
      {
        header: "Margen",
        id: "margen",
        cell: ({ row }) => {
          const costo = Number(row.original.costo)
          const precio = Number(row.original.precio)
          if (costo === 0) return <span className="text-slate-400">—</span>
          const margen = ((precio - costo) / costo) * 100
          const color =
            margen >= 50
              ? "text-emerald-600"
              : margen >= 25
              ? "text-amber-600"
              : "text-red-600"
          return (
            <span className={`font-mono ${color}`}>
              {margen >= 0 ? "+" : ""}
              {margen.toFixed(1)}%
            </span>
          )
        },
      },
    ],
    []
  )

  if (productsLoading) return <LoadingSpinner className="mt-20" />

  return (
    <div>
      <PageHeader title="Productos" description="Gestiona tu catálogo de productos">
        <Link
          href="/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Link>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat: Category) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
        >
          <option value="">Todos los stocks</option>
          <option value="bajo">Stock bajo</option>
          <option value="sin_stock">Sin stock</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title={search || categoryFilter || stockFilter ? "Sin resultados" : "No hay productos"}
          description={
            search || categoryFilter || stockFilter
              ? "Intenta con otros términos de búsqueda o filtros."
              : "Crea tu primer producto para empezar a vender."
          }
          action={
            !search && !categoryFilter && !stockFilter ? (
              <Link
                href="/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Link>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} data={filteredProducts} pageSize={15} />
      )}
    </div>
  )
}
