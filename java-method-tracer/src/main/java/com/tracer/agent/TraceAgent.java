package com.tracer.agent;

import java.lang.instrument.Instrumentation;
import java.util.logging.Logger;

/**
 * Java Agent 入口
 * JVM 启动时通过 -javaagent:tracer-agent.jar 加载
 */
public class TraceAgent {
    
    private static final Logger LOG = Logger.getLogger(TraceAgent.class.getName());
    
    /**
     * JVM 启动时入口
     * @param args 格式: outputDir=/tmp/trace;includePackages=com.example,com.demo
     * @param inst Instrumentation 实例
     */
    public static void premain(String args, Instrumentation inst) {
        LOG.info("[TraceAgent] ==========================================");
        LOG.info("[TraceAgent] 方法调用追踪 Agent 启动中...");
        LOG.info("[TraceAgent] ==========================================");
        
        // 解析参数
        AgentConfig config = AgentConfig.parse(args);
        LOG.info("[TraceAgent] 配置: " + config);
        
        // 添加类转换器
        inst.addTransformer(new TraceClassTransformer(config));
        
        // 添加关闭钩子，确保最后刷新输出
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            LOG.info("[TraceAgent] JVM 关闭，刷新追踪数据...");
            TraceContext.flushAll();
        }));
        
        LOG.info("[TraceAgent] Agent 加载完成，开始追踪...");
    }
}
