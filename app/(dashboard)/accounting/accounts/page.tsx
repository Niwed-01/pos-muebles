"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"

const tipoColors: Record<string, string> = {
  ACTIVO: "text-emerald-600 bg-emerald-50 border-emerald-200",
  PASIVO: "text-red-600 bg-red-50 border-red-200",
  CAPITAL: "text-blue-600 bg-blue-50 border-blue-200",
  INGRESO: "text-amber-600 bg-amber-50 border-amber-200",
  GASTO: "text-purple-600 bg-purple-50 border-purple-200",
}

const tipoLabels: Record<string, string> = {
  ACTIVO: "Activo",
  PASIVO: "Pasivo",
  CAPITAL: "Capital",
  INGRESO: "Ingreso",
  GASTO: "Gasto",
}

function AccountNode({ account, depth = 0 }: { account: any; depth?: number }) {
  const [open, setOpen] = useState(true)
  const hasChildren = account.children?.length > 0

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
          )
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}
        <FolderOpen className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <span className="text-xs font-mono text-slate-500">{account.codigo}</span>
        <span className="text-sm font-medium text-slate-800">{account.nombre}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${tipoColors[account.tipo] ?? "text-slate-500 bg-slate-50"}`}>
          {tipoLabels[account.tipo] || account.tipo}
        </span>
      </div>
      {hasChildren && open && (
        <div>
          {account.children.map((child: any) => (
            <AccountNode key={child.id} account={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AccountingAccountsPage() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCodigo, setNewCodigo] = useState("")
  const [newNombre, setNewNombre] = useState("")
  const [newTipo, setNewTipo] = useState("ACTIVO")
  const [newNivel, setNewNivel] = useState(1)
  const [newParentId, setNewParentId] = useState("")

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounting-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounting/accounts")
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json.data ?? []
    },
  })

  const { data: flatAccounts } = useQuery({
    queryKey: ["accounts-list-flat"],
    queryFn: async () => {
      const res = await fetch("/api/accounting/accounts")
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      const flatten = (items: any[]): any[] =>
        items.flatMap((item) => [item, ...flatten(item.children ?? [])])
      return flatten(json.data ?? [])
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/accounting/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: newCodigo,
          nombre: newNombre,
          tipo: newTipo,
          nivel: newNivel,
          parentId: newParentId || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Error al crear cuenta")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting-accounts"] })
      queryClient.invalidateQueries({ queryKey: ["accounts-list-flat"] })
      setShowCreateModal(false)
      setNewCodigo("")
      setNewNombre("")
      setNewTipo("ACTIVO")
      setNewNivel(1)
      setNewParentId("")
      toast.success("Cuenta creada exitosamente")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Catálogo de Cuentas"
        description="Árbol de cuentas contables"
      >
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Cuenta
        </button>
      </PageHeader>

      {isLoading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner /></div>
      ) : !accounts || accounts.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-12 w-12 text-slate-400" />}
          title="No hay cuentas contables"
          description="El catálogo de cuentas aún no ha sido cargado. Ejecuta el seed."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs divide-y divide-slate-100">
          {accounts.map((account: any) => (
            <AccountNode key={account.id} account={account} depth={0} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Nueva Cuenta Contable</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Código</label>
                <input
                  type="text"
                  value={newCodigo}
                  onChange={(e) => setNewCodigo(e.target.value)}
                  placeholder="Ej: 1.1.06"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Nombre de la cuenta"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
                <select
                  value={newTipo}
                  onChange={(e) => setNewTipo(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="PASIVO">Pasivo</option>
                  <option value="CAPITAL">Capital</option>
                  <option value="INGRESO">Ingreso</option>
                  <option value="GASTO">Gasto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nivel</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={newNivel}
                  onChange={(e) => setNewNivel(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cuenta Padre (opcional)</label>
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  <option value="">Ninguna (cuenta principal)</option>
                  {(flatAccounts ?? []).map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.codigo} - {acc.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!newCodigo || !newNombre || createMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {createMutation.isPending ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Creando...</>
                ) : (
                  "Crear Cuenta"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
