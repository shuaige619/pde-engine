#!/bin/bash
# PDE Engine 无 Docker 一键启动（SQLite 模式）
# 无需 PostgreSQL/Redis/Docker，用 SQLite 文件数据库

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_USER_DIR="$PROJECT_DIR/frontend-user"
FRONTEND_ADMIN_DIR="$PROJECT_DIR/frontend-admin"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  PDE Engine 无 Docker 启动（SQLite 模式）               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ==================== 检查环境 ====================

echo "[1/4] 检查环境..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 未安装"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm 未安装"; exit 1; }
node -v && npm -v
echo "✅ 环境检查通过"

# ==================== 启动后端 ====================

echo ""
echo "[2/4] 启动后端（SQLite 模式）..."
cd "$BACKEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 切换到 SQLite 配置
echo "🔄 切换到 SQLite 模式..."
cp prisma/schema.sqlite.prisma prisma/schema.prisma

# 创建 SQLite 环境变量文件
cat > .env << 'EOF'
DATABASE_URL="file:./dev.db"
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
JWT_SECRET="pde_jwt_secret_change_in_production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"
LOG_LEVEL=info
EOF

echo "🔄 生成 Prisma 客户端..."
npx prisma generate

echo "🔄 执行数据库迁移..."
npx prisma migrate dev --name init --skip-generate 2>/dev/null || npx prisma migrate deploy 2>/dev/null || true

echo "🌱 导入种子数据..."
# 手动创建种子数据
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@pde.local' } });
  if (existing) {
    console.log('✅ 种子数据已存在');
    return;
  }
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.create({
    data: {
      email: 'admin@pde.local',
      password: hashedPassword,
      name: '管理员',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  
  console.log('✅ 种子数据导入完成');
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
" 2>/dev/null || echo "⚠️ 种子数据跳过，可能Prisma Client未生成"

echo "🚀 启动后端..."
npm run dev &
BACKEND_PID=$!

# 等待后端就绪
for i in {1..30}; do
    if curl -s http://localhost:3000/health 2>/dev/null | grep -q "ok"; then
        echo "✅ 后端就绪 (http://localhost:3000)"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "⚠️ 后端启动较慢，继续..."
    fi
    sleep 1
done

# ==================== 启动前端 ====================

echo ""
echo "[3/4] 启动用户控制台..."
cd "$FRONTEND_USER_DIR"

if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 检查端口
PORT_PID=$(lsof -ti :5173 2>/dev/null || true)
if [ -n "$PORT_PID" ]; then
    echo "⚠️  端口 5173 被占用，关闭旧进程..."
    kill -9 "$PORT_PID" 2>/dev/null || true
    sleep 1
fi

npm run dev &
FRONTEND_PID=$!
echo "✅ 用户控制台启动中 (http://localhost:5173)"

echo ""
echo "[4/4] 启动管理后台..."
cd "$FRONTEND_ADMIN_DIR"

if [ ! -d "node_modules" ]; then
    echo "📦 安装管理后台依赖..."
    npm install
fi

# 检查端口
PORT_PID=$(lsof -ti :5174 2>/dev/null || true)
if [ -n "$PORT_PID" ]; then
    echo "⚠️  端口 5174 被占用，关闭旧进程..."
    kill -9 "$PORT_PID" 2>/dev/null || true
    sleep 1
fi

npm run dev &
ADMIN_PID=$!
echo "✅ 管理后台启动中 (http://localhost:5174)"

# ==================== 完成 ====================

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              ✅ 所有服务已启动（SQLite 模式）            ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  📋 用户控制台:  http://localhost:5173                   ║"
echo "║  🔧 管理后台:    http://localhost:5174                   ║"
echo "║  🌐 后端 API:    http://localhost:3000                   ║"
echo "║                                                          ║"
echo "║  ⚠️  当前为 SQLite 模式（无 Docker）                     ║"
echo "║     如需完整功能，请启动 Docker 后运行 ./start.sh        ║"
echo "║                                                          ║"
echo "║  🔑 默认账户:    admin@pde.local / admin123               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "按 Ctrl+C 停止所有服务"

cleanup() {
    echo ""
    echo "🛑 正在停止..."
    kill $ADMIN_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    echo "✅ 已停止"
    exit 0
}
trap cleanup INT
wait
