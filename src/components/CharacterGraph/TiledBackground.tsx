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

    const gl = canvas.getContext("webgl2", { alpha: false });
    if (!gl) {
      console.error("[TiledBackground] WebGL2 not supported");
      return;
    }

    let isDestroyed = false;

    const vsSource = `#version 300 es
      in vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;
      uniform vec2 uResolution;
      uniform vec3 uTransform;
      uniform sampler2D uTexture;
      uniform float uTexSize;
      out vec4 fragColor;

      void main() {
        vec2 worldPos = (gl_FragCoord.xy - uTransform.xy) / uTransform.z;
        vec2 uv = worldPos / 1000.0;
        uv.y = -uv.y;
        vec4 texColor = texture(uTexture, uv);
        fragColor = vec4(texColor.rgb, 1.0);
      }
    `;

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

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    const image = new Image();

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTransform = gl.getUniformLocation(program, "uTransform");
    const uTexture = gl.getUniformLocation(program, "uTexture");

    // ResizeObserver를 사용하여 크기 변경 감지 (Reflow 방지)
    const observer = new ResizeObserver((entries) => {
      if (isDestroyed || !canvas) return;
      for (const entry of entries) {
        const width = Math.floor(entry.contentRect.width);
        const height = Math.floor(entry.contentRect.height);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
          // 크기가 바뀌면 즉시 재렌더링
          if (renderRef.current && zoomStateRef.current) {
            renderRef.current(zoomStateRef.current);
          }
        }
      }
    });
    observer.observe(canvas);

    renderRef.current = (z: ZoomState) => {
      if (!isTextureLoaded.current || isDestroyed) return;

      gl.useProgram(program);

      gl.uniform1i(uTexture, 0);
      gl.activeTexture(gl.TEXTURE0);
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
      if (isDestroyed) return;

      const cropMargin = 5;
      const targetWidth = Math.max(1, image.width - cropMargin * 2);
      const targetHeight = Math.max(1, image.height - cropMargin * 2);

      const offscreen = document.createElement("canvas");
      offscreen.width = targetWidth;
      offscreen.height = targetHeight;
      const ctx = offscreen.getContext("2d");

      if (ctx) {
        ctx.drawImage(
          image,
          cropMargin,
          cropMargin,
          targetWidth,
          targetHeight,
          0,
          0,
          targetWidth,
          targetHeight,
        );

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          offscreen,
        );
      } else {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image,
        );
      }

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.generateMipmap(gl.TEXTURE_2D);

      isTextureLoaded.current = true;
      if (renderRef.current) renderRef.current(zoomStateRef.current);
    };

    image.onerror = (e) => {
      if (isDestroyed) return;
      console.error("[TiledBackground] Failed to load texture", e);
    };

    image.src = "/assets/seamless_parchment_background.png";

    return () => {
      isDestroyed = true;
      observer.disconnect();
      isTextureLoaded.current = false;
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (gl.isTexture(texture)) gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
    };
  }, []);

  // RAF 중복 호출 제거: 상위 useZoom에서 이미 스로틀링된 상태를 받음
  useEffect(() => {
    zoomStateRef.current = zoomState;

    // 즉시 렌더링 (지연 방지)
    if (renderRef.current) {
      renderRef.current(zoomState);
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
