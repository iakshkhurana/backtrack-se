import { useEffect, useRef } from "react";

/**
 * Animated shader background with diagonal neon streaks effect.
 * WebGL-based, no external dependencies.
 */
export const ShaderBackground = ({ className = "" }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vertexSrc = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Diagonal neon streaks, moving top-left -> bottom-right
    const fragmentSrc = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;

      void main(){
        vec2 R = u_resolution;
        vec2 uv = (gl_FragCoord.xy - 0.5*R) / R.y;
        float t = u_time;

        // direction of streaks (normalized)
        vec2 dir = normalize(vec2(1.0, -0.6));

        // base color palette (purple/blue)
        vec3 col = vec3(0.0);

        // Create multiple streaks by iterating and offsetting
        for (int i = 0; i < 18; i++) {
          float fi = float(i);
          // each streak moves along the direction with different speed and offset
          float speed = mix(0.6, 1.6, fract(sin(fi*78.233)*43758.5453));
          float offset = fi*0.35;
          // position of line center along perpendicular axis
          float line = dot(uv, vec2(-dir.y, dir.x));
          float center = fract(line*2.0 + offset + t*speed);
          center = (center - 0.5);

          // distance from pixel to line center
          float d = abs(center);
          // thickness with soft core
          float thickness = 0.02; 
          float intensity = exp(-pow(d/thickness, 2.0));

          // add tail glow along the direction
          float along = dot(uv + dir*t*speed*0.2, dir);
          float tail = smoothstep(-0.6, 0.2, along);
          intensity *= tail;

          // color per streak
          vec3 c = mix(vec3(0.18,0.44,1.0), vec3(0.58,0.28,0.98), fract(fi*0.137));
          col += intensity * c;
        }

        // subtle vignette to keep edges dark
        float vign = smoothstep(1.2, 0.1, length(uv));
        col *= vign;

        // clamp for safety
        col = min(col, vec3(1.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vsh = createShader(gl.VERTEX_SHADER, vertexSrc);
    const fsh = createShader(gl.FRAGMENT_SHADER, fragmentSrc);
    if (!vsh || !fsh) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vsh);
    gl.attachShader(program, fsh);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Fullscreen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
      ]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    const onResize = () => resize();
    resize();
    window.addEventListener("resize", onResize);

    let start = performance.now();
    const loop = () => {
      const now = performance.now();
      const t = (now - start) / 1000;
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 -z-10 opacity-80 ${className}`}
    />
  );
};

