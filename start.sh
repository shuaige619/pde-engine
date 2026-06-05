#!/bin/bash
# PDE Engine 一键启动脚本
# 用法: ./start.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_USER_DIR="$PROJECT_DIR/frontend-user"
FRONTEND_ADMIN_DIR="$PROJECT_DIR/frontend-admin"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║         PDE Engine 产研一体化引擎 一键启动                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ==================== 检查依赖 ====================

echo "[1/6] 检查依赖..."

command -v node >/dev/null 2>&1 || { echo "❌ Node.js 未安装, 请先安装 Node.js 20+"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm 未安装"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker 未安装, 请先安装 Docker"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose 未安装"; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Node.js 版本过低, 建议 20+: $(node -v)"
fi

echo "✅ 依赖检查通过"

# ==================== 启动基础设施 ====================

echo ""
echo "[2/6] 启动基础设施 (PostgreSQL + Redis)..."

cd "$PROJECT_DIR"
docker-compose up -d postgres redis

# 等待PostgreSQL就绪
echo "⏳ 等待 PostgreSQL 就绪..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U pde_user -d pde_engine >/dev/null 2>&1; then
        echo "✅ PostgreSQL 就绪"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "❌ PostgreSQL 启动超时"
        exit 1
    fi
    sleep 1
done

# 等待Redis就绪
echo "⏳ 等待 Redis 就绪..."
for i in {1..30}; do
    if docker-compose exec -T redis redis-cli -a pde_redis_pass ping | grep -q PONG; then
        echo "✅ Redis 就绪"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "❌ Redis 启动超时"
        exit 1
    fi
    sleep 1
done

# ==================== 启动后端 ====================

echo ""
echo "[3/6] 启动后端服务..."

cd "$BACKEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 恢复PostgreSQL配置的prisma schema
cp prisma/schema.prisma.postgresql prisma/schema.prisma 2>/dev/null || true

if [ ! -f "prisma/schema.prisma.postgresql" ]; then
    # 备份原始schema
    cp prisma/schema.prisma prisma/schema.prisma.postgresql 2>/dev/null || true
fi

# 确保使用PostgreSQL配置
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma 2>/dev/null || true
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma 2>/dev/null || true

echo "🔄 执行数据库迁移..."
npx prisma generate
npx prisma migrate dev --name init --skip-generate 2>/dev/null || true
npx prisma migrate deploy 2>/dev/null || true

echo "🌱 导入种子数据..."
npx prisma db seed 2>/dev/null || echo "⚠️ 种子数据导入失败，继续启动"

echo "🚀 启动后端服务..."
npm run dev &
BACKEND_PID=$!
echo "后端 PID: $BACKEND_PID"

# 等待后端就绪
echo "⏳ 等待后端服务就绪..."
for i in {1..30}; do
    if curl -s http://localhost:3000/health | grep -q "ok"; then
        echo "✅ 后端服务就绪 (http://localhost:3000)"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "⚠️ 后端启动可能有问题，继续..."
    fi
    sleep 1
done

# ==================== 启动用户控制台 ====================

echo ""
echo "[4/6] 启动用户控制台 (React)..."

cd "$FRONTEND_USER_DIR"

if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

npm run dev &
FRONTEND_USER_PID=$!
echo "用户控制台 PID: $FRONTEND_USER_PID"

# ==================== 启动管理后台 ====================

echo ""
echo "[5/6] 启动管理后台 (Vue3)..."

cd "$FRONTEND_ADMIN_DIR"

if [ ! -d "node_modules" ]; then
    echo "📦 安装管理后台依赖..."
    npm install
fi

npm run dev &
FRONTEND_ADMIN_PID=$!
echo "管理后台 PID: $FRONTEND_ADMIN_PID"

# ==================== 完成 ====================

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                   ✅ 所有服务已启动                       ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  📋 用户控制台:  http://localhost:5173                   ║"
echo "║  🔧 管理后台:    http://localhost:5174                   ║"
echo "║  🌐 后端 API:    http://localhost:3000                   ║"
echo "║  💓 健康检查:    http://localhost:3000/health            ║"
echo "║                                                          ║"
echo "║  🔑 默认账户:    admin@pde.local / admin123               ║"
echo "║                                                          ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  按 Ctrl+C 停止所有服务                                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 捕获Ctrl+C信号，优雅关闭所有服务
cleanup() {
    echo ""
    echo "🛑 正在停止所有服务..."
    kill $FRONTEND_ADMIN_PID 2>/dev/null || true
    kill $FRONTEND_USER_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    cd "$PROJECT_DIR" && docker-compose stop
    echo "✅ 所有服务已停止"
    exit 0
}
trap cleanup INT

# 保持脚本运行
wait
