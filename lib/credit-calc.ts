export type Frecuencia = "SEMANAL" | "QUINCENAL" | "MENSUAL"

export interface ScheduleRow {
  cuota: number
  fecha: Date
  capital: number
  interes: number
  seguro: number
  totalCuota: number
  saldoRestante: number
}

export interface CreditCalcInput {
  montoTotal: number
  inicial: number
  tasaInteres: number
  cuotas: number
  frecuencia: Frecuencia
  seguroPorCuota: number
  tipoSeguro?: "FIJO" | "PORCENTAJE"
  valorSeguro?: number
  fechaVenta: Date
  gastosLegales?: number
  modalidadGastos?: "CUOTAS" | "INICIAL"
}

function periodRate(tasaAnual: number, frecuencia: Frecuencia): number {
  const r = tasaAnual / 100
  switch (frecuencia) {
    case "MENSUAL":
      return r / 12
    case "QUINCENAL":
      return r / (52 / 2)
    case "SEMANAL":
      return r / 52
  }
}

function periodDays(frecuencia: Frecuencia): number {
  switch (frecuencia) {
    case "MENSUAL":
      return 30
    case "QUINCENAL":
      return 15
    case "SEMANAL":
      return 7
  }
}

export function calcCuotaFija(P: number, r: number, n: number): number {
  if (r === 0) return Math.round((P / n) * 100) / 100
  const factor = Math.pow(1 + r, n)
  return Math.round((P * (r * factor) / (factor - 1)) * 100) / 100
}

export function generateSchedule(input: CreditCalcInput): ScheduleRow[] {
  const gastosLegales = input.gastosLegales ?? 0
  const modalidadGastos = input.modalidadGastos ?? "CUOTAS"
  
  let montoFinanciar = Math.round((input.montoTotal - input.inicial) * 100) / 100
  
  // Si los gastos legales van en cuotas, se agregan al monto a financiar
  if (modalidadGastos === "CUOTAS" && gastosLegales > 0) {
    montoFinanciar = Math.round((montoFinanciar + gastosLegales) * 100) / 100
  }
  
  const P = montoFinanciar
  if (P <= 0) return []

  const r = periodRate(input.tasaInteres, input.frecuencia)
  const n = input.cuotas
  const tipoSeguro = input.tipoSeguro ?? "FIJO"
  const dias = periodDays(input.frecuencia)

  const cuotaFija = calcCuotaFija(P, r, n)
  const schedule: ScheduleRow[] = []
  let saldo = P

  for (let i = 1; i <= n; i++) {
    const interes = Math.round(saldo * r * 100) / 100

    let seguro: number
    if (tipoSeguro === "PORCENTAJE") {
      seguro = Math.round(saldo * ((input.valorSeguro ?? 0) / 100) * 100) / 100
    } else {
      seguro = input.seguroPorCuota
    }

    const capital = Math.round((cuotaFija - interes) * 100) / 100
    const totalCuota = Math.round((cuotaFija + seguro) * 100) / 100

    let saldoRestante: number
    if (i === n) {
      saldoRestante = 0
    } else {
      saldoRestante = Math.round((saldo - capital) * 100) / 100
    }

    const fecha = new Date(input.fechaVenta.getTime() + i * dias * 86_400_000)

    schedule.push({
      cuota: i,
      fecha,
      capital,
      interes,
      seguro,
      totalCuota,
      saldoRestante,
    })

    saldo = saldoRestante
  }

  return schedule
}

export function calcCreditSummary(input: CreditCalcInput) {
  const gastosLegales = input.gastosLegales ?? 0
  const modalidadGastos = input.modalidadGastos ?? "CUOTAS"

  let P = Math.round((input.montoTotal - input.inicial) * 100) / 100
  if (modalidadGastos === "CUOTAS" && gastosLegales > 0) {
    P = Math.round((P + gastosLegales) * 100) / 100
  }

  const r = periodRate(input.tasaInteres, input.frecuencia)
  const cuotaFija = calcCuotaFija(P, r, input.cuotas)
  const tipoSeguro = input.tipoSeguro ?? "FIJO"

  let totalSeguros: number
  let cuotaConSeguro: number

  if (tipoSeguro === "PORCENTAJE") {
    totalSeguros = 0
    let saldo = P
    for (let i = 1; i <= input.cuotas; i++) {
      const seguro = Math.round(saldo * ((input.valorSeguro ?? 0) / 100) * 100) / 100
      totalSeguros += seguro
      const capital = Math.round((cuotaFija - Math.round(saldo * r * 100) / 100) * 100) / 100
      saldo = i === input.cuotas ? 0 : Math.round((saldo - capital) * 100) / 100
    }
    totalSeguros = Math.round(totalSeguros * 100) / 100
    cuotaConSeguro = Math.round((cuotaFija + (totalSeguros / input.cuotas)) * 100) / 100
  } else {
    cuotaConSeguro = Math.round((cuotaFija + input.seguroPorCuota) * 100) / 100
    totalSeguros = Math.round((input.seguroPorCuota * input.cuotas) * 100) / 100
  }

  const totalAPagar = Math.round((cuotaFija * input.cuotas + totalSeguros + input.inicial + (modalidadGastos === "INICIAL" ? gastosLegales : 0)) * 100) / 100
  const totalIntereses = Math.round((cuotaFija * input.cuotas - P) * 100) / 100
  const inicialTotal = input.inicial + (modalidadGastos === "INICIAL" ? gastosLegales : 0)

  return {
    montoFinanciado: P,
    cuotaFijaSinSeguro: cuotaFija,
    cuotaConSeguro,
    totalAPagar,
    totalIntereses,
    totalSeguros,
    inicialTotal,
  }
}

export function isOverdue(fechaVencimiento: Date, today: Date = new Date()): boolean {
  return today > fechaVencimiento
}

export function calcExtraPayment(saldo: number, montoPago: number, cuotaFija: number) {
  const pagoNormal = Math.min(montoPago, cuotaFija)
  const abonoCapital = montoPago - pagoNormal
  const nuevoSaldo = Math.max(0, Math.round((saldo - montoPago) * 100) / 100)
  return { pagoNormal, abonoCapital, nuevoSaldo }
}
