package com.tracer.agent;

/**
 * TraceContext - 上下文管理
 */
public class TraceContext {
    
    /**
     * 刷新所有未完成的追踪
     */
    public static void flushAll() {
        TraceRecorder.flushAll();
    }
}
