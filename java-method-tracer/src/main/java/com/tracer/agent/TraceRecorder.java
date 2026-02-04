package com.tracer.agent;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.logging.Logger;

/**
 * 调用记录器
 * 在运行时记录所有方法调用信息
 * 这是被注入到业务代码中的类，必须是 public 且方法签名固定
 */
public class TraceRecorder {
    
    private static final Logger LOG = Logger.getLogger(TraceRecorder.class.getName());
    
    // 调用 ID 生成器
    private static final AtomicLong callIdGenerator = new AtomicLong(0);
    
    // 每个线程的调用栈
    private static final ThreadLocal<Deque<CallFrame>> callStack = ThreadLocal.withInitial(ArrayDeque::new);
    
    // 根调用映射：traceId -> 根调用
    private static final Map<String, RootCall> rootCalls = new ConcurrentHashMap<>();
    
    // 配置（由 Agent 初始化）
    private static volatile AgentConfig config;
    
    /**
     * 初始化配置
     */
    public static void initConfig(AgentConfig cfg) {
        config = cfg;
    }
    
    /**
     * 方法入口 - 被注入到每个方法开头
     */
    public static void enterMethod(String className, String methodName, 
                                    String descriptor, int lineNumber) {
        try {
            Deque<CallFrame> stack = callStack.get();
            
            // 检查深度限制
            if (config != null && stack.size() >= config.getMaxDepth()) {
                return;
            }
            
            String callId = String.valueOf(callIdGenerator.incrementAndGet());
            long timestamp = System.currentTimeMillis();
            
            CallFrame frame = new CallFrame(callId, className, methodName, 
                                            descriptor, lineNumber, timestamp);
            
            if (stack.isEmpty()) {
                // 这是一个新的根调用
                frame.setTraceId(UUID.randomUUID().toString());
                RootCall rootCall = new RootCall(frame.getTraceId(), className, methodName);
                rootCall.setStartTime(timestamp);
                rootCalls.put(frame.getTraceId(), rootCall);
            } else {
                // 设置父调用关系
                CallFrame parent = stack.peek();
                frame.setTraceId(parent.getTraceId());
                frame.setParentId(parent.getCallId());
                frame.setDepth(parent.getDepth() + 1);
                
                // 添加到父调用的子调用列表
                RootCall rootCall = rootCalls.get(frame.getTraceId());
                if (rootCall != null) {
                    rootCall.addCallRelation(frame);
                }
            }
            
            stack.push(frame);
            
        } catch (Exception e) {
            // 追踪代码不应该影响业务逻辑
            LOG.finest("[TraceRecorder] enterMethod 出错: " + e.getMessage());
        }
    }
    
    /**
     * 方法出口 - 被注入到每个方法 return 前
     */
    public static void exitMethod(Throwable exception) {
        try {
            Deque<CallFrame> stack = callStack.get();
            if (stack.isEmpty()) {
                return;
            }
            
            CallFrame frame = stack.pop();
            frame.setEndTime(System.currentTimeMillis());
            frame.setException(exception);
            
            // 如果是根调用结束，生成输出
            if (stack.isEmpty()) {
                RootCall rootCall = rootCalls.remove(frame.getTraceId());
                if (rootCall != null) {
                    rootCall.setEndTime(frame.getEndTime());
                    rootCall.complete(frame);
                }
            }
            
        } catch (Exception e) {
            LOG.finest("[TraceRecorder] exitMethod 出错: " + e.getMessage());
        }
    }
    
    /**
     * 获取当前配置
     */
    public static AgentConfig getConfig() {
        return config;
    }
    
    /**
     * 强制刷新所有未完成的追踪
     */
    public static void flushAll() {
        for (RootCall rootCall : rootCalls.values()) {
            try {
                rootCall.forceComplete();
            } catch (Exception e) {
                LOG.warning("[TraceRecorder] 强制完成追踪失败: " + e.getMessage());
            }
        }
        rootCalls.clear();
    }
    
    /**
     * 单次调用帧
     */
    static class CallFrame {
        private final String callId;
        private String traceId;
        private String parentId;
        private final String className;
        private final String methodName;
        private final String descriptor;
        private final int lineNumber;
        private final long startTime;
        private long endTime;
        private int depth = 0;
        private Throwable exception;
        
        public CallFrame(String callId, String className, String methodName, 
                         String descriptor, int lineNumber, long startTime) {
            this.callId = callId;
            this.className = className;
            this.methodName = methodName;
            this.descriptor = descriptor;
            this.lineNumber = lineNumber;
            this.startTime = startTime;
        }
        
        // Getters
        public String getCallId() { return callId; }
        public String getTraceId() { return traceId; }
        public void setTraceId(String traceId) { this.traceId = traceId; }
        public String getParentId() { return parentId; }
        public void setParentId(String parentId) { this.parentId = parentId; }
        public String getClassName() { return className; }
        public String getMethodName() { return methodName; }
        public String getDescriptor() { return descriptor; }
        public int getLineNumber() { return lineNumber; }
        public long getStartTime() { return startTime; }
        public long getEndTime() { return endTime; }
        public void setEndTime(long endTime) { this.endTime = endTime; }
        public int getDepth() { return depth; }
        public void setDepth(int depth) { this.depth = depth; }
        public Throwable getException() { return exception; }
        public void setException(Throwable exception) { this.exception = exception; }
        
        public long getDuration() {
            return endTime > startTime ? endTime - startTime : 0;
        }
        
        public String getSimpleSignature() {
            return className.substring(className.lastIndexOf('.') + 1) + "." + methodName + "()";
        }
    }
}
