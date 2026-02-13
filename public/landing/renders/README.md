# Landing Page Renders

This directory contains the real Renderspace output images used on the landing page.

## Required Images

Place the following images in this directory:

1. **Hero Section** (3 images):
   - `interior-hero-01.png`
   - `exterior-hero-01.png`
   - `landscape-hero-01.png`

2. **Space Gen Section** (2 images):
   - `renderspace-exterior-01.png`
   - `renderspace-exterior-02.png`

3. **How It Works Section** (1 image):
   - `studio-ui.png`

4. **Final CTA Section** (1 image):
   - `cta-render-01.png`

## How to Add Images

1. **Option 1: Drag and Drop**
   - Open the `public/landing/renders/` folder in your file explorer
   - Drag your image files into this folder
   - Ensure the filenames match exactly (case-sensitive)

2. **Option 2: Copy/Paste**
   - Copy your image files
   - Navigate to `public/landing/renders/` in your file explorer
   - Paste the files here
   - Rename them to match the required filenames above

3. **Option 3: Via Terminal**
   ```bash
   # Copy a file to this directory
   copy "path\to\your\image.png" "public\landing\renders\interior-hero-01.png"
   ```

## Image Requirements

- **Format**: PNG (recommended) or JPG
- **Optimization**: Consider compressing images for web performance
- **Naming**: Must match exactly (case-sensitive)

## Verification

After adding images, verify they're accessible at:
- `http://localhost:3000/landing/renders/interior-hero-01.png`
- etc.


