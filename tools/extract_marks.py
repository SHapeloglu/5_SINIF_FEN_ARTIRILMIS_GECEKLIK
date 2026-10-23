"""Kitap PDF'indeki kirmizi isaretleri (Square/Circle notlari) bulur ve AR hedefi olarak disa aktarir.

Kullanim:  python extract_marks.py v3.pdf cikti_klasoru [--max 480]
Her isaret icin (PDF'teki sirayla 1'den numaralanir):
  mNN.png   : isaretli bolgenin kirmizi cizgi olmadan goruntusu
  mNN.rgba  : ayni goruntunun ham RGBA pikselleri (compile-targets.mjs icin)
  marks.json: numara, PDF sayfasi, basili sayfa no, boyut (mm, piksel)
Gereksinim: pip install pymupdf
"""
import json, re, sys, os
import pymupdf as fitz

def main():
    pdf, out = sys.argv[1], sys.argv[2]
    max_px = int(sys.argv[sys.argv.index('--max') + 1]) if '--max' in sys.argv else 480
    os.makedirs(out, exist_ok=True)
    doc = fitz.open(pdf)
    marks = []
    for i, page in enumerate(doc):
        annots = [a for a in page.annots() if a.type[1] in ('Square', 'Circle')]
        if not annots:
            continue
        nums = [l.strip() for l in page.get_text().splitlines() if re.fullmatch(r'\d{1,3}', l.strip())]
        for a in annots:
            r = a.rect & page.rect
            pix = page.get_pixmap(dpi=300, clip=r, annots=False)
            if max(pix.width, pix.height) > max_px:
                f = max_px / max(pix.width, pix.height)
                pix = fitz.Pixmap(pix, max(1, int(pix.width * f)), max(1, int(pix.height * f)), None)
            if pix.alpha:
                pix = fitz.Pixmap(pix, 0)
            n = len(marks) + 1
            pix.save(f'{out}/m{n:02d}.png')
            rgba = fitz.Pixmap(pix, 1)
            open(f'{out}/m{n:02d}.rgba', 'wb').write(rgba.samples)
            marks.append({'mark': n, 'pdfPage': i + 1, 'printedPage': nums[-1] if nums else '',
                          'shape': a.type[1], 'mm': [round(r.width * 25.4 / 72, 1), round(r.height * 25.4 / 72, 1)],
                          'px': [pix.width, pix.height]})
    json.dump(marks, open(f'{out}/marks.json', 'w'), ensure_ascii=False, indent=1)
    print(f'{len(marks)} isaret disa aktarildi -> {out}')

if __name__ == '__main__':
    main()
