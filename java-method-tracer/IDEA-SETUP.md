# IDEA 中使用 Java Agent 跑测试

## 方案一：Run Configuration 配置（推荐）

### 步骤

1. **先编译好 Agent**
```bash
cd java-method-tracer
mvn clean package
# 得到 target/method-tracer-agent-1.0.0.jar
```

2. **IDEA 中配置 VM Options**

   - 打开 `Run` → `Edit Configurations...`
   - 选择你的测试类（或 JUnit 模板）
   - 在 **VM options** 输入框添加：

```bash
-javaagent:$PROJECT_DIR$/java-method-tracer/target/method-tracer-agent-1.0.0.jar=outputDir=./trace-output;includePackages=com.yourcompany
```

   > 注意替换 `com.yourcompany` 为你实际的包名

3. **运行测试**，查看 `trace-output/` 目录

---

## 方案二：IDEA 模板配置（一劳永逸）

如果你想让所有测试都自动带上 Agent：

1. `Run` → `Edit Configurations...`
2. 点击左侧 `Edit configuration templates...`
3. 找到 `JUnit`（或 `TestNG`）
4. 在 **VM options** 添加上面那行参数
5. 以后所有新创建的测试配置都会自动带上

---

## 方案三：Maven 插件配置（纯自动化）

在 `pom.xml` 中配置 maven-surefire-plugin：

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.1.2</version>
            <configuration>
                <argLine>
                    -javaagent:${project.basedir}/../java-method-tracer/target/method-tracer-agent-1.0.0.jar=outputDir=./trace-output;includePackages=com.yourcompany
                </argLine>
            </configuration>
        </plugin>
    </plugins>
</build>
```

然后直接在 IDEA 里右键 `pom.xml` → `Maven` → `test`

---

## 方案四：Gradle 配置（如果你用 Gradle）

```groovy
test {
    jvmArgs "-javaagent:${rootDir}/java-method-tracer/target/method-tracer-agent-1.0.0.jar=outputDir=./trace-output;includePackages=com.yourcompany"
}
```

---

## 快速验证

运行任意测试后，检查是否生成输出：

```bash
ls -la trace-output/
# 应该看到类似 xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxx 的目录
```

---

## 常见问题

### Q: 提示 "Agent JAR not found"
确保路径是绝对路径或相对于工作目录的正确路径。在 IDEA 里可以用 `$PROJECT_DIR$` 变量。

### Q: 追踪没生效
检查 `includePackages` 参数是否正确匹配了你的包名。比如：
- 你的类在 `com.example.service` 包下
- 参数应该是 `includePackages=com.example`

### Q: 怎么只追踪某个特定测试方法？
目前 Agent 是类级别的，会追踪该测试方法里调用的所有业务代码。如果你想过滤，可以：
1. 在测试方法里加个标记（比如设置系统属性）
2. 修改 Agent 代码检查该标记再决定是否记录

### Q: 并行测试会不会错乱？
不会。Agent 用 `ThreadLocal` 隔离每个线程的调用栈，并行测试各自独立。

---

## 进阶：IDEA 快速切换 Agent

如果你经常要开关 Agent，可以在 IDEA 里创建两个 Configuration：

1. `MyTest` - 普通运行
2. `MyTest (With Tracer)` - 带 Agent 参数

这样需要追踪时选第二个，不需要时选第一个。
