package com.example.service;

/**
 * 示例服务 - 用于演示追踪功能
 */
public class OrderService {
    
    private UserService userService = new UserService();
    private InventoryService inventoryService = new InventoryService();
    private PaymentService paymentService = new PaymentService();
    
    /**
     * 创建订单 - 这个方法会触发追踪
     */
    public Order createOrder(String userId, String itemId, int quantity) {
        System.out.println("[OrderService] 开始创建订单...");
        
        // 验证用户
        User user = userService.validateUser(userId);
        
        // 检查库存
        boolean hasStock = inventoryService.checkStock(itemId, quantity);
        if (!hasStock) {
            throw new RuntimeException("库存不足");
        }
        
        // 扣减库存
        inventoryService.decreaseStock(itemId, quantity);
        
        // 创建订单
        Order order = new Order(userId, itemId, quantity);
        order.setStatus("CREATED");
        
        // 处理支付
        boolean paid = paymentService.processPayment(userId, calculatePrice(itemId, quantity));
        if (paid) {
            order.setStatus("PAID");
        }
        
        // 发送通知
        userService.sendNotification(userId, "订单创建成功: " + order.getId());
        
        System.out.println("[OrderService] 订单创建完成: " + order.getId());
        return order;
    }
    
    private double calculatePrice(String itemId, int quantity) {
        // 模拟价格计算
        return 100.0 * quantity;
    }
}

class UserService {
    public User validateUser(String userId) {
        System.out.println("  [UserService] 验证用户: " + userId);
        // 模拟用户查询
        return new User(userId, "用户" + userId);
    }
    
    public void sendNotification(String userId, String message) {
        System.out.println("  [UserService] 发送通知给用户 " + userId + ": " + message);
    }
}

class InventoryService {
    public boolean checkStock(String itemId, int quantity) {
        System.out.println("  [InventoryService] 检查库存: " + itemId + " x " + quantity);
        return quantity <= 100; // 模拟库存充足
    }
    
    public void decreaseStock(String itemId, int quantity) {
        System.out.println("  [InventoryService] 扣减库存: " + itemId + " - " + quantity);
    }
}

class PaymentService {
    public boolean processPayment(String userId, double amount) {
        System.out.println("  [PaymentService] 处理支付: " + amount + " 元");
        validatePaymentParams(userId, amount);
        return true; // 模拟支付成功
    }
    
    private void validatePaymentParams(String userId, double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("金额必须大于0");
        }
    }
}

class Order {
    private String id;
    private String userId;
    private String itemId;
    private int quantity;
    private String status;
    
    public Order(String userId, String itemId, int quantity) {
        this.id = "ORD" + System.currentTimeMillis();
        this.userId = userId;
        this.itemId = itemId;
        this.quantity = quantity;
    }
    
    public String getId() { return id; }
    public void setStatus(String status) { this.status = status; }
}

class User {
    private String id;
    private String name;
    
    public User(String id, String name) {
        this.id = id;
        this.name = name;
    }
}
