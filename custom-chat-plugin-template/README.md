# 自定义聊天应用对接 OpenClau 指南

## 快速开始（推荐方案 B）

### 你的聊天应用需要实现的 API

#### 1. 接收 OpenClaw 回复的 Webhook

```typescript
// POST /api/openclaw/webhook
// Headers: Content-Type: application/json, X-OpenClaw-Secret: <your-secret>
// Body:
{
  "message": "AI 回复内容",
  "target": "user_id_123",  // 你的用户 ID
  "messageId": "om_xxxxxx",  // OpenClaw 消息 ID（可选，用于回复）
  "timestamp": "2026-02-04T14:33:00Z"
}

// Response:
{
  "success": true,
  "channelMessageId": "msg_12345"  // 你的系统消息 ID（可选）
}
```

#### 2. 用户发消息时推送到 OpenClaw

```typescript
// 你的应用调用 OpenClaw API
POST http://your-openclaw-gateway:3000/api/message
Headers: Content-Type: application/json

Body:
{
  "action": "send",
  "channel": "custom-chat",
  "target": "default",
  "message": "用户的消息内容",
  "messageId": "msg_user_12345",  // 你的消息 ID
  "metadata": {
    "userId": "user_id_123",
    "userName": "张三",
    "timestamp": "2026-02-04T14:33:00Z"
  },
  "replyTo": "om_xxxxxx"  // 可选，回复上一条消息
}
```

### 完整示例：Node.js + Express

```typescript
import express from 'express';

const app = express();
app.use(express.json());

const OPENCLAW_WEBHOOK_SECRET = 'your-secret-here';
const OPENCLAW_GATEWAY_URL = 'http://localhost:3000';

// 用户消息存储（简单实现，生产环境建议用数据库）
const userSessions = new Map<string, string>();

// Webhook: 接收 OpenClaw 的回复
app.post('/api/openclaw/webhook', (req, res) => {
  // 验证签名
  const secret = req.headers['x-openclaw-secret'];
  if (secret !== OPENCLAW_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid secret' });
  }

  const { message, target: userId, messageId } = req.body;

  // 这里应该通过 WebSocket 或 SSE 推送给前端
  // 简单示例：保存到会话
  const previousUserMsgId = userSessions.get(userId);
  if (previousUserMsgId) {
    console.log(`[${userId}] AI 回复到消息 ${previousUserMsgId}: ${message}`);
    userSessions.delete(userId);
  }

  res.json({
    success: true,
    channelMessageId: `msg_${Date.now()}`
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 用户发送消息
app.post('/api/chat', async (req, res) => {
  const { userId, userName, message, replyTo } = req.body;

  // 记录会话（用于关联回复）
  const userMsgId = `msg_${Date.now()}`;
  userSessions.set(userId, userMsgId);

  // 推送给 OpenClaw
  try {
    const response = await fetch(`${OPENCLAW_GATEWAY_URL}/api/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        channel: 'custom-chat',
        target: 'default',
        message,
        messageId: userMsgId,
        metadata: { userId, userName },
        replyTo,
      }),
    });

    const result = await response.json();
    res.json({
      success: true,
      messageId: userMsgId,
      openClawMessageId: result.messageId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Custom Chat App running on http://localhost:3001');
});
```

## 安装插件（方案 C）

### 1. 安装插件到 OpenClaw

```bash
# 复制插件到 OpenClaw 扩展目录
cp -r custom-chat-plugin-template ~/.openclaw/extensions/custom-chat

# 安装依赖
cd ~/.openclaw/extensions/custom-chat
npm install

# 编译 TypeScript（如果需要）
npx tsc
```

### 2. 配置 OpenClaw

```yaml
# openclaw.yml
channels:
  custom-chat:
    enabled: true
    webhookUrl: "https://your-app.com/api/openclaw/webhook"
    secret: "your-secret-key-change-this"
    dmPolicy: "open"
```

### 3. 重启 OpenClaw

```bash
openclaw gateway restart
```

## 验证对接

```bash
# 1. 检查 OpenClaw 状态
openclaw status

# 2. 测试发送消息
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send",
    "channel": "custom-chat",
    "target": "default",
    "message": "你好，测试消息"
  }'
```

## 功能扩展

### 支持图片发送

```typescript
// 你的应用接收图片消息
app.post('/api/chat', async (req, res) => {
  const { userId, message, imageUrl } = req.body;

  await fetch(`${OPENCLAW_GATEWAY_URL}/api/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'send',
      channel: 'custom-chat',
      target: 'default',
      message,
      media: imageUrl,  // 图片 URL
      metadata: { userId },
    }),
  });

  res.json({ success: true });
});

// Webhook 返回图片
// OpenClaw 会推送到你的 webhook：
{
  "message": "这是一只猫",
  "media": "https://cdn.example.com/cat.jpg",
  "target": "user_id_123"
}
```

### 支持交互式卡片

```typescript
// OpenClaw 推送卡片
{
  "message": "请选择一个选项",
  "card": {
    "type": "buttons",
    "options": [
      { "label": "选项 A", "value": "a" },
      { "label": "选项 B", "value": "b" }
    ]
  },
  "target": "user_id_123"
}
```

## 下一步

1. 根据你的技术栈调整示例代码（React/Vue 前端、Python/Go 后端等）
2. 添加用户认证和权限控制
3. 实现会话管理（支持多轮对话）
4. 添加文件上传/下载功能
5. 配置 OpenClaw 的 AI 模型参数

有问题随时问我 🦀
