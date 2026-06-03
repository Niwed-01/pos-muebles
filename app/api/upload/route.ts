import { NextRequest } from "next/server"
import { writeFile, mkdir, rename } from "fs/promises"
import path from "path"
import os from "os"
import { randomUUID } from "crypto"
import { apiResponse, getAuthUser } from "@/lib/utils"

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}
const MAX_FILE_SIZE = 5 * 1024 * 1024

const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png":  [[0x89, 0x50, 0x4E, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  "image/gif":  [[0x47, 0x49, 0x46, 0x38]],
}

function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType]
  if (!signatures) return false
  return signatures.some(sig =>
    sig.every((byte, i) => buffer[i] === byte)
  )
}

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

      // verify magic bytes before saving
      if (!verifyMagicBytes(buffer, file.type)) {
        return apiResponse(null, "El archivo no es una imagen válida", undefined, 400)
      }

      const ext = EXT_MAP[file.type] ?? "jpg"
      // filename: timestamp + secure random alphanumeric id (no hyphens)
      const uuid = randomUUID().replace(/-/g, "")
      const filename = `${Date.now()}-${uuid}.${ext}`

      // write to temp location first, then move to uploads
      const tmpPath = path.join(os.tmpdir(), filename)
      const finalPath = path.join(uploadDir, filename)
      await writeFile(tmpPath, buffer)
      await rename(tmpPath, finalPath)

      urls.push(`/uploads/${filename}`)
    }

    return apiResponse(urls, null, "Imágenes subidas exitosamente")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al subir imágenes"
    const status = message === "No autorizado" ? 401 : 500
    return apiResponse(null, message, undefined, status)
  }
}
