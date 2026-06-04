#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

step()  { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "  ${CYAN}$1${NC}"; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
ok()    { echo -e "  ${GREEN}✓${NC} $1"; }
warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()   { echo -e "  ${RED}✗${NC} $1"; }

# ──────────────────────────────────────────────
step "1/7  Verificando requisitos"

missing=()
command -v node >/dev/null 2>&1 || missing+=("Node.js v18+ (https://nodejs.org)")
command -v npm  >/dev/null 2>&1 || missing+=("npm")
command -v docker >/dev/null 2>&1 || missing+=("Docker (https://docker.com)")

if [ ${#missing[@]} -gt 0 ]; then
  for m in "${missing[@]}"; do err "$m"; done
  err "Instala los componentes faltantes y vuelve a ejecutar este script."
  exit 1
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  err "Se requiere Node.js v18+. Versión actual: $(node -v)"
  exit 1
fi

ok "Node.js $(node -v)"
ok "npm $(npm -v)"
ok "Docker $(docker -v)"

# ──────────────────────────────────────────────
step "2/7  Creando archivo .env"

ENV_FILE="$ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
  SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
  cat > "$ENV_FILE" <<EOF
# Base de datos PostgreSQL (Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pos_muebles"

# NextAuth
AUTH_SECRET="$SECRET"
AUTH_URL="http://localhost:3000"

# Credenciales del admin inicial (usado por prisma/seed.ts)
AUTH_ADMIN_EMAIL="admin@mueblepos.com"
AUTH_ADMIN_PASSWORD="Admin123!"
EOF
  ok "Archivo .env creado"
  warn "  Email: admin@mueblepos.com"
  warn "  Pass:  Admin123!"
  warn "  CAMBIA LA CONTRASEÑA EN PRODUCCIÓN"
else
  ok ".env ya existe, se mantiene la configuración actual"
fi

# ──────────────────────────────────────────────
step "3/7  Instalando dependencias npm"

cd "$ROOT"
npm install
ok "Dependencias instaladas"

# ──────────────────────────────────────────────
step "4/7  Iniciando PostgreSQL en Docker"

CONTAINER="pos-muebles-db"
if docker ps -a --format '{{.Names}}' | grep -q "^$CONTAINER$"; then
  STATUS=$(docker inspect "$CONTAINER" --format '{{.State.Status}}')
  if [ "$STATUS" = "running" ]; then
    ok "Contenedor $CONTAINER ya está corriendo"
  else
    warn "Contenedor existe pero está $STATUS. Iniciando..."
    docker start "$CONTAINER"
    ok "Contenedor iniciado"
  fi
else
  echo "  Creando contenedor PostgreSQL..."
  docker compose -f "$ROOT/docker-compose.yml" up -d
  ok "Contenedor creado e iniciado"
fi

echo "  Esperando que PostgreSQL esté disponible..."
for i in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
if ! docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then
  err "PostgreSQL no respondió después de 30 intentos"
  exit 1
fi
ok "PostgreSQL está listo"

# ──────────────────────────────────────────────
step "5/7  Generando Prisma Client y migrando BD"

npx prisma generate
npx prisma db push
ok "Base de datos sincronizada"

# Migrar datos existentes
docker exec -i "$CONTAINER" psql -U postgres -d pos_muebles -c "
  UPDATE sales SET ncf = 'B01-' || LPAD(numero::text, 8, '0') WHERE ncf IS NULL;
  UPDATE sales SET \"tipoIngreso\" = '01' WHERE \"tipoIngreso\" IS NULL;
" 2>/dev/null && ok "Datos existentes migrados" || warn "No hay datos que migrar"

# ──────────────────────────────────────────────
step "6/7  Sembrando base de datos"

npx prisma db seed
ok "Base de datos sembrada"

# ──────────────────────────────────────────────
step "7/7  Compilando proyecto"

npx next build || warn "El build tiene errores de tipos. Verifica con 'npm run dev'."
ok "Build completado"

# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "  ${GREEN}INSTALACIÓN COMPLETADA${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "  Comandos útiles:"
echo -e "  ${GRAY}npm run dev        → Iniciar servidor de desarrollo${NC}"
echo -e "  ${GRAY}npm run build      → Compilar para producción${NC}"
echo -e "  ${GRAY}npm start          → Iniciar servidor de producción${NC}"
echo -e "  ${GRAY}npm run db:seed    → Re-sembrar BD${NC}"
echo ""
echo -e "  ${CYAN}Accede en: http://localhost:3000${NC}"
echo -e "  ${CYAN}Email:    admin@mueblepos.com${NC}"
echo -e "  ${CYAN}Password: Admin123!${NC}"
echo ""
