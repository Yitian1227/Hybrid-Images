class HybridImageRenderer {
    constructor() {
        this.canvas = document.getElementById('glCanvas');
        this.gl = this.canvas.getContext('webgl', {
            preserveDrawingBuffer: true,
            antialias: true,
            alpha: false
        }) || this.canvas.getContext('experimental-webgl', {
            preserveDrawingBuffer: true,
            antialias: true,
            alpha: false
        });
        
        if (!this.gl) {
            alert('WebGL not supported');
            return;
        }
        
        console.log('✅ WebGL initialized successfully');
        
        this.textures = {};
        this.programs = {};
        this.framebuffers = {};
        this.currentView = 'hybrid';
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        this.setupGeometry();
        
        if (!this.createShaders()) {
            console.error('❌ Failed to create shaders. Application cannot continue.');
            return;
        }
        
        this.createFramebuffers();
        this.loadImages();
    }
    
    setupGeometry() {
        // Create a full-screen quad
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1,
        ]);
        
        const texCoords = new Float32Array([
            0, 1,
            1, 1,
            0, 0,
            0, 0,
            1, 1,
            1, 0,
        ]);
        
        // Create position buffer
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        
        // Create texture coordinate buffer
        this.texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
    }
    
    createShaders() {
        // Create all shader programs
        this.programs.lowPass = this.createProgram(vertexShaderSource, lowPassFragmentShaderSource);
        this.programs.highPass = this.createProgram(vertexShaderSource, highPassFragmentShaderSource);
        this.programs.hybrid = this.createProgram(vertexShaderSource, hybridFragmentShaderSource);
        this.programs.display = this.createProgram(vertexShaderSource, displayFragmentShaderSource);
        this.programs.comparison = this.createProgram(vertexShaderSource, comparisonFragmentShaderSource);
        
        // Check if all programs were created successfully
        const failedPrograms = Object.entries(this.programs).filter(([name, program]) => !program);
        if (failedPrograms.length > 0) {
            console.error('Failed to create shader programs:', failedPrograms.map(([name]) => name));
            return false;
        }
        
        console.log('✅ All shader programs created successfully');
        return true;
    }
    
    createProgram(vertexSource, fragmentSource) {
        const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
        
        if (!vertexShader || !fragmentShader) {
            console.error('Failed to compile shaders');
            return null;
        }
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program linking failed:', this.gl.getProgramInfoLog(program));
            return null;
        }
        
        console.log('✅ Shader program created successfully');
        return program;
    }
    
    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation failed:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createFramebuffers() {
        // Create framebuffers for intermediate rendering
        this.framebuffers.lowPass = this.createFramebuffer();
        this.framebuffers.highPass = this.createFramebuffer();
        this.framebuffers.blur = this.createFramebuffer();
        this.framebuffers.blur2 = this.createFramebuffer(); // Additional buffer for ping-pong blur
    }
    
    createFramebuffer() {
        const framebuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.canvas.width, this.canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
        
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        
        return {
            framebuffer: framebuffer,
            texture: texture
        };
    }
    
    loadImages() {
        this.loadImage('image1', '3368325a22bfe52474398206c1b19357.jpg', () => {
            this.loadImage('image2', 'Gemini_Generated_Image_17qzf017qzf017qz__1_-removebg-preview.png', () => {
                this.render();
            });
        });
    }
    
    loadImage(name, src, callback) {
        const img = new Image();
        // Set crossOrigin to anonymous to allow WebGL texture loading
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            console.log(`✅ Image loaded: ${name} (${src})`);
            console.log(`📏 Image dimensions: ${img.width} x ${img.height}`);
            const texture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            
            this.textures[name] = texture;
            
            // Test render the first image immediately
            if (name === 'image1') {
                console.log('🧪 Testing direct render of image1...');
                this.testRenderImage(texture);
            }
            
            callback();
        };
        
        img.onerror = (error) => {
            console.error(`❌ Failed to load image: ${name} (${src})`, error);
            
            // Check if this is a CORS-related error
            if (src.includes('http') && !src.includes('localhost')) {
                console.error(`🚫 CORS Error: Image ${name} cannot be loaded due to cross-origin restrictions.`);
                console.error(`💡 Solution: Make sure the image is served from the same origin or has proper CORS headers.`);
                console.error(`💡 Alternative: Use the file upload feature to load images from your local computer.`);
            }
            
            // Create a fallback texture with a solid color
            const texture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            const fallbackColor = name === 'image1' ? [1, 0, 0, 1] : [0, 1, 0, 1]; // Red or Green
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array(fallbackColor.map(c => c * 255)));
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            
            this.textures[name] = texture;
            callback();
        };
        
        console.log(`🔄 Loading image: ${name} from ${src}`);
        img.src = src;
    }
    
    testRenderImage(texture) {
        console.log('🧪 Starting test render...');
        
        // Set up a simple render to test if the texture works
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.useProgram(this.programs.display);
        
        this.setupAttributes(this.programs.display);
        this.setUniforms(this.programs.display, {
            u_texture: texture
        });
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.0, 0.5, 0.0, 1.0); // Green background for testing
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        
        const error = this.gl.getError();
        if (error !== this.gl.NO_ERROR) {
            console.error('❌ WebGL error during test render:', error);
        } else {
            console.log('✅ Test render completed successfully - You should see a GREEN canvas with your image!');
        }
    }
    
    setupEventListeners() {
        // View toggle buttons
        document.getElementById('hybridView').addEventListener('click', () => this.setView('hybrid'));
        document.getElementById('lowPassView').addEventListener('click', () => this.setView('lowPass'));
        document.getElementById('highPassView').addEventListener('click', () => this.setView('highPass'));
        document.getElementById('originalView').addEventListener('click', () => this.setView('original'));
        
        // Control sliders
        this.setupSlider('blendFactor', 'blendValue', 0.5);
        this.setupSlider('blurIterations', 'blurValue', 3);
        this.setupSlider('lowPassStrength', 'lowPassValue', 1.0);
        this.setupSlider('highPassStrength', 'highPassValue', 1.0);
        
        // Window resize
        window.addEventListener('resize', () => this.resize());
        
        // File upload handlers
        this.setupFileUploads();
    }
    
    setupSlider(sliderId, inputId, defaultValue) {
        const slider = document.getElementById(sliderId);
        const input = document.getElementById(inputId);
        
        slider.addEventListener('input', (e) => {
            input.value = e.target.value;
            this.render();
        });
        
        input.addEventListener('input', (e) => {
            slider.value = e.target.value;
            this.render();
        });
        
        slider.value = defaultValue;
        input.value = defaultValue;
    }
    
    setupFileUploads() {
        const lowPassUpload = document.getElementById('lowPassUpload');
        const highPassUpload = document.getElementById('highPassUpload');
        const loadButton = document.getElementById('loadUploadedImages');
        const lowPassFileName = document.getElementById('lowPassFileName');
        const highPassFileName = document.getElementById('highPassFileName');
        
        let lowPassFile = null;
        let highPassFile = null;
        
        lowPassUpload.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                lowPassFile = e.target.files[0];
                lowPassFileName.textContent = lowPassFile.name;
                this.updateLoadButton();
            }
        });
        
        highPassUpload.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                highPassFile = e.target.files[0];
                highPassFileName.textContent = highPassFile.name;
                this.updateLoadButton();
            }
        });
        
        loadButton.addEventListener('click', () => {
            if (lowPassFile && highPassFile) {
                console.log('📁 Loading uploaded images...');
                this.loadUploadedImages(lowPassFile, highPassFile);
            }
        });
        
        this.updateLoadButton = () => {
            loadButton.disabled = !(lowPassFile && highPassFile);
        };
    }
    
    loadUploadedImages(lowPassFile, highPassFile) {
        console.log('📁 Processing uploaded files...');
        
        // Clear existing textures
        this.textures = {};
        
        // Load low-pass image
        this.loadImageFromFile('image1', lowPassFile, () => {
            // Load high-pass image
            this.loadImageFromFile('image2', highPassFile, () => {
                console.log('✅ Both uploaded images loaded successfully!');
                this.render();
            });
        });
    }
    
    loadImageFromFile(name, file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                console.log(`✅ Uploaded image loaded: ${name} (${img.width}x${img.height})`);
                const texture = this.gl.createTexture();
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                
                this.textures[name] = texture;
                
                // Test render the first uploaded image immediately
                if (name === 'image1') {
                    console.log('🧪 Testing direct render of uploaded image1...');
                    this.testRenderImage(texture);
                }
                
                callback();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    setView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.view-toggle button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(view + 'View').classList.add('active');
        
        this.render();
    }
    
    render() {
        if (!this.textures.image1 || !this.textures.image2) {
            console.log('⚠️ Textures not ready yet:', {
                image1: !!this.textures.image1,
                image2: !!this.textures.image2
            });
            return;
        }
        
        console.log('🎨 Rendering with view:', this.currentView);
        console.log('📐 Canvas size:', this.canvas.width, 'x', this.canvas.height);
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.2, 0.2, 0.2, 1.0); // Set a visible background color
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        switch (this.currentView) {
            case 'hybrid':
                this.renderHybrid();
                break;
            case 'lowPass':
                this.renderLowPass();
                break;
            case 'highPass':
                this.renderHighPass();
                break;
            case 'original':
                this.renderOriginal();
                break;
        }
        
        console.log('✅ Render completed for view:', this.currentView);
    }
    
    renderHybrid() {
        // First, apply low-pass filter to image1
        const lowPassTexture = this.applyLowPassFilter(this.textures.image1);
        
        // Then, apply high-pass filter to image2
        const highPassTexture = this.applyHighPassFilter(this.textures.image2);
        
        // Finally, combine them
        this.combineImages(lowPassTexture, highPassTexture);
    }
    
    applyLowPassFilter(sourceTexture) {
        const iterations = parseInt(document.getElementById('blurIterations').value);
        const blurRadius = parseFloat(document.getElementById('lowPassStrength').value) * 2.0;
        
        let currentTexture = sourceTexture;
        let targetFramebuffer = this.framebuffers.blur;
        
        // Apply multiple blur passes using ping-pong buffers to avoid feedback loops
        for (let i = 0; i < iterations; i++) {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, targetFramebuffer.framebuffer);
            this.gl.useProgram(this.programs.lowPass);
            
            this.setupAttributes(this.programs.lowPass);
            this.setUniforms(this.programs.lowPass, {
                u_texture: currentTexture,
                u_resolution: [this.canvas.width, this.canvas.height],
                u_blurRadius: blurRadius,
                u_iterations: 1
            });
            
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
            
            // Ping-pong between buffers to avoid feedback loop
            currentTexture = targetFramebuffer.texture;
            targetFramebuffer = (targetFramebuffer === this.framebuffers.blur) ? 
                               this.framebuffers.blur2 : this.framebuffers.blur;
        }
        
        return currentTexture;
    }
    
    applyHighPassFilter(sourceTexture) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffers.highPass.framebuffer);
        this.gl.useProgram(this.programs.highPass);
        
        this.setupAttributes(this.programs.highPass);
        this.setUniforms(this.programs.highPass, {
            u_texture: sourceTexture,
            u_resolution: [this.canvas.width, this.canvas.height],
            u_edgeThreshold: 0.1,
            u_edgeStrength: parseFloat(document.getElementById('highPassStrength').value)
        });
        
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        
        return this.framebuffers.highPass.texture;
    }
    
    combineImages(lowPassTexture, highPassTexture) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.useProgram(this.programs.hybrid);
        
        this.setupAttributes(this.programs.hybrid);
        this.setUniforms(this.programs.hybrid, {
            u_lowPassTexture: lowPassTexture,
            u_highPassTexture: highPassTexture,
            u_blendFactor: parseFloat(document.getElementById('blendFactor').value),
            u_lowPassStrength: parseFloat(document.getElementById('lowPassStrength').value),
            u_highPassStrength: parseFloat(document.getElementById('highPassStrength').value)
        });
        
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
    
    renderLowPass() {
        const lowPassTexture = this.applyLowPassFilter(this.textures.image1);
        this.renderTexture(lowPassTexture);
    }
    
    renderHighPass() {
        const highPassTexture = this.applyHighPassFilter(this.textures.image2);
        this.renderTexture(highPassTexture);
    }
    
    renderOriginal() {
        this.gl.useProgram(this.programs.comparison);
        this.setupAttributes(this.programs.comparison);
        this.setUniforms(this.programs.comparison, {
            u_texture1: this.textures.image1,
            u_texture2: this.textures.image2
        });
        
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
    
    renderTexture(texture) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.useProgram(this.programs.display);
        
        this.setupAttributes(this.programs.display);
        this.setUniforms(this.programs.display, {
            u_texture: texture
        });
        
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        
        // Check for WebGL errors
        const error = this.gl.getError();
        if (error !== this.gl.NO_ERROR) {
            console.warn('WebGL error during render:', error);
        }
    }
    
    setupAttributes(program) {
        // Position attribute
        const positionLocation = this.gl.getAttribLocation(program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        
        // Texture coordinate attribute
        const texCoordLocation = this.gl.getAttribLocation(program, 'a_texCoord');
        this.gl.enableVertexAttribArray(texCoordLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
    }
    
    setUniforms(program, uniforms) {
        for (const [name, value] of Object.entries(uniforms)) {
            const location = this.gl.getUniformLocation(program, name);
            if (location === null) continue;
            
            if (Array.isArray(value)) {
                if (value.length === 2) {
                    this.gl.uniform2fv(location, value);
                } else if (value.length === 3) {
                    this.gl.uniform3fv(location, value);
                } else if (value.length === 4) {
                    this.gl.uniform4fv(location, value);
                }
            } else if (typeof value === 'number') {
                this.gl.uniform1f(location, value);
            } else if (typeof value === 'object' && value.constructor === WebGLTexture) {
                // Handle texture uniforms
                const textureUnit = this.getTextureUnit();
                this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
                this.gl.bindTexture(this.gl.TEXTURE_2D, value);
                this.gl.uniform1i(location, textureUnit);
            }
        }
    }
    
    getTextureUnit() {
        if (!this.textureUnit) this.textureUnit = 0;
        return this.textureUnit++;
    }
    
    resize() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            
            // Recreate framebuffers with new size
            this.createFramebuffers();
            
            this.render();
        }
    }
}

// Initialize the application when the page loads
window.addEventListener('load', () => {
    new HybridImageRenderer();
});
