/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
  images: {
    remotePatterns: [
      // CAMBIA el wildcard por dominios específicos que uses
      // Si usas Supabase Storage:
      { protocol: "https", hostname: "*.supabase.co" },
      // Si usas tu propio dominio:
      { protocol: "https", hostname: "tudominio.com" },
    ],
  },
}

export default nextConfig
