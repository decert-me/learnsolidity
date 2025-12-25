#!/usr/bin/env python3
"""
Update local markdown references to published article URLs.

This script reads published_articles.json and updates all markdown files
to replace local file references (e.g., 3_types.md) with published URLs
(e.g., https://learnblockchain.cn/article/22531).
"""

import json
import os
import re
from pathlib import Path


def load_published_articles(json_path):
    """Load published articles mapping from JSON file."""
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def build_filename_to_url_map(published_data):
    """
    Build a mapping from filename to published URL.

    Returns:
        dict: {filename: url, ...}
        Example: {"3_types.md": "https://learnblockchain.cn/article/22531"}
    """
    filename_map = {}

    for file_path, info in published_data.items():
        # Extract just the filename from the path
        filename = os.path.basename(file_path)
        article_id = info['lbc_article_id']
        url = f"https://learnblockchain.cn/article/{article_id}"
        filename_map[filename] = url

    return filename_map


def find_all_markdown_files(base_dir):
    """Find all markdown files in the docs directory."""
    md_files = []
    docs_path = Path(base_dir) / 'docs'

    for md_file in docs_path.rglob('*.md'):
        md_files.append(md_file)

    return md_files


def update_markdown_links(content, filename_to_url):
    """
    Update markdown links in content.

    Handles various reference formats:
    - [text](3_types.md)
    - [text](./3_types.md)
    - [text](../solidity-basic/3_types.md)
    - [text](../../ethereum/1_ethereum_basics.md)

    Args:
        content: markdown file content
        filename_to_url: mapping of filename to published URL

    Returns:
        tuple: (updated_content, changes_made)
    """
    changes = []

    # Pattern to match markdown links: [text](path/to/file.md)
    # Captures: [1]=link text, [2]=full path including any ../
    link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+\.md)\)')

    def replace_link(match):
        link_text = match.group(1)
        original_path = match.group(2)

        # Extract just the filename from the path
        filename = os.path.basename(original_path)

        # Check if we have a published URL for this file
        if filename in filename_to_url:
            new_url = filename_to_url[filename]
            changes.append(f"  {original_path} -> {new_url}")
            return f"[{link_text}]({new_url})"

        # If no mapping found, keep original
        return match.group(0)

    updated_content = link_pattern.sub(replace_link, content)

    return updated_content, changes


def process_file(file_path, filename_to_url, dry_run=False):
    """
    Process a single markdown file.

    Args:
        file_path: Path to the markdown file
        filename_to_url: mapping of filename to URL
        dry_run: if True, don't actually write changes

    Returns:
        int: number of changes made
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        original_content = f.read()

    updated_content, changes = update_markdown_links(original_content, filename_to_url)

    if changes:
        print(f"\n📝 {file_path.relative_to(file_path.parent.parent.parent)}:")
        for change in changes:
            print(change)

        if not dry_run:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"  ✅ Updated {len(changes)} link(s)")
        else:
            print(f"  🔍 [DRY RUN] Would update {len(changes)} link(s)")

        return len(changes)

    return 0


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Update markdown links to published URLs')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be changed without actually changing files')
    parser.add_argument('--base-dir', default='..',
                       help='Base directory of the project (default: parent of scripts/)')
    args = parser.parse_args()

    # Resolve paths
    script_dir = Path(__file__).parent
    base_dir = (script_dir / args.base_dir).resolve()
    json_path = script_dir / 'published_articles.json'

    print(f"📚 Base directory: {base_dir}")
    print(f"📄 Reading published articles from: {json_path}")

    # Load published articles data
    published_data = load_published_articles(json_path)
    print(f"✅ Found {len(published_data)} published articles")

    # Build filename to URL mapping
    filename_to_url = build_filename_to_url_map(published_data)
    print(f"🔗 Built mapping for {len(filename_to_url)} files\n")

    # Find all markdown files
    md_files = find_all_markdown_files(base_dir)
    print(f"🔍 Found {len(md_files)} markdown files to process")

    if args.dry_run:
        print("\n⚠️  DRY RUN MODE - No files will be modified\n")

    # Process each file
    total_changes = 0
    files_changed = 0

    for md_file in md_files:
        changes = process_file(md_file, filename_to_url, dry_run=args.dry_run)
        if changes > 0:
            total_changes += changes
            files_changed += 1

    # Summary
    print(f"\n{'='*60}")
    print(f"📊 Summary:")
    print(f"  Files changed: {files_changed}/{len(md_files)}")
    print(f"  Total links updated: {total_changes}")

    if args.dry_run:
        print(f"\n💡 Run without --dry-run to apply changes")
    else:
        print(f"\n✅ All updates complete!")


if __name__ == '__main__':
    main()
