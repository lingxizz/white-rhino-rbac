# 飞书卡片发送方法

## 问题
OpenClaw 的 `message` tool 在发送飞书卡片时，`receive_id_type` 参数处理有问题，导致卡片发送失败。

## 根本原因
飞书 API 要求 `receive_id_type` 作为 **query 参数** 传递，而不是放在 JSON body 里。

## 解决方案
使用 Python + requests 直接调用飞书 API，绕过 OpenClaw message 工具的限制。

## 代码模板

```python
import json
import requests

def send_feishu_card(open_id, card_content, app_id, app_secret):
    """
    发送飞书卡片消息
    
    Args:
        open_id: 接收者的 open_id
        card_content: 卡片内容字典
        app_id: 飞书应用 ID
        app_secret: 飞书应用 Secret
    """
    # 1. 获取 tenant_access_token
    token_resp = requests.post(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        headers={"Content-Type": "application/json"},
        json={"app_id": app_id, "app_secret": app_secret}
    )
    token = token_resp.json().get("tenant_access_token")
    
    # 2. 构建卡片内容字符串
    card_str = json.dumps(card_content, ensure_ascii=False)
    
    # 3. 发送卡片 - receive_id_type 作为 query 参数
    payload = {
        "receive_id": open_id,
        "msg_type": "interactive",
        "content": card_str
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    url = "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id"
    
    resp = requests.post(url, headers=headers, json=payload)
    return resp.json()
```

## 卡片内容示例

```python
card_content = {
    "config": {"wide_screen_mode": True},
    "header": {
        "template": "orange",  # 颜色: blue, red, orange, green, grey
        "title": {"content": "📊 标题", "tag": "plain_text"}
    },
    "elements": [
        {"tag": "div", "text": {"content": "**粗体内容**", "tag": "lark_md"}},
        {"tag": "hr"},  # 分隔线
        {"tag": "div", "text": {"content": "普通文本", "tag": "lark_md"}},
        {"tag": "note", "elements": [{"tag": "plain_text", "content": "底部备注"}]}
    ]
}
```

## 关键要点

1. **receive_id_type 必须作为 query 参数**: `?receive_id_type=open_id`
2. **content 必须是 JSON 字符串**: 使用 `json.dumps()` 转换
3. **获取 token**: 每次发送前需要先获取 tenant_access_token
4. **open_id**: 从飞书消息中获取发送者的 open_id

## 当前配置

```python
app_id = "cli_a9d12e3c62b8dcd0"
app_secret = "AvSRsbDEfhfsSDQSLPghegHtlAPck6bY"
```

## 替代方案

如果需要在 Shell 中发送，使用 curl:

```bash
# 获取 token
TOKEN=$(curl -s -X POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal \
  -H "Content-Type: application/json" \
  -d '{"app_id": "cli_a9d12e3c62b8dcd0", "app_secret": "xxx"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin).get('tenant_access_token',''))")

# 发送卡片
curl -X POST "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receive_id": "ou_xxx",
    "msg_type": "interactive",
    "content": "{\"config\":{...}}"
  }'
```

## 参考

- 飞书卡片文档: https://open.feishu.cn/document/feishu-cards/send-feishu-cards
- 飞书 API 文档: https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create

---
**记录时间**: 2026-02-03
**记录原因**: OpenClaw message tool 无法正确发送飞书卡片
**解决方案**: 直接使用飞书 API 调用
