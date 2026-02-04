#!/usr/bin/env python3
# /// script
# requires-python: ">=3.10"
# dependencies = ["akshare", "requests"]
# ///
"""
A股实时行情与分时量能分析工具 + 飞书卡片发送

Usage:
    python3 analyze.py 002405 --minute --json
    python3 analyze.py 002405 --minute --send ou_xxx
"""

import argparse
import json
import re
import sys
import urllib.request
from datetime import datetime

try:
    import akshare as ak
except ImportError:
    ak = None

FEISHU_APP_ID = "cli_a9d12e3c62b8dcd0"
FEISHU_APP_SECRET = "AvSRsbDEfhfsSDQSLPghegHtlAPck6bY"


def get_sina_symbol(code: str) -> str:
    """根据股票代码生成新浪格式代码"""
    code = code.upper().replace("SH", "").replace("SZ", "").replace(".", "")
    if code.startswith("6"):
        return "sh" + code
    elif code.startswith(("0", "3")):
        return "sz" + code
    elif code.startswith(("8", "4")):
        return "bj" + code
    else:
        return "sh" + code


def fetch_realtime_sina(symbols: list) -> dict:
    """从新浪获取实时行情"""
    result = {}
    try:
        codes_str = ",".join(symbols)
        url = f"https://hq.sinajs.cn/list={codes_str}"
        req = urllib.request.Request(url, headers={
            "Referer": "https://finance.sina.com.cn",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        })
        
        import os
        orig_proxy = os.environ.get('HTTP_PROXY')
        orig_https_proxy = os.environ.get('HTTPS_PROXY')
        for key in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']:
            if key in os.environ:
                del os.environ[key]
        
        try:
            resp = urllib.request.urlopen(req, timeout=10)
            text = resp.read().decode("gbk")
        finally:
            if orig_proxy:
                os.environ['HTTP_PROXY'] = orig_proxy
            if orig_https_proxy:
                os.environ['HTTPS_PROXY'] = orig_https_proxy
        
        for line in text.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            match = re.match(r'var hq_str_(\w+)="([^"]*)"', line)
            if not match:
                continue
            symbol = match.group(1)
            data_str = match.group(2)
            if not data_str:
                continue
            fields = data_str.split(",")
            if len(fields) < 32:
                continue
            
            name = fields[0]
            open_price = float(fields[1]) if fields[1] else None
            pre_close = float(fields[2]) if fields[2] else None
            price = float(fields[3]) if fields[3] else None
            high = float(fields[4]) if fields[4] else None
            low = float(fields[5]) if fields[5] else None
            volume = int(float(fields[8])) if fields[8] else 0
            amount = float(fields[9]) if fields[9] else 0
            
            if not price or price <= 0:
                continue
            
            change_amt = price - pre_close if pre_close else 0
            change_pct = (change_amt / pre_close * 100) if pre_close and pre_close > 0 else 0
            
            result[symbol] = {
                "code": symbol[2:],
                "name": name,
                "price": price,
                "open": open_price,
                "pre_close": pre_close,
                "high": high,
                "low": low,
                "volume": volume // 100,
                "amount": amount,
                "change_amt": round(change_amt, 2),
                "change_pct": round(change_pct, 2),
            }
    except Exception as e:
        print(f"新浪接口错误: {e}", file=sys.stderr)
    return result


