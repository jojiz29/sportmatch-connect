import os
import sys
import zipfile
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')
downloads = os.path.expanduser('~/Downloads')

def inspect_file(fname):
    fpath = os.path.join(downloads, fname)
    print(f"\n=========================================\nFILE: {fname}\n=========================================")
    if fname.endswith('.docx'):
        with zipfile.ZipFile(fpath) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            paragraphs = []
            for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                p_text = ''.join([node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text])
                if p_text.strip():
                    paragraphs.append(p_text.strip())
            print('\n'.join(paragraphs))

inspect_file('10-26-1) Medición AG.docx')
