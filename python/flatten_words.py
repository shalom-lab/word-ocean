import os
import json

json_folder = "./json"
output_folder = "./json_flat"
os.makedirs(output_folder, exist_ok=True)

file_list = [
    "1-初中-顺序.json",
    "2-高中-顺序.json",
    "3-CET4-顺序.json",
    "4-CET6-顺序.json",
    "5-考研-顺序.json",
    "6-托福-顺序.json",
    "7-SAT-顺序.json"
]

word_map = {}

for file_name in file_list:
    path = os.path.join(json_folder, file_name)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for entry in data:
        key = entry["word"].lower().strip()

        if key not in word_map:
            word_map[key] = {
                "word": entry["word"],
                "translations": [],
                "phrases": []
            }

        # 合并 translations
        for t in entry.get("translations", []):
            if t not in word_map[key]["translations"]:
                word_map[key]["translations"].append(t)

        # 合并 phrases
        for p in entry.get("phrases", []):
            if p not in word_map[key]["phrases"]:
                word_map[key]["phrases"].append(p)

all_words = list(word_map.values())

output_path = os.path.join(output_folder, "all_words_dedup.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(all_words, f, ensure_ascii=False, indent=2)

print(f"✅ 去重完成")
print(f"📊 原始条数 ≈ 54356")
print(f"📊 去重后单词数 = {len(all_words)}")
