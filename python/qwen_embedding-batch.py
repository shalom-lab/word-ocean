import os
import json
import time
from collections import Counter
from dotenv import load_dotenv

load_dotenv()

# === 配置 ===
INPUT_FILE = "./json_flat/all_words_dedup.json"
OUTPUT_FILE = "qwen_embeddings_output.json"
PROCESSED_FILE = "qwen_processed_words.txt"
MODEL_NAME = "text-embedding-v4"
DIMENSION = 1024
PRICE_PER_1K_TOKENS_YUAN = 0.0005
FREE_QUOTA = 1_000_000
BATCH_SIZE = 10  # text-embedding-v4 最多支持 10 条/批

DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY")
if not DASHSCOPE_API_KEY:
    raise EnvironmentError(
        "请设置环境变量 DASHSCOPE_API_KEY。\n"
        "1. 在项目根目录创建 .env 文件\n"
        "2. 写入：DASHSCOPE_API_KEY=sk-你的真实密钥"
    )

# === 构建 embedding 输入文本 ===
def build_embedding_text(item):
    lines = [item["word"]]
    if "translations" in item:
        for t in item["translations"]:
            line = f'{t.get("type", "")}. {t["translation"]}'.strip()
            if line:  # 避免空行
                lines.append(line)
    if item.get("phrases"):
        lines.append("phrases:")
        for p in item["phrases"]:
            line = f'{p["phrase"]} - {p["translation"]}'
            lines.append(line)
    return "\n".join(lines)

# === 读取已处理单词（用于断点续跑）===
def load_processed_words():
    if os.path.exists(PROCESSED_FILE):
        with open(PROCESSED_FILE, "r", encoding="utf-8") as f:
            return set(line.strip() for line in f if line.strip())
    return set()

# === 主程序 ===
def main():
    import dashscope
    from http import HTTPStatus

    dashscope.api_key = DASHSCOPE_API_KEY

    # 加载数据
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 跳过已处理的单词
    processed = load_processed_words()
    remaining = [item for item in data if item["word"] not in processed]
    print(f"总单词数: {len(data)}, 已处理: {len(data) - len(remaining)}, 剩余: {len(remaining)}")

    if not remaining:
        print("✅ 所有单词已处理完毕！")
        return

    total_tokens = 0
    total_words_processed = 0

    # 批处理
    for i in range(0, len(remaining), BATCH_SIZE):
        batch = remaining[i:i + BATCH_SIZE]

        # 构建文本，跳过空内容
        texts = []
        words = []
        for item in batch:
            text = build_embedding_text(item)
            if not text.strip():
                print(f"[警告] 单词 '{item['word']}' 生成空文本，跳过")
                continue
            texts.append(text)
            words.append(item["word"])

        if not texts:
            continue  # 跳过空批次

        # 调用 API
        try:
            resp = dashscope.TextEmbedding.call(
                model=MODEL_NAME,
                input=texts,
                dimension=DIMENSION
            )
        except Exception as e:
            print(f"[异常] 批次 {i//BATCH_SIZE + 1} 调用失败: {e}")
            time.sleep(2)
            continue

        # 检查是否真正成功（DashScope 特有：status_code=200 但 code 非空）
        if resp.status_code != HTTPStatus.OK or resp.code != "":
            print(f"[错误] 批次 {i//BATCH_SIZE + 1} 失败:")
            print(f"  code: {resp.code}")
            print(f"  message: {resp.message}")
            time.sleep(3)
            continue

        # 安全提取结果
        try:
            embeddings = resp.output["embeddings"]
            batch_tokens = resp.usage["total_tokens"]  # ✅ 正确访问方式
        except (KeyError, TypeError, AttributeError) as e:
            print(f"[错误] 批次 {i//BATCH_SIZE + 1} 响应格式异常: {e}")
            continue

        total_tokens += batch_tokens
        total_words_processed += len(words)

        # 保存每条结果（JSONL 格式）
        with open(OUTPUT_FILE, "a", encoding="utf-8") as out_f, \
             open(PROCESSED_FILE, "a", encoding="utf-8") as proc_f:

            for j, word in enumerate(words):
                # 确保索引不越界
                if j >= len(embeddings):
                    print(f"[警告] 单词 '{word}' 无对应 embedding，跳过")
                    continue

                result = {
                    "word": word,
                    "embedding": embeddings[j]["embedding"],
                    "batch_tokens": batch_tokens,
                    "dimension": DIMENSION
                }
                out_f.write(json.dumps(result, ensure_ascii=False) + "\n")
                proc_f.write(word + "\n")

        print(f"[批次 {i//BATCH_SIZE + 1}] 处理 {len(words)} 词, 本批 tokens: {batch_tokens}, 累计 tokens: {total_tokens}")

        # 避免 QPS 限流
        time.sleep(0.15)

    # === 最终统计 ===
    avg_tokens_per_word = total_tokens / total_words_processed if total_words_processed else 0
    cost_yuan = total_tokens / 1000 * PRICE_PER_1K_TOKENS_YUAN

    print("\n" + "=" * 60)
    print("✅ 批量 embedding 任务完成！")
    print(f"总处理单词数: {total_words_processed}")
    print(f"总 token 消耗: {total_tokens}")
    print(f"平均每词 token: {avg_tokens_per_word:.2f}")
    print(f"免费额度使用: {min(total_tokens, FREE_QUOTA)}/{FREE_QUOTA}")
    print(f"预估费用: ¥{cost_yuan:.4f} (约 ${(cost_yuan / 7.2):.4f})")

    # 保存摘要
    with open("qwen_embedding_summary.txt", "w", encoding="utf-8") as f:
        f.write(f"总单词数: {total_words_processed}\n")
        f.write(f"总 tokens: {total_tokens}\n")
        f.write(f"平均每词 tokens: {avg_tokens_per_word:.2f}\n")
        f.write(f"费用（元）: {cost_yuan:.4f}\n")

if __name__ == "__main__":
    main()