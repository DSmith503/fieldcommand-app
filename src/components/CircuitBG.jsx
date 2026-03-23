import { useEffect, useRef } from 'react';

export default function CircuitBG() {
  const ref = useRef(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 2;
    let W, H, animId;

    function resize() {
      W = c.offsetWidth * dpr;
      H = c.offsetHeight * dpr;
      c.width = W;
      c.height = H;
    }
    resize();
    window.addEventListener('resize', resize);

    const GRID = 40 * dpr;
    const cols = Math.ceil(W / GRID) + 1;
    const rows = Math.ceil(H / GRID) + 1;

    const junctions = [];
    for (let r = 0; r < rows; r++) {
      for (let cl = 0; cl < cols; cl++) {
        if (Math.random() < 0.3) {
          junctions.push({
            x: cl * GRID, y: r * GRID,
            active: Math.random() < 0.4,
            pulse: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.03 + 0.008,
            type: Math.random() > 0.65 ? 'cyan' : 'gold'
          });
        }
      }
    }

    const traces = [];
    for (let i = 0; i < 50; i++) {
      const sx = Math.floor(Math.random() * cols) * GRID;
      const sy = Math.floor(Math.random() * rows) * GRID;
      const path = [{ x: sx, y: sy }];
      let cx = sx, cy = sy;
      const steps = Math.floor(Math.random() * 6) + 3;
      for (let s = 0; s < steps; s++) {
        const dir = Math.random() > 0.5;
        const dist = (Math.floor(Math.random() * 4) + 1) * GRID;
        if (dir) cx += (Math.random() > 0.5 ? 1 : -1) * dist;
        else cy += (Math.random() > 0.5 ? 1 : -1) * dist;
        cx = Math.max(0, Math.min(W, cx));
        cy = Math.max(0, Math.min(H, cy));
        path.push({ x: cx, y: cy });
      }
      traces.push({ path, progress: Math.random(), speed: Math.random() * 0.004 + 0.001, type: Math.random() > 0.6 ? 'cyan' : 'gold' });
    }

    const floaters = [];
    for (let i = 0; i < 25; i++) {
      floaters.push({ x: Math.random() * W, y: Math.random() * H, vy: -(Math.random() * 0.3 + 0.1) * dpr, r: (Math.random() * 1.5 + 0.5) * dpr, life: Math.random(), decay: Math.random() * 0.002 + 0.0005, type: Math.random() > 0.5 ? 'gold' : 'cyan' });
    }

    function goldC(a) { return `rgba(203,161,53,${a})`; }
    function cyanC(a) { return `rgba(58,180,220,${a})`; }
    function getC(type, a) { return type === 'cyan' ? cyanC(a) : goldC(a); }

    ctx.fillStyle = '#030305';
    ctx.fillRect(0, 0, W, H);

    function draw() {
      ctx.fillStyle = 'rgba(3,3,5,0.12)';
      ctx.fillRect(0, 0, W, H);

      traces.forEach(tr => {
        tr.progress += tr.speed;
        if (tr.progress > 1) tr.progress = 0;
        const totalLen = tr.path.reduce((s, p, i) => {
          if (i === 0) return 0;
          return s + Math.abs(p.x - tr.path[i - 1].x) + Math.abs(p.y - tr.path[i - 1].y);
        }, 0);
        ctx.strokeStyle = getC(tr.type, 0.06);
        ctx.lineWidth = 0.5 * dpr;
        ctx.beginPath();
        tr.path.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();
        const pulsePos = tr.progress * totalLen;
        let accum = 0;
        for (let i = 1; i < tr.path.length; i++) {
          const segLen = Math.abs(tr.path[i].x - tr.path[i - 1].x) + Math.abs(tr.path[i].y - tr.path[i - 1].y);
          if (accum + segLen >= pulsePos) {
            const t = (pulsePos - accum) / segLen;
            const px = tr.path[i - 1].x + (tr.path[i].x - tr.path[i - 1].x) * t;
            const py = tr.path[i - 1].y + (tr.path[i].y - tr.path[i - 1].y) * t;
            ctx.beginPath();
            ctx.arc(px, py, 2 * dpr, 0, Math.PI * 2);
            ctx.fillStyle = getC(tr.type, 0.6);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px, py, 6 * dpr, 0, Math.PI * 2);
            ctx.fillStyle = getC(tr.type, 0.08);
            ctx.fill();
            break;
          }
          accum += segLen;
        }
      });

      junctions.forEach(j => {
        j.pulse += j.speed;
        const glow = (Math.sin(j.pulse) + 1) / 2;
        if (j.active) {
          ctx.beginPath();
          ctx.arc(j.x, j.y, (3 + glow * 3) * dpr, 0, Math.PI * 2);
          ctx.fillStyle = getC(j.type, 0.04 + glow * 0.06);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(j.x, j.y, (1 + glow) * dpr, 0, Math.PI * 2);
          ctx.fillStyle = getC(j.type, 0.3 + glow * 0.5);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(j.x, j.y, 0.5 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = getC(j.type, 0.1);
          ctx.fill();
        }
      });

      floaters.forEach(p => {
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0 || p.y < -10) { p.y = H + 10; p.x = Math.random() * W; p.life = 1; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fillStyle = getC(p.type, p.life * 0.35);
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />;
}
