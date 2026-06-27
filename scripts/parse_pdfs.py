import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')
downloads = os.path.expanduser('~/Downloads')

def extract_pdf_strings(fname):
    fpath = os.path.join(downloads, fname)
    print(f"\n=========================================\nPDF FILE: {fname}\n=========================================")
    with open(fpath, 'rb') as f:
        data = f.read()
    
    # Simple regex to find text inside BT ... ET blocks or string objects
    # In PDF strings are inside (...) or <...>
    text_chunks = []
    # find all TJ or Tj operators or plain parentheses
    raw_strings = re.findall(rb'\((.*?)\)', data)
    for s in raw_strings:
        try:
            txt = s.decode('latin1', errors='ignore')
            if len(txt.strip()) > 3 and not txt.startswith('http') and not txt.startswith('/'):
                text_chunks.append(txt.strip())
        except:
            pass
    
    full_text = ' '.join(text_chunks)
    print(f"Total extracted chars: {len(full_text)}")
    print(full_text[:3000])

extract_pdf_strings('(10-26-2) 3 Modelo de Paper.pdf')
extract_pdf_strings('AG-C05_ Gestión de Proyectos_Vera_de_la_Cruz_Nilton_Alonso.pdf')