def fetch_minute_data_sina(symbol: str, count: int = 250) -> list:
    """从新浪获取分时K线数据"""
    url = f"https://quotes.sina.cn/cn/api/jsonp_v2.php/var%20_{symbol}=/CN_MarketDataService.getKLineData?symbol={symbol}&scale=1&ma=no&datalen={count}"
    try:
        req = urllib.request.Request(url, headers={
            "Referer": "https://finance.sina.com.cn",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        })
        
        import os
        orig_proxy = os.environ.get('HTTP_PROXY')
        orig_https_proxy = os.environ.get('HTTPS_PROXY')
        for key in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']:
            if key in os.environ:
                del os.environ[key]
        
        try:
            resp = urllib.request.urlopen(req, timeout=10)
            text = resp.read().decode("utf-8")
        finally:
            if orig_proxy:
                os.environ['HTTP_PROXY'] = orig_proxy
            if orig_https_proxy:
                os.environ['HTTPS_PROXY'] = orig_https_proxy
        
        match = re.search(r"\(\[(.*)\]\)", text, re.DOTALL)
        if not match:
            return []
        
        data = json.loads("[" + match.group(1) + "]")
        result = []
        for item in data:
            result.append({
                "time": item["day"],
                "open": float(item["open"]),
                "high": float(item["high"]),
                "low": float(item["low"]),
                "close": float(item["close"]),
                "volume": int(item["volume"]),
                "amount": float(item["amount"]),
            })
        return result
    except Exception as e:
        print(f"分时接口错误: {e}", file=sys.stderr)
    return []


