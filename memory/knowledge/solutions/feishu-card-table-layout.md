# 飞书卡片表格实现方法

## 问题
飞书卡片原生没有 `table` 标签，直接使用 `table` 会导致错误。

## 解决方案
使用 **`column_set`** 组件实现表格布局效果。

## 核心原理
- 每行数据是一个独立的 `column_set`
- 表头使用 `background_style: "grey"` 区分
- 通过 `weight` 控制列宽比例

## 代码模板

### 基础表格行
```json
{
  "tag": "column_set",
  "flex_mode": "none",
  "columns": [
    {
      "tag": "column",
      "width": "weighted",
      "weight": 1,
      "elements": [{"tag": "div", "text": {"content": "列1内容", "tag": "lark_md"}}]
    },
    {
      "tag": "column",
      "width": "weighted",
      "weight": 2,
      "elements": [{"tag": "div", "text": {"content": "列2内容", "tag": "lark_md"}}]
    }
  ]
}
```

### 带背景色的表头
```json
{
  "tag": "column_set",
  "flex_mode": "none",
  "background_style": "grey",
  "columns": [
    {
      "tag": "column",
      "width": "weighted",
      "weight": 1,
      "elements": [{"tag": "div", "text": {"content": "**表头1**", "tag": "lark_md"}}]
    },
    {
      "tag": "column",
      "width": "weighted",
      "weight": 1,
      "elements": [{"tag": "div", "text": {"content": "**表头2**", "tag": "lark_md"}}]
    }
  ]
}
```

## 完整示例

```python
import json
import requests

card_content = {
    "config": {"wide_screen_mode": True},
    "header": {
        "template": "orange",
        "title": {"content": "📊 股票分析报告", "tag": "plain_text"}
    },
    "elements": [
        # 表头
        {
            "tag": "column_set",
            "flex_mode": "none",
            "background_style": "grey",
            "columns": [
                {"tag": "column", "width": "weighted", "weight": 2, 
                 "elements": [{"tag": "div", "text": {"content": "**时段**", "tag": "lark_md"}}]},
                {"tag": "column", "width": "weighted", "weight": 2, 
                 "elements": [{"tag": "div", "text": {"content": "**成交量**", "tag": "lark_md"}}]},
                {"tag": "column", "width": "weighted", "weight": 1, 
                 "elements": [{"tag": "div", "text": {"content": "**占比**", "tag": "lark_md"}}]}
            ]
        },
        # 数据行1
        {
            "tag": "column_set",
            "flex_mode": "none",
            "columns": [
                {"tag": "column", "width": "weighted", "weight": 2, 
                 "elements": [{"tag": "div", "text": {"content": "早盘30分", "tag": "lark_md"}}]},
                {"tag": "column", "width": "weighted", "weight": 2, 
                 "elements": [{"tag": "div", "text": {"content": "38.19万手", "tag": "lark_md"}}]},
                {"tag": "column", "width": "weighted", "weight": 1, 
                 "elements": [{"tag": "div", "text": {"content": "33.5%", "tag": "lark_md"}}]}
            ]
        },
        # 数据行2
        {
            "tag": "column_set",
            "flex_mode": "none",
            "columns": [
                {"tag": "column", "width": "weighted", "weight": 2, 
                 "elements": [{"tag": "div", "text": {"content": "上午中段", "tag": "lark_md"}}]},
                {"tag": "column", "width": "weighted", "weight": 2, 
                 "elements": [{"tag": "div", "text": {"content": "43.53万手", "tag": "lark_md"}}]},
                {"tag": "column", "width": "weighted", "weight": 1, 
                 "elements": [{"tag": "div", "text": {"content": "38.2%", "tag": "lark_md"}}]}
            ]
        }
    ]
}

# 发送卡片
card_str = json.dumps(card_content, ensure_ascii=False)
payload = {
    "receive_id": "ou_xxx",
    "msg_type": "interactive",
    "content": card_str
}

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

url = "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id"
resp = requests.post(url, headers=headers, json=payload)
```

## 属性说明

| 属性 | 类型 | 说明 |
|------|------|------|
| `column_set` | tag | 容器组件 |
| `flex_mode` | string | 布局模式，`none` 为固定布局，`bisect` 为 bisect 模式 |
| `background_style` | string | 背景色，`grey` / `default` |
| `columns` | array | 列数组 |
| `column.width` | string | 列宽类型，`weighted` 权重 / `auto` 自适应 |
| `column.weight` | int | 权重值，数字越大列越宽 |

## 优缺点

### 优点
- ✅ 无需原生 table 标签
- ✅ 可设置表头背景色
- ✅ 列宽可灵活调整
- ✅ 支持 Markdown 格式

### 缺点
- ❌ 没有边框线
- ❌ 每行需要独立定义
- ❌ 不能自动对齐（需通过 weight 控制）

## 适用场景
- 股票数据分析
- 统计报表展示
- 列表数据呈现
- 多列信息对比

---
**记录时间**: 2026-02-03
**解决方案**: 使用 column_set 实现表格布局
**验证状态**: ✅ 已验证可用
