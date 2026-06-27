import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/downloads_parsed_summary.txt', 'r', encoding='utf-8') as f:
    text = f.read()

sections = text.split('=========================================\nFILE: ')
for s in sections[1:]:
    lines = s.split('\n')
    filename = lines[0].replace('=========================================', '').strip()
    content = '\n'.join(lines[1:])
    print(f"\n=========================================\n*** FILE: {filename} *** (Length: {len(content)} chars)\n=========================================")
    # Print clean snippet
    clean_lines = [l for l in content.split('\n') if l.strip()]
    for line in clean_lines[:40]:
        print(line[:120])
