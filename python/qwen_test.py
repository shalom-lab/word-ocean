# qwen_test.py
import os
from dotenv import load_dotenv
import dashscope
from http import HTTPStatus

load_dotenv()

api_key = os.getenv("DASHSCOPE_API_KEY")
if not api_key or "sk-" not in api_key:
    raise ValueError("请在 .env 文件中设置真实的 DASHSCOPE_API_KEY（以 sk- 开头）")

dashscope.api_key = api_key

resp = dashscope.TextEmbedding.call(
    model="text-embedding-v4",
    input="hello world",
    dimension=1024
)

print("✅ 调用成功！")
print("status_code:", resp.status_code)
print("code:", repr(resp.code))  # 空字符串表示成功
print("total_tokens:", resp.usage["total_tokens"] if resp.usage else "N/A")
print("embedding length:", len(resp.output["embeddings"][0]["embedding"]))