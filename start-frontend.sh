#!/bin/bash
# 前端诊断启动脚本

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     PDE Engine 前端诊断启动                             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")/frontend-user"

# 1. 检查 Node.js
echo "[1/5] 检查 Node.js..."
node -v || { echo "❌ Node.js 未安装"; exit 1; }
npm -v || { echo "❌ npm 未安装"; exit 1; }

# 2. 检查 node_modules
echo ""
echo "[2/5] 检查 node_modules..."
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules 不存在，开始安装依赖..."
    echo "⏳ 这可能需要几分钟..."
    npm install 2>&1
    echo "✅ 依赖安装完成"
else
    echo "✅ node_modules 已存在"
    # 检查关键包是否存在
    if [ ! -d "node_modules/vite" ]; then
        echo "⚠️  vite 未安装，重新安装..."
        npm install
    fi
fi

# 3. 检查端口
echo ""
echo "[3/5] 检查端口 5173..."
PORT_PID=$(lsof -ti :5173 2>/dev/null || true)
if [ -n "$PORT_PID" ]; then
    echo "⚠️  端口 5173 被占用 (PID: $PORT_PID)，正在关闭..."
    kill -9 "$PORT_PID" 2>/dev/null || true
    sleep 1
fi
echo "✅ 端口 5173 可用"

# 4. 检查关键文件
echo ""
echo "[4/5] 检查项目文件..."
FILES="index.html vite.config.ts tsconfig.json src/main.tsx src/App.tsx"
for f in $FILES; do
    if [ ! -f "$f" ]; then
        echo "❌ 缺少文件: $f"
        exit 1
    fi
done
echo "✅ 项目文件完整"

# 5. 启动
echo ""
echo "[5/5] 启动开发服务器..."
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "如果启动失败，请把下面的错误信息复制给我"
echo "═══════════════════════════════════════════════════════════"
echo ""

npx vite --port 5173 --host 0.0.0.0
