import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # 读取 .env 文件

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "你好，帮我写一段Python示例代码"}
    ],
)

print(response.choices[0].message.content)
