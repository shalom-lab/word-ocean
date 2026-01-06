import json
import tiktoken

enc = tiktoken.encoding_for_model("text-embedding-3-small")

def build_text(entry):
    parts = [entry["word"]]

    for t in entry.get("translations", []):
        parts.append(t["translation"])

    for p in entry.get("phrases", []):
        parts.append(f'{p["phrase"]} - {p["translation"]}')

    return "\n".join(parts)

with open("json_flat/all_words_dedup.json", "r", encoding="utf-8") as f:
    words = json.load(f)

# 👇 随便挑一个你关心的词
entry = words[0]   # 比如 ability

text = build_text(entry)
tokens = enc.encode(text)

print("====== INPUT TEXT (实际传给 OpenAI 的) ======")
print(text)

print("\n====== TOKEN COUNT ======")
print(len(tokens))

print("\n====== TOKENS (id -> decoded) ======")
for i, tok in enumerate(tokens):
    print(f"{i:03d}: {tok} -> {enc.decode([tok])}")
