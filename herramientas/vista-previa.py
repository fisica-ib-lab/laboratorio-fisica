"""Convierte un PDF (presentación o ficha) en las imágenes WebP con marca de agua que usa el visor de materiales.

Uso:  python3 herramientas/vista-previa.py ARCHIVO.pdf CARPETA_DESTINO [ancho_px]
Crea CARPETA_DESTINO/NNN.webp (ancho 1600 px por defecto) y CARPETA_DESTINO/mini/NNN.webp (260 px).
Necesita pdftoppm (poppler) y Pillow. La marca de agua dice «IB Seven · Física IB» en diagonal y lleva
una línea de contacto abajo, sin nombres de personas.
"""
import os, subprocess, sys, tempfile, glob
from PIL import Image, ImageDraw, ImageFont

FUENTE = '/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf'
LINEA = 'Muestra · IB Seven'


def marca(im):
    w, h = im.size
    capa = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    f = ImageFont.truetype(FUENTE, int(h * 0.075))
    texto = 'IB Seven · Física IB'
    paso_x, paso_y = int(w * 0.62), int(h * 0.36)
    for fila, y in enumerate(range(0, h * 2, paso_y)):
        for x in range(-paso_x + (fila % 2) * paso_x // 2, w * 2, paso_x):
            d.text((x, y), texto, font=f, fill=(128, 140, 155, 34))
    capa = capa.rotate(28, resample=Image.BICUBIC, center=(w, h))
    capa = capa.crop((w // 2, h // 2, w // 2 + w, h // 2 + h))
    im = Image.alpha_composite(im.convert('RGBA'), capa)
    # línea de contacto en una franja semitransparente al pie
    d = ImageDraw.Draw(im)
    f2 = ImageFont.truetype(FUENTE, max(12, int(h * 0.022)))
    tw = d.textlength(LINEA, font=f2)
    alto = int(h * 0.036)
    franja = Image.new('RGBA', (int(tw + alto * 1.4), alto), (255, 255, 255, 205))
    x0 = int((w - franja.width) / 2)
    im.alpha_composite(franja, (x0, h - alto - 2))
    d.text((w / 2, h - alto / 2 - 2), LINEA, font=f2, fill=(90, 107, 125, 255), anchor='mm')
    return im.convert('RGB')


def main():
    pdf, destino = sys.argv[1], sys.argv[2]
    ancho = int(sys.argv[3]) if len(sys.argv) > 3 else 1600
    os.makedirs(os.path.join(destino, 'mini'), exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['pdftoppm', '-png', '-scale-to-x', str(ancho), '-scale-to-y', '-1', pdf, os.path.join(tmp, 'p')],
                       check=True, stderr=subprocess.DEVNULL)
        archivos = sorted(glob.glob(os.path.join(tmp, 'p-*.png')))
        for i, a in enumerate(archivos, 1):
            im = marca(Image.open(a))
            im.save(os.path.join(destino, f'{i:03d}.webp'), 'WEBP', quality=80, method=6)
            m = im.copy(); m.thumbnail((260, 260))
            m.save(os.path.join(destino, 'mini', f'{i:03d}.webp'), 'WEBP', quality=72, method=6)
        print(len(archivos), 'páginas →', destino, '·', im.size)


if __name__ == '__main__':
    main()
