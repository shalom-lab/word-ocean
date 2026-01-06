import json
import tiktoken
from collections import Counter

INPUT_FILE = "./json_flat/all_words_dedup.json"

ENCODING_NAME = "cl100k_base"
PRICE_PER_1M_TOKENS = 0.02  # text-embedding-3-small

def build_embedding_text(item):
    """
    把一个单词的所有信息合并成 embedding 输入文本
    """
    lines = []
    lines.append(item["word"])

    # translations
    if "translations" in item:
        for t in item["translations"]:
            line = f'{t.get("type","")}. {t["translation"]}'.strip()
            lines.append(line)

    # phrases
    if "phrases" in item and item["phrases"]:
        lines.append("phrases:")
        for p in item["phrases"]:
            lines.append(f'{p["phrase"]} - {p["translation"]}')

    return "\n".join(lines)

def main():
    enc = tiktoken.get_encoding(ENCODING_NAME)

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    token_counts = []
    per_word = []

    for item in data:
        text = build_embedding_text(item)
        tokens = enc.encode(text)
        n_tokens = len(tokens)

        token_counts.append(n_tokens)
        per_word.append({
            "word": item["word"],
            "tokens": n_tokens
        })

    total_words = len(per_word)
    total_tokens = sum(token_counts)
    avg_tokens = total_tokens / total_words
    cost = total_tokens / 1_000_000 * PRICE_PER_1M_TOKENS

    dist = Counter(token_counts)

    print("====== Embedding Token 统计 ======")
    print(f"单词数: {total_words}")
    print(f"Token 总数: {total_tokens}")
    print(f"平均每词 token: {avg_tokens:.2f}")
    print(f"预计 embedding 成本: ${cost:.4f}")
    print()
    print("Token 分布:")
    for k in sorted(dist):
        print(f"  {k} tokens: {dist[k]} words")

if __name__ == "__main__":
    main()
