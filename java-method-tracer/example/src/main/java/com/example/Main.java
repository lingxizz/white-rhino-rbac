package com.example;

import com.example.service.OrderService;

/**
 * 示例程序入口
 */
public class Main {
    
    public static void main(String[] args) {
        System.out.println("========================================");
        System.out.println("方法调用追踪示例程序");
        System.out.println("========================================\n");
        
        OrderService orderService = new OrderService();
        
        // 模拟几次订单创建
        for (int i = 1; i <= 3; i++) {
            System.out.println("\n--- 第 " + i + " 次调用 ---");
            try {
                orderService.createOrder("USER" + i, "ITEM" + i, i * 2);
            } catch (Exception e) {
                System.err.println("调用失败: " + e.getMessage());
            }
        }
        
        System.out.println("\n========================================");
        System.out.println("程序执行完成，请查看 trace-output 目录");
        System.out.println("========================================");
    }
}
