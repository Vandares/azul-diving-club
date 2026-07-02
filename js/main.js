(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- header scroll state ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (window.scrollY > 12) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobile-nav');

  const closeMenu = () => {
    navToggle.setAttribute('aria-expanded', 'false');
    mobileNav.dataset.state = 'closed';
    document.body.style.overflow = '';
  };
  const openMenu = () => {
    navToggle.setAttribute('aria-expanded', 'true');
    mobileNav.dataset.state = 'open';
    document.body.style.overflow = 'hidden';
  };

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 5, 4) * 70}ms`;
      io.observe(el);
    });
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- depth rail ---------- */
  const rail = document.querySelector('.depth-rail');
  if (rail) {
    const fill = rail.querySelector('.depth-rail__fill');
    const marks = [...rail.querySelectorAll('.depth-rail__marks li')];
    const sections = ['#hero', '#club', '#facilities', '#courses', '#captains', '#ascent']
      .map(sel => document.querySelector(sel))
      .filter(Boolean);

    const updateRail = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (scrollTop / max) * 100)) : 0;
      fill.style.height = pct + '%';

      let activeIndex = 0;
      const probe = scrollTop + window.innerHeight * 0.4;
      sections.forEach((sec, i) => {
        if (sec.offsetTop <= probe) activeIndex = i;
      });
      marks.forEach((m, i) => m.classList.toggle('is-active', i === activeIndex));
    };

    document.addEventListener('scroll', updateRail, { passive: true });
    window.addEventListener('resize', updateRail);
    updateRail();
  }

  /* ---------- caustics + bubbles canvas ---------- */
  const canvas = document.getElementById('causticsCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr;
    let bubbles = [];
    let rafId = null;
    let running = false;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const makeBubbles = () => {
      const count = w < 700 ? 16 : 30;
      bubbles = Array.from({ length: count }, () => spawnBubble(true));
    };

    function spawnBubble(randomY) {
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : h + 20,
        r: 1.5 + Math.random() * 3.5,
        speed: 0.25 + Math.random() * 0.6,
        drift: (Math.random() - 0.5) * 0.4,
        wobble: Math.random() * Math.PI * 2,
        alpha: 0.15 + Math.random() * 0.35,
      };
    }

    let t = 0;
    const draw = () => {
      t += 0.0045;
      ctx.clearRect(0, 0, w, h);

      /* caustic light bands */
      ctx.globalCompositeOperation = 'lighter';
      const bands = 4;
      for (let i = 0; i < bands; i++) {
        const phase = t + i * 1.7;
        const bandY = h * (0.15 + i * 0.22) + Math.sin(phase) * h * 0.06;
        const grad = ctx.createLinearGradient(0, bandY - 60, w, bandY + 60);
        const alpha = 0.05 + 0.03 * Math.sin(phase * 1.3);
        grad.addColorStop(0, `rgba(79,199,214,0)`);
        grad.addColorStop(0.5, `rgba(79,199,214,${Math.max(alpha, 0.02)})`);
        grad.addColorStop(1, `rgba(79,199,214,0)`);
        ctx.fillStyle = grad;
        ctx.save();
        ctx.translate(w / 2, bandY);
        ctx.rotate(Math.sin(phase * 0.4) * 0.12);
        ctx.fillRect(-w, -70, w * 2, 140);
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';

      /* bubbles */
      bubbles.forEach(b => {
        b.wobble += 0.03;
        b.y -= b.speed;
        b.x += b.drift + Math.sin(b.wobble) * 0.3;
        if (b.y < -10) Object.assign(b, spawnBubble(false));

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244,241,232,${b.alpha})`;
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    };

    resize();
    makeBubbles();

    if (reduceMotion) {
      draw();
      cancelAnimationFrame(rafId);
    } else {
      start();
      document.addEventListener('visibilitychange', () => {
        document.hidden ? stop() : start();
      });
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resize(); makeBubbles(); }, 200);
      });
    }
  }
})();
