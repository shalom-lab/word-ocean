import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import os

# 配置路径
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_FILE = os.path.join(BASE_DIR, "data-process", "qwen_embeddings_output.jsonl")
OUTPUT_FILE = os.path.join(BASE_DIR, "data-process", "word_top_similar.json")
TOP_K = 50

def main():
    words, embeddings = [], []
    
    # 1. 加载 JSONL 数据
    print(f"正在读取: {INPUT_FILE}")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        for line in f:
            data = json.loads(line)
            words.append(data["word"])
            embeddings.append(data["embedding"])
    
    X = np.array(embeddings, dtype=np.float32)
    
    # 2. 计算余弦相似度
    print("计算相似度矩阵...")
    sim_matrix = cosine_similarity(X)
    
    # 3. 提取 Top-K
    results = {}
    for i, word in enumerate(words):
        # 排除自身：将自身相似度设为极小值
        sim_scores = sim_matrix[i]
        sim_scores[i] = -1.0
        
        # 获取最大 K 个值的索引
        top_indices = np.argpartition(sim_scores, -TOP_K)[-TOP_K:]
        # 按相似度降序排列
        top_indices = top_indices[np.argsort(sim_scores[top_indices])[::-1]]
        
        results[word] = [
            {"word": words[idx], "similarity": round(float(sim_scores[idx]), 4)}
            for idx in top_indices
        ]

    # 4. 保存结果
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"成功！结果保存至: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()