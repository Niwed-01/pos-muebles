<#
.SYNOPSIS
  Instalación automática de POS Muebles
.DESCRIPTION
  Verifica requisitos, configura BD en Docker, instala dependencias,
  ejecuta migraciones y seed, y compila el proyecto.
#>

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

function Write-Step($msg) {
  Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host "  $msg" -ForegroundColor Cyan
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Write-OK($msg) {
  Write-Host "  ✓ $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
  Write-Host "  ⚠ $msg" -ForegroundColor Yellow
}

function Write-Error($msg) {
  Write-Host "  ✗ $msg" -ForegroundColor Red
}

function Test-Command($cmd) {
  return (Get-Command $cmd -ErrorAction SilentlyContinue) -ne $null
}

# ──────────────────────────────────────────────
Write-Step "1/7  Verificando requisitos"

$missing = @()
if (-not (Test-Command "node")) { $missing += "Node.js v18+ (https://nodejs.org)" }
if (-not (Test-Command "npm"))   { $missing += "npm" }
if (-not (Test-Command "docker")) { $missing += "Docker Desktop (https://docker.com)" }

if ($missing.Count -gt 0) {
  foreach ($m in $missing) { Write-Error $m }
  Write-Error "Instala los componentes faltantes y vuelve a ejecutar este script."
  exit 1
}

$nodeVer = (node -v).TrimStart('v').Split('.')[0]
if ([int]$nodeVer -lt 18) {
  Write-Error "Se requiere Node.js v18+. Versión actual: $(node -v)"
  exit 1
}

Write-OK "Node.js $(node -v)"
Write-OK "npm $(npm -v)"
Write-OK "Docker $(docker -v)"

# ──────────────────────────────────────────────
Write-Step "2/7  Creando archivo .env"

$envFile = Join-Path $projectRoot ".env"
if (-not (Test-Path $envFile)) {
  $secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

  @"
# Base de datos PostgreSQL (Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pos_muebles"

# NextAuth
AUTH_SECRET="$secret"
AUTH_URL="http://localhost:3000"

# Credenciales del admin inicial (usado por prisma/seed.ts)
AUTH_ADMIN_EMAIL="admin@mueblepos.com"
AUTH_ADMIN_PASSWORD="Admin123!"
"@ | Out-File -FilePath $envFile -Encoding utf8

  Write-OK "Archivo .env creado con credenciales por defecto"
  Write-Warn "  Email: admin@mueblepos.com"
  Write-Warn "  Pass:  Admin123!"
  Write-Warn "  CAMBIA LA CONTRASEÑA EN PRODUCCIÓN"
} else {
  Write-OK ".env ya existe, se mantiene la configuración actual"
}

# ──────────────────────────────────────────────
Write-Step "3/7  Instalando dependencias npm"

Set-Location $projectRoot
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "npm install falló"; exit 1 }
Write-OK "Dependencias instaladas"

# ──────────────────────────────────────────────
Write-Step "4/7  Iniciando PostgreSQL en Docker"

$containerName = "pos-muebles-db"
$existing = docker ps -a --filter "name=$containerName" --format "{{.Names}}" 2>$null

if ($existing -eq $containerName) {
  $status = docker inspect $containerName --format "{{.State.Status}}" 2>$null
  if ($status -eq "running") {
    Write-OK "Contenedor $containerName ya está corriendo"
  } else {
    Write-Warn "Contenedor existe pero está $status. Iniciando..."
    docker start $containerName
    Write-OK "Contenedor iniciado"
  }
} else {
  Write-Host "  Creando contenedor PostgreSQL..."
  docker compose -f (Join-Path $projectRoot "docker-compose.yml") up -d
  Write-OK "Contenedor creado e iniciado"
}

# Esperar a que PostgreSQL esté listo
Write-Host "  Esperando que PostgreSQL esté disponible..."
$maxAttempts = 30
$attempt = 0
do {
  $attempt++
  $ready = docker exec $containerName pg_isready -U postgres 2>$null
  if ($ready -match "accepting connections") { break }
  Start-Sleep -Seconds 2
} while ($attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
  Write-Error "PostgreSQL no respondió después de $maxAttempts intentos"
  exit 1
}
Write-OK "PostgreSQL está listo"

# ──────────────────────────────────────────────
Write-Step "5/7  Generando Prisma Client y migrando BD"

npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Error "prisma generate falló"; exit 1 }

npx prisma db push
if ($LASTEXITCODE -ne 0) { Write-Error "prisma db push falló"; exit 1 }
Write-OK "Base de datos sincronizada"

# Migrar datos existentes (ncf, tipoIngreso, etc.)
try {
  $null = docker exec -i $containerName psql -U postgres -d pos_muebles -c "UPDATE sales SET ncf = 'B01-' || LPAD(numero::text, 8, '0') WHERE ncf IS NULL; UPDATE sales SET ""tipoIngreso"" = '01' WHERE ""tipoIngreso"" IS NULL;"
  Write-OK "Datos existentes migrados"
} catch {
  Write-Warn "No se pudieron migrar datos existentes (probablemente no hay registros)"
}

# ──────────────────────────────────────────────
Write-Step "6/7  Sembrando base de datos"

npx prisma db seed
if ($LASTEXITCODE -ne 0) { Write-Error "seed falló"; exit 1 }
Write-OK "Base de datos sembrada (admin + categorías + caja chica + catálogo de cuentas)"

# ──────────────────────────────────────────────
Write-Step "7/7  Compilando proyecto"

npx next build
if ($LASTEXITCODE -ne 0) {
  Write-Warn "El build tiene errores de tipos (posiblemente lucide-react). Verifica con 'npm run dev'."
} else {
  Write-OK "Build exitoso"
}

# ──────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  INSTALACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Comandos útiles:" -ForegroundColor White
Write-Host "  npm run dev        → Iniciar servidor de desarrollo" -ForegroundColor Gray
Write-Host "  npm run build      → Compilar para producción" -ForegroundColor Gray
Write-Host "  npm start          → Iniciar servidor de producción" -ForegroundColor Gray
Write-Host "  npm run db:seed    → Re-sembrar BD" -ForegroundColor Gray
Write-Host ""
Write-Host "  Accede en: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Email:    admin@mueblepos.com" -ForegroundColor Cyan
Write-Host "  Password: Admin123!" -ForegroundColor Cyan
Write-Host ""
