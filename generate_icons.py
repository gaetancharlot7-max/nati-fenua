#!/usr/bin/env python3
"""
Script pour générer les icônes PNG à partir du SVG avec drapeau polynésien intégré.
Utilise Playwright pour un rendu fidèle du SVG incluant les images base64.
"""

import asyncio
import os
from pathlib import Path
from PIL import Image
import io

# Tailles d'icônes requises
ICON_SIZES = [16, 32, 48, 64, 128, 152, 167, 180, 192, 256, 384, 512]

# Chemins
SVG_SOURCE = "/app/frontend/public/assets/logo_nati_fenua_v2.svg"
ICONS_DIR = "/app/frontend/public/icons"
PUBLIC_DIR = "/app/frontend/public"


async def generate_icons():
    """Génère les icônes PNG à partir du SVG en utilisant Playwright."""
    from playwright.async_api import async_playwright
    
    # Lire le contenu SVG
    with open(SVG_SOURCE, 'r', encoding='utf-8') as f:
        svg_content = f.read()
    
    # Créer une page HTML qui affiche le SVG à grande taille pour une meilleure qualité
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            * {{ margin: 0; padding: 0; }}
            body {{ 
                background: transparent; 
                display: flex; 
                justify-content: center; 
                align-items: center;
                width: 1024px;
                height: 1024px;
            }}
            .logo-container {{
                width: 1024px;
                height: 1024px;
            }}
            .logo-container svg {{
                width: 100%;
                height: 100%;
            }}
        </style>
    </head>
    <body>
        <div class="logo-container">
            {svg_content}
        </div>
    </body>
    </html>
    """
    
    async with async_playwright() as p:
        # Lancer le navigateur
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1024, 'height': 1024})
        
        # Charger le HTML
        await page.set_content(html_content)
        
        # Attendre le rendu complet
        await page.wait_for_timeout(500)
        
        # Capturer le logo
        logo_element = await page.query_selector('.logo-container')
        if not logo_element:
            print("Erreur: Élément logo non trouvé")
            await browser.close()
            return False
        
        # Screenshot de l'élément à 1024x1024
        screenshot_bytes = await logo_element.screenshot(type='png', omit_background=True)
        
        await browser.close()
    
    # Charger l'image source
    source_image = Image.open(io.BytesIO(screenshot_bytes))
    
    # S'assurer que le dossier icons existe
    os.makedirs(ICONS_DIR, exist_ok=True)
    
    # Générer chaque taille d'icône
    for size in ICON_SIZES:
        # Redimensionner avec haute qualité (LANCZOS)
        resized = source_image.resize((size, size), Image.LANCZOS)
        
        # Sauvegarder
        output_path = os.path.join(ICONS_DIR, f"nati-fenua-{size}.png")
        resized.save(output_path, "PNG", optimize=True)
        print(f"✓ Généré: {output_path}")
    
    # Générer également favicon.ico (multi-taille) et apple-touch-icon.png
    # Apple Touch Icon (180x180)
    apple_icon = source_image.resize((180, 180), Image.LANCZOS)
    apple_icon_path = os.path.join(PUBLIC_DIR, "apple-touch-icon.png")
    apple_icon.save(apple_icon_path, "PNG", optimize=True)
    print(f"✓ Généré: {apple_icon_path}")
    
    # Favicon (utiliser la version 32x32 comme favicon.ico)
    favicon_32 = source_image.resize((32, 32), Image.LANCZOS)
    favicon_path = os.path.join(PUBLIC_DIR, "favicon.ico")
    favicon_32.save(favicon_path, "ICO")
    print(f"✓ Généré: {favicon_path}")
    
    print("\n✅ Toutes les icônes ont été générées avec succès!")
    return True


if __name__ == "__main__":
    success = asyncio.run(generate_icons())
    if success:
        print("\n📱 Les icônes sont prêtes pour le déploiement!")
    else:
        print("\n❌ Erreur lors de la génération des icônes")
