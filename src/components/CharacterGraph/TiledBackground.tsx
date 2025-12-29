import { useEffect, useRef } from "react";
import type { ZoomState } from "@/types/characterGraph";

interface TiledBackgroundProps {
  zoomState: ZoomState;
  className?: string;
}

export function TiledBackground({
  zoomState,
  className,
}: TiledBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderRef = useRef<((z: ZoomState) => void) | null>(null);
  const zoomStateRef = useRef(zoomState);
  const isTextureLoaded = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use WebGL2
    const gl = canvas.getContext("webgl2", { alpha: false });
    if (!gl) {
      console.error("[TiledBackground] WebGL2 not supported");
      return;
    }

    // Flag to prevent operations on destroyed context
    let isDestroyed = false;

    // GLSL 3.00 ES Shader sources (High Precision)
    const vsSource = `#version 300 es
      in vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;
      uniform vec2 uResolution;
      uniform vec3 uTransform; // x, y, scale
      uniform sampler2D uTexture;
      out vec4 fragColor;

      void main() {
        // 1. Calculate UV based on Fragment Coordinates vs Transform
        // uTransform.xy is translation in screen pixels.
        // uTransform.z is zoom scale.

        // (ScreenPos - Translate) / Scale = WorldPos
        vec2 worldPos = (gl_FragCoord.xy - uTransform.xy) / uTransform.z;

        // Normalize WorldPos to UV space (1024px = 1 tile)
        // Adjust for WebGL coordinates (Y is Up, but D3/DOM Y is Down)
        // If we want texture to align with DOM content, we might need to flip Y.

        vec2 uv = worldPos / 1024.0;

        // User Suggestion: uv.y = -uv.y to match coordinate systems
        uv.y = -uv.y;

        fragColor = texture(uTexture, uv);
      }
    `;

    // Compile shaders
    const compileShader = (type: number, source: string) => {
      if (isDestroyed) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    // Full screen quad
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Texture setup
    const texture = gl.createTexture();
    const image = new Image();

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTransform = gl.getUniformLocation(program, "uTransform");
    const uTexture = gl.getUniformLocation(program, "uTexture");

    const resize = () => {
      if (!canvas || isDestroyed) return;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    renderRef.current = (z: ZoomState) => {
      // Prevent rendering if texture not ready or context destroyed
      if (!isTextureLoaded.current || isDestroyed) return;

      resize();

      gl.useProgram(program);

      // Explicit Texture Unit Binding
      gl.uniform1i(uTexture, 0);
      gl.activeTexture(gl.TEXTURE0);

      // Guard against using deleted texture
      if (gl.isTexture(texture)) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
      } else {
        return;
      }

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform3f(uTransform, z.x, z.y, z.scale);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    image.onload = () => {
      if (isDestroyed) return; // Cleanup guard

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );

      // Use REPEAT (Standard)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.generateMipmap(gl.TEXTURE_2D);

      isTextureLoaded.current = true;

      // Initial draw
      if (renderRef.current) renderRef.current(zoomStateRef.current);
    };

    image.onerror = (e) => {
      if (isDestroyed) return;
      console.error("[TiledBackground] Failed to load texture", e);
    };

    image.src = "/assets/seamless_parchment_background.png";

    return () => {
      isDestroyed = true; // Set flag immediately
      isTextureLoaded.current = false;

      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (gl.isTexture(texture)) gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
    };
  }, []); // Run once to setup GL

  useEffect(() => {
    zoomStateRef.current = zoomState;
  }, [zoomState]);

  useEffect(() => {
    if (renderRef.current) {
      requestAnimationFrame(() => {
        renderRef.current?.(zoomState);
      });
    }
  }, [zoomState]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
