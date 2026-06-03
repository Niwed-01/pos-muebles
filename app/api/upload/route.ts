import { NextRequest } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { apiResponse, getAuthUser } from "@/lib/utils"

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    await getAuthUser()
    const formData = await req.formData()
    const files = formData.getAll("files") as File[]

    if (files.length === 0 || files.length > 3) {
      return apiResponse(null, "Debe subir entre 1 y 3 imágenes", undefined, 400)
    }

    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        return apiResponse(
          null,
          `Tipo de archivo no permitido: ${file.type}. Solo se permiten JPG, PNG, WebP y GIF.`,
          undefined,
          400
        )
      }
      if (file.size > MAX_FILE_SIZE) {
        return apiResponse(
          null,
          `El archivo ${file.name} excede el tamaño máximo de 5MB.`,
          undefined,
          400
        )
      }
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })

    const urls: string[] = []
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = EXT_MAP[file.type] ?? "jpg"
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
      await writeFile(path.join(uploadDir, filename), buffer)
      urls.push(`/uploads/${filename}`)
    }

    return apiResponse(urls, null, "Imágenes subidas exitosamente")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al subir imágenes"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
