import { useEffect, useRef } from 'react';
import './zigzag.css';

export default function ZigZag() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize);

    let rotAngle = 0;

    function iso(x, y, z) {
      const tilt = 0.45;
      const scale = Math.min(window.innerWidth, window.innerHeight) * 0.45;
      let cx = x - 0.5, cy = y - 0.5, cz = z - 0.5;

      const cos = Math.cos(rotAngle), sin = Math.sin(rotAngle);
      const rx = cx * cos - cz * sin, rz = cx * sin + cz * cos;

      const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const ry = cy * cosT - rz * sinT, rz2 = cy * sinT + rz * cosT;

      const px = rx * scale, py = -ry * scale;
      return [window.innerWidth / 2 + px, window.innerHeight / 2 + py];
    }

    function zz(x, period) {
      return Math.abs(((x % period) + period) % period - period * 0.5) / (period * 0.5);
    }

    function line3d(x0, y0, z0, x1, y1, z1, color, width) {
      const [sx0, sy0] = iso(x0, y0, z0), [sx1, sy1] = iso(x1, y1, z1);
      ctx.beginPath();
      ctx.moveTo(sx0, sy0);
      ctx.lineTo(sx1, sy1);
      ctx.strokeStyle = color;
      ctx.lineWidth = width || 1;
      ctx.stroke();
    }

    function drawCube() {
      const c = 'rgba(255,255,255, .25)';
      // bottom face
      line3d(0,0,0, 1,0,0, c); line3d(1,0,0, 1,0,1, c);
      line3d(1,0,1, 0,0,1, c); line3d(0,0,1, 0,0,0, c);
      // top face
      line3d(0,1,0, 1,1,0, c); line3d(1,1,0, 1,1,1, c);
      line3d(1,1,1, 0,1,1, c); line3d(0,1,1, 0,1,0, c);
      // verticals
      line3d(0,0,0, 0,1,0, c); line3d(1,0,0, 1,1,0, c);
      line3d(1,0,1, 1,1,1, c); line3d(0,0,1, 0,1,1, c);
    }

    function drawAxisLabels() {
      ctx.font = '14px Space Mono';
      ctx.textAlign = 'center';
      const [rx, ry] = iso(1.12, 0, 0); ctx.fillStyle = '#ff4444'; ctx.fillText('R', rx, ry);
      const [gx, gy] = iso(0, 1.12, 0); ctx.fillStyle = '#44ff44'; ctx.fillText('G', gx, gy);
      const [bx, by] = iso(0, 0, 1.12); ctx.fillStyle = '#4488ff'; ctx.fillText('B', bx, by);
    }

    let prev = performance.now(), phase = 0;

    function frame(now) {
      const dt = (now - prev) / 1000;
      prev = now;
      phase += dt * 0.8;
      rotAngle += dt * 0.2;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      drawCube();
      drawAxisLabels();

      const steps = 600;
      const spread = zz(phase * 0.3, 2.0) * 0.8 + 0.2;
      let lastPt = null;

      let nr, ng, nb, dx, dy;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const base = t * 4 + phase;
        const r = zz(base, 2);
        const g = zz(base + spread, 2);
        const b = zz(base + spread*2, 2);
        const pt = iso(r, g, b);
        if (lastPt) {
          ctx.beginPath();
          ctx.moveTo(lastPt[0], lastPt[1]);
          ctx.lineTo(pt[0], pt[1]);
          ctx.strokeStyle = `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;
          ctx.lineWidth = 1.25;
          ctx.stroke();
        }
        lastPt = pt;

        // laatste punt voor swatch
        if(i === steps) { nr = r; ng = g; nb = b; [dx, dy] = pt; }
      }

      const colStr = `rgb(${Math.round(nr*255)},${Math.round(ng*255)},${Math.round(nb*255)})`;

      // kleine swatch rechtsboven
      const sw = 48;
      const sx = window.innerWidth - sw - 24;
      const sy = 24;
      ctx.beginPath();
      ctx.arc(sx + sw/2, sy + sw/2, sw/2, 0, Math.PI * 2);
      ctx.fillStyle = colStr;
      ctx.fill();
      ctx.strokeStyle = 'rgb(255 255 255)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // RGB tekst onder swatch
      ctx.font = '11px Space Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(nr*255)} ${Math.round(ng*255)} ${Math.round(nb*255)}`, sx + sw/2, sy + sw + 16);

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div>
      <canvas ref={canvasRef}></canvas>
      <div className="overlay"><pre>ZigZag RGB</pre></div>
    </div>
  );
}