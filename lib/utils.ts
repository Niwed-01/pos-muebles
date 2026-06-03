import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export function apiResponse<T = unknown>(
  data: T | null = null,
  error: string | null = null,
  message: string | null = null,
  status = 200
) {
  return NextResponse.json({ data, error, message }, { status })
}

export async function getAuthUser() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }
  return session.user as { id: string; email: string; name: string; rol: string }
}
