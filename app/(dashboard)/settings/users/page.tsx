"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  Pencil,
  UserCheck,
  UserX,
  Shield,
  X,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

interface User {
  id: string
  nombre: string
  email: string
  rol: string
  activo: boolean
  creadoEn: string
}

const userFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
  rol: z.enum(["ADMIN", "VENDEDOR"]),
})

type UserFormData = z.infer<typeof userFormSchema>

export default function SettingsUsersPage() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<{ id: string; activo: boolean; nombre: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { nombre: "", email: "", password: "", rol: "VENDEDOR" },
  })

  const rol = watch("rol")

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users")
      const json = await res.json()
      return (json.data ?? []) as User[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.nombre,
          email: data.email,
          password: data.password || "Temp123!",
          rol: data.rol,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Error al crear usuario")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("Usuario creado exitosamente")
      closeModal()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const payload: Record<string, unknown> = {
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
      }
      const res = await fetch(`/api/users/${editingUser!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Error al actualizar")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("Usuario actualizado exitosamente")
      closeModal()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? "Error al actualizar usuario")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("Estado del usuario actualizado")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const openCreate = () => {
    setEditingUser(null)
    reset({ nombre: "", email: "", password: "", rol: "VENDEDOR" })
    setShowModal(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    reset({ nombre: user.nombre, email: user.email, password: "", rol: user.rol as "ADMIN" | "VENDEDOR" })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUser(null)
    reset({ nombre: "", email: "", password: "", rol: "VENDEDOR" })
  }

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isLoading) return <LoadingSpinner className="mt-20" />

  return (
    <div className="space-y-6">
      <PageHeader title="Gestión de Usuarios" description="Administrar usuarios del sistema">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Usuario
        </button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left font-medium text-slate-500">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Rol</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500">Estado</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 font-medium">{user.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.rol === "ADMIN"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      {user.rol === "ADMIN" ? "Admin" : "Vendedor"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        if (user.id === currentUserId && user.activo) {
                          toast.error("No puedes desactivarte a ti mismo")
                          return
                        }
                        setConfirmToggle({ id: user.id, activo: !user.activo, nombre: user.nombre })
                      }}
                      disabled={toggleMutation.isPending}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        user.activo
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-red-50 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      {user.activo ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          Activo
                        </>
                      ) : (
                        <>
                          <UserX className="h-3.5 w-3.5" />
                          Inactivo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openEdit(user)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nombre
                </label>
                <input
                  {...register("nombre")}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="Nombre completo"
                />
                {errors.nombre && (
                  <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {editingUser ? "Nueva Contraseña (dejar vacío para no cambiar)" : "Contraseña Temporal"}
                </label>
                <input
                  {...register("password", {
                    required: !editingUser ? "La contraseña es requerida" : false,
                  })}
                  type="password"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder={editingUser ? "••••••" : "Mínimo 6 caracteres"}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Rol
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => reset((prev) => ({ ...prev, rol: "VENDEDOR" }))}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      rol === "VENDEDOR"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    Vendedor
                  </button>
                  <button
                    type="button"
                    onClick={() => reset((prev) => ({ ...prev, rol: "ADMIN" }))}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      rol === "ADMIN"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    Admin
                  </button>
                </div>
                {errors.rol && (
                  <p className="mt-1 text-xs text-red-600">{errors.rol.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    editingUser ? "Guardar Cambios" : "Crear Usuario"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmToggle}
        title={confirmToggle?.activo ? "Activar Usuario" : "Desactivar Usuario"}
        description={`¿Estás seguro de que deseas ${confirmToggle?.activo ? "activar" : "desactivar"} al usuario "${confirmToggle?.nombre}"?`}
        confirmLabel={confirmToggle?.activo ? "Activar" : "Desactivar"}
        variant={confirmToggle?.activo ? "default" : "danger"}
        onConfirm={() => {
          if (confirmToggle) {
            toggleMutation.mutate({ id: confirmToggle.id, activo: confirmToggle.activo })
            setConfirmToggle(null)
          }
        }}
        onCancel={() => setConfirmToggle(null)}
        loading={toggleMutation.isPending}
      />
    </div>
  )
}
