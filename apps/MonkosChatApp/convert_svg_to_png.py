#!/usr/bin/env python3
"""
SVG to PNG converter for MONKOS Chat icons
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("PIL not available, creating simple colored squares instead")

import os

def create_icon_png(size, output_path):
    """Create a simple but nice-looking icon"""
    if PIL_AVAILABLE:
        # Create image with gradient-like background
        img = Image.new('RGB', (size, size), color='#6366F1')
        draw = ImageDraw.Draw(img)

        # Draw a simple M shape
        margin = size // 6
        line_width = max(size // 12, 5)

        # Left vertical line
        draw.rectangle([margin, margin, margin + line_width, size - margin], fill='white')

        # Right vertical line
        draw.rectangle([size - margin - line_width, margin, size - margin, size - margin], fill='white')

        # Left diagonal (approximate)
        for i in range(line_width * 2):
            draw.line([(margin + i, margin), (size//2 + i, size//2)], fill='white', width=3)

        # Right diagonal (approximate)
        for i in range(line_width * 2):
            draw.line([(size - margin - i, margin), (size//2 - i, size//2)], fill='white', width=3)

        # Center circle
        center = size // 2
        circle_r = size // 15
        draw.ellipse([center - circle_r, center - circle_r, center + circle_r, center + circle_r], fill='white')

        # Add rounded corners for larger sizes
        if size >= 192:
            img = add_rounded_corners(img, size // 8)

        img.save(output_path, 'PNG')
        print(f"✓ Created {os.path.basename(output_path)} ({size}x{size})")
    else:
        # Fallback: create solid color square
        img = Image.new('RGB', (size, size), color='#6366F1')
        img.save(output_path, 'PNG')
        print(f"✓ Created basic {os.path.basename(output_path)} ({size}x{size})")

def add_rounded_corners(img, radius):
    """Add rounded corners to image"""
    circle = Image.new('L', (radius * 2, radius * 2), 0)
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, radius * 2, radius * 2), fill=255)

    alpha = Image.new('L', img.size, 255)
    w, h = img.size

    # Paste corner circles
    alpha.paste(circle.crop((0, 0, radius, radius)), (0, 0))
    alpha.paste(circle.crop((radius, 0, radius * 2, radius)), (w - radius, 0))
    alpha.paste(circle.crop((0, radius, radius, radius * 2)), (0, h - radius))
    alpha.paste(circle.crop((radius, radius, radius * 2, radius * 2)), (w - radius, h - radius))

    img.putalpha(alpha)
    return img

if __name__ == '__main__':
    assets_dir = os.path.join(os.path.dirname(__file__), 'assets')

    # Create icons in different sizes
    sizes = {
        'icon.png': 512,
        'favicon.png': 48,
        'adaptive-icon.png': 512,
        'splash-icon.png': 1024,
        'icon-192.png': 192,
        'icon-512.png': 512,
    }

    print('Generating PNG icons from design...\n')

    for filename, size in sizes.items():
        output_path = os.path.join(assets_dir, filename)
        create_icon_png(size, output_path)

    print('\n✅ All icons generated successfully!')
    print('\nGenerated files:')
    for filename in sizes.keys():
        print(f'  - assets/{filename}')