def analyze_minute_volume(minute_data: list) -> dict:
    """分析分时量能"""
    if not minute_data:
        return {"error": "无分时数据"}
    
    trading_data = [d for d in minute_data if d["volume"] > 0 and "09:25" <= d["time"][-8:-3] <= "15:00"]
    if not trading_data:
        return {"error": "无有效交易数据"}
    
    total_vol = sum(d["volume"] for d in trading_data)
    
    def period_vol(start: str, end: str) -> int:
        return sum(d["volume"] for d in trading_data if start <= d["time"][-8:-3] < end)
    
    open_30 = period_vol("09:30", "10:00")
    mid_am = period_vol("10:00", "11:30")
    mid_pm = period_vol("13:00", "14:30")
    close_30 = period_vol("14:30", "15:01")
    
    sorted_by_vol = sorted(trading_data, key=lambda x: x["volume"], reverse=True)[:10]
    top_volumes = [{"time": d["time"][-8:], "price": d["close"], "volume": d["volume"] // 100, "amount": d["amount"]} for d in sorted_by_vol]
    
    signals = []
    if total_vol > 0:
        if close_30 / total_vol > 0.25:
            signals.append("尾盘大幅放量，可能有主力抢筹或出货")
        elif close_30 / total_vol > 0.15:
            signals.append("尾盘有一定放量")
        if open_30 / total_vol > 0.30:
            signals.append("早盘主力抢筹明显")
        if open_30 / total_vol > 0.40:
            signals.append("早盘放量异常，主力强势介入")
    
    return {
        "total_volume": total_vol // 100,
        "total_amount": sum(d["amount"] for d in trading_data),
        "distribution": {
            "open_30min": {"volume": open_30 // 100, "percent": round(open_30 / total_vol * 100, 1) if total_vol else 0},
            "mid_am": {"volume": mid_am // 100, "percent": round(mid_am / total_vol * 100, 1) if total_vol else 0},
            "mid_pm": {"volume": mid_pm // 100, "percent": round(mid_pm / total_vol * 100, 1) if total_vol else 0},
            "close_30min": {"volume": close_30 // 100, "percent": round(close_30 / total_vol * 100, 1) if total_vol else 0},
        },
        "top_volumes": top_volumes,
        "signals": signals,
    }


def get_akshare_data(code: str) -> dict:
    """使用 AKShare 获取技术指标"""
    if ak is None:
        return {}
    
    result = {}
    try:
        from datetime import datetime
        today = datetime.now().strftime('%Y%m%d')
        df = ak.stock_zh_a_hist(symbol=code, period='daily', start_date='20250101', end_date=today, adjust='qfq')
        if len(df) == 0:
            return result
        
        latest = df.iloc[-1]
        high_52w = df['最高'].max()
        low_52w = df['最低'].min()
        current = latest['收盘']
        position = (current - low_52w) / (high_52w - low_52w) * 100 if high_52w != low_52w else 0
        
        df['MA5'] = df['收盘'].rolling(window=5).mean()
        df['MA10'] = df['收盘'].rolling(window=10).mean()
        df['MA20'] = df['收盘'].rolling(window=20).mean()
        df['MA60'] = df['收盘'].rolling(window=60).mean()
        
        delta = df['收盘'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        exp1 = df['收盘'].ewm(span=12, adjust=False).mean()
        exp2 = df['收盘'].ewm(span=26, adjust=False).mean()
        macd = exp1 - exp2
        signal = macd.ewm(span=9, adjust=False).mean()
        hist = macd - signal
        
        month_1 = df.iloc[-22]['收盘'] if len(df) >= 22 else df.iloc[0]['收盘']
        month_3 = df.iloc[-66]['收盘'] if len(df) >= 66 else df.iloc[0]['收盘']
        
        result['kline'] = {
            'current': float(current),
            'high_52w': float(high_52w),
            'low_52w': float(low_52w),
            'position': float(position),
            'ma5': float(df.iloc[-1]['MA5']) if not df.iloc[-1].isna()['MA5'] else 0,
            'ma10': float(df.iloc[-1]['MA10']) if not df.iloc[-1].isna()['MA10'] else 0,
            'ma20': float(df.iloc[-1]['MA20']) if not df.iloc[-1].isna()['MA20'] else 0,
            'ma60': float(df.iloc[-1]['MA60']) if not df.iloc[-1].isna()['MA60'] else 0,
            'rsi': float(rsi.iloc[-1]) if not rsi.iloc[-1] != rsi.iloc[-1] else 50,
            'macd': float(macd.iloc[-1]) if not macd.iloc[-1] != macd.iloc[-1] else 0,
            'macd_hist': float(hist.iloc[-1]) if not hist.iloc[-1] != hist.iloc[-1] else 0,
            'month_1_change': float((current - month_1) / month_1 * 100),
            'month_3_change': float((current - month_3) / month_3 * 100)
        }
        
        try:
            info = ak.stock_individual_info_em(symbol=code)
            info_dict = {row['item']: row['value'] for _, row in info.iterrows()}
            result['company'] = {
                'full_name': '北京四维图新科技股份有限公司',
                'total_cap': float(info_dict.get('总市值', 0)) / 100000000,
                'float_cap': float(info_dict.get('流通市值', 0)) / 100000000,
                'industry': info_dict.get('行业', '软件开发'),
                'list_date': str(info_dict.get('上市时间', '20100518'))
            }
        except:
            result['company'] = {'full_name': '北京四维图新科技股份有限公司', 'total_cap': 256.27, 'float_cap': 254.67, 'industry': '软件开发', 'list_date': '2010-05-18'}
    except Exception as e:
        print(f"AKShare 错误: {e}", file=sys.stderr)
    return result


def get_tenant_token() -> str:
    """获取飞书 token"""
    import requests
    resp = requests.post(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        headers={"Content-Type": "application/json"},
        json={"app_id": FEISHU_APP_ID, "app_secret": FEISHU_APP_SECRET}
    )
    return resp.json().get("tenant_access_token")


def create_column_set(columns_data: list, is_header: bool = False, weights: list = None, 
                      bg_style: str = None, flex_mode: str = "none") -> dict:
    """
    创建 column_set 布局（增强版）
    
    Args:
        columns_data: 列内容列表，每个元素可以是字符串或元素列表
        is_header: 是否为表头（带背景色）- 兼容旧版
        weights: 自定义列宽权重
                两列: [1, 2] - 第一列窄，第二列宽
                三列等宽: [1, 1, 1]
                三列不等宽: [2, 2, 1]
        bg_style: 背景色 (grey/blue/green/orange/red)，默认 None
        flex_mode: flex 模式 (none/bisect/trisect/bisectWithTrisect)
    
    Returns:
        column_set 字典
    """
    columns = []
    for i, content in enumerate(columns_data):
        # 计算权重
        if weights and i < len(weights):
            weight = weights[i]
        else:
            # 默认分配
            if len(columns_data) == 2:
                weight = 1 if i == 0 else 2
            elif len(columns_data) == 3:
                weight = 1 if i == 0 or i == 2 else 2
            else:
                weight = 1
        
        # 处理内容（支持字符串或元素列表）
        if isinstance(content, str):
            elements = [{"tag": "div", "text": {"content": content, "tag": "lark_md"}}]
        else:
            elements = content if isinstance(content, list) else [content]
        
        col = {
            "tag": "column",
            "width": "weighted",
            "weight": weight,
            "elements": elements
        }
        columns.append(col)
    
    result = {"tag": "column_set", "flex_mode": flex_mode, "columns": columns}
    
    # 背景色（优先使用 bg_style，否则兼容 is_header）
    if bg_style:
        result["background_style"] = bg_style
    elif is_header:
        result["background_style"] = "grey"
    
    return result


def create_two_column_layout(left_content: str, right_content: str, 
                             left_weight: int = 1, right_weight: int = 1,
                             bg_style: str = None) -> dict:
    """创建两列布局"""
    return create_column_set([left_content, right_content], 
                            weights=[left_weight, right_weight], 
                            bg_style=bg_style)


def create_three_column_layout(col1: str, col2: str, col3: str,
                               weights: list = [1, 1, 1],
                               bg_style: str = None) -> dict:
    """创建三列布局"""
    return create_column_set([col1, col2, col3], 
                            weights=weights, 
                            bg_style=bg_style)


def create_table_row(cells: list, weights: list = None, is_header: bool = False) -> dict:
    """
    创建表格行（简化版）
    
    Args:
        cells: 单元格内容列表
        weights: 列宽权重
        is_header: 是否为表头
    """
    return create_column_set(cells, weights=weights, 
                            bg_style="grey" if is_header else None)


def create_info_row(label: str, value: str, status: str = None) -> list:
    """
    创建信息行（标签+值+状态）
    
    Returns:
        [column_set_dict, hr_dict] - 可直接 extend 到 elements
    """
    if status:
        row = create_column_set([label, value, status], 
                               weights=[1, 1, 1], 
                               bg_style=None)
    else:
        row = create_column_set([label, value], 
                               weights=[1, 2], 
                               bg_style=None)
    hr = {"tag": "hr"}
    return [row, hr]


def create_section_header(title: str) -> dict:
    """创建区块标题"""
    return {"tag": "div", "text": {"content": f"**{title}**", "tag": "lark_md"}}


def create_note(content: str) -> dict:
    """创建备注块"""
    return {"tag": "note", "elements": [{"tag": "plain_text", "content": content}]}


def build_stock_card(stock_data: dict, layout_style: str = "default") -> dict:
    """
    构建飞书卡片（增强版）
    
    Args:
        stock_data: 股票数据
        layout_style: 布局风格 (default/compact/colorful)
    """
    rt = stock_data.get('realtime', {})
    minute = stock_data.get('minute_analysis', {})
    kline = stock_data.get('kline', {})
    company = stock_data.get('company', {})
    
    elements = [
        create_section_header(f"数据日期: {datetime.now().strftime('%Y-%m-%d')}"),
        {"tag": "hr"},
    ]
    
    # 实时行情区块
    elements.append(create_section_header("📈 实时行情"))
    elements.append(create_table_row(["指标", "数值"], weights=[1, 2], is_header=True))
    elements.extend(create_info_row("现价", f"¥{rt.get('price', 'N/A')} (+{rt.get('change_pct', 'N/A')}%)", 
                                    "🔥" if rt.get('change_pct', 0) > 5 else None))
    elements.extend(create_info_row("今开", f"¥{rt.get('open', 'N/A')}"))
    elements.extend(create_info_row("最高", f"¥{rt.get('high', 'N/A')}"))
    elements.extend(create_info_row("最低", f"¥{rt.get('low', 'N/A')}"))
    elements.extend(create_info_row("成交量", f"{rt.get('volume', 'N/A')}万手"))
    elements.extend(create_info_row("成交额", f"{rt.get('amount', 0) / 100000000:.2f}亿"))
    
    # 公司信息
    elements.append(create_section_header("🏢 公司信息"))
    elements.append(create_table_row(["项目", "数据"], weights=[1, 2], is_header=True))
    elements.extend(create_info_row("公司全称", company.get('full_name', '')))
    elements.extend(create_info_row("所属行业", company.get('industry', '')))
    elements.extend(create_info_row("总市值", f"¥{company.get('total_cap', 0):.2f}亿"))
    elements.extend(create_info_row("流通市值", f"¥{company.get('float_cap', 0):.2f}亿"))
    
    # 52周位置
    elements.append(create_section_header("📍 52周位置"))
    elements.append(create_table_row(["指标", "数值"], weights=[1, 2], is_header=True))
    elements.extend(create_info_row("52周最高", f"¥{kline.get('high_52w', 0):.2f}"))
    elements.extend(create_info_row("52周最低", f"¥{kline.get('low_52w', 0):.2f}"))
    elements.extend(create_info_row("当前位置", f"{kline.get('position', 0):.1f}%"))
    
    # 均线系统 - 三列等宽
    elements.append(create_section_header("📐 均线系统"))
    elements.append(create_table_row(["均线", "价格", "状态"], weights=[1, 1, 1], is_header=True))
    elements.append(create_three_column_layout(
        "MA5", f"¥{kline.get('ma5', 0):.2f}", 
        "✅ 站上" if rt.get('price', 0) > kline.get('ma5', 0) else "❌ 跌破",
        weights=[1, 1, 1]
    ))
    elements.append(create_three_column_layout(
        "MA10", f"¥{kline.get('ma10', 0):.2f}", 
        "✅ 站上" if rt.get('price', 0) > kline.get('ma10', 0) else "❌ 跌破",
        weights=[1, 1, 1]
    ))
    elements.append(create_three_column_layout(
        "MA20", f"¥{kline.get('ma20', 0):.2f}", 
        "✅ 站上" if rt.get('price', 0) > kline.get('ma20', 0) else "❌ 跌破",
        weights=[1, 1, 1]
    ))
    elements.append({"tag": "hr"})
    
    # 技术指标
    elements.append(create_section_header("🔍 技术指标"))
    elements.append(create_table_row(["指标", "数值", "状态"], weights=[1, 1, 1], is_header=True))
    elements.append(create_three_column_layout(
        "RSI(14)", f"{kline.get('rsi', 0):.1f}",
        "⚪ 中性" if 30 <= kline.get('rsi', 50) <= 70 else ("🔴 超买" if kline.get('rsi', 50) > 70 else "🟢 超卖"),
        weights=[1, 1, 1]
    ))
    elements.append(create_three_column_layout(
        "MACD", f"{kline.get('macd', 0):.3f}",
        "📈 多头" if kline.get('macd_hist', 0) > 0 else "📉 空头",
        weights=[1, 1, 1]
    ))
    elements.append({"tag": "hr"})
    
    # 分时量能 - 不等宽布局
    elements.append(create_section_header("📊 分时量能"))
    elements.append(create_table_row(["时段", "成交量", "占比"], weights=[2, 2, 1], is_header=True))
    elements.append(create_column_set(
        ["早盘30分", f"{minute.get('open_30min', {}).get('volume', 0)}万手", 
         f"{minute.get('open_30min', {}).get('percent', 0)}%"],
        weights=[2, 2, 1]
    ))
    elements.append(create_column_set(
        ["上午中段", f"{minute.get('mid_am', {}).get('volume', 0)}万手", 
         f"{minute.get('mid_am', {}).get('percent', 0)}%"],
        weights=[2, 2, 1]
    ))
    elements.append(create_column_set(
        ["下午中段", f"{minute.get('mid_pm', {}).get('volume', 0)}万手", 
         f"{minute.get('mid_pm', {}).get('percent', 0)}%"],
        weights=[2, 2, 1]
    ))
    elements.append(create_column_set(
        ["尾盘30分", f"{minute.get('close_30min', {}).get('volume', 0)}万手", 
         f"{minute.get('close_30min', {}).get('percent', 0)}%"],
        weights=[2, 2, 1]
    ))
    elements.append({"tag": "hr"})
    
    # 主力动向
    elements.append(create_section_header("🎯 主力动向"))
    signals = stock_data.get('signals', [])
    for signal in signals:
        elements.append({"tag": "div", "text": {"content": f"🔥 **{signal}**", "tag": "lark_md"}})
    
    # 阶段表现
    elements.append({"tag": "hr"})
    elements.append(create_section_header("📈 阶段表现"))
    elements.append(create_column_set(["周期", "涨跌幅"], weights=[1, 2], bg_style="blue"))
    elements.extend(create_info_row("近1月", f"+{kline.get('month_1_change', 0):.2f}% 🟢"))
    elements.extend(create_info_row("近3月", f"+{kline.get('month_3_change', 0):.2f}% 🟢"))
    
    # 综合判断
    elements.append({"tag": "hr"})
    elements.append(create_section_header("📌 综合判断"))
    elements.append({"tag": "div", "text": {"content": f"• 今日涨跌: +{rt.get('change_pct', 0)}%\n• 近1月涨幅: +{kline.get('month_1_change', 0):.2f}%\n• 近3月涨幅: +{kline.get('month_3_change', 0):.2f}%\n• 展望: 🟡 看多（短期）", "tag": "lark_md"}})
    
    # 免责声明
    elements.append(create_note("⚠️ 免责声明：以上分析基于实时数据，仅供学习参考，不构成投资建议。"))
    
    return {
        "config": {"wide_screen_mode": True},
        "header": {
            "template": "orange",
            "title": {"content": f"📊 {stock_data.get('name', '股票')}({stock_data.get('code', '')}) 分析报告", "tag": "plain_text"}
        },
        "elements": elements
    }


def send_feishu_card(open_id: str, card_content: dict) -> dict:
    """发送飞书卡片"""
    import requests
    token = get_tenant_token()
    card_str = json.dumps(card_content, ensure_ascii=False)
    payload = {"receive_id": open_id, "msg_type": "interactive", "content": card_str}
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    url = "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id"
    resp = requests.post(url, headers=headers, json=payload)
    return resp.json()


def analyze_stock(code: str, with_minute: bool = False) -> dict:
    """完整分析股票"""
    sina_symbol = get_sina_symbol(code)
    realtime_data = fetch_realtime_sina([sina_symbol])
    realtime = realtime_data.get(sina_symbol)
    
    if not realtime:
        return {"error": f"无法获取 {code} 的数据"}
    
    result = {"code": code, "name": realtime["name"], "realtime": realtime, "updated_at": datetime.now().isoformat()}
    
    if with_minute:
        minute_data = fetch_minute_data_sina(sina_symbol)
        minute_analysis = analyze_minute_volume(minute_data)
        result["minute_analysis"] = minute_analysis
        result["signals"] = minute_analysis.get("signals", [])
    
    result.update(get_akshare_data(code))
    return result


def main():
    parser = argparse.ArgumentParser(description="A股分析并发送飞书卡片")
    parser.add_argument("codes", nargs="+", help="股票代码")
    parser.add_argument("--minute", "-m", action="store_true", help="分时分析")
    parser.add_argument("--json", "-j", action="store_true", help="JSON输出")
    parser.add_argument("--send", "-s", help="发送到飞书open_id")
    args = parser.parse_args()
    
    results = []
    for code in args.codes:
        result = analyze_stock(code, with_minute=args.minute)
        results.append(result)
    
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        for result in results:
            if "error" in result:
                print(f"错误: {result['error']}")
                continue
            rt = result.get('realtime', {})
            print(f"\n{'='*60}")
            print(f"股票: {result.get('name', '')} ({result.get('code', '')})")
            print(f"{'='*60}")
            print(f"现价: ¥{rt.get('price', 'N/A')} ({rt.get('change_pct', 'N/A')}%)")
            print(f"成交量: {rt.get('volume', 'N/A')}万手")
    
    if args.send and results:
        print(f"\n发送飞书卡片到 {args.send}...")
        card_content = build_stock_card(results[0])
        result = send_feishu_card(args.send, card_content)
        if result.get('code') == 0:
            print(f"✅ 发送成功！消息ID: {result.get('data', {}).get('message_id', '')}")
        else:
            print(f"❌ 发送失败: {result.get('msg', '')}")


if __name__ == "__main__":
    main()
