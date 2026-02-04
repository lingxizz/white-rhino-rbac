# A股完整分析方案

## 概述
结合 **a-stock-analysis skill** 和 **AKShare** 库，提供全面的A股股票分析。

## 数据源组合

| 数据源 | 提供数据 |
|--------|----------|
| **a-stock-analysis** | 实时行情、分时量能、主力动向判断 |
| **AKShare** | K线历史、技术指标、公司信息、新闻资讯 |

## 分析维度

### 1. 实时行情 (a-stock-analysis)
- 现价、涨跌幅、成交量、成交额
- 今开、最高、最低、昨收

### 2. 公司信息 (AKShare)
- 公司全称、所属行业
- 总市值、流通市值
- 上市时间

### 3. 位置判断 (AKShare)
- 52周最高/最低
- 当前位置百分比
- 距离高点百分比

### 4. 均线系统 (AKShare)
- MA5、MA10、MA20、MA60
- 股价与均线位置关系（站上/跌破）

### 5. 技术指标 (AKShare)
- RSI(14) - 超买/超卖判断
- MACD - 多空趋势
- MACD柱状图

### 6. 分时量能 (a-stock-analysis)
- 早盘30分、上午中段、下午中段、尾盘30分
- 各时段成交量占比
- 放量时段 TOP 10

### 7. 主力动向 (a-stock-analysis)
- 早盘抢筹信号
- 尾盘异动信号
- 主力动向判断

### 8. 阶段表现 (AKShare)
- 近1月涨跌幅
- 近3月涨跌幅
- 近6月涨跌幅

### 9. 新闻资讯 (AKShare)
- 近期相关新闻
- 机构调研信息

## 飞书卡片展示格式

使用 `column_set` 实现表格布局：

```python
def create_column_set(columns_data, is_header=False):
    """创建 column_set 表格行"""
    columns = []
    for i, content in enumerate(columns_data):
        weight = 1 if i == 0 else (1 if i == len(columns_data) - 1 else 2)
        col = {
            "tag": "column",
            "width": "weighted",
            "weight": weight,
            "elements": [{"tag": "div", "text": {"content": content, "tag": "lark_md"}}]
        }
        columns.append(col)
    
    result = {
        "tag": "column_set",
        "flex_mode": "none",
        "columns": columns
    }
    if is_header:
        result["background_style"] = "grey"
    return result

# 使用示例
elements = [
    create_column_set(["指标", "数值", "状态"], is_header=True),
    create_column_set(["MA5", "¥10.60", "✅ 站上"]),
    create_column_set(["MA10", "¥10.65", "✅ 站上"]),
]
```

## 完整代码模板

```python
import json
import requests
import akshare as ak

# 1. 获取 a-stock-analysis 数据
def get_astock_data(code):
    import subprocess
    result = subprocess.run(
        ['uv', 'run', 'scripts/analyze.py', code, '--minute', '--json'],
        capture_output=True, text=True, cwd='/root/.openclaw/skills/a-stock-analysis'
    )
    return json.loads(result.stdout)

# 2. 获取 AKShare 数据
def get_akshare_data(code):
    result = {}
    
    # K线数据
    df = ak.stock_zh_a_hist(symbol=code, period='daily', 
                           start_date='20250101', end_date='20260203', adjust='qfq')
    latest = df.iloc[-1]
    
    # 52周数据
    high_52w = df['最高'].max()
    low_52w = df['最低'].min()
    
    # 均线
    df['MA5'] = df['收盘'].rolling(window=5).mean()
    df['MA10'] = df['收盘'].rolling(window=10).mean()
    df['MA20'] = df['收盘'].rolling(window=20).mean()
    
    # RSI
    delta = df['收盘'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    
    # MACD
    exp1 = df['收盘'].ewm(span=12, adjust=False).mean()
    exp2 = df['收盘'].ewm(span=26, adjust=False).mean()
    macd = exp1 - exp2
    signal = macd.ewm(span=9, adjust=False).mean()
    hist = macd - signal
    
    # 公司信息
    info = ak.stock_individual_info_em(symbol=code)
    info_dict = {row['item']: row['value'] for _, row in info.iterrows()}
    
    # 新闻
    news = ak.stock_news_em(symbol=code)
    
    return {
        'kline': {...},
        'company': {...},
        'news': news.head(5).to_dict('records')
    }

# 3. 发送飞书卡片
def send_feishu_card(open_id, card_content):
    # 获取 token
    token_resp = requests.post(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        headers={"Content-Type": "application/json"},
        json={"app_id": "cli_a9d12e3c62b8dcd0", 
              "app_secret": "AvSRsbDEfhfsSDQSLPghegHtlAPck6bY"}
    )
    token = token_resp.json().get("tenant_access_token")
    
    # 发送卡片
    card_str = json.dumps(card_content, ensure_ascii=False)
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

# 4. 主函数
def analyze_stock(code, open_id):
    # 获取数据
    astock_data = get_astock_data(code)
    akshare_data = get_akshare_data(code)
    
    # 构建卡片
    card_content = build_card(astock_data, akshare_data)
    
    # 发送
    return send_feishu_card(open_id, card_content)
```

## 当前限制

| 数据 | 状态 | 原因 |
|------|------|------|
| 资金流向 | ❌ 不可用 | AKShare 接口参数变更 |
| 龙虎榜 | ❌ 不可用 | 接口变动 |
| 详细财务数据 | ❌ N/A | 接口返回空值 |

## 扩展方向

1. **增加图表**: 使用 chart-image skill 生成 K 线图
2. **历史对比**: 对比同行业其他股票表现
3. **机构持仓**: 基金/北向资金持仓变化
4. **财务分析**: 营收/利润/ROE 趋势

---
**记录时间**: 2026-02-03
**验证状态**: ✅ 已验证可用
**适用场景**: A股实时分析、飞书卡片展示
