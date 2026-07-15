// <line-art> — small animated concept sketches. kind: rag | power | ahs | ml
// Attributes: kind, stroke, accent
(function () {
  if (customElements.get('line-art')) return;
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  class LineArt extends HTMLElement {
    connectedCallback() {
      this.style.display = 'block'; this.style.width = '100%'; this.style.height = '100%'; this.style.overflow = 'hidden';
      this._c = document.createElement('canvas');
      this._c.style.cssText = 'width:100%;height:100%;display:block;';
      this.appendChild(this._c);
      this._x = this._c.getContext('2d');
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this);
      this._resize();
      this._t0 = performance.now();
      const loop = () => { this._draw(); this._raf = requestAnimationFrame(loop); };
      this._raf = requestAnimationFrame(loop);
    }
    disconnectedCallback() { cancelAnimationFrame(this._raf); this._ro && this._ro.disconnect(); }
    _resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this._w = this.clientWidth || 200; this._h = this.clientHeight || 110;
      this._c.width = this._w * dpr; this._c.height = this._h * dpr; this._dpr = dpr;
    }
    _draw() {
      const ctx = this._x; if (!ctx || !this._w) return;
      const w = this._w, h = this._h;
      const stroke = this.getAttribute('stroke') || 'rgba(60,60,60,.6)';
      const accent = this.getAttribute('accent') || '#c97b3d';
      const kind = this.getAttribute('kind') || 'rag';
      const t = (performance.now() - this._t0) / 1000;
      ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      const P = 10; // padding

      if (kind === 'rag') {
        // historical case dots converge on one solution node
        const rnd = mulberry32(11);
        const nodes = [];
        for (let i = 0; i < 14; i++) nodes.push([P + rnd() * (w * 0.55), P + rnd() * (h - 2 * P)]);
        const tx = w - P - 14, ty = h / 2;
        ctx.strokeStyle = stroke;
        nodes.forEach((n, i) => {
          ctx.globalAlpha = 0.35;
          ctx.setLineDash([3, 4]);
          ctx.lineDashOffset = -t * 14 - i * 3;
          ctx.beginPath(); ctx.moveTo(n[0], n[1]);
          ctx.quadraticCurveTo((n[0] + tx) / 2, n[1], tx, ty); ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = stroke;
        nodes.forEach(n => { ctx.beginPath(); ctx.arc(n[0], n[1], 2, 0, 7); ctx.fill(); });
        // solution node pulse
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(tx, ty, 4.5, 0, 7); ctx.fill();
        ctx.strokeStyle = accent;
        const pr = 6 + (t * 10 % 12);
        ctx.globalAlpha = Math.max(0, 1 - pr / 18);
        ctx.beginPath(); ctx.arc(tx, ty, pr, 0, 7); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (kind === 'power') {
        // two zero-emissions haul trucks: battery-electric (charging via MCS) + hydrogen fuel cell
        const drawTruck = (cx, cy, W) => {
          const H = W * 0.42;
          const by = cy + H * 0.5;
          ctx.strokeStyle = stroke; ctx.globalAlpha = 0.9;
          [[-0.3], [0.32]].forEach(p => {
            const wx = cx + p[0] * W, wr = H * 0.3;
            ctx.beginPath(); ctx.arc(wx, by, wr, 0, 7); ctx.stroke();
            ctx.beginPath(); ctx.arc(wx, by, wr * 0.35, 0, 7); ctx.stroke();
          });
          ctx.beginPath();
          ctx.moveTo(cx - W * 0.52, cy - H * 0.62);
          ctx.lineTo(cx + W * 0.12, cy - H * 0.28);
          ctx.lineTo(cx + W * 0.14, cy - H * 0.62);
          ctx.lineTo(cx + W * 0.44, cy - H * 0.62);
          ctx.lineTo(cx + W * 0.5, cy - H * 0.1);
          ctx.lineTo(cx + W * 0.5, cy + H * 0.18);
          ctx.lineTo(cx - W * 0.44, cy + H * 0.18);
          ctx.closePath();
          ctx.stroke();
        };
        const W = Math.min(w * 0.3, h * 1.2);
        const y = h * 0.45;
        const x1 = w * 0.3, x2 = w * 0.75;
        drawTruck(x1, y, W);
        drawTruck(x2, y, W);
        ctx.font = '9px "IBM Plex Mono", monospace';
        ctx.fillStyle = stroke; ctx.globalAlpha = 0.9;
        ctx.textAlign = 'center';
        ctx.fillText('BEV', x1, h - 4);
        ctx.fillText('H2 FUEL CELL', x2, h - 4);
        // battery pack on BEV truck, cells filling at 2C
        const bw = W * 0.36, bh = Math.max(7, W * 0.14);
        const bx = x1 - bw / 2, byy = y - bh / 2 + W * 0.02;
        ctx.strokeStyle = accent; ctx.globalAlpha = 1;
        ctx.strokeRect(bx, byy, bw, bh);
        const cells = 4, fill = (t * 1.2) % (cells + 1);
        ctx.fillStyle = accent;
        for (let i = 0; i < Math.min(cells, fill); i++)
          ctx.fillRect(bx + 2 + i * (bw - 4) / cells, byy + 2, (bw - 4) / cells - 2, bh - 4);
        // MCS charger post + cable with energy pulse
        const px2 = Math.max(8, x1 - W * 0.85);
        ctx.strokeStyle = accent;
        ctx.beginPath(); ctx.moveTo(px2, y + W * 0.25); ctx.lineTo(px2, y - W * 0.12); ctx.stroke();
        const cy0 = y - W * 0.06, cmx = (px2 + bx) / 2, cmy = y + W * 0.16, cex = bx, cey = byy + bh / 2;
        ctx.beginPath(); ctx.moveTo(px2, cy0); ctx.quadraticCurveTo(cmx, cmy, cex, cey); ctx.stroke();
        const cp = (t * 0.7) % 1;
        const qx = (1 - cp) * (1 - cp) * px2 + 2 * (1 - cp) * cp * cmx + cp * cp * cex;
        const qy = (1 - cp) * (1 - cp) * cy0 + 2 * (1 - cp) * cp * cmy + cp * cp * cey;
        ctx.beginPath(); ctx.arc(qx, qy, 2.5, 0, 7); ctx.fill();
        // H2 tank on FC truck + venting bubbles
        const tw = W * 0.32, th2 = Math.max(7, W * 0.13);
        ctx.strokeStyle = accent;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x2 - tw / 2, y - th2 / 2 + W * 0.02, tw, th2, th2 / 2); else ctx.rect(x2 - tw / 2, y - th2 / 2 + W * 0.02, tw, th2);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.font = '8px "IBM Plex Mono", monospace';
        ctx.fillText('H2', x2, y + W * 0.02 + 3);
        for (let i = 0; i < 3; i++) {
          const bt = (t * 0.5 + i / 3) % 1;
          ctx.globalAlpha = 1 - bt;
          ctx.beginPath(); ctx.arc(x2 + tw * 0.62, y - bt * h * 0.28, 1.5 + bt * 2, 0, 7); ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.textAlign = 'left';
      } else if (kind === 'ahs') {
        // plan-view haul loop, load + dump nodes, trucks circulating
        const cx = w / 2, cy = h / 2, rx = w / 2 - P - 8, ry = h / 2 - P;
        const pt = (a) => [cx + Math.cos(a) * rx * (1 + 0.12 * Math.sin(a * 2)), cy + Math.sin(a) * ry];
        ctx.strokeStyle = stroke; ctx.globalAlpha = 0.7;
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) { const [x, y] = pt(i / 80 * Math.PI * 2); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.closePath(); ctx.stroke();
        // nodes
        ctx.fillStyle = stroke; ctx.globalAlpha = 0.9;
        const [lx, ly] = pt(Math.PI); const [dx2, dy2] = pt(0);
        ctx.strokeRect(lx - 5, ly - 5, 10, 10);
        ctx.strokeRect(dx2 - 5, dy2 - 5, 10, 10);
        // trucks
        ctx.fillStyle = accent; ctx.globalAlpha = 1;
        for (let k = 0; k < 3; k++) {
          const a = t * 0.5 + k * (Math.PI * 2 / 3);
          const [x, y] = pt(a);
          ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill();
        }
      } else if (kind === 'ml') {
        // rock size scatter with detection threshold; scan line flags oversize
        const rnd = mulberry32(23);
        ctx.strokeStyle = stroke;
        const th = h * 0.38;
        ctx.globalAlpha = 0.9; ctx.setLineDash([4, 3]);
        ctx.strokeStyle = accent;
        ctx.beginPath(); ctx.moveTo(P, th); ctx.lineTo(w - P, th); ctx.stroke();
        ctx.setLineDash([]);
        const scan = P + ((t * 30) % (w - 2 * P));
        for (let i = 0; i < 22; i++) {
          const x = P + rnd() * (w - 2 * P);
          const y = P + rnd() * (h - 2 * P);
          const r = 1.5 + rnd() * 3.5;
          const over = y < th;
          ctx.globalAlpha = x < scan ? 0.9 : 0.3;
          ctx.strokeStyle = over ? accent : stroke;
          ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
          if (over && x < scan) { ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, 7); ctx.stroke(); }
        }
        ctx.strokeStyle = stroke; ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.moveTo(scan, P); ctx.lineTo(scan, h - P); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
  customElements.define('line-art', LineArt);
})();
