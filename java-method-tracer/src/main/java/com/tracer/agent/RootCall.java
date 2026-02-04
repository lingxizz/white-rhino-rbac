package com.tracer.agent;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.logging.Logger;

/**
 * 根调用 - 表示一个完整的调用链
 */
class RootCall {
    
    private static final Logger LOG = Logger.getLogger(RootCall.class.getName());
    
    private final String traceId;
    private final String rootClassName;
    private final String rootMethodName;
    private long startTime;
    private long endTime;
    
    // 所有调用关系
    private final List<TraceRecorder.CallFrame> allCalls = new ArrayList<>();
    
    // 涉及的类名（用于提取源码）
    private final Set<String> involvedClasses = new LinkedHashSet<>();
    
    public RootCall(String traceId, String rootClassName, String rootMethodName) {
        this.traceId = traceId;
        this.rootClassName = rootClassName;
        this.rootMethodName = rootMethodName;
    }
    
    public void addCallRelation(TraceRecorder.CallFrame frame) {
        allCalls.add(frame);
        involvedClasses.add(frame.getClassName());
    }
    
    public void setStartTime(long startTime) {
        this.startTime = startTime;
    }
    
    public void setEndTime(long endTime) {
        this.endTime = endTime;
    }
    
    /**
     * 调用链完成 - 生成所有输出
     */
    public void complete(TraceRecorder.CallFrame rootFrame) {
        AgentConfig config = TraceRecorder.getConfig();
        if (config == null) {
            return;
        }
        
        try {
            // 添加根调用
            allCalls.add(0, rootFrame);
            involvedClasses.add(rootClassName);
            
            // 创建输出目录
            Path outputDir = Paths.get(config.getOutputDir(), traceId);
            Files.createDirectories(outputDir);
            
            LOG.info("[TraceAgent] 调用链完成: " + rootClassName + "." + rootMethodName + 
                     " TraceId: " + traceId);
            
            // 保存源码
            if (config.isSaveSource()) {
                saveSourceFiles(outputDir.resolve("sources"));
            }
            
            // 生成 PlantUML
            if (config.isGeneratePlantUml()) {
                generatePlantUml(outputDir.resolve("sequence.puml"));
            }
            
            // 保存原始调用数据（JSON 格式）
            saveCallData(outputDir.resolve("calls.json"));
            
        } catch (Exception e) {
            LOG.warning("[TraceAgent] 生成输出失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 强制完成（JVM 关闭时）
     */
    public void forceComplete() {
        if (endTime == 0) {
            endTime = System.currentTimeMillis();
        }
        // 尝试生成输出，但可能没有完整的调用帧
    }
    
    /**
     * 保存涉及的源码文件
     */
    private void saveSourceFiles(Path sourceDir) throws IOException {
        Files.createDirectories(sourceDir);
        
        for (String className : involvedClasses) {
            try {
                String sourcePath = className.replace('.', '/') + ".java";
                
                // 尝试从多个来源查找源码
                Path sourceFile = findSourceFile(sourcePath);
                
                if (sourceFile != null && Files.exists(sourceFile)) {
                    Path targetFile = sourceDir.resolve(sourcePath);
                    Files.createDirectories(targetFile.getParent());
                    Files.copy(sourceFile, targetFile, StandardCopyOption.REPLACE_EXISTING);
                    LOG.fine("[TraceAgent] 已复制源码: " + sourcePath);
                } else {
                    // 如果找不到文件，尝试生成一个占位符
                    createSourcePlaceholder(sourceDir.resolve(sourcePath), className);
                }
            } catch (Exception e) {
                LOG.finest("[TraceAgent] 复制源码失败: " + className + " - " + e.getMessage());
            }
        }
    }
    
    /**
     * 查找源码文件
     */
    private Path findSourceFile(String sourcePath) {
        // 尝试从 classpath 推断
        String[] possiblePaths = {
            "./src/main/java/" + sourcePath,
            "./src/java/" + sourcePath,
            "./java/" + sourcePath,
            "./src/" + sourcePath,
            "../src/main/java/" + sourcePath,
            System.getProperty("user.dir") + "/src/main/java/" + sourcePath,
            System.getProperty("user.dir") + "/src/" + sourcePath,
        };
        
        for (String path : possiblePaths) {
            Path p = Paths.get(path);
            if (Files.exists(p)) {
                return p;
            }
        }
        
        // 尝试从系统属性获取源码路径
        String sourceRoot = System.getProperty("tracer.source.root");
        if (sourceRoot != null) {
            Path p = Paths.get(sourceRoot, sourcePath);
            if (Files.exists(p)) {
                return p;
            }
        }
        
        return null;
    }
    
    /**
     * 创建源码占位符（当找不到实际源码时）
     */
    private void createSourcePlaceholder(Path targetFile, String className) throws IOException {
        Files.createDirectories(targetFile.getParent());
        String content = "// Source not found for: " + className + "\n" +
                        "// This is a placeholder.\n" +
                        "// To include actual source, set -Dtracer.source.root=/path/to/src\n";
        Files.write(targetFile, content.getBytes());
    }
    
    /**
     * 生成 PlantUML 时序图
     */
    private void generatePlantUml(Path outputFile) throws IOException {
        StringBuilder puml = new StringBuilder();
        
        puml.append("@startuml\n");
        puml.append("title ").append(rootClassName.substring(rootClassName.lastIndexOf('.') + 1))
            .append(".").append(rootMethodName).append("()\n");
        puml.append("skinparam sequenceMessageAlign center\n");
        puml.append("skinparam responseMessageBelowArrow true\n\n");
        
        // 收集所有参与者
        Map<String, String> classToAlias = new LinkedHashMap<>();
        int idx = 0;
        
        // 添加 Actor 作为调用发起者
        puml.append("actor Actor\n");
        
        // 添加所有类作为参与者
        for (String className : involvedClasses) {
            String alias = "C" + (idx++);
            classToAlias.put(className, alias);
            String simpleName = className.substring(className.lastIndexOf('.') + 1);
            puml.append("participant \"").append(simpleName).append("\" as ")
                .append(alias).append("\n");
        }
        
        puml.append("\n");
        
        // 构建调用关系
        Map<String, TraceRecorder.CallFrame> callMap = new HashMap<>();
        for (TraceRecorder.CallFrame call : allCalls) {
            callMap.put(call.getCallId(), call);
        }
        
        // 生成消息
        Deque<String> stack = new ArrayDeque<>();
        stack.push("Actor");
        
        for (TraceRecorder.CallFrame call : allCalls) {
            String from = stack.peek();
            String to = classToAlias.get(call.getClassName());
            
            if (to == null) continue;
            
            // 同步调用
            puml.append(from).append(" -> ").append(to)
                .append(": ").append(call.getMethodName()).append("()");
            
            if (call.getDuration() > 0) {
                puml.append(" (").append(call.getDuration()).append("ms)");
            }
            puml.append("\n");
            
            // 激活
            puml.append("activate ").append(to).append("\n");
            
            // 返回（如果不是叶子节点，会在后续调用后返回）
            if (call.getException() != null) {
                puml.append(to).append(" --x ").append(from)
                    .append(": <font color=red>").append(call.getException().getClass().getSimpleName())
                    .append("</font>\n");
                puml.append("deactivate ").append(to).append("\n");
            } else if (isLeafNode(call, callMap)) {
                puml.append(to).append(" --> ").append(from)
                    .append(": return\n");
                puml.append("deactivate ").append(to).append("\n");
            }
            
            stack.push(to);
        }
        
        // 结束未闭合的调用
        while (stack.size() > 1) {
            String from = stack.pop();
            String to = stack.peek();
            if (!from.equals("Actor")) {
                puml.append(from).append(" --> ").append(to).append(": return\n");
                puml.append("deactivate ").append(from).append("\n");
            }
        }
        
        puml.append("\n");
        puml.append("note right\n");
        puml.append("  TraceId: ").append(traceId).append("\n");
        puml.append("  Total: ").append(endTime - startTime).append("ms\n");
        puml.append("  Calls: ").append(allCalls.size()).append("\n");
        puml.append("end note\n");
        
        puml.append("@enduml");
        
        Files.write(outputFile, puml.toString().getBytes());
        LOG.info("[TraceAgent] PlantUML 已生成: " + outputFile);
    }
    
    /**
     * 判断是否为叶子节点（没有子调用）
     */
    private boolean isLeafNode(TraceRecorder.CallFrame call, Map<String, TraceRecorder.CallFrame> callMap) {
        for (TraceRecorder.CallFrame c : callMap.values()) {
            if (call.getCallId().equals(c.getParentId())) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * 保存调用数据（JSON 格式）
     */
    private void saveCallData(Path outputFile) throws IOException {
        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("  \"traceId\": \"").append(traceId).append("\",\n");
        json.append("  \"rootClass\": \"").append(rootClassName).append("\",\n");
        json.append("  \"rootMethod\": \"").append(rootMethodName).append("\",\n");
        json.append("  \"startTime\": ").append(startTime).append(",\n");
        json.append("  \"endTime\": ").append(endTime).append(",\n");
        json.append("  \"totalDurationMs\": ").append(endTime - startTime).append(",\n");
        json.append("  \"callCount\": ").append(allCalls.size()).append(",\n");
        json.append("  \"calls\": [\n");
        
        for (int i = 0; i < allCalls.size(); i++) {
            TraceRecorder.CallFrame call = allCalls.get(i);
            json.append("    {\n");
            json.append("      \"callId\": \"").append(call.getCallId()).append("\",\n");
            json.append("      \"parentId\": \"").append(call.getParentId()).append("\",\n");
            json.append("      \"className\": \"").append(call.getClassName()).append("\",\n");
            json.append("      \"methodName\": \"").append(call.getMethodName()).append("\",\n");
            json.append("      \"depth\": ").append(call.getDepth()).append(",\n");
            json.append("      \"lineNumber\": ").append(call.getLineNumber()).append(",\n");
            json.append("      \"durationMs\": ").append(call.getDuration()).append(",\n");
            json.append("      \"hasException\": ").append(call.getException() != null);
            json.append("\n    }");
            if (i < allCalls.size() - 1) {
                json.append(",");
            }
            json.append("\n");
        }
        
        json.append("  ],\n");
        json.append("  \"involvedClasses\": [\n");
        
        List<String> classes = new ArrayList<>(involvedClasses);
        for (int i = 0; i < classes.size(); i++) {
            json.append("    \"").append(classes.get(i)).append("\"");
            if (i < classes.size() - 1) {
                json.append(",");
            }
            json.append("\n");
        }
        
        json.append("  ]\n");
        json.append("}\n");
        
        Files.write(outputFile, json.toString().getBytes());
        LOG.info("[TraceAgent] 调用数据已保存: " + outputFile);
    }
}
