#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import sys
from pathlib import Path
from publish_article import update_lbc_article, PUBLISHED_ARTICLES_FILE


def load_published_articles():
    """加载已发布文章记录"""
    if not PUBLISHED_ARTICLES_FILE.exists():
        print(f"✗ 发布记录文件不存在: {PUBLISHED_ARTICLES_FILE}")
        return {}

    try:
        with open(PUBLISHED_ARTICLES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"✗ 读取发布记录文件时出错: {e}")
        return {}


def update_articles(article_files):
    """
    批量更新文章到 LBC

    Args:
        article_files: 要更新的文章文件路径列表
    """
    published_articles = load_published_articles()

    if not published_articles:
        print("✗ 没有找到已发布的文章记录")
        return 0

    print(f"已加载 {len(published_articles)} 个已发布文章记录")
    print()

    success_count = 0
    skip_count = 0
    fail_count = 0

    for i, file_path in enumerate(article_files, 1):
        print(f"[{i}/{len(article_files)}] 处理: {file_path.name}")
        print("-" * 60)

        # 转换为相对路径字符串（相对于项目根目录）
        try:
            relative_path = str(file_path.relative_to(Path.cwd()))
        except ValueError:
            relative_path = str(file_path)

        # 检查是否已发布
        if relative_path not in published_articles:
            print(f"  ⚠️  文章未在发布记录中找到，跳过")
            print(f"     路径: {relative_path}")
            skip_count += 1
            print()
            continue

        published_info = published_articles[relative_path]
        article_id = published_info.get('lbc_article_id')

        if not article_id:
            print(f"  ✗ 无法获取文章ID")
            fail_count += 1
            print()
            continue

        print(f"  文章ID: {article_id}")
        print(f"  发布时间: {published_info.get('published_at')}")

        # 读取文章内容
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            print(f"  读取文章内容: {len(content)} 字符")

            # 调用更新函数
            update_lbc_article(article_id, content)

            print(f"  ✓ 更新完成")
            success_count += 1

        except Exception as e:
            print(f"  ✗ 更新失败: {e}")
            fail_count += 1

        print()

    return success_count, skip_count, fail_count


def main():
    import argparse

    parser = argparse.ArgumentParser(description='批量更新已发布的文章到 LBC')
    parser.add_argument('files', nargs='*', help='要更新的文章文件路径（可以是多个）')
    parser.add_argument('--dir', type=str, help='更新指定目录下的所有 .md 文件')
    parser.add_argument('--pattern', type=str, help='文件匹配模式（如 "加密朋克*"）')

    args = parser.parse_args()

    # 收集要更新的文件
    files_to_update = []

    if args.dir:
        # 更新指定目录下的所有文件
        dir_path = Path(args.dir)
        if not dir_path.exists():
            print(f"✗ 目录不存在: {dir_path}")
            return 1

        if args.pattern:
            files_to_update = list(dir_path.glob(args.pattern))
        else:
            files_to_update = list(dir_path.glob('*.md'))

    elif args.files:
        # 更新指定的文件
        for file_str in args.files:
            file_path = Path(file_str)
            if not file_path.exists():
                print(f"⚠️  文件不存在: {file_path}")
                continue
            files_to_update.append(file_path)

    else:
        script_dir = Path(__file__).parent
        articles_dir = script_dir.parent / 'docs' / 'solidity-basic'

        if not articles_dir.exists():
            print(f"✗ 默认目录不存在: {articles_dir}")
            print("请使用 --dir 或 --files 参数指定要更新的文件")
            return 1

        files_to_update = list(articles_dir.glob('*.md'))

    if not files_to_update:
        print("✗ 没有找到要更新的文件")
        return 1

    files_to_update = sorted(files_to_update)

    print("=" * 60)
    print("批量更新文章到 LBC")
    print("=" * 60)
    print(f"找到 {len(files_to_update)} 个文件")
    print()

    # 更新文章
    success_count, skip_count, fail_count = update_articles(files_to_update)

    # 输出结果
    print("=" * 60)
    print("更新完成！")
    print("=" * 60)
    print(f"成功: {success_count} 个")
    print(f"跳过: {skip_count} 个")
    print(f"失败: {fail_count} 个")
    print(f"总计: {len(files_to_update)} 个")

    return 0


if __name__ == "__main__":
    exit(main())
