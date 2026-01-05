export const fogVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fogFragmentShader = `
uniform float uTime;
uniform float uFlashIntensity;
uniform vec2 uRevealCenter;
uniform float uRevealRadius; // 0.0 to ~1.5
uniform vec2 uResolution;

varying vec2 vUv;

// Random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise(in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

// Fractal Brownian Motion
#define OCTAVES 5
float fbm(in vec2 st) {
    // Initial values
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    //
    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    // Aspect ratio correction (assume square UV for noise uniformity, but mapped to screen)
    // For fog, direct UV is usually fine, maybe slight scaling.
    vec2 uv = vUv;

    // 1. The Fog (FBM Noise)
    // Deep Greys (#1a1a1a to #2a2a2a)
    vec3 colorDark = vec3(0.10, 0.10, 0.10); // #1a1a1a
    vec3 colorLight = vec3(0.16, 0.16, 0.16); // #2a2a2a

    // Move fog over time
    float timeScale = uTime * 0.1;
    // fbm input scaling
    vec2 noiseUV = uv * 3.0 + vec2(timeScale * 0.5, timeScale);

    float fogValue = fbm(noiseUV);

    // Mix colors based on noise
    vec3 fogColor = mix(colorDark, colorLight, fogValue);

    // 2. The Red Flash (Detection)
    // Normalized distance from center
    // Adjust aspect ratio for distance calculation to make it circular
    float aspect = uResolution.x / uResolution.y;
    vec2 aspectUV = vec2(uv.x * aspect, uv.y);
    vec2 aspectCenter = vec2(uRevealCenter.x * aspect, uRevealCenter.y);

    float dist = distance(aspectUV, aspectCenter);

    // Flash glow intensity
    // Inverse distance squared for soft glow
    float glow = 1.0 / (dist * 10.0 + 0.5) * uFlashIntensity;

    // Red color #FF3B30 -> vec3(1.0, 0.23, 0.188)
    vec3 redColor = vec3(1.0, 0.23, 0.188);

    // Additive mixing for the flash
    vec3 finalColor = mix(fogColor, redColor, clamp(glow, 0.0, 0.8));

    // 3. The Reveal (Shockwave/Hole)

    // Smoothstep for soft edge
    // Make the hole expand
    // uRevealRadius controls the size of the hole

    // Edge width
    float edgeWidth = 0.2;
    float innerEdge = uRevealRadius;
    float outerEdge = uRevealRadius + edgeWidth;

    // Mask: 0.0 inside hole, 1.0 outside
    float mask = smoothstep(innerEdge, outerEdge, dist);

    // Optional: burn/highlight edge
    // A thin ring at the edge of the hole
    float rim = smoothstep(innerEdge, innerEdge + 0.05, dist) * (1.0 - smoothstep(outerEdge - 0.05, outerEdge, dist));
    // Add rim light (white) to the edge
    finalColor += vec3(0.5) * rim * mask; // modulate by mask to ensure it disappears inside

    // Final alpha
    // We want the fog to be opaque (alpha 1) where mask is 1, and transparent where mask is 0
    // But maybe the fog itself should be slightly transparent?
    // The prompt implies "dense" fog, so alpha ~1.0 or high is good.
    // Let's set base alpha to 0.95 for a slight see-through feel if desired, or 1.0.
    // Using 1.0 for "Fog of War" usu. means opaque.

    float alpha = mask;

    gl_FragColor = vec4(finalColor, alpha);
}
`;
