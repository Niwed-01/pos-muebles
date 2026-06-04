type TxClient = Parameters<Parameters<typeof import("@/lib/db").db.$transaction>[0]>[0]

const SALE_ACCOUNT_CODES = ["1.1.01", "1.1.02", "1.1.03", "1.1.05", "4.1.01", "2.1.01"] as const

async function getAccountIds(codes: readonly string[]) {
  const accounts = await import("@/lib/db").then((m) =>
    m.db.account.findMany({ where: { codigo: { in: codes as unknown as string[] } } })
  )
  const map = Object.fromEntries(accounts.map((a) => [a.codigo, a.id]))
  const missing = codes.filter((c) => !map[c])
  if (missing.length > 0) {
    throw new Error(`Cuentas contables no encontradas: ${missing.join(", ")}. Ejecuta el seed primero.`)
  }
  return map as Record<(typeof codes)[number], string>
}

export async function createSaleJournalEntry(
  tx: TxClient,
  subtotal: number,
  impuesto: number,
  total: number,
  metodoPago: string,
  userId: string
) {
  const ids = await getAccountIds(SALE_ACCOUNT_CODES)

  let cuentaDebe: string
  if (metodoPago === "EFECTIVO") cuentaDebe = ids["1.1.01"]
  else if (metodoPago === "TARJETA") cuentaDebe = ids["1.1.02"]
  else if (metodoPago === "TRANSFERENCIA") cuentaDebe = ids["1.1.03"]
  else cuentaDebe = ids["1.1.05"]

  const entry = await tx.journalEntry.create({
    data: {
      descripcion: `Venta al contado - ${metodoPago}`,
      referencia: `VENTA-${total.toFixed(2)}`,
      tipo: "VENTA",
      userId,
      lineas: {
        create: [
          { accountId: cuentaDebe, debe: total, haber: 0 },
          { accountId: ids["4.1.01"], debe: 0, haber: subtotal },
          { accountId: ids["2.1.01"], debe: 0, haber: impuesto },
        ],
      },
    },
  })

  return entry
}

export async function createPettyCashExpenseJournalEntry(
  tx: TxClient,
  monto: number,
  descripcion: string,
  cuentaGastoCodigo: string,
  userId: string
) {
  const ids = await getAccountIds(["1.1.04", cuentaGastoCodigo] as const)
  const cajaChicaId = ids["1.1.04"]
  const cuentaGastoId = ids[cuentaGastoCodigo as keyof typeof ids]

  const entry = await tx.journalEntry.create({
    data: {
      descripcion,
      referencia: `CAJA-${Date.now().toString(36)}`,
      tipo: "CAJA_CHICA",
      userId,
      lineas: {
        create: [
          { accountId: cuentaGastoId, debe: monto, haber: 0 },
          { accountId: cajaChicaId, debe: 0, haber: monto },
        ],
      },
    },
  })

  return entry
}
