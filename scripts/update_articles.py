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

    parser = argparse.ArgumentParser(
        description='更新已发布的文章到 LBC',
        epilog='示例:\n'
               '  更新所有已发布文章: python update_articles.py --all\n'
               '  更新单个文章: python update_articles.py docs/solidity-adv/7_storage_gas.md',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('file', nargs='?', help='要更新的文章文件路径')
    parser.add_argument('--all', action='store_true', help='更新 published_articles.json 中的所有已发布文章')

    args = parser.parse_args()

    # 收集要更新的文件
    files_to_update = []

    if args.all and args.file:
        print("✗ 不能同时使用 --all 和指定文件")
        print("  使用 --all 更新所有文章，或指定单个文件路径")
        return 1

    if args.all:
        # 更新所有已发布的文章
        published_articles = load_published_articles()

        if not published_articles:
            print("✗ 没有找到已发布的文章记录")
            return 1

        print(f"从 published_articles.json 加载了 {len(published_articles)} 个已发布文章")
        print()

        # 获取项目根目录
        project_root = Path(__file__).parent.parent

        for relative_path in published_articles.keys():
            file_path = project_root / relative_path
            if file_path.exists():
                files_to_update.append(file_path)
            else:
                print(f"⚠️  文件不存在（将跳过）: {relative_path}")

        if not files_to_update:
            print("✗ 没有找到可更新的文件")
            return 1

    elif args.file:
        # 更新指定的单个文件
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"✗ 文件不存在: {file_path}")
            return 1
        files_to_update.append(file_path)

    else:
        print("✗ 请指定要更新的文章")
        print("  使用 --all 更新所有已发布文章")
        print("  或指定单个文件路径，例如: python update_articles.py docs/solidity-adv/7_storage_gas.md")
        return 1

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
