// <count-up> — animates its number from 0 when scrolled into view.
// Attributes: value (number), prefix, suffix, decimals, duration (ms)
(function () {
  if (customElements.get('count-up')) return;
  class CountUp extends HTMLElement {
    connectedCallback() {
      this.style.display = 'inline';
      const val = parseFloat(this.getAttribute('value') || '0');
      const dec = parseInt(this.getAttribute('decimals') || '0', 10);
      const prefix = this.getAttribute('prefix') || '';
      const suffix = this.getAttribute('suffix') || '';
      const dur = parseInt(this.getAttribute('duration') || '1400', 10);
      const fmt = (n) => prefix + n.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
      this.textContent = fmt(0);
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting || this._done) return;
        this._done = true;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          this.textContent = fmt(val * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, { threshold: 0.4 });
      io.observe(this);
      this._io = io;
    }
    disconnectedCallback() { this._io && this._io.disconnect(); }
  }
  customElements.define('count-up', CountUp);

  // <reveal-fx> — fades+rises its content when scrolled into view. Attribute: delay (ms)
  if (!customElements.get('reveal-fx')) {
    class RevealFx extends HTMLElement {
      connectedCallback() {
        this.style.display = 'block';
        const delay = parseInt(this.getAttribute('delay') || '0', 10);
        this.style.opacity = '0';
        this.style.transform = 'translateY(24px)';
        this.style.transition = 'opacity .7s ease ' + delay + 'ms, transform .7s ease ' + delay + 'ms';
        const io = new IntersectionObserver((entries) => {
          if (!entries[0].isIntersecting) return;
          io.disconnect();
          this.style.opacity = '1';
          this.style.transform = 'none';
        }, { threshold: 0.12 });
        io.observe(this);
        this._io = io;
      }
      disconnectedCallback() { this._io && this._io.disconnect(); }
    }
    customElements.define('reveal-fx', RevealFx);
  }
})();
