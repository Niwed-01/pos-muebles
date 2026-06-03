import { NextRequest, NextResponse } from "next/server"

// In-memory fallback for development
const attempts = new Map<string, { count: number; resetAt: number }>()

export function rateLimitLogin(req: NextRequest): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
  const key = `login:${ip}`
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutos
  const maxAttempts = 10

  const record = attempts.get(key)

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  if (record.count >= maxAttempts) {
    const waitMinutes = Math.ceil((record.resetAt - now) / 60000)
    return NextResponse.json(
      { data: null, error: `Demasiados intentos. Espera ${waitMinutes} minutos.` },
      { status: 429 }
    )
  }

  record.count++
  return null
}

/*
If you want a production-backed rate limiter use Upstash Redis + @upstash/ratelimit.
Example (pseudocode):

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '15 m') })

const res = await ratelimit.limit(key)
if (!res.success) return NextResponse.json({ data: null, error: 'Rate limit' }, { status: 429 })

*/
