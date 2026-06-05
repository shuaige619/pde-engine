#!/bin/bash
# 解决端口占用问题

echo "=== 检查端口占用 ==="
echo ""
echo "--- 6379 (Redis) ---"
lsof -i :6379 2>/dev/null || echo "无进程占用"

echo ""
echo "--- 5432 (PostgreSQL) ---"
lsof -i :5432 2>/dev/null || echo "无进程占用"

echo ""
echo "--- 3000 (Backend) ---"
lsof -i :3000 2>/dev/null || echo "无进程占用"

echo ""
echo "=== 是否要杀掉占用端口的进程？(y/n) ==="
read -r answer
if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    echo "正在关闭占用端口的进程..."
    lsof -ti :6379 | xargs kill -9 2>/dev/null || true
    lsof -ti :5432 | xargs kill -9 2>/dev/null || true
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    echo "✅ 端口已释放"
    echo ""
    echo "现在可以重新运行: ./start.sh"
else
    echo "跳过，使用方案2：修改端口..."
fi
