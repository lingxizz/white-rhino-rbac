package com.tracer.agent;

import org.objectweb.asm.*;

import java.lang.instrument.ClassFileTransformer;
import java.lang.instrument.IllegalClassFormatException;
import java.security.ProtectionDomain;
import java.util.logging.Logger;

/**
 * 类文件转换器
 * 在类加载时修改字节码，插入追踪代码
 */
public class TraceClassTransformer implements ClassFileTransformer {
    
    private static final Logger LOG = Logger.getLogger(TraceClassTransformer.class.getName());
    private final AgentConfig config;
    
    public TraceClassTransformer(AgentConfig config) {
        this.config = config;
    }
    
    @Override
    public byte[] transform(ClassLoader loader, String className, 
                           Class<?> classBeingRedefined,
                           ProtectionDomain protectionDomain, 
                           byte[] classfileBuffer) throws IllegalClassFormatException {
        
        // 转换为标准类名格式
        String normalClassName = className.replace('/', '.');
        
        // 检查是否应该追踪
        if (!config.shouldTrace(normalClassName)) {
            return classfileBuffer;
        }
        
        try {
            LOG.fine("[TraceAgent] 转换类: " + normalClassName);
            
            ClassReader reader = new ClassReader(classfileBuffer);
            ClassWriter writer = new ClassWriter(ClassWriter.COMPUTE_FRAMES | ClassWriter.COMPUTE_MAXS);
            TraceClassVisitor visitor = new TraceClassVisitor(writer, normalClassName, config);
            reader.accept(visitor, ClassReader.EXPAND_FRAMES);
            
            return writer.toByteArray();
            
        } catch (Exception e) {
            LOG.warning("[TraceAgent] 转换类失败: " + normalClassName + ", 错误: " + e.getMessage());
            return classfileBuffer;
        }
    }
}

/**
 * 类访问器 - 处理类级别的转换
 */
class TraceClassVisitor extends ClassVisitor {
    
    private final String className;
    private final AgentConfig config;
    private String sourceFile;
    
    public TraceClassVisitor(ClassVisitor cv, String className, AgentConfig config) {
        super(Opcodes.ASM9, cv);
        this.className = className;
        this.config = config;
    }
    
    @Override
    public void visitSource(String source, String debug) {
        this.sourceFile = source;
        super.visitSource(source, debug);
    }
    
    @Override
    public MethodVisitor visitMethod(int access, String name, String descriptor, 
                                     String signature, String[] exceptions) {
        MethodVisitor mv = cv.visitMethod(access, name, descriptor, signature, exceptions);
        
        // 跳过构造方法、静态构造、抽象方法、native方法
        if (name.equals("<init>") || name.equals("<clinit>") 
            || (access & Opcodes.ACC_ABSTRACT) != 0
            || (access & Opcodes.ACC_NATIVE) != 0) {
            return mv;
        }
        
        return new TraceMethodVisitor(mv, className, name, descriptor, sourceFile, config);
    }
}

/**
 * 方法访问器 - 处理方法级别的转换
 * 在每个方法入口和出口插入追踪代码
 */
class TraceMethodVisitor extends MethodVisitor {
    
    private final String className;
    private final String methodName;
    private final String descriptor;
    private final String sourceFile;
    private final AgentConfig config;
    private int lineNumber = -1;
    private Label startLabel;
    private Label endLabel;
    
    public TraceMethodVisitor(MethodVisitor mv, String className, String methodName,
                              String descriptor, String sourceFile, AgentConfig config) {
        super(Opcodes.ASM9, mv);
        this.className = className;
        this.methodName = methodName;
        this.descriptor = descriptor;
        this.sourceFile = sourceFile;
        this.config = config;
    }
    
    @Override
    public void visitLineNumber(int line, Label start) {
        this.lineNumber = line;
        super.visitLineNumber(line, start);
    }
    
    @Override
    public void visitCode() {
        super.visitCode();
        
        // 在方法入口插入: TraceRecorder.enterMethod(className, methodName, descriptor, line)
        mv.visitLdcInsn(className);
        mv.visitLdcInsn(methodName);
        mv.visitLdcInsn(descriptor);
        
        if (lineNumber > 0) {
            mv.visitLdcInsn(lineNumber);
        } else {
            mv.visitLdcInsn(-1);
        }
        
        mv.visitMethodInsn(Opcodes.INVOKESTATIC, 
            "com/tracer/agent/TraceRecorder",
            "enterMethod",
            "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;I)V",
            false);
        
        // 设置异常处理标签
        startLabel = new Label();
        endLabel = new Label();
        Label handlerLabel = new Label();
        
        mv.visitTryCatchBlock(startLabel, endLabel, handlerLabel, "java/lang/Throwable");
        mv.visitLabel(startLabel);
    }
    
    @Override
    public void visitInsn(int opcode) {
        // 在 return 指令前插入 exitMethod
        if ((opcode >= Opcodes.IRETURN && opcode <= Opcodes.RETURN) || opcode == Opcodes.ATHROW) {
            // 正常返回
            if (opcode != Opcodes.ATHROW) {
                insertExitMethod(null);
            }
        }
        super.visitInsn(opcode);
    }
    
    @Override
    public void visitMaxs(int maxStack, int maxLocals) {
        // 异常处理
        Label handlerLabel = new Label();
        mv.visitLabel(endLabel);
        mv.visitLabel(handlerLabel);
        
        // 异常时调用 exitMethod(exception)
        mv.visitInsn(Opcodes.DUP);
        insertExitMethod("java/lang/Throwable");
        mv.visitInsn(Opcodes.ATHROW);
        
        super.visitMaxs(maxStack + 2, maxLocals);
    }
    
    private void insertExitMethod(String exceptionType) {
        if (exceptionType != null) {
            // 有异常
            mv.visitMethodInsn(Opcodes.INVOKESTATIC,
                "com/tracer/agent/TraceRecorder",
                "exitMethod",
                "(Ljava/lang/Throwable;)V",
                false);
        } else {
            // 正常返回
            mv.visitInsn(Opcodes.ACONST_NULL);
            mv.visitMethodInsn(Opcodes.INVOKESTATIC,
                "com/tracer/agent/TraceRecorder",
                "exitMethod",
                "(Ljava/lang/Throwable;)V",
                false);
        }
    }
}
