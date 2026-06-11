import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

const CHART_OF_ACCOUNTS = [
  {
    codigo: "1",
    nombre: "ACTIVO",
    tipo: "ACTIVO",
    nivel: 1,
    children: [
      {
        codigo: "1.1",
        nombre: "Activo Corriente",
        tipo: "ACTIVO",
        nivel: 2,
        children: [
          { codigo: "1.1.01", nombre: "Caja", tipo: "ACTIVO", nivel: 3 },
          { codigo: "1.1.02", nombre: "Banco (Tarjeta)", tipo: "ACTIVO", nivel: 3 },
          { codigo: "1.1.03", nombre: "Banco (Transferencia)", tipo: "ACTIVO", nivel: 3 },
          { codigo: "1.1.04", nombre: "Caja Chica", tipo: "ACTIVO", nivel: 3 },
          { codigo: "1.1.05", nombre: "Cuentas por Cobrar (Créditos)", tipo: "ACTIVO", nivel: 3 },
          { codigo: "1.1.06", nombre: "Inventario de Muebles", tipo: "ACTIVO", nivel: 3 },
        ],
      },
      {
        codigo: "1.2",
        nombre: "Activo No Corriente",
        tipo: "ACTIVO",
        nivel: 2,
        children: [
          { codigo: "1.2.01", nombre: "Mobiliario y Equipo", tipo: "ACTIVO", nivel: 3 },
          { codigo: "1.2.02", nombre: "Depreciación Acumulada", tipo: "ACTIVO", nivel: 3 },
        ],
      },
    ],
  },
  {
    codigo: "2",
    nombre: "PASIVO",
    tipo: "PASIVO",
    nivel: 1,
    children: [
      {
        codigo: "2.1",
        nombre: "Pasivo Corriente",
        tipo: "PASIVO",
        nivel: 2,
        children: [
          { codigo: "2.1.01", nombre: "ITBIS por Pagar", tipo: "PASIVO", nivel: 3 },
          { codigo: "2.1.02", nombre: "Proveedores por Pagar", tipo: "PASIVO", nivel: 3 },
          { codigo: "2.1.03", nombre: "ISR por Pagar", tipo: "PASIVO", nivel: 3 },
        ],
      },
    ],
  },
  {
    codigo: "3",
    nombre: "CAPITAL",
    tipo: "CAPITAL",
    nivel: 1,
    children: [
      { codigo: "3.1.01", nombre: "Capital Social", tipo: "CAPITAL", nivel: 3 },
      { codigo: "3.1.02", nombre: "Utilidades Retenidas", tipo: "CAPITAL", nivel: 3 },
      { codigo: "3.1.03", nombre: "Resultado del Ejercicio", tipo: "CAPITAL", nivel: 3 },
    ],
  },
  {
    codigo: "4",
    nombre: "INGRESOS",
    tipo: "INGRESO",
    nivel: 1,
    children: [
      { codigo: "4.1.01", nombre: "Ventas de Muebles", tipo: "INGRESO", nivel: 3 },
      { codigo: "4.1.02", nombre: "Ingresos por Intereses (Créditos)", tipo: "INGRESO", nivel: 3 },
      { codigo: "4.1.03", nombre: "Ingresos por Seguros", tipo: "INGRESO", nivel: 3 },
      { codigo: "4.1.04", nombre: "Ingresos por Gastos Legales", tipo: "INGRESO", nivel: 3 },
      { codigo: "4.1.05", nombre: "Devoluciones y Descuentos en Ventas", tipo: "INGRESO", nivel: 3 },
    ],
  },
  {
    codigo: "5",
    nombre: "GASTOS",
    tipo: "GASTO",
    nivel: 1,
    children: [
      {
        codigo: "5.1",
        nombre: "Gastos Operativos",
        tipo: "GASTO",
        nivel: 2,
        children: [
          { codigo: "5.1.01", nombre: "Costo de Ventas", tipo: "GASTO", nivel: 3 },
          { codigo: "5.1.02", nombre: "Sueldos y Salarios", tipo: "GASTO", nivel: 3 },
          { codigo: "5.1.03", nombre: "Alquiler del Local", tipo: "GASTO", nivel: 3 },
          { codigo: "5.1.04", nombre: "Electricidad y Agua", tipo: "GASTO", nivel: 3 },
          { codigo: "5.1.05", nombre: "Gastos de Transporte", tipo: "GASTO", nivel: 3 },
          { codigo: "5.1.06", nombre: "Papelería y Útiles", tipo: "GASTO", nivel: 3 },
          { codigo: "5.1.07", nombre: "Gastos de Publicidad y Mercadeo", tipo: "GASTO", nivel: 3 },
          { codigo: "5.1.08", nombre: "Mantenimiento y Reparaciones", tipo: "GASTO", nivel: 3 },
          { codigo: "5.1.09", nombre: "Teléfono e Internet", tipo: "GASTO", nivel: 3 },
          { codigo: "5.1.10", nombre: "Gastos Varios de Caja Chica", tipo: "GASTO", nivel: 3 },
        ],
      },
      {
        codigo: "5.2",
        nombre: "Gastos Financieros",
        tipo: "GASTO",
        nivel: 2,
        children: [
          { codigo: "5.2.01", nombre: "Comisiones Bancarias", tipo: "GASTO", nivel: 3 },
          { codigo: "5.2.02", nombre: "Intereses Pagados", tipo: "GASTO", nivel: 3 },
        ],
      },
    ],
  },
]

async function createAccountTree(
  items: Array<{ codigo: string; nombre: string; tipo: string; nivel: number; children?: any[] }>,
  parentId: string | null = null
) {
  for (const item of items) {
    const { children, ...data } = item
    const existing = await prisma.account.findUnique({ where: { codigo: data.codigo } })
    if (!existing) {
      await prisma.account.create({
        data: {
          codigo: data.codigo,
          nombre: data.nombre,
          tipo: data.tipo,
          nivel: data.nivel,
          parentId,
        },
      })
      console.log(`  ✓ Cuenta creada: ${data.codigo} - ${data.nombre}`)
    }
    if (children?.length) {
      const parent = await prisma.account.findUnique({ where: { codigo: data.codigo } })
      if (parent) await createAccountTree(children, parent.id)
    }
  }
}

async function main() {
  const email = process.env.AUTH_ADMIN_EMAIL ?? "admin@example.com"
  const password = process.env.AUTH_ADMIN_PASSWORD ?? "CHANGE_ME_BEFORE_SEED"

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

  const existingPettyCash = await prisma.pettyCash.findFirst()
  if (!existingPettyCash) {
    await prisma.pettyCash.create({
      data: {
        nombre: "Caja Chica Principal",
        fondoAsignado: 10000.00,
        saldoActual: 10000.00,
        activo: true,
      }
    })
    console.log("✓ Caja Chica inicial creada")
  }

  console.log("\n📊 Cargando catálogo de cuentas contables...")
  await createAccountTree(CHART_OF_ACCOUNTS)
  console.log("✓ Catálogo de cuentas cargado")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
