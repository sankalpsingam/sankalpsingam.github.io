// <rag-demo> — interactive demo of the RAG diagnostic agent.
// Click a fault: the agent scans historical cases, converges on matches, returns a verified fix.
// Attributes: ink, muted, accent, line, font, mono
(function () {
  if (customElements.get('rag-demo')) return;

  const FAULTS = [
    {
      label: 'Traction inverter overtemp',
      code: 'FLT-2214',
      cases: 38, top: 96,
      fix: 'Coolant pump cavitation confirmed against 38 resolved cases. Replace pump impeller and bleed circuit — verified fix in 96% of matches.',
      time: '4.2h → 40min'
    },
    {
      label: 'Autonomy comms dropout',
      code: 'FLT-0871',
      cases: 61, top: 92,
      fix: 'Pattern matches LTE handover failures on ridge sections. Re-sequence radio priority table — verified across 61 historical cases.',
      time: '6h → 55min'
    },
    {
      label: 'Hydraulic pressure fault',
      code: 'FLT-1509',
      cases: 27, top: 94,
      fix: 'Signature matches accumulator pre-charge drift. Re-charge to spec and update PM interval — verified fix in 27 prior cases.',
      time: '3.5h → 30min'
    }
  ];

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  class RagDemo extends HTMLElement {
    connectedCallback() {
      const ink = this.getAttribute('ink') || '#1c1a16';
      const muted = this.getAttribute('muted') || '#857e71';
      const accent = this.getAttribute('accent') || '#a2680f';
      const line = this.getAttribute('line') || '#e2ddd2';
      const font = this.getAttribute('font') || "'Archivo', sans-serif";
      const mono = this.getAttribute('mono') || "'IBM Plex Mono', monospace";
      this._accent = accent; this._muted = muted;

      this.style.cssText += ';display:grid;grid-template-columns:220px 1fr 300px;gap:0;align-items:stretch;';

      // left: fault list
      const left = document.createElement('div');
      left.style.cssText = 'display:flex;flex-direction:column;gap:0;border-right:1px solid ' + line + ';';
      const lh = document.createElement('div');
      lh.style.cssText = 'font-family:' + mono + ';font-size:11px;letter-spacing:.1em;color:' + muted + ';padding:18px 20px 10px;';
      lh.textContent = 'INCOMING FAULT — SELECT';
      left.appendChild(lh);
      this._btns = FAULTS.map((f, i) => {
        const b = document.createElement('button');
        b.style.cssText = 'appearance:none;background:none;border:none;border-top:1px solid ' + line + ';text-align:left;cursor:pointer;padding:14px 20px;font-family:' + font + ';display:block;';
        b.innerHTML = '<span style="font-family:' + mono + ';font-size:10px;color:' + muted + ';">' + f.code + '</span><br><span style="font-size:14px;line-height:1.35;color:' + ink + ';">' + f.label + '</span>';
        b.addEventListener('click', () => this._select(i));
        left.appendChild(b);
        return b;
      });
      this.appendChild(left);

      // middle: canvas
      const mid = document.createElement('div');
      mid.style.cssText = 'position:relative;border-right:1px solid ' + line + ';';
      this._canvas = document.createElement('canvas');
      this._canvas.style.cssText = 'width:100%;height:100%;display:block;';
      mid.appendChild(this._canvas);
      const cap = document.createElement('div');
      cap.style.cssText = 'position:absolute;bottom:10px;left:16px;font-family:' + mono + ';font-size:10px;letter-spacing:.08em;color:' + muted + ';pointer-events:none;';
      cap.textContent = 'HISTORICAL CASE LIBRARY — 12,000+ RESOLVED CASES';
      mid.appendChild(cap);
      this.appendChild(mid);
      this._ctx = this._canvas.getContext('2d');

      // right: result
      this._panel = document.createElement('div');
      this._panel.style.cssText = 'padding:18px 24px;display:flex;flex-direction:column;gap:12px;font-family:' + font + ';';
      this.appendChild(this._panel);

      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(mid);
      this._mid = mid;
      this._resize();

      const rnd = mulberry32(5);
      this._dots = [];
      for (let i = 0; i < 90; i++) this._dots.push({ x: rnd(), y: rnd(), r: 1 + rnd() * 1.6 });

      this._sel = -1; this._t0 = 0;
      this._renderPanel(null, 0);
      const loop = () => { this._drawCanvas(); this._raf = requestAnimationFrame(loop); };
      this._raf = requestAnimationFrame(loop);
      this._styleBtns();
      // auto-run the first fault once visible
      const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); this._select(0); } }, { threshold: 0.4 });
      io.observe(this); this._io = io;
    }
    disconnectedCallback() { cancelAnimationFrame(this._raf); this._ro && this._ro.disconnect(); this._io && this._io.disconnect(); }

    _styleBtns() {
      this._btns.forEach((b, i) => {
        b.style.background = i === this._sel ? 'rgba(162,104,15,.08)' : 'none';
        b.style.boxShadow = i === this._sel ? ('inset 3px 0 0 ' + this._accent) : 'none';
      });
    }
    _select(i) {
      this._sel = i; this._t0 = performance.now();
      this._styleBtns();
      this._renderPanel(FAULTS[i], 0);
    }
    _resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this._w = this._mid.clientWidth || 400; this._h = this._mid.clientHeight || 300;
      this._canvas.width = this._w * dpr; this._canvas.height = this._h * dpr; this._dpr = dpr;
    }
    _drawCanvas() {
      const ctx = this._ctx; if (!ctx || !this._w) return;
      const w = this._w, h = this._h;
      ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const muted = this._muted, accent = this._accent;
      const P = 24;
      const px = (d) => P + d.x * (w - 2 * P), py = (d) => P + d.y * (h - 2 * P - 16);
      const el = this._sel >= 0 ? (performance.now() - this._t0) / 1000 : 0;
      const f = this._sel >= 0 ? FAULTS[this._sel] : null;
      // scan sweep
      let scanX = -1;
      if (f && el < 1.2) scanX = P + (el / 1.2) * (w - 2 * P);
      // pick matched dots deterministically per fault
      const matched = [];
      if (f) { const rnd = mulberry32(31 + this._sel * 7); for (let k = 0; k < 8; k++) matched.push(Math.floor(rnd() * this._dots.length)); }
      // entry node (fault)
      const fx = 16, fy = h / 2;
      this._dots.forEach((d, i) => {
        const isM = f && matched.indexOf(i) >= 0 && (scanX < 0 ? true : px(d) < scanX);
        ctx.globalAlpha = isM ? 0.95 : 0.35;
        ctx.fillStyle = isM ? accent : muted;
        ctx.beginPath(); ctx.arc(px(d), py(d), isM ? d.r + 1.2 : d.r, 0, 7); ctx.fill();
        if (isM && el > 1.2) {
          const p = Math.min(1, (el - 1.2) / 0.6);
          ctx.strokeStyle = accent; ctx.globalAlpha = 0.55; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(fx, fy);
          ctx.lineTo(fx + (px(d) - fx) * p, fy + (py(d) - fy) * p); ctx.stroke();
        }
      });
      if (scanX >= 0) {
        ctx.strokeStyle = muted; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(scanX, 12); ctx.lineTo(scanX, h - 26); ctx.stroke();
      }
      if (f) {
        ctx.globalAlpha = 1; ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(fx, fy, 5, 0, 7); ctx.fill();
        const pr = 6 + ((performance.now() / 90) % 14);
        ctx.strokeStyle = accent; ctx.globalAlpha = Math.max(0, 1 - pr / 20);
        ctx.beginPath(); ctx.arc(fx, fy, pr, 0, 7); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // progress panel updates
      if (f) {
        const phase = el < 1.2 ? 0 : el < 1.9 ? 1 : 2;
        if (phase !== this._phase) { this._phase = phase; this._renderPanel(f, phase); }
      }
    }
    _renderPanel(f, phase) {
      const mono = this.getAttribute('mono') || "'IBM Plex Mono', monospace";
      const ink = this.getAttribute('ink') || '#1c1a16';
      const muted = this._muted || '#857e71', accent = this._accent || '#a2680f';
      if (!f) {
        this._panel.innerHTML = '<div style="font-family:' + mono + ';font-size:11px;letter-spacing:.1em;color:' + muted + ';padding-top:2px;">AGENT OUTPUT</div><div style="font-size:14px;line-height:1.6;color:' + muted + ';">Select a fault to run the diagnostic agent.</div>';
        return;
      }
      const status = phase === 0 ? 'SCANNING CASE LIBRARY…' : phase === 1 ? 'MATCHING SIGNATURES…' : 'VERIFIED FIX RETURNED';
      let html = '<div style="font-family:' + mono + ';font-size:11px;letter-spacing:.1em;color:' + muted + ';padding-top:2px;">AGENT OUTPUT</div>';
      html += '<div style="font-family:' + mono + ';font-size:12px;color:' + accent + ';">' + status + '</div>';
      if (phase === 2) {
        html += '<div style="font-size:14px;line-height:1.6;color:' + ink + ';">' + f.fix + '</div>';
        html += '<div style="display:flex;gap:24px;margin-top:auto;padding-top:10px;">'
          + '<div><div style="font-family:' + mono + ';font-size:18px;color:' + ink + ';">' + f.cases + '</div><div style="font-size:11px;color:' + muted + ';">matched cases</div></div>'
          + '<div><div style="font-family:' + mono + ';font-size:18px;color:' + ink + ';">' + f.top + '%</div><div style="font-size:11px;color:' + muted + ';">fix confidence</div></div>'
          + '<div><div style="font-family:' + mono + ';font-size:18px;color:' + accent + ';">' + f.time + '</div><div style="font-size:11px;color:' + muted + ';">time to resolve</div></div>'
          + '</div>';
      }
      this._panel.innerHTML = html;
    }
  }
  customElements.define('rag-demo', RagDemo);
})();
