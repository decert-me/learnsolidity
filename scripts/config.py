import os
from dotenv import load_dotenv

load_dotenv(".env")


OPENROUTER_PREFIX = "openrouter:"

MODEL_GEMINI_20_FLASH = "google/gemini-2.0-flash-001"
OPENROUTER_MODEL_GEMINI_20_FLASH = OPENROUTER_PREFIX +  MODEL_GEMINI_20_FLASH

LLM_MODEL_GPT_4O_MINI = "gpt-4o-mini-2024-07-18"

MAX_TOKENS = 8000  

# LBC (LearnBlockchain.cn) API 配置
LBC_BASE_API_URL = os.getenv("LBC_BASE_API_URL", "")
LBC_API_KEY = os.getenv("LBC_API_KEY", "")


