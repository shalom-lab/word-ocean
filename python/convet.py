file_path = "merged2.jsonl"

with open(file_path, 'r', encoding='utf-8') as f:
    line_count = sum(1 for _ in f)

print(line_count)
