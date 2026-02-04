#!/usr/bin/env python3
"""快捷脚本：分析股票并发送飞书卡片"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from analyze import analyze_stock, build_stock_card, send_feishu_card

def analyze_and_send(code: str, open_id: str):
    print(f"正在分析股票 {code}...")
    stock_data = analyze_stock(code, with_minute=True)
    if "error" in stock_data:
        print(f"错误: {stock_data['error']}")
        return
    print(f"✅ 数据获取成功: {stock_data.get('name', '')}")
    
    print(f"正在发送飞书卡片到 {open_id}...")
    card_content = build_stock_card(stock_data)
    result = send_feishu_card(open_id, card_content)
    
    if result.get('code') == 0:
        print(f"✅ 发送成功！消息ID: {result.get('data', {}).get('message_id', '')}")
    else:
        print(f"❌ 发送失败: {result.get('msg', '')}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 analyze_and_send.py <stock_code> <open_id>")
        sys.exit(1)
    analyze_and_send(sys.argv[1], sys.argv[2])
