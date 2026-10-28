(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- hero page-load sequence ----------
     Held until the hero photo is decoded so the type never animates in over
     an empty frame — but never held longer than 1.2s on a slow connection. */
  const startHero = () => {
    /* Forced layout read flushes the initial hidden state so the transition
       still runs. rAF would also work but is throttled in background tabs,
       which would leave the hero blank until the tab is focused. */
    void document.body.offsetHeight;
    document.documentElement.classList.add('is-loaded');
  };
  const heroPhoto = document.querySelector('.hero__photo');
  if (heroPhoto && !heroPhoto.complete) {
    heroPhoto.addEventListener('load', startHero, { once: true });
    heroPhoto.addEventListener('error', startHero, { once: true });
    setTimeout(startHero, 1200);
  } else {
    startHero();
  }

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
    /* rows that run under the rail: the facilities slider and the reels */
    const passers = ['facilityTrack', 'reelTrack'].map(id => document.getElementById(id)).filter(Boolean);
    /* English and Arabic pages share this list; each page only has the ids it
       uses (#features + #facilities here, #facilities + #services on /ar/), and
       missing ones drop out, so the marks still line up one-to-one. */
    const sections = ['#hero', '#club', '#features', '#facilities', '#services', '#reels', '#courses', '#captains', '#ascent']
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

      /* The facilities slider and the reels run under the rail at the right
         edge — step the rail aside while either row passes beneath it. */
      if (passers.length) {
        const r = rail.getBoundingClientRect();
        rail.classList.toggle('is-hidden', passers.some(el => {
          const s = el.getBoundingClientRect();
          return s.top < r.bottom && s.bottom > r.top;
        }));
      }
    };

    document.addEventListener('scroll', updateRail, { passive: true });
    window.addEventListener('resize', updateRail);
    updateRail();
  }

  /* ---------- active nav link ----------
     The depth rail already reports where you are; the nav did not. This mirrors
     it so the header shows the current section too. */
  const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  if (navLinks.length) {
    const navTargets = navLinks
      .map(link => ({ link, el: document.querySelector(link.getAttribute('href')) }))
      .filter(t => t.el);

    let navTicking = false;

    const updateNav = () => {
      navTicking = false;
      const probe = window.scrollY + window.innerHeight * 0.35;
      let current = null;
      navTargets.forEach(t => {
        if (t.el.getBoundingClientRect().top + window.scrollY <= probe) current = t;
      });
      navTargets.forEach(t => {
        const on = t === current;
        t.link.classList.toggle('is-current', on);
        if (on) t.link.setAttribute('aria-current', 'location');
        else t.link.removeAttribute('aria-current');
      });
    };

    const onScrollNav = () => {
      if (navTicking) return;
      navTicking = true;
      requestAnimationFrame(updateNav);
    };

    updateNav();
    document.addEventListener('scroll', onScrollNav, { passive: true });
    window.addEventListener('resize', updateNav);
  }

  /* ---------- depth attenuation ----------
     Drives --depth from scroll position. Red is fully present at the surface,
     fully absorbed at the captains (30M), and returns on the ascent — so the
     accent colour tracks the same descent the depth rail reports. */
  const depthStops = [
    { sel: '#hero',       value: 0    },
    { sel: '#club',       value: 0.18 },
    { sel: '#features',   value: 0.36 },
    /* #facilities is the slider here but the benefits grid on /ar/ */
    { sel: '#facilities', value: document.getElementById('features') ? 0.52 : 0.36 },
    { sel: '#services',   value: 0.52 },
    { sel: '#reels',      value: 0.61 },
    { sel: '#courses',    value: 0.70 },
    { sel: '#captains',   value: 1    },
    { sel: '#ascent',     value: 0    },
  ]
    .map(s => ({ el: document.querySelector(s.sel), value: s.value }))
    .filter(s => s.el);

  if (depthStops.length > 1) {
    const root = document.documentElement;
    let points = [];
    let ticking = false;

    const measure = () => {
      points = depthStops.map(s => {
        const rect = s.el.getBoundingClientRect();
        return { pos: rect.top + window.scrollY + rect.height / 2, value: s.value };
      });
    };

    const updateDepth = () => {
      ticking = false;
      const probe = window.scrollY + window.innerHeight / 2;
      const last = points[points.length - 1];
      let depth;

      if (probe <= points[0].pos) {
        depth = points[0].value;
      } else if (probe >= last.pos) {
        depth = last.value;
      } else {
        depth = last.value;
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i];
          const b = points[i + 1];
          if (probe >= a.pos && probe <= b.pos) {
            const span = b.pos - a.pos;
            const t = span > 0 ? (probe - a.pos) / span : 0;
            /* reduced motion gets the nearest stop instead of a live blend */
            depth = reduceMotion ? (t < 0.5 ? a.value : b.value)
                                 : a.value + (b.value - a.value) * t;
            break;
          }
        }
      }

      root.style.setProperty('--depth', depth.toFixed(3));
    };

    const onScrollDepth = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateDepth);
    };

    measure();
    updateDepth();
    document.addEventListener('scroll', onScrollDepth, { passive: true });
    window.addEventListener('resize', () => { measure(); updateDepth(); });
    window.addEventListener('load', () => { measure(); updateDepth(); });
  }

  /* ---------- facilities slider ----------
     Native horizontal scroll with snap does the swiping; the arrows step one
     card at a time and the progress rule tracks how far along the row you are. */
  const track = document.getElementById('facilityTrack');
  if (track) {
    const progress = document.getElementById('facilityProgress');
    const buttons = [...document.querySelectorAll('.slider-btn[aria-controls="facilityTrack"]')];
    /* On the Arabic page the row starts at the right and moves left: scrollLeft
       runs from 0 down to -max there, so positions are read as a distance from
       the start and every movement is mirrored. */
    const flow = getComputedStyle(track).direction === 'rtl' ? -1 : 1;
    const travelled = () => Math.abs(track.scrollLeft);

    const step = () => {
      const card = track.querySelector('.facility');
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
    };

    let sliderTicking = false;
    const updateSlider = () => {
      sliderTicking = false;
      const max = track.scrollWidth - track.clientWidth;
      const pos = travelled();
      /* the bar shows the visible share of the row, sliding to the end */
      const visible = max > 0 ? track.clientWidth / track.scrollWidth : 1;
      if (progress) {
        progress.style.width = (visible * 100).toFixed(2) + '%';
        progress.style.transform = `translateX(${flow * (max > 0 ? (pos / max) * ((1 - visible) / visible) * 100 : 0)}%)`;
      }
      buttons.forEach(btn => {
        const dir = Number(btn.dataset.dir);
        btn.disabled = dir < 0 ? pos <= 2 : pos >= max - 2;
      });
    };

    buttons.forEach(btn => btn.addEventListener('click', () => {
      track.scrollBy({ left: flow * Number(btn.dataset.dir) * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }));
    /* Mouse wheel over the cards steps the row one card per notch. Sideways
       trackpad swipes already scroll natively, so only a mostly-vertical wheel
       is taken over — and only while the row can still move that way, so at
       either end the page carries on scrolling instead of trapping the visitor. */
    let wheelLock = 0;
    track.addEventListener('wheel', e => {
      if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const dir = Math.sign(e.deltaY);
      const max = track.scrollWidth - track.clientWidth;
      const now = performance.now();
      if (now < wheelLock) { e.preventDefault(); return; }
      if (dir < 0 ? travelled() <= 2 : travelled() >= max - 2) return;
      e.preventDefault();
      wheelLock = now + 450;
      track.scrollBy({ left: flow * dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }, { passive: false });

    track.addEventListener('scroll', () => {
      if (sliderTicking) return;
      sliderTicking = true;
      requestAnimationFrame(updateSlider);
    }, { passive: true });
    window.addEventListener('resize', updateSlider);
    updateSlider();
  }

  /* ---------- captains: phone slider dots ----------
     The roster is a CSS scroll-snap row on phones; this only adds the dots
     that say which captain you are on and jump to one when tapped. */
  const crew = document.querySelector('.crew');
  if (crew) {
    const crewCards = [...crew.children];
    const dots = document.createElement('div');
    dots.className = 'crew-dots';
    const dotButtons = crewCards.map((card, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const name = card.querySelector('.crew__name');
      btn.setAttribute('aria-label', name ? name.textContent : String(i + 1));
      btn.addEventListener('click', () => {
        /* offsets run negative in RTL, which matches RTL scrollLeft */
        crew.scrollTo({ left: card.offsetLeft - crewCards[0].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
      dots.appendChild(btn);
      return btn;
    });
    crew.after(dots);

    let crewTicking = false;
    const updateDots = () => {
      crewTicking = false;
      const pos = Math.abs(crew.scrollLeft);
      let active = 0;
      crewCards.forEach((card, i) => {
        if (Math.abs(card.offsetLeft - crewCards[0].offsetLeft) <= pos + card.offsetWidth / 2) active = i;
      });
      dotButtons.forEach((btn, i) => btn.setAttribute('aria-current', i === active ? 'true' : 'false'));
    };
    crew.addEventListener('scroll', () => {
      if (crewTicking) return;
      crewTicking = true;
      requestAnimationFrame(updateDots);
    }, { passive: true });
    window.addEventListener('resize', updateDots);
    updateDots();
  }

  /* ---------- reels ----------
     Cards play muted while they are on screen and pause when they leave, so
     only the reels in view ever download. A click grows the card into a
     full-screen player with sound (FLIP from the card's own rectangle). */
  const reelTrack = document.getElementById('reelTrack');
  if (reelTrack) {
    const reelSection = reelTrack.closest('.reels');
    const reelItems = [...reelTrack.querySelectorAll('.reel')];
    const reelCards = reelItems.map(li => li.querySelector('.reel__card'));
    const reelVideos = reelCards.map(card => card.querySelector('video'));
    const rtl = getComputedStyle(reelTrack).direction === 'rtl';

    const enter = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      reelSection.classList.add('is-in');
      enter.disconnect();
    }, { threshold: 0.15 });
    enter.observe(reelTrack);

    const onScreen = new Set();
    const autoplay = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (entry.isIntersecting) {
          onScreen.add(video);
          if (!reduceMotion) video.play().catch(() => {});
        } else {
          onScreen.delete(video);
          video.pause();
        }
      });
    }, { threshold: 0.45 });
    reelCards.forEach(card => autoplay.observe(card));

    reelVideos.forEach(video => {
      const bar = video.parentElement.querySelector('.reel__bar span');
      video.addEventListener('timeupdate', () => {
        if (video.duration) bar.style.transform = `scaleX(${(video.currentTime / video.duration).toFixed(4)})`;
      });
    });

    /* tilt + glint, mouse only */
    if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      reelCards.forEach(card => {
        card.addEventListener('pointermove', e => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          card.style.setProperty('--ry', ((x - 0.5) * 14).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - y) * 12).toFixed(2) + 'deg');
          card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        });
        card.addEventListener('pointerleave', () => {
          ['--rx', '--ry', '--gx', '--gy'].forEach(p => card.style.removeProperty(p));
        });
      });
    }

    /* scroll drift: odd and even cards slide against each other */
    const wide = window.matchMedia('(min-width: 861px)');
    let driftTicking = false;
    const drift = () => {
      driftTicking = false;
      if (reduceMotion || !wide.matches) {
        reelItems.forEach(li => { li.style.transform = ''; });
        return;
      }
      const r = reelTrack.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      reelItems.forEach((li, i) => {
        li.style.transform = `translate3d(0, ${(p * (i % 2 ? -1 : 1) * 46).toFixed(1)}px, 0)`;
      });
    };
    document.addEventListener('scroll', () => {
      if (driftTicking) return;
      driftTicking = true;
      requestAnimationFrame(drift);
    }, { passive: true });
    window.addEventListener('resize', drift);
    drift();

    /* full-screen player */
    const viewer = document.getElementById('reelViewer');
    const frame = viewer.querySelector('.reel-viewer__frame');
    const big = frame.querySelector('video');
    const closeBtn = viewer.querySelector('.reel-viewer__close');
    let current = -1;
    let returnFocus = null;
    const ease = 'cubic-bezier(.16, 1, .3, 1)';

    const flipFrom = rect => {
      const to = frame.getBoundingClientRect();
      return `translate(${rect.left - to.left}px, ${rect.top - to.top}px) scale(${rect.width / to.width}, ${rect.height / to.height})`;
    };

    const load = i => {
      const small = reelVideos[i];
      current = i;
      big.poster = small.poster;
      /* the muted card loop is a preview; with sound it starts from the top */
      big.src = small.currentSrc || small.src;
      big.muted = false;
      big.play().catch(() => {});
      small.pause();
    };

    const open = i => {
      returnFocus = document.activeElement;
      viewer.hidden = false;
      document.body.style.overflow = 'hidden';
      load(i);
      if (!reduceMotion) {
        frame.animate([{ transform: flipFrom(reelCards[i].getBoundingClientRect()), borderRadius: '20px' }, { transform: 'none' }],
          { duration: 700, easing: ease });
        viewer.querySelector('.reel-viewer__backdrop').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' });
      }
      closeBtn.focus({ preventScroll: true });
    };

    const close = async () => {
      if (viewer.hidden) return;
      big.pause();
      if (!reduceMotion) {
        const card = reelCards[current].getBoundingClientRect();
        viewer.querySelector('.reel-viewer__backdrop').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-in', fill: 'forwards' });
        await frame.animate([{ transform: 'none' }, { transform: flipFrom(card) }],
          { duration: 520, easing: ease, fill: 'forwards' }).finished.catch(() => {});
        frame.getAnimations().forEach(a => a.cancel());
        viewer.querySelector('.reel-viewer__backdrop').getAnimations().forEach(a => a.cancel());
      }
      viewer.hidden = true;
      document.body.style.overflow = '';
      big.removeAttribute('src');
      big.load();
      reelVideos.forEach(v => { if (onScreen.has(v) && !reduceMotion) v.play().catch(() => {}); });
      if (returnFocus) returnFocus.focus({ preventScroll: true });
    };

    const step = dir => {
      const next = (current + dir + reelCards.length) % reelCards.length;
      if (!reduceMotion) frame.animate([{ opacity: 0, transform: `translateX(${(rtl ? -dir : dir) * 40}px)` }, { opacity: 1, transform: 'none' }], { duration: 420, easing: ease });
      load(next);
    };

    reelCards.forEach((card, i) => card.addEventListener('click', () => open(i)));
    viewer.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
    viewer.querySelectorAll('[data-step]').forEach(btn => btn.addEventListener('click', () => step(Number(btn.dataset.step))));
    document.addEventListener('keydown', e => {
      if (viewer.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(rtl ? -1 : 1);
      else if (e.key === 'ArrowLeft') step(rtl ? 1 : -1);
      else if (e.key === 'Tab') {
        /* keep focus inside the player */
        const focusables = [...viewer.querySelectorAll('button, video')].filter(el => el.offsetParent !== null);
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
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
