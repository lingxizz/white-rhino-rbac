import type { ChannelPlugin, OpenClawPluginApi } from "openclaw/plugin-sdk";

// 你的自定义通道配置
const meta = {
  id: "custom-chat",
  label: "Custom Chat",
  selectionLabel: "Custom Chat App",
  blurb: "Your custom chat application integration",
  order: 99,
} as const;

// 核心插件定义
export const customChatPlugin: ChannelPlugin<any> = {
  id: "custom-chat",
  meta,

  // 声明支持的功能
  capabilities: {
    chatTypes: ["direct"],
    polls: false,
    threads: false,
    media: true,
    reactions: false,
    edit: false,
    reply: true,
  },

  // 配置 Schema
  configSchema: {
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: { type: "boolean" },
        webhookUrl: { type: "string", format: "uri" },
        secret: { type: "string" },
        dmPolicy: {
          type: "string",
          enum: ["open", "pairing", "allowlist"],
          default: "open"
        },
      },
    },
  },

  // 消息发送逻辑
  outbound: async ({ cfg, target, message, options }) => {
    const webhookUrl = cfg.channels?.['custom-chat']?.webhookUrl;
    const secret = cfg.channels?.['custom-chat']?.secret;

    if (!webhookUrl) {
      throw new Error("custom-chat: webhookUrl not configured");
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OpenClaw-Secret': secret || '',
      },
      body: JSON.stringify({
        message,
        target,
        messageId: options?.messageId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`custom-chat: send failed ${response.status}`);
    }

    const result = await response.json();
    return {
      messageId: result.messageId,
      channelMessageId: result.channelMessageId,
    };
  },

  // 健康检查
  probe: async ({ cfg }) => {
    const webhookUrl = cfg.channels?.['custom-chat']?.webhookUrl;
    if (!webhookUrl) {
      return { ok: false, error: "webhookUrl not configured" };
    }
    try {
      const response = await fetch(webhookUrl.replace('/api/webhook', '/health'), {
        method: 'GET',
        timeout: 5000,
      });
      return { ok: response.ok, error: response.ok ? undefined : "Health check failed" };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  },
};

// 插件导出
const plugin = {
  id: "custom-chat",
  name: "Custom Chat",
  description: "Custom chat application channel plugin",
  configSchema: customChatPlugin.configSchema,
  register(api: OpenClawPluginApi) {
    api.registerChannel({ plugin: customChatPlugin });
  },
};

export default plugin;
