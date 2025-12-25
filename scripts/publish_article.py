import requests
import os
import sys
import json
import time
from datetime import datetime, timedelta
from pathlib import Path

from config import LBC_BASE_API_URL, LBC_API_KEY
from urllib.parse import urlencode

import llm_analyze

# 发布记录配置文件路径
PUBLISHED_ARTICLES_FILE = Path(__file__).parent / "published_articles.json"

def first_line_of_file(filename):
    """读取文件的第一行（非空行）"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:  # 跳过空行
                    return line
        return ""  # 如果文件为空或只有空行
    except Exception as e:
        print(f"读取文件 {filename} 第一行时出错: {e}")
        return ""

def trim_summary(summary, max_length=200):
    """截断摘要，确保不超过指定长度"""
    if not summary:
        return ""
    if len(summary) <= max_length:
        return summary
    # 在最大长度处截断，并添加省略号
    return summary[:max_length-3] + "..."

def load_published_articles():
    """加载已发布文章记录"""
    if not PUBLISHED_ARTICLES_FILE.exists():
        return {}
    
    try:
        with open(PUBLISHED_ARTICLES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"读取发布记录文件时出错: {e}")
        return {}

def save_published_article(filename, lbc_article_id):
    """保存已发布文章记录"""
    published = load_published_articles()
    
    published[filename] = {
        'lbc_article_id': lbc_article_id,
        'published_at': datetime.now().isoformat()
    }
    
    try:
        with open(PUBLISHED_ARTICLES_FILE, 'w', encoding='utf-8') as f:
            json.dump(published, f, ensure_ascii=False, indent=2)
        print(f"已记录发布信息到 {PUBLISHED_ARTICLES_FILE}")
    except Exception as e:
        print(f"保存发布记录时出错: {e}")

def is_article_published(filename):
    """检查文章是否已发布"""
    published = load_published_articles()
    return filename in published

def get_published_info(filename):
    """获取已发布文章的信息"""
    published = load_published_articles()
    return published.get(filename)


def publish_article(filename, force=False):
    """
    发布文章
    
    Args:
        filename: 文章文件路径
        force: 如果为 True，即使已发布过也会重新发布
    """
    # 检查是否已发布
    if not force and is_article_published(filename):
        published_info = get_published_info(filename)
        print(f"⚠️  文章 {filename} 已经发布过")
        print(f"   LBC 文章ID: {published_info.get('lbc_article_id')}")
        print(f"   发布时间: {published_info.get('published_at')}")
        print(f"   如需重新发布，请使用 force=True 参数")
        return published_info.get('lbc_article_id')
    
    content = open(filename, "r").read()

    title = first_line_of_file(filename).replace("# ", "").strip()

    # 使用 LLM 分析文章，获取摘要和关键词
    try:
        print(f"正在分析文章内容...")
        analysis_result = llm_analyze.analyze_article(content)
        title = analysis_result.get('title', title).replace("详解", "")
        summary = trim_summary(analysis_result.get('summary', title))
        keywords = analysis_result.get('keywords', [])
        tags = ','.join(keywords) if keywords else "Solidity"
        if "Solidity" not in tags:
            tags = tags + ",Solidity"
        print(f"分析完成 - title: {title} ")
        print(f"分析完成 - 关键词: {tags}")
    except Exception as e:
        print(f"⚠️  分析文章失败: {e}，使用默认值")
        summary = title
        tags = "区块链"

    user_id = 13917 # decert.me 用户 id
    category_id = 7 # 4: 通识   # 3: 比特币  以太坊": 5

    article_featured = 1
    article_level = 3
    createday = "2025-12-16"

    article_type = 1  # 1：原创; 2: 翻译 ;  3：转发 

    payload = {
        'title': title,
        'content': content,
        'summary':  summary,
        'link': "",
        'author_id': user_id, # 指定用户 id 
        'category_id': category_id,
        'proofread': False,
        'is_public': True,
        'tags': tags,
        'featured': article_featured,
        'level': article_level,
        'type': article_type
    }

    if createday:
        payload['createday'] = createday

    # print(payload)

    lbc_article_id = post_article(
        payload                       
    )

    if lbc_article_id:
        print(f"{filename} 发布成功，LBC 文章ID: {lbc_article_id}")
        # 记录发布信息
        save_published_article(filename, lbc_article_id)
    else:
        print(f"发布文章： {filename} 发布失败")
    return lbc_article_id
        
def post_article(payload, max_retries=2, retry_delay=5):
    """
    发布文章，遇到504错误时自动重试
    
    Args:
        payload: 文章数据
        max_retries: 最大重试次数，默认3次
        retry_delay: 重试前等待时间（秒），默认5秒
    
    Returns:
        lbc_article_id: 成功时返回文章ID，失败时返回None
    """
    for attempt in range(max_retries):
        response = requests.post(
            url=LBC_BASE_API_URL + '/api/post/article',
            headers={
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-api-key': LBC_API_KEY
            },
            data = urlencode(payload)
        )

        if response.status_code == 200:
            result = response.json()
            print(result)

            if result.get("code") == 0:
                print(f" {payload.get('link')} 发布成功")
                lbc_article_id = result.get("article_id")
                return lbc_article_id
            else:
                print(f" {payload.get('link')} 发布失败, {result.get('code')},   错误信息: {result.get('message')}")
                return None
        
        elif response.status_code == 504:
            # 504 Gateway Timeout 错误，进行重试
            if attempt < max_retries - 1:
                print(f" {payload.get('link')} 遇到504错误，{retry_delay}秒后重试 (第 {attempt + 1}/{max_retries} 次尝试)")
                time.sleep(retry_delay)
                continue
            else:
                print(f" {payload.get('link')} 发布失败，504错误，已重试 {max_retries} 次，放弃")
                return None
        else:
            print(f" {payload.get('link')} 发布失败{response.status_code} {response.text}")
            return None
    
    return None


def update_lbc_article(article_id, new_markdown):
    payload = {
        "article_id": article_id,
        "content": new_markdown
    }

    # print(payload)
    url = LBC_BASE_API_URL + '/api/article/update'

    response = requests.post(
        url,
        headers={
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-api-key': LBC_API_KEY
        },
        data=urlencode(payload)
    )

    
    if response.status_code == 200:
        result = response.json()
        print(result)
        if result.get("code") == 0:
            print(f"更新文章 {article_id} 中的链接成功")
        else:
            print(f"更新文章 {article_id} 中的链接失败")
    else:
        print(f"更新文章 {article_id} 中的链接失败")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python publish_article.py <文件或文件夹路径> [--force]")
        sys.exit(1)
    
    target_path = Path(sys.argv[1])
    force = '--force' in sys.argv
    
    if not target_path.exists():
        print(f"错误: 路径不存在: {target_path}")
        sys.exit(1)
    
    # 收集要发布的文件
    files_to_publish = []
    
    if target_path.is_file():
        # 如果是单个文件
        if target_path.suffix == '.md':
            files_to_publish = [target_path]
        else:
            print(f"错误: 文件不是 .md 格式: {target_path}")
            sys.exit(1)
    elif target_path.is_dir():
        # 如果是文件夹，递归查找所有 .md 文件
        files_to_publish = sorted(target_path.rglob('*.md'))
        if not files_to_publish:
            print(f"警告: 在文件夹 {target_path} 中未找到 .md 文件")
            sys.exit(0)
    else:
        print(f"错误: 无效的路径: {target_path}")
        sys.exit(1)
    
    # 按文件名排序
    files_to_publish = sorted(files_to_publish)
    
    print(f"找到 {len(files_to_publish)} 个文件，开始依次发布...")
    print("=" * 60)
    
    success_count = 0
    skip_count = 0
    fail_count = 0
    
    for i, file_path in enumerate(files_to_publish, 1):
        print(f"\n[{i}/{len(files_to_publish)}] 处理文件: {file_path}")
        print("-" * 60)
        
        try:
            result = publish_article(str(file_path), force=force)
            if result:
                success_count += 1
            else:
                # 检查是否因为已发布而跳过
                if is_article_published(str(file_path)):
                    skip_count += 1
                else:
                    fail_count += 1
        except Exception as e:
            print(f"❌ 处理文件 {file_path} 时出错: {e}")
            fail_count += 1
            continue
        
        # 在文件之间添加短暂延迟，避免请求过快
        if i < len(files_to_publish):
            time.sleep(1)
    
    print("\n" + "=" * 60)
    print("发布完成！")
    print(f"  成功: {success_count} 个")
    print(f"  跳过: {skip_count} 个")
    print(f"  失败: {fail_count} 个")
    print(f"  总计: {len(files_to_publish)} 个")
