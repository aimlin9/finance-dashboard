import pdfplumber
import sys

path = sys.argv[1]
pdf = pdfplumber.open(path)
for pi, page in enumerate(pdf.pages):
    tables = page.extract_tables()
    print(f'Page {pi}: {len(tables)} tables')
    for ti, table in enumerate(tables):
        print(f'  Table {ti}: {len(table)} rows')
        for ri, row in enumerate(table):
            print(f'    Row {ri}: {row}')
    
    # Also try extract_text
    text = page.extract_text()
    print('--- PAGE TEXT ---')
    print(text[:500])
    print('--- END ---')
pdf.close()