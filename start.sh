#!/bin/bash
# PDE Engine 一键启动脚本

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║         PDE Engine 产研一体化引擎 一键启动                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ==================== 检查依赖 ====================

echo "[1/6] 检查依赖..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 未安装"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm 未安装"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker 未安装"; exit 1; }
echo "✅ 依赖检查通过"

# ==================== 启动基础设施 ====================

echo ""
echo "[2/6] 启动基础设施 (PostgreSQL + Redis)..."
cd "$PROJECT_DIR"
docker compose up -d postgres redis

echo "⏳ 等待 PostgreSQL..."
for i in {1..30}; do
    docker compose exec -T postgres pg_isready -U pde_user -d pde_engine -p 5432 >/dev/null 2>&1 && { echo "✅ PostgreSQL 就绪"; break; }
    [ "$i" -eq 30 ] && { echo "⚠️ PostgreSQL 超时，继续..."; }
    sleep 1
done

echo "⏳ 等待 Redis..."
for i in {1..30}; do
    docker compose exec -T redis redis-cli -a pde_redis_pass ping 2>/dev/null | grep -q PONG && { echo "✅ Redis 就绪"; break; }
    [ "$i" -eq 30 ] && { echo "⚠️ Redis 超时，继续..."; }
    sleep 1
done

# ==================== 启动后端 ====================

echo ""
echo "[3/6] 启动后端..."
cd "$PROJECT_DIR/backend"

if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

echo "🔄 数据库迁移..."
npx prisma generate
npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name init
npx prisma db seed 2>/dev/null || echo "⚠️ 种子数据跳过"

echo "🚀 启动后端..."
npm run dev &
BACKEND_PID=$!

for i in {1..30}; do
    curl -s http://localhost:3000/health | grep -q "ok" && { echo "✅ 后端就绪 (http://localhost:3000)"; break; }
    [ "$i" -eq 30 ] && echo "⚠️ 后端启动慢，继续..."
    sleep 1
done

# ==================== 启动前端 ====================

echo ""
echo "[4/6] 启动用户控制台..."
cd "$PROJECT_DIR/frontend-user"
[ ! -d "node_modules" ] && { echo "📦 安装前端依赖..."; npm install; }
npm run dev &
FRONTEND_PID=$!
echo "✅ 用户控制台启动中 (http://localhost:5173)"

echo ""
echo "[5/6] 启动管理后台..."
cd "$PROJECT_DIR/frontend-admin"
[ ! -d "node_modules" ] && { echo "📦 安装管理后台依赖..."; npm install; }
npm run dev &
ADMIN_PID=$!
echo "✅ 管理后台启动中 (http://localhost:5174)"

# ==================== 完成 ====================

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                   ✅ 所有服务已启动                       ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  📋 用户控制台:  http://localhost:5173                   ║"
echo "║  🔧 管理后台:    http://localhost:5174                   ║"
echo "║  🌐 后端 API:    http://localhost:3000                   ║"
echo "║  💓 健康检查:    http://localhost:3000/health            ║"
echo "║                                                          ║"
echo "║  🔑 默认账户:    admin@pde.local / admin123               ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  如果前端无法访问，请单独运行:                            ║"
echo "║  ./start-frontend.sh   (用户控制台诊断启动)              ║"
echo "║  ./start-admin.sh      (管理后台诊断启动)               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "按 Ctrl+C 停止所有服务"

cleanup() {
    echo ""
    echo "🛑 正在停止..."
    kill $ADMIN_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    cd "$PROJECT_DIR" && docker compose stop
    echo "✅ 已停止"
    exit 0
}
trap cleanup INT
wait
