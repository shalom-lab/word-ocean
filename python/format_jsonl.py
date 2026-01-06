#!/usr/bin/env python3
"""
统一 JSON 文件格式为 JSONL（每行一个对象）
处理混合格式的 JSON 文件，统一输出为 JSONL 格式
"""

import json
import sys
import os
from pathlib import Path

def format_jsonl(input_file, output_file):
    """
    将输入的 JSON 文件统一格式化为 JSONL（每行一个对象）
    
    支持：
    1. JSONL 格式（每行一个对象）
    2. JSON 数组格式 [{"word": "..."}, ...]
    3. 混合格式（部分格式化，部分压缩）
    """
    print(f"正在处理: {input_file}")
    
    objects = []
    line_count = 0
    
    # 读取并解析文件
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read().strip()
        
        # 尝试作为 JSON 数组解析
        if content.startswith('['):
            try:
                objects = json.loads(content)
                print(f"检测到 JSON 数组格式，包含 {len(objects)} 个对象")
            except json.JSONDecodeError as e:
                print(f"解析 JSON 数组失败: {e}")
                sys.exit(1)
        else:
            # 按行解析（JSONL 格式）
            print("检测到 JSONL 或混合格式，逐行解析...")
            for line_num, line in enumerate(content.split('\n'), 1):
                line = line.strip()
                if not line:
                    continue
                
                try:
                    obj = json.loads(line)
                    objects.append(obj)
                    line_count += 1
                    if line_count % 10000 == 0:
                        print(f"  已解析 {line_count} 行...")
                except json.JSONDecodeError:
                    # 可能是多行 JSON，尝试继续读取
                    continue
    
    print(f"总共解析到 {len(objects)} 个对象")
    
    # 写入 JSONL 格式（每行一个对象）
    print(f"正在写入: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        for i, obj in enumerate(objects):
            json_line = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
            f.write(json_line + '\n')
            if (i + 1) % 10000 == 0:
                print(f"  已写入 {i + 1}/{len(objects)} 行...")
    
    print(f"[完成] 共处理 {len(objects)} 个对象")
    print(f"输出文件: {output_file}")
    
    # 显示文件大小
    input_size = os.path.getsize(input_file) / (1024 * 1024)
    output_size = os.path.getsize(output_file) / (1024 * 1024)
    print(f"输入文件大小: {input_size:.2f} MB")
    print(f"输出文件大小: {output_size:.2f} MB")

def main():
    if len(sys.argv) < 2:
        print("用法: python format_jsonl.py <输入文件> [输出文件]")
        print("示例: python format_jsonl.py qwen_embeddings_output.json qwen_embeddings_output.jsonl")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    if not os.path.exists(input_file):
        print(f"错误: 文件不存在: {input_file}")
        sys.exit(1)
    
    # 如果没有指定输出文件，使用输入文件名（替换扩展名）
    if len(sys.argv) >= 3:
        output_file = sys.argv[2]
    else:
        path = Path(input_file)
        output_file = str(path.parent / f"{path.stem}_formatted{path.suffix}")
    
    format_jsonl(input_file, output_file)

if __name__ == "__main__":
    main()

