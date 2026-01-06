import os
from openai import OpenAI
from dotenv import load_dotenv

# 载入 .env 文件
load_dotenv()

# 创建客户端
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 待测试文本
text_to_embed = "能力，创新能力，学习能力"

try:
    # 调用 embedding
    response = client.embeddings.create(
        model="text-embedding-3-small",  # 小模型，便宜
        input=text_to_embed
    )

    # 输出 token 数和向量长度
    embedding = response.data[0].embedding
    print("Embedding 向量长度:", len(embedding))
    print("Embedding 前5个数值示例:", embedding[:5])

except Exception as e:
    print("调用出错:", e)
