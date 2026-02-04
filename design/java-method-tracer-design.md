# Java 方法调用追踪工具设计方案

## 需求拆解
1. **方法拦截** - 在目标方法执行时自动触发
2. **调用链路追踪** - 记录整个调用栈中的所有方法
3. **源码归档** - 收集调用链涉及的所有 Java 文件
4. **时序图生成** - 输出标准时序图 JSON 数据

## 技术方案选型

### 方案一：Java Agent + ASM（推荐）
- **优点**: 无侵入、性能高、可追踪 JDK 内部调用
- **缺点**: 实现复杂，需要处理字节码

### 方案二：AspectJ AOP
- **优点**: 简单易用，注解驱动
- **缺点**: 需要编译期或加载期织入

### 方案三：动态代理 (JDK/CGLIB)
- **优点**: 纯 Java，易理解
- **缺点**: 只能拦截 Spring Bean 或接口方法

---

## 推荐实现：Java Agent + 栈追踪

```java
/**
 * 方法调用追踪器
 * 通过 Java Agent 在 JVM 加载类时插入追踪代码
 */
@Component
@Slf4j
public class MethodCallTracer {
    
    private static final ThreadLocal<CallContext> CONTEXT = new ThreadLocal<>();
    
    /**
     * 入口方法 - 在目标方法上添加此注解
     */
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface TraceFlow {
        String value() default "";  // 流程名称
        boolean saveSource() default true;  // 是否保存源码
        boolean generateSequence() default true;  // 是否生成时序图
    }
    
    /**
     * 调用上下文
     */
    @Data
    public static class CallContext {
        private String traceId;
        private String flowName;
        private long startTime;
        private List<MethodCall> callStack = new ArrayList<>();
        private Set<String> involvedClasses = new HashSet<>();
        
        public void addCall(MethodCall call) {
            callStack.add(call);
            involvedClasses.add(call.getClassName());
        }
    }
    
    /**
     * 单次方法调用记录
     */
    @Data
    @AllArgsConstructor
    public static class MethodCall {
        private int depth;              // 调用深度
        private String className;       // 类名
        private String methodName;      // 方法名
        private String signature;       // 方法签名
        private long enterTime;         // 进入时间
        private long exitTime;          // 退出时间
        private Object returnValue;     // 返回值
        private Throwable exception;    // 异常
        private String sourcePath;      // 源码路径
        private int lineNumber;         // 行号
    }
}
```

---

## 核心实现代码

### 1. Java Agent 入口

```java
public class TraceAgent {
    
    public static void premain(String args, Instrumentation inst) {
        log.info("[TraceAgent] 开始加载方法追踪 Agent...");
        inst.addTransformer(new MethodTraceTransformer());
    }
    
    /**
     * 类文件转换器 - 在类加载时修改字节码
     */
    public static class MethodTraceTransformer implements ClassFileTransformer {
        
        @Override
        public byte[] transform(ClassLoader loader, String className, 
                               Class<?> classBeingRedefined,
                               ProtectionDomain protectionDomain, 
                               byte[] classfileBuffer) {
            
            // 跳过 JDK 类、第三方库
            if (shouldSkip(className)) {
                return classfileBuffer;
            }
            
            try {
                ClassReader reader = new ClassReader(classfileBuffer);
                ClassWriter writer = new ClassWriter(ClassWriter.COMPUTE_FRAMES);
                TraceClassVisitor visitor = new TraceClassVisitor(writer, className);
                reader.accept(visitor, ClassReader.EXPAND_FRAMES);
                return writer.toByteArray();
            } catch (Exception e) {
                log.warn("转换类失败: {}", className, e);
                return classfileBuffer;
            }
        }
        
        private boolean shouldSkip(String className) {
            return className.startsWith("java/") 
                || className.startsWith("javax/")
                || className.startsWith("sun/")
                || className.startsWith("org/springframework")
                || className.startsWith("org/apache");
        }
    }
}
```

### 2. 方法进入/退出拦截

```java
public class TraceMethodAdvice {
    
    private static final Logger traceLog = LoggerFactory.getLogger("TRACE_LOG");
    
    /**
     * 方法进入时调用
     */
    public static void onMethodEnter(String className, String methodName, 
                                     String signature, int lineNumber) {
        CallContext ctx = MethodCallTracer.CONTEXT.get();
        if (ctx == null) {
            return; // 不是追踪入口，忽略
        }
        
        MethodCall call = new MethodCall(
            ctx.getCallStack().size(),
            className,
            methodName,
            signature,
            System.currentTimeMillis(),
            0, null, null,
            getSourcePath(className),
            lineNumber
        );
        ctx.addCall(call);
    }
    
    /**
     * 方法退出时调用
     */
    public static void onMethodExit(Object returnValue, Throwable exception) {
        CallContext ctx = MethodCallTracer.CONTEXT.get();
        if (ctx == null || ctx.getCallStack().isEmpty()) {
            return;
        }
        
        // 找到当前深度的最后一个调用
        int currentDepth = ctx.getCallStack().size() - 1;
        for (int i = ctx.getCallStack().size() - 1; i >= 0; i--) {
            MethodCall call = ctx.getCallStack().get(i);
            if (call.getExitTime() == 0) {
                call.setExitTime(System.currentTimeMillis());
                call.setReturnValue(returnValue);
                call.setException(exception);
                break;
            }
        }
    }
}
```

### 3. AOP 切面（Spring 项目简化版）

```java
@Aspect
@Component
@Slf4j
public class MethodTraceAspect {
    
    @Autowired
    private TraceConfig traceConfig;
    
    @Around("@annotation(traceFlow)")
    public Object traceMethod(ProceedingJoinPoint pjp, TraceFlow traceFlow) throws Throwable {
        
        // 初始化调用上下文
        CallContext ctx = new CallContext();
        ctx.setTraceId(UUID.randomUUID().toString());
        ctx.setFlowName(traceFlow.value().isEmpty() ? pjp.getSignature().getName() : traceFlow.value());
        ctx.setStartTime(System.currentTimeMillis());
        MethodCallTracer.CONTEXT.set(ctx);
        
        try {
            // 记录入口
            recordMethodEnter(pjp, 0);
            
            // 执行目标方法
            Object result = pjp.proceed();
            
            // 记录出口
            recordMethodExit(result, null);
            
            return result;
            
        } catch (Throwable t) {
            recordMethodExit(null, t);
            throw t;
            
        } finally {
            // 流程结束，保存结果
            onFlowComplete(ctx, traceFlow);
            MethodCallTracer.CONTEXT.remove();
        }
    }
    
    private void onFlowComplete(CallContext ctx, TraceFlow config) {
        String outputDir = traceConfig.getOutputDir() + "/" + ctx.getTraceId();
        
        try {
            // 1. 保存源码文件
            if (config.saveSource()) {
                saveSourceFiles(ctx.getInvolvedClasses(), outputDir + "/sources");
            }
            
            // 2. 生成时序图 JSON
            if (config.generateSequence()) {
                SequenceDiagramData seqData = buildSequenceData(ctx);
                saveSequenceJson(seqData, outputDir + "/sequence.json");
            }
            
            // 3. 保存调用链日志
            saveCallStack(ctx, outputDir + "/trace.log");
            
        } catch (IOException e) {
            log.error("保存追踪结果失败", e);
        }
    }
    
    /**
     * 构建时序图数据
     */
    private SequenceDiagramData buildSequenceData(CallContext ctx) {
        List<SequenceParticipant> participants = new ArrayList<>();
        List<SequenceMessage> messages = new ArrayList<>();
        
        // 收集参与者（去重）
        Set<String> classNames = ctx.getCallStack().stream()
            .map(MethodCall::getClassName)
            .collect(Collectors.toSet());
        
        int idx = 0;
        Map<String, String> classToAlias = new HashMap<>();
        for (String className : classNames) {
            String alias = "P" + idx++;
            classToAlias.put(className, alias);
            participants.add(new SequenceParticipant(alias, getSimpleName(className)));
        }
        
        // 构建消息序列
        Deque<String> callStack = new ArrayDeque<>();
        for (MethodCall call : ctx.getCallStack()) {
            String from = callStack.isEmpty() ? "Actor" : callStack.peek();
            String to = classToAlias.get(call.getClassName());
            
            messages.add(new SequenceMessage(
                from,
                to,
                call.getMethodName() + "()",
                call.getExitTime() - call.getEnterTime()
            ));
            
            callStack.push(to);
        }
        
        return new SequenceDiagramData(ctx.getFlowName(), participants, messages);
    }
}
```

### 4. 时序图 JSON 数据结构

```java
/**
 * 时序图完整数据结构
 */
@Data
public class SequenceDiagramData {
    private String title;
    private String description;
    private List<SequenceParticipant> participants;
    private List<SequenceMessage> messages;
    private Map<String, Object> metadata;
    
    public SequenceDiagramData(String title, 
                               List<SequenceParticipant> participants,
                               List<SequenceMessage> messages) {
        this.title = title;
        this.participants = participants;
        this.messages = messages;
        this.metadata = new HashMap<>();
        this.metadata.put("generatedAt", new Date().toString());
    }
}

/**
 * 参与者
 */
@Data
@AllArgsConstructor
public class SequenceParticipant {
    private String id;      // 唯一标识
    private String name;    // 显示名称
    private String type = "class";  // class/service/actor
}

/**
 * 消息/调用
 */
@Data
@AllArgsConstructor
public class SequenceMessage {
    private String from;        // 发起方 ID
    private String to;          // 接收方 ID
    private String label;       // 消息标签（方法名）
    private long durationMs;    // 执行耗时
    private String type = "sync";  // sync/async/return
}
```

---

## 生成的 JSON 示例

```json
{
  "title": "订单创建流程",
  "description": "TraceID: 550e8400-e29b-41d4-a716-446655440000",
  "participants": [
    {"id": "Actor", "name": "调用方", "type": "actor"},
    {"id": "P0", "name": "OrderService", "type": "class"},
    {"id": "P1", "name": "UserService", "type": "class"},
    {"id": "P2", "name": "InventoryService", "type": "class"},
    {"id": "P3", "name": "OrderRepository", "type": "class"}
  ],
  "messages": [
    {"from": "Actor", "to": "P0", "label": "createOrder()", "durationMs": 245, "type": "sync"},
    {"from": "P0", "to": "P1", "label": "validateUser()", "durationMs": 32, "type": "sync"},
    {"from": "P0", "to": "P2", "label": "checkStock()", "durationMs": 56, "type": "sync"},
    {"from": "P0", "to": "P3", "label": "save()", "durationMs": 120, "type": "sync"}
  ],
  "metadata": {
    "generatedAt": "Wed Feb 04 16:51:09 CST 2026",
    "totalCalls": 4,
    "totalDurationMs": 245
  }
}
```

---

## 使用方式

### 1. 标记入口方法

```java
@Service
public class OrderService {
    
    @TraceFlow(value = "订单创建流程", saveSource = true, generateSequence = true)
    public Order createOrder(CreateOrderRequest request) {
        // 业务逻辑...
        userService.validateUser(request.getUserId());
        inventoryService.checkStock(request.getItems());
        return orderRepository.save(order);
    }
}
```

### 2. 输出目录结构

```
trace-output/
└── 550e8400-e29b-41d4-a716-446655440000/
    ├── sequence.json          # 时序图数据
    ├── trace.log              # 调用链日志
    └── sources/               # 涉及的源码
        ├── com/example/OrderService.java
        ├── com/example/UserService.java
        ├── com/example/InventoryService.java
        └── com/example/OrderRepository.java
```

---

## 进阶功能

### 1. 可视化时序图（使用 PlantUML/ Mermaid）

```java
public class SequenceDiagramRenderer {
    
    /**
     * 生成 PlantUML 格式
     */
    public String toPlantUml(SequenceDiagramData data) {
        StringBuilder sb = new StringBuilder();
        sb.append("@startuml\n");
        sb.append("title ").append(data.getTitle()).append("\n");
        
        // 参与者声明
        for (SequenceParticipant p : data.getParticipants()) {
            if ("actor".equals(p.getType())) {
                sb.append("actor ").append(p.getName()).append("\n");
            } else {
                sb.append("participant ").append(p.getName()).append("\n");
            }
        }
        
        // 消息
        for (SequenceMessage m : data.getMessages()) {
            String from = findParticipantName(data, m.getFrom());
            String to = findParticipantName(data, m.getTo());
            sb.append(from).append(" -> ").append(to)
              .append(": ").append(m.getLabel())
              .append(" (").append(m.getDurationMs()).append("ms)\n");
        }
        
        sb.append("@enduml");
        return sb.toString();
    }
}
```

### 2. 条件过滤（只追踪指定包）

```yaml
trace:
  enabled: true
  output-dir: ./trace-output
  include-packages:
    - com.example.service
    - com.example.controller
  exclude-classes:
    - com.example.util.LoggerUtil
  max-depth: 10  # 最大调用深度
```

### 3. 异步调用追踪

```java
public class AsyncTraceWrapper {
    
    public static <T> CompletableFuture<T> traceAsync(Supplier<T> supplier) {
        CallContext parentContext = MethodCallTracer.CONTEXT.get();
        
        return CompletableFuture.supplyAsync(() -> {
            // 传递上下文到异步线程
            MethodCallTracer.CONTEXT.set(parentContext);
            try {
                return supplier.get();
            } finally {
                MethodCallTracer.CONTEXT.remove();
            }
        });
    }
}
```

---

## 注意事项

1. **性能影响**: 生产环境建议采样率控制（如只追踪 1% 请求）
2. **敏感信息**: 自动脱敏返回值中的密码、Token 等
3. **循环调用**: 设置最大深度防止栈溢出
4. **源码定位**: 需要编译时保留行号信息 (`-g` 参数)

---

需要我把完整代码实现成一个可用的 Maven 项目吗？还是你更想用现成的开源方案（如 Arthas、SkyWalking）改改？ 🦀
