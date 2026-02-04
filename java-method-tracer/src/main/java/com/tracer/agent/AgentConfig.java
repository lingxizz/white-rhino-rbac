package com.tracer.agent;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Agent 配置
 */
public class AgentConfig {
    
    private String outputDir = "./trace-output";
    private Set<String> includePackages = new HashSet<>();
    private Set<String> excludePackages = new HashSet<>(Arrays.asList(
        "java.", "javax.", "sun.", "com.sun.", "jdk.",
        "org.objectweb.asm.", "com.tracer.agent."
    ));
    private int maxDepth = 50;
    private boolean saveSource = true;
    private boolean generatePlantUml = true;
    
    public static AgentConfig parse(String args) {
        AgentConfig config = new AgentConfig();
        if (args == null || args.isEmpty()) {
            return config;
        }
        
        String[] pairs = args.split(";");
        for (String pair : pairs) {
            String[] kv = pair.split("=");
            if (kv.length != 2) continue;
            
            String key = kv[0].trim();
            String value = kv[1].trim();
            
            switch (key) {
                case "outputDir":
                    config.outputDir = value;
                    break;
                case "includePackages":
                    config.includePackages.addAll(Arrays.asList(value.split(",")));
                    break;
                case "excludePackages":
                    config.excludePackages.addAll(Arrays.asList(value.split(",")));
                    break;
                case "maxDepth":
                    config.maxDepth = Integer.parseInt(value);
                    break;
                case "saveSource":
                    config.saveSource = Boolean.parseBoolean(value);
                    break;
                case "generatePlantUml":
                    config.generatePlantUml = Boolean.parseBoolean(value);
                    break;
            }
        }
        return config;
    }
    
    /**
     * 判断是否应该追踪这个类
     */
    public boolean shouldTrace(String className) {
        // 排除优先
        for (String exclude : excludePackages) {
            if (className.startsWith(exclude)) {
                return false;
            }
        }
        
        // 如果没有指定包含包，追踪所有非排除的
        if (includePackages.isEmpty()) {
            return true;
        }
        
        // 检查是否在包含列表中
        for (String include : includePackages) {
            if (className.startsWith(include)) {
                return true;
            }
        }
        return false;
    }
    
    // Getters
    public String getOutputDir() { return outputDir; }
    public Set<String> getIncludePackages() { return includePackages; }
    public int getMaxDepth() { return maxDepth; }
    public boolean isSaveSource() { return saveSource; }
    public boolean isGeneratePlantUml() { return generatePlantUml; }
    
    @Override
    public String toString() {
        return "AgentConfig{" +
            "outputDir='" + outputDir + '\'' +
            ", includePackages=" + includePackages +
            ", maxDepth=" + maxDepth +
            ", saveSource=" + saveSource +
            ", generatePlantUml=" + generatePlantUml +
            '}';
    }
}
