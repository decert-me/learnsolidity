#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import traceback
import argparse
from pathlib import Path

MAX_LINKS_PER_TERM = 2  # 每个术语在同一文档中最多出现2次链接
MAX_LINKS_PER_FILE = 6  # 每个文件最多添加6个链接


def extract_terms_and_links(termlink_path):
    """从 termlink.md 文件中提取术语和对应的链接"""
    terms_dict = {}

    try:
        with open(termlink_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 使用正则表达式匹配 markdown 链接格式: [术语](链接)
        pattern = r'\[(.*?)\]\((.*?)\)'
        matches = re.findall(pattern, content)

        # 将匹配结果存入字典
        for term, link in matches:
            terms_dict[term] = link

    except Exception as e:
        print(f"Error in extract_terms_and_links at line {traceback.extract_tb(e.__traceback__)[-1].lineno}:")
        print(traceback.format_exc())
        raise

    return terms_dict


def is_in_code_block(text, pos):
    """检查位置是否在代码块中"""
    before_text = text[:pos]
    # 计算三个反引号的数量
    triple_backticks = before_text.count('```')
    # 如果数量为奇数，说明在代码块中
    return triple_backticks % 2 == 1


def is_in_inline_code(text, pos):
    """检查位置是否在行内代码中"""
    # 向前查找最近的单个反引号
    start = text.rfind('`', 0, pos)
    if start == -1:
        return False

    # 检查这个反引号是否是三个反引号的一部分
    if start >= 2 and text[start-2:start+1] == '```':
        return False
    if start >= 1 and text[start-1:start+2] == '```':
        return False
    if start <= len(text) - 3 and text[start:start+3] == '```':
        return False

    # 向后查找配对的反引号
    end = text.find('`', pos)
    if end == -1:
        return False

    # 检查配对的反引号是否是三个反引号的一部分
    if end >= 2 and text[end-2:end+1] == '```':
        return False
    if end >= 1 and text[end-1:end+2] == '```':
        return False
    if end <= len(text) - 3 and text[end:end+3] == '```':
        return False

    return True


def is_in_link(text, pos, term_len):
    """检查术语是否在链接中（包括链接文本部分和URL部分）"""
    # 向前查找，看是否在 [...] 中
    before = text[:pos]
    # 查找最近的 [ 和 ]
    last_bracket_open = before.rfind('[')
    last_bracket_close = before.rfind(']')

    # 如果在 [...] 中
    if last_bracket_open != -1 and (last_bracket_close == -1 or last_bracket_open > last_bracket_close):
        return True

    # 向前查找，看是否在 (...) 中的URL部分
    last_paren_open = before.rfind('(')
    last_paren_close = before.rfind(')')

    # 如果在 (...) 中，且前面紧挨着 ]
    if last_paren_open != -1 and (last_paren_close == -1 or last_paren_open > last_paren_close):
        # 检查 ( 前面是否是 ]
        if last_paren_open > 0 and text[last_paren_open-1] == ']':
            return True

    return False


def is_in_url(text, pos):
    """检查是否在URL中"""
    # 向前查找，看是否在 http:// 或 https:// 之后
    before = text[:pos]
    # 查找最近的空格或行首
    last_space = max(before.rfind(' '), before.rfind('\n'), before.rfind('\t'))
    if last_space != -1:
        word = before[last_space+1:]
        if word.startswith('http://') or word.startswith('https://'):
            return True
    else:
        # 从行首开始
        if before.startswith('http://') or before.startswith('https://'):
            return True
    return False


def is_in_heading(text, pos):
    """检查位置是否在标题行中（以 ## 或 ### 等开头的行）"""
    # 找到当前位置所在行的开始位置
    line_start = text.rfind('\n', 0, pos)
    if line_start == -1:
        line_start = 0
    else:
        line_start += 1  # 跳过换行符

    # 获取从行首到当前位置之间的内容
    line_prefix = text[line_start:pos]

    # 获取整行内容用于检查
    line_end = text.find('\n', pos)
    if line_end == -1:
        line_end = len(text)
    line = text[line_start:line_end]

    # 检查行是否以 ## 开头（markdown 标题）
    stripped_line = line.lstrip()
    if stripped_line.startswith('#'):
        return True

    return False

def remove_all_term_links(content, term_links):
    """移除所有术语链接，还原为纯文本"""
    result = content

    for term, link in term_links.items():
        # 匹配 [term](link) 格式
        pattern = re.compile(r'\[' + re.escape(term) + r'\]\(' + re.escape(link) + r'\)')
        result = pattern.sub(term, result)

    return result



def add_links_to_content(content, term_links):
    """为内容添加术语链接，每个术语最多替换2次，同一行只替换一次"""
    # 检查 https://learnblockchain.cn/tags 出现的次数
    tag_link_count = content.count('https://learnblockchain.cn/tags')
    if tag_link_count >= 4:
        # 如果出现超过 4 次，跳过替换逻辑，直接返回原内容
        return content

    # 直接在原内容基础上添加术语链接
    result = content
    total_replacements = 0

    for term, link in term_links.items():
        link_count = 0  # 当前术语已添加的链接数
        replaced_lines = set()  # 记录已经替换过该术语的行号
        markdown_link = f'[{term}]({link})'

        # 使用正则表达式查找所有匹配的术语
        # 使用单词边界 \b 确保只替换完整的词，而不是词的一部分
        # 对于包含特殊字符的术语(如 web3.js)，需要特殊处理
        if re.search(r'[a-zA-Z]', term):
            # 如果术语包含英文字母，使用单词边界
            pattern = re.compile(r'\b' + re.escape(term) + r'\b')
        else:
            # 对于纯中文或其他字符，直接匹配
            pattern = re.compile(re.escape(term))
        matches = list(pattern.finditer(result))

        # 从后向前替换，避免位置偏移问题
        for match in reversed(matches):
            pos = match.start()

            # 计算当前匹配所在的行号
            line_number = result[:pos].count('\n')

            # 检查是否达到文件总替换次数限制
            if total_replacements >= MAX_LINKS_PER_FILE:
                break

            if link_count >= MAX_LINKS_PER_TERM:
                continue

            # 检查该行是否已经替换过这个术语
            if line_number in replaced_lines:
                continue

            # 检查是否应该跳过这个匹配
            if (is_in_code_block(result, pos) or
                is_in_inline_code(result, pos) or
                is_in_link(result, pos, len(term)) or
                is_in_url(result, pos) or
                is_in_heading(result, pos)):
                continue

            # 替换为链接
            result = result[:pos] + markdown_link + result[pos + len(term):]
            link_count += 1
            replaced_lines.add(line_number)
            total_replacements += 1

        # 如果已经达到文件总替换次数限制，停止处理其他术语
        if total_replacements >= MAX_LINKS_PER_FILE:
            break
    return result


def replace_terms_in_file(file_path, terms_dict):
    """在文件中替换术语为对应的超链接"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 替换 EIP 链接为登链社区的镜像链接
        original_content = content
        if "https://eips.ethereum.org/" in content:
            content = content.replace(
                "https://eips.ethereum.org/EIPS/eip-",
                "https://learnblockchain.cn/docs/eips/EIPS/eip-"
            )
            content = content.replace(
                "https://eips.ethereum.org/erc",
                "https://learnblockchain.cn/docs/eips/erc/"
            )

        # 使用改进的链接添加函数
        new_content = add_links_to_content(content, terms_dict)

        # 如果内容有变化，写回文件
        if new_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False

    except Exception as e:
        print(f"Error in replace_terms_in_file at line {traceback.extract_tb(e.__traceback__)[-1].lineno}:")
        print(traceback.format_exc())
        raise


def process_directory(directory, terms_dict):
    """处理目录下的所有 markdown 文件"""
    updated_count = 0
    skipped_count = 0
    total_count = 0

    try:
        # 递归获取所有 .md 文件
        for file_path in Path(directory).rglob('*.md'):
            total_count += 1
            try:
                if replace_terms_in_file(file_path, terms_dict):
                    updated_count += 1
                    print(f"✓ 已更新: {file_path}")
                else:
                    skipped_count += 1
            except Exception as e:
                print(f"✗ 错误 {file_path}: {e}")
                skipped_count += 1
                continue

    except Exception as e:
        print(f"Error in process_directory at line {traceback.extract_tb(e.__traceback__)[-1].lineno}:")
        print(traceback.format_exc())
        raise

    print(f'\n处理完成！')
    print(f'  更新: {updated_count} 个文件')
    print(f'  跳过: {skipped_count} 个文件')
    print(f'  总计: {total_count} 个文件')


def main():
    try:
        # 设置命令行参数
        parser = argparse.ArgumentParser(
            description='替换 Markdown 文件中的术语为超链接',
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog='''
示例:
  python replace_terms.py  docs                            # 默认处理 docs 目录
  python replace_terms.py bitcoin/协议/BOLT11.md      # 处理单个文件
            '''
        )
        parser.add_argument(
            'target_path',
            nargs='?',
            default='solana',
            help='要处理的目标路径（目录或文件，相对于项目根目录），默认为 solana'
        )

        args = parser.parse_args()

        # 设置路径
        script_dir = Path(__file__).parent
        termlink_path = '/Users/emmett/blockdocs/web3map/scripts/termlink.md'
        target_path = script_dir.parent / args.target_path

        # 提取术语和链接
        terms_dict = extract_terms_and_links(termlink_path)
        print(f"从 termlink.md 中找到 {len(terms_dict)} 个术语\n")

        # 判断是文件还是目录
        if target_path.is_file():
            # 处理单个文件
            if target_path.suffix != '.md':
                raise ValueError(f"只支持 .md 文件，当前文件: {target_path}")

            print(f"目标文件: {target_path}\n")
            try:
                if replace_terms_in_file(target_path, terms_dict):
                    print(f"✓ 已更新: {target_path}")
                else:
                    print(f"○ 无需更新: {target_path}")
            except Exception as e:
                print(f"✗ 错误 {target_path}: {e}")
                return 1
        else:
            # 处理目录
            print(f"目标目录: {target_path}\n")
            process_directory(target_path, terms_dict)

    except Exception as e:
        print(f"Error in main at line {traceback.extract_tb(e.__traceback__)[-1].lineno}:")
        print(traceback.format_exc())
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
