#!/usr/bin/env python3
"""
Simple HTTP server for serving the Hybrid Images project
"""

import http.server
import socketserver
import os
import sys

# Configuration
PORT = 8000
HOST = 'localhost'

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow local file access
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    # Change to the script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Check if required files exist
    required_files = ['index.html', 'shaders.js', 'main.js']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print(f"Error: Missing required files: {', '.join(missing_files)}")
        sys.exit(1)
    
    # Check if images exist
    image_files = [
        '3368325a22bfe52474398206c1b19357.jpg',
        'Gemini_Generated_Image_17qzf017qzf017qz__1_-removebg-preview.png'
    ]
    
    missing_images = [f for f in image_files if not os.path.exists(f)]
    if missing_images:
        print(f"Warning: Missing image files: {', '.join(missing_images)}")
        print("Make sure your image files are in the same directory as this server script.")
    
    try:
        with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
            print(f"🚀 Hybrid Images Server running at http://{HOST}:{PORT}")
            print("📁 Serving files from:", script_dir)
            print("🖼️  Make sure your images are in this directory:")
            for img in image_files:
                status = "✅" if os.path.exists(img) else "❌"
                print(f"   {status} {img}")
            print("\n🌐 Open your browser to: http://localhost:8000")
            print("⏹️  Press Ctrl+C to stop the server")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use. Try a different port:")
            print(f"   python server.py --port {PORT + 1}")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--help" or sys.argv[1] == "-h":
            print("Hybrid Images Server")
            print("Usage: python server.py [--port PORT]")
            print("Default port: 8000")
            sys.exit(0)
        elif sys.argv[1] == "--port" and len(sys.argv) > 2:
            try:
                PORT = int(sys.argv[2])
            except ValueError:
                print("Error: Port must be a number")
                sys.exit(1)
    
    main()
