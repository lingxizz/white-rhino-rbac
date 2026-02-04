#!/bin/bash

# build.sh - 一键构建脚本

set -e

echo "=========================================="
echo "Java Method Tracer Agent - 构建脚本"
echo "=========================================="

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查 Maven
if ! command -v mvn &> /dev/null; then
    echo "错误: 未找到 Maven，请先安装 Maven"
    exit 1
fi

echo ""
echo "[1/3] 编译 Agent..."
mvn clean package -DskipTests

echo ""
echo "[2/3] 编译示例程序..."
cd example
mvn clean package -DskipTests
cd ..

echo ""
echo "[3/3] 运行示例..."
echo ""
echo "执行命令:"
echo "  java -javaagent:target/method-tracer-agent-1.0.0.jar=outputDir=./trace-output;includePackages=com.example \\"
echo "       -cp example/target/classes:example/target/tracer-example-1.0.0.jar com.example.Main"
echo ""

# 运行示例
java -javaagent:target/method-tracer-agent-1.0.0.jar=outputDir=./trace-output;includePackages=com.example \
     -cp "example/target/classes:example/target/tracer-example-1.0.0.jar" \
     com.example.Main

echo ""
echo "=========================================="
echo "构建和运行完成！"
echo "=========================================="
echo ""
echo "输出目录: ./trace-output/"
echo ""

# 列出生成的追踪目录
if [ -d "./trace-output" ]; then
    echo "生成的追踪数据:"
    ls -la ./trace-output/
    echo ""
    
    # 显示最新的时序图
    LATEST_PUML=$(find ./trace-output -name "sequence.puml" -type f 2>/dev/null | head -1)
    if [ -n "$LATEST_PUML" ]; then
        echo "最新时序图 ($LATEST_PUML):"
        echo "----------------------------------------"
        cat "$LATEST_PUML"
        echo "----------------------------------------"
    fi
fi
