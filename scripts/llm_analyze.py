import openai
import os
import json

from config import  OPENROUTER_PREFIX, LLM_MODEL_GPT_4O_MINI, MAX_TOKENS, OPENROUTER_MODEL_GEMINI_20_FLASH


def process_json_response(json_data_str):
    """处理JSON响应，如果返回的是数组则取第一个元素"""
    try:
        parsed_data = json.loads(json_data_str)
        # 如果返回的是数组，取第一个元素
        if isinstance(parsed_data, list) and len(parsed_data) > 0:
            print("检测到返回的是数组，提取第一个元素...")
            return parsed_data[0]
        return parsed_data
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}")
        raise


def analyze_article(markdown_text, model=OPENROUTER_MODEL_GEMINI_20_FLASH):
    
    system_prompt = """
你是编程及区块链技术专家，用户将提供给你一段以太坊智能合约开发相关的内容，请你总结内容，并提取其中的标题、摘要、关键词：

注意：
输出的 JSON 需遵守以下的格式：
{
    "title": "中文标题，不超过18个字",
    "summary": "用中文简明扼要概括核心内容, 1-3句话即可，字数在150字以内，不需要做额外补充，例如：不需要说明文章结构，不需要说明适合什么读者阅读。",
    "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词通常为技术术语，最多6个, 尽量使用中文"],
}
"""
    model_name = model
    if model.startswith(OPENROUTER_PREFIX):
        model_name = model.split(":")[1]

    request_params = {
        "model": model_name,
        "response_format": {"type": "json_object"},
        "temperature": 1.0,   # deepseek 推荐的分析温度, 1.0 也是默认值， 更高结果更发散
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": markdown_text}
        ]
    }

    print(f"等待 {model} 大模型返回分析结果...")

    # 初始化客户端，API密钥从环境变量读取
    if model.startswith("gpt-"):
        api_key=os.getenv("OPENAI_API_KEY")
        base_url=os.getenv("OPENAI_BASE_URL")

        client = openai.OpenAI(api_key=api_key, base_url=base_url)
        response = client.chat.completions.create(**request_params)

        # 提取返回的JSON字符串
        json_data = response.choices[0].message.content
        return process_json_response(json_data)
    elif model.startswith(OPENROUTER_PREFIX):
        print(f"使用 OpenRouter 模型: {model}")
        api_key = os.getenv("OPENROUTER_API_KEY")
        base_url = os.getenv("OPENROUTER_BASE_URL")
        client = openai.OpenAI(api_key=api_key, base_url=base_url)
        response = client.chat.completions.create(**request_params)
    
        json_data = response.choices[0].message.content
        return process_json_response(json_data)
    
    
def request_llm_with_stream(client, request_params):

    request_params["stream"] = True
    response = client.chat.completions.create(**request_params)

    responseContent = ""
    for chunk in response:
        if chunk and chunk.choices[0].delta.content:
            answer_chunk = chunk.choices[0].delta.content
            if answer_chunk and answer_chunk != "":
                    responseContent += answer_chunk

    print(f"responseContent: {responseContent}")
    # 去掉 responseContent 中的 ```json 和 ```
    responseContent = responseContent.replace("```json", "").replace("```", "")

    return process_json_response(responseContent)