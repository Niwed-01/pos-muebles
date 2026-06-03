import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = process.env.AUTH_ADMIN_EMAIL ?? "admin@mueblepos.com"
  const password = process.env.AUTH_ADMIN_PASSWORD ?? "Admin123!"

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (!existingUser) {
    const passwordHash = await hash(password, 12)
    await prisma.user.create({
      data: {
        nombre: "Admin",
        email,
        passwordHash,
        rol: "ADMIN",
        activo: true,
      },
    })
    console.log(`✓ Usuario admin creado: ${email}`)
  } else {
    console.log(`✓ Usuario ${email} ya existe`)
  }

  const categorias = [
    { nombre: "Sala", slug: "sala" },
    { nombre: "Comedor", slug: "comedor" },
    { nombre: "Dormitorio", slug: "dormitorio" },
    { nombre: "Oficina", slug: "oficina" },
    { nombre: "Jardín", slug: "jardin" },
    { nombre: "Decoración", slug: "decoracion" },
  ]

  for (const cat of categorias) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } })
    if (!existing) {
      await prisma.category.create({ data: cat })
      console.log(`  ✓ Categoría creada: ${cat.nombre}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
