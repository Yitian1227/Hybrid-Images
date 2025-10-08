# Hybrid Images with GLSL

This project implements hybrid images using WebGL and GLSL shaders. Hybrid images are created by combining a low-pass filtered version of one image with a high-pass filtered version of another image, creating an effect that appears different when viewed from different distances.

## Features

- **Low-Pass Filter**: Applies Gaussian blur to the first image (silver blister pack) to preserve low-frequency information
- **High-Pass Filter**: Enhances edges and details in the second image (portraits) to preserve high-frequency information
- **Recursive Blur**: Multiple blur iterations for enhanced blur effect
- **Frame Buffer System**: Efficient rendering pipeline using WebGL frame buffers
- **Interactive Controls**: Real-time adjustment of blend factor, blur iterations, and filter strengths
- **Multiple Views**: Toggle between hybrid view, individual filters, and original images

## How It Works

### Low-Pass Filter (Gaussian Blur)
The low-pass filter removes high-frequency details and smooths the image using a Gaussian kernel. This is applied recursively with multiple iterations to enhance the blur effect.

### High-Pass Filter (Edge Enhancement)
The high-pass filter enhances edges and details by calculating gradient magnitude and amplifying areas with high frequency content while reducing low-frequency components.

### Hybrid Combination
The final hybrid image is created by blending the low-pass filtered first image with the high-pass filtered second image using a controllable blend factor.

## Quick Start

### Option 1: Using Python (Recommended)
```bash
python server.py
```

### Option 2: Using Node.js
```bash
npm install
npm start
```

### Option 3: Using Batch File (Windows)
Double-click `server.bat`

### Option 4: Using Shell Script (Mac/Linux)
```bash
chmod +x server.sh
./server.sh
```

### Option 5: VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html` and select "Open with Live Server"

## Usage

1. Start a local server using one of the methods above
2. Open your browser to `http://localhost:8000`
3. The images will load automatically
4. Use the controls to fine-tune the effect:
   - **Blend Factor**: Controls the mix between low-pass and high-pass images (0 = only low-pass, 1 = only high-pass)
   - **Blur Iterations**: Number of blur passes for the low-pass filter (1-10)
   - **Low-Pass Strength**: Intensity of the blur effect (0-5)
   - **High-Pass Strength**: Intensity of the edge enhancement (0-3)
5. Toggle between different views using the view buttons

## Technical Details

### Shaders
- **Vertex Shader**: Handles geometry transformation and texture coordinate mapping
- **Low-Pass Fragment Shader**: Implements multi-pass Gaussian blur
- **High-Pass Fragment Shader**: Calculates gradient magnitude and enhances edges
- **Hybrid Fragment Shader**: Combines the filtered images with controllable blending
- **Display Fragment Shader**: Simple texture rendering for preview modes

### Frame Buffers
The application uses multiple frame buffers to create an efficient rendering pipeline:
- Intermediate rendering for blur passes
- Separate buffers for low-pass and high-pass results
- Final composition buffer

### Image Processing Pipeline
1. Load original images as textures
2. Apply low-pass filter with recursive blur to image 1
3. Apply high-pass filter to image 2
4. Combine filtered images using blend factor
5. Render final result to screen

## Browser Compatibility

Requires a modern web browser with WebGL support:
- Chrome 9+
- Firefox 4+
- Safari 5.1+
- Edge 12+

## File Structure

- `index.html` - Main HTML file with UI controls
- `shaders.js` - GLSL shader source code
- `main.js` - WebGL application logic and rendering pipeline
- `3368325a22bfe52474398206c1b19357.jpg` - First image (silver blister pack)
- `Gemini_Generated_Image_17qzf017qzf017qz__1_-removebg-preview.png` - Second image (portraits)

## Controls

- **Hybrid View**: Shows the final combined result
- **Low-Pass Filter**: Shows only the blurred first image
- **High-Pass Filter**: Shows only the edge-enhanced second image
- **Original Images**: Shows both original images side by side
