#!/bin/bash

# compile.sh - 纯 JDK 编译脚本（不需要 Maven）

set -e

echo "=========================================="
echo "Java Method Tracer Agent - 纯 JDK 编译"
echo "=========================================="

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查 Java
if ! command -v javac &> /dev/null; then
    echo "错误: 未找到 javac，请先安装 JDK"
    exit 1
fi

echo ""
echo "[1/4] 下载 ASM 依赖..."
mkdir -p lib

# 下载 ASM
ASM_VERSION="9.6"
ASM_URL="https://repo1.maven.org/maven2/org/ow2/asm"

download_jar() {
    local group=$1
    local artifact=$2
    local version=$3
    local url="${ASM_URL}/${artifact}/${version}/${artifact}-${version}.jar"
    local target="lib/${artifact}-${version}.jar"
    
    if [ ! -f "$target" ]; then
        echo "  下载 ${artifact}-${version}.jar..."
        curl -sL "$url" -o "$target" || wget -q "$url" -O "$target"
    else
        echo "  已存在: ${artifact}-${version}.jar"
    fi
}

download_jar "org.ow2.asm" "asm" "$ASM_VERSION"
download_jar "org.ow2.asm" "asm-commons" "$ASM_VERSION"
download_jar "org.ow2.asm" "asm-tree" "$ASM_VERSION"
download_jar "org.ow2.asm" "asm-analysis" "$ASM_VERSION"

echo ""
echo "[2/4] 编译 Agent 源码..."

# 创建输出目录
rm -rf build
mkdir -p build/classes

# 编译所有 .java 文件
find src/main/java -name "*.java" -exec javac -d build/classes -cp "lib/*" {} +

echo ""
echo "[3/4] 打包 Agent JAR..."

# 创建临时目录合并 ASM 和编译后的类
mkdir -p build/agent

# 解压 ASM jar 包
cd build/agent
for jar in ../../lib/*.jar; do
    jar xf "$jar"
done

# 复制编译后的类
cp -r ../classes/* .

# 创建 Manifest
cat > MANIFEST.MF << 'EOF'
Manifest-Version: 1.0
Premain-Class: com.tracer.agent.TraceAgent
Agent-Class: com.tracer.agent.TraceAgent
Can-Redefine-Classes: true
Can-Retransform-Classes: true
Can-Set-Native-Method-Prefix: true
EOF

# 打包
cd ..
jar cfm method-tracer-agent.jar agent/MANIFEST.MF -C agent .

cd ..

# 复制最终 jar 到根目录
cp build/method-tracer-agent.jar .

echo ""
echo "[4/4] 编译示例程序..."
mkdir -p example/build
find example/src/main/java -name "*.java" -exec javac -d example/build -cp "method-tracer-agent.jar" {} +

echo ""
echo "=========================================="
echo "编译完成!"
echo "=========================================="
echo ""
echo "Agent JAR: $(pwd)/method-tracer-agent.jar"
echo ""
echo "使用方式:"
echo "  java -javaagent:method-tracer-agent.jar=outputDir=./trace;includePackages=com.yourcompany \\"
echo "       -cp your-app.jar com.yourcompany.Main"
echo ""
echo "运行示例:"
echo "  java -javaagent:method-tracer-agent.jar=outputDir=./trace-output;includePackages=com.example \\"
echo "       -cp 'example/build:build/method-tracer-agent.jar' com.example.Main"
