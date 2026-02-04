---
name: feishu-stock-analysis
description: A-share stock analysis and Feishu card reports with flexible column layouts. Triggers when user mentions analyzing stocks, stock reports, Feishu cards, A-share analysis, real-time quotes, technical indicators, K-lines, or trading volume. Keywords include 股票, 分析, 行情, 报告, 飞书卡片.
---

# 飞书股票分析

A股股票完整分析并通过飞书卡片发送报告。支持多种 column_set 布局和样式。

## 快速使用

```bash
# 分析股票并发送飞书卡片
python3 scripts/analyze_and_send.py 002405 ou_xxx

# 分析并输出JSON
python3 scripts/analyze.py 002405 --minute --json

# 分析并发送
python3 scripts/analyze.py 002405 --minute --send ou_xxx
```

## 布局函数

### 基础函数

```python
# 创建列布局（支持任意列数和自定义权重）
create_column_set(
    columns_data=["列1", "列2", "列3"],
    weights=[1, 2, 1],        # 自定义权重
    bg_style="grey"           # 背景色: grey/blue/green/orange/red
)

# 创建两列布局
create_two_column_layout(
    left_content="左侧",
    right_content="右侧", 
    left_weight=1,
    right_weight=2,
    bg_style="blue"
)

# 创建三列布局
create_three_column_layout(
    col1="第一列",
    col2="第二列",
    col3="第三列",
    weights=[1, 1, 1],
    bg_style="green"
)

# 创建表格行
create_table_row(
    cells=["指标", "数值", "状态"],
    weights=[1, 1, 1],
    is_header=True
)

# 创建信息行（自动添加分割线）
create_info_row(
    label="标签",
    value="值",
    status="状态"  # 可选
)

# 创建区块标题
create_section_header("📈 实时行情")

# 创建备注块
create_note("⚠️ 免责声明...")
```

## 布局示例

### 两列布局 (1:2)
```python
create_column_set(["指标", "数值"], weights=[1, 2])
```

### 三列等宽 (1:1:1)
```python
create_column_set(["均线", "价格", "状态"], weights=[1, 1, 1])
```

### 三列不等宽 (2:2:1)
```python
create_column_set(["时段", "成交量", "占比"], weights=[2, 2, 1])
```

### 带背景色
```python
create_column_set(["标题", "内容"], weights=[1, 2], bg_style="blue")
```

## 背景色选项

- `grey` - 灰色（表头常用）
- `blue` - 蓝色
- `green` - 绿色
- `orange` - 橙色
- `red` - 红色

## 数据源

| 来源 | 数据 |
|------|------|
| **新浪财经** | 实时行情、分时K线 |
| **AKShare** | K线历史、均线、RSI、MACD、公司信息 |

## 分析维度

1. 实时行情（价格、涨跌幅、成交量）
2. 分时量能分布
3. 主力动向判断
4. 均线系统（MA5/10/20/60）
5. 技术指标（RSI、MACD）
6. 52周位置
7. 公司信息
8. 阶段表现（1月/3月涨幅）

## 股票代码格式

直接使用6位数字代码：
- **沪市**: 6开头 (如 600789)
- **深市**: 0或3开头 (如 002405, 300001)
- **北交所**: 8或4开头

## 限制

- 仅支持A股（沪深北交所）
- 交易时段外获取的是收盘数据
- 分时数据最多250条（约1个交易日）

## 依赖

- Python 3.10+
- AKShare
- requests
