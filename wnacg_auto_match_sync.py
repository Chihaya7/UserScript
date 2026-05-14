import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime

# 配置
SOURCE_URL = "https://wn01.link/"

# 需要更新的多个脚本文件
SCRIPT_FILES = [
    "pic_box href index → sild.user.js",
    "another.user.js"
]

def fetch_latest_urls():
    """从发布页获取所有最新网址"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        response = requests.get(
            SOURCE_URL,
            headers=headers,
            timeout=15
        )

        response.encoding = 'utf-8'

        soup = BeautifulSoup(response.text, 'html.parser')

        urls = []

        # 方法1：直接从页面文本提取网址
        text_content = soup.get_text()

        # 匹配:
        # www.wn01.xxx
        # www.wnacg01.xxx
        pattern = r'www\.wn(?:acg)?\d+\.\w+'

        found_urls = re.findall(pattern, text_content)

        if found_urls:
            urls = list(set(found_urls))  # 去重

            print(f"找到 {len(urls)} 个网址:")

            for url in sorted(urls):
                print(f"  - {url}")

            return urls

        # 方法2：如果正文没找到，再扫描所有链接
        for link in soup.find_all('a', href=True):
            href = link.get('href')

            match = re.search(
                r'www\.wn(?:acg)?\d+\.\w+',
                href
            )

            if match:
                urls.append(match.group(0))

        if urls:
            urls = list(set(urls))

            print(f"找到 {len(urls)} 个网址:")

            for url in sorted(urls):
                print(f"  - {url}")

            return urls

        print("未能找到有效网址")

        return []

    except Exception as e:
        print(f"获取网址失败: {e}")

        return []


def update_version(content: str) -> str:
    """更新 @version 时间"""

    version_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    new_line = f"// @version      {version_str}"

    # 只替换第一个 @version
    new_content, count = re.subn(
        r'//\s*@version\s+[^\n]+',
        new_line,
        content,
        count=1
    )

    if count == 0:
        print("⚠️ 未找到 @version，未更新版本号")
    else:
        print(f"✔ @version 已更新为 {version_str}")

    return new_content


def update_userscript(script_file, new_urls):
    """在现有 @match 基础上新增网址"""

    if not new_urls:
        print("没有新网址，跳过更新")
        return False

    try:
        # 读取脚本
        with open(script_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # 更新版本号
        content = update_version(content)

        # 提取现有 @match
        existing_matches = re.findall(
            r'//\s*@match\s+(https?://[^\s]+)',
            content
        )

        existing_urls = set()

        for match in existing_matches:
            domain_match = re.search(
                r'https?://([^/]+)',
                match
            )

            if domain_match:
                existing_urls.add(domain_match.group(1))

        print(f"\n当前文件: {script_file}")
        print(f"现有 @match 规则: {len(existing_urls)} 个")

        for url in sorted(existing_urls):
            print(f"  - {url}")

        # 找出需要新增的网址
        new_domains = set(new_urls) - existing_urls

        if not new_domains:
            print("所有网址已存在，无需更新")
            return False

        print(f"\n需要新增 {len(new_domains)} 个网址:")

        for url in sorted(new_domains):
            print(f"  + {url}")

        # 找最后一个 @match
        last_match = None

        for match in re.finditer(
            r'//\s*@match\s+[^\n]+',
            content
        ):
            last_match = match

        if not last_match:
            print("❌ 未找到 @match 规则")
            return False

        insert_pos = last_match.end()

        # 生成新增规则
        new_lines = []

        for url in sorted(new_domains):
            new_lines.append(
                f"\n// @match        https://{url}/*"
            )

        # 插入
        new_content = (
            content[:insert_pos]
            + ''.join(new_lines)
            + content[insert_pos:]
        )

        # 写回文件
        with open(script_file, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f"\n✅ 成功新增 {len(new_domains)} 个 @match 规则")

        return True

    except Exception as e:
        print(f"更新脚本失败 ({script_file}): {e}")

        return False


if __name__ == "__main__":

    print(f"开始更新 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"源地址: {SOURCE_URL}")

    print("-" * 50)

    # 获取最新地址
    latest_urls = fetch_latest_urls()

    print("-" * 50)

    if latest_urls:

        # 循环更新多个脚本
        for script_file in SCRIPT_FILES:

            print(f"\n正在处理: {script_file}")

            updated = update_userscript(
                script_file,
                latest_urls
            )

            print("-" * 50)

            if updated:
                print(f"✅ {script_file} 更新成功")
            else:
                print(f"ℹ️ {script_file} 无需更新")

    else:
        print("❌ 获取网址失败")
