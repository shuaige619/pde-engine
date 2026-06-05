#!/bin/bash
# 管理后台诊断启动脚本

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     PDE Engine 管理后台诊断启动                         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")/frontend-admin"

# 1. 检查环境
echo "[1/5] 检查环境..."
node -v && npm -v || { echo "❌ Node.js/npm 未安装"; exit 1; }

# 2. 安装依赖
echo ""
echo "[2/5] 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install 2>&1
    echo "✅ 完成"
else
    echo "✅ node_modules 已存在"
fi

# 3. 检查端口
echo ""
echo "[3/5] 检查端口 5174..."
PORT_PID=$(lsof -ti :5174 2>/dev/null || true)
if [ -n "$PORT_PID" ]; then
    echo "⚠️  端口 5174 被占用 (PID: $PORT_PID)，正在关闭..."
    kill -9 "$PORT_PID" 2>/dev/null || true
    sleep 1
fi
echo "✅ 端口 5174 可用"

# 4. 检查文件
echo ""
echo "[4/5] 检查项目文件..."
for f in index.html vite.config.ts tsconfig.json src/main.ts src/App.vue; do
    [ -f "$f" ] || { echo "❌ 缺少: $f"; exit 1; }
done
echo "✅ 项目文件完整"

# 5. 启动
echo ""
echo "[5/5] 启动管理后台..."
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "如果启动失败，请把下面的错误信息复制给我"
echo "═══════════════════════════════════════════════════════════"
echo ""

npx vite --port 5174 --host 0.0.0.0
