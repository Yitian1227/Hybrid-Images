// Vertex Shader
const vertexShaderSource = `
    precision mediump float;
    
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    
    uniform vec2 u_resolution;
    
    varying vec2 v_texCoord;
    
    void main() {
        // Convert from pixels to clip space
        vec2 clipSpace = ((a_position / u_resolution) * 2.0) - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        
        v_texCoord = a_texCoord;
    }
`;

// Fragment Shader for Low-Pass Filter (Gaussian Blur)
const lowPassFragmentShaderSource = `
    precision mediump float;
    
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform float u_blurRadius;
    uniform int u_iterations;
    
    varying vec2 v_texCoord;
    
    void main() {
        vec2 texelSize = 1.0 / u_resolution;
        vec4 color = vec4(0.0);
        float total = 0.0;
        
        // Simple Gaussian blur - no dynamic loops
        float offset = u_blurRadius;
        
        // Sample in a cross pattern for blur
        color += texture2D(u_texture, v_texCoord) * 4.0;
        total += 4.0;
        
        color += texture2D(u_texture, v_texCoord + vec2(offset * texelSize.x, 0.0)) * 2.0;
        color += texture2D(u_texture, v_texCoord + vec2(-offset * texelSize.x, 0.0)) * 2.0;
        color += texture2D(u_texture, v_texCoord + vec2(0.0, offset * texelSize.y)) * 2.0;
        color += texture2D(u_texture, v_texCoord + vec2(0.0, -offset * texelSize.y)) * 2.0;
        total += 8.0;
        
        color += texture2D(u_texture, v_texCoord + vec2(offset * texelSize.x, offset * texelSize.y)) * 1.0;
        color += texture2D(u_texture, v_texCoord + vec2(-offset * texelSize.x, offset * texelSize.y)) * 1.0;
        color += texture2D(u_texture, v_texCoord + vec2(offset * texelSize.x, -offset * texelSize.y)) * 1.0;
        color += texture2D(u_texture, v_texCoord + vec2(-offset * texelSize.x, -offset * texelSize.y)) * 1.0;
        total += 4.0;
        
        gl_FragColor = color / total;
    }
`;

// Fragment Shader for High-Pass Filter (Edge Enhancement)
const highPassFragmentShaderSource = `
    precision mediump float;
    
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform float u_edgeThreshold;
    uniform float u_edgeStrength;
    
    varying vec2 v_texCoord;
    
    void main() {
        vec2 texelSize = 1.0 / u_resolution;
        
        // Sample surrounding pixels
        vec4 center = texture2D(u_texture, v_texCoord);
        vec4 left = texture2D(u_texture, v_texCoord + vec2(-texelSize.x, 0.0));
        vec4 right = texture2D(u_texture, v_texCoord + vec2(texelSize.x, 0.0));
        vec4 top = texture2D(u_texture, v_texCoord + vec2(0.0, -texelSize.y));
        vec4 bottom = texture2D(u_texture, v_texCoord + vec2(0.0, texelSize.y));
        
        // Calculate gradient magnitude
        vec4 gradientX = right - left;
        vec4 gradientY = bottom - top;
        vec4 gradientMagnitude = sqrt(gradientX * gradientX + gradientY * gradientY);
        
        // High-pass filter: enhance edges and reduce low frequencies
        vec4 highPass = center - vec4(0.5) + gradientMagnitude * u_edgeStrength;
        
        // Apply threshold to enhance strong edges
        float edgeFactor = smoothstep(u_edgeThreshold, u_edgeThreshold + 0.1, length(gradientMagnitude.rgb));
        
        gl_FragColor = mix(center, highPass, edgeFactor);
    }
`;

// Fragment Shader for Hybrid Image Combination
const hybridFragmentShaderSource = `
    precision mediump float;
    
    uniform sampler2D u_lowPassTexture;
    uniform sampler2D u_highPassTexture;
    uniform float u_blendFactor;
    uniform float u_lowPassStrength;
    uniform float u_highPassStrength;
    
    varying vec2 v_texCoord;
    
    void main() {
        vec4 lowPass = texture2D(u_lowPassTexture, v_texCoord);
        vec4 highPass = texture2D(u_highPassTexture, v_texCoord);
        
        // Apply strength modifiers
        lowPass *= u_lowPassStrength;
        highPass *= u_highPassStrength;
        
        // Blend the two images
        vec4 hybrid = mix(lowPass, highPass, u_blendFactor);
        
        // Ensure we don't exceed valid color range
        hybrid = clamp(hybrid, 0.0, 1.0);
        
        gl_FragColor = hybrid;
    }
`;

// Fragment Shader for Display (Simple texture rendering)
const displayFragmentShaderSource = `
    precision mediump float;
    
    uniform sampler2D u_texture;
    
    varying vec2 v_texCoord;
    
    void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
    }
`;

// Side-by-side comparison shader
const comparisonFragmentShaderSource = `
    precision mediump float;
    
    uniform sampler2D u_texture1;
    uniform sampler2D u_texture2;
    
    varying vec2 v_texCoord;
    
    void main() {
        if (v_texCoord.x < 0.5) {
            // Left side - first image
            vec2 leftCoord = vec2(v_texCoord.x * 2.0, v_texCoord.y);
            gl_FragColor = texture2D(u_texture1, leftCoord);
        } else {
            // Right side - second image
            vec2 rightCoord = vec2((v_texCoord.x - 0.5) * 2.0, v_texCoord.y);
            gl_FragColor = texture2D(u_texture2, rightCoord);
        }
    }
`;
