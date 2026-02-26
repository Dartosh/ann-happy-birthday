document.addEventListener("DOMContentLoaded", () => {
  window.presentation = new Presentation("#presentation");
  runPeekerAnimation();
  initCarousel();
  initStackSlide();
  initTiktokSlide();
  initFinalSlide();
});

function runPeekerAnimation() {
  const peeker = document.getElementById("peeker");
  if (!peeker) return;

  const imgNormal = peeker.querySelector(".peeker__img--normal");
  const imgUp = peeker.querySelector(".peeker__img--up");
  const imgDown = peeker.querySelector(".peeker__img--down");

  function showImg(img) {
    [imgNormal, imgUp, imgDown].forEach((el) =>
      el.classList.remove("peeker__img--active"),
    );
    img.classList.add("peeker__img--active");
  }

  const steps = [
    [
      1000,
      () => {
        peeker.classList.add("peeker--visible");
        showImg(imgNormal);
      },
    ],
    [800, () => showImg(imgDown)],
    [400, () => showImg(imgNormal)],
    [20, () => showImg(imgUp)],
    [400, () => showImg(imgNormal)],
    [20, () => showImg(imgDown)],
    // [400, () => showImg(imgNormal)],
    [1000, () => peeker.classList.remove("peeker--visible")],
    [
      800,
      () =>
        [imgNormal, imgUp, imgDown].forEach((el) =>
          el.classList.remove("peeker__img--active"),
        ),
    ],
  ];

  let delay = 0;
  steps.forEach(([ms, fn]) => {
    delay += ms;
    setTimeout(fn, delay);
  });
}

function initCarousel() {
  const slideEl = document.querySelector('[data-slide="6"]');
  if (!slideEl) return;

  const items = Array.from(slideEl.querySelectorAll('.c-slide__item'));
  const dots  = Array.from(slideEl.querySelectorAll('.c-slide__dot'));
  const TOTAL = items.length;

  const CURVE = 40;
  const ANGLE = 10;
  const SNAP_RATIO = 0.25; // drag > 25% of GAP → advance

  let activeIdx    = 0;
  let startX       = 0;
  let dragX        = 0;
  let dragging     = false;

  function gap() {
    return Math.min(window.innerWidth * 0.78, 370);
  }

  // ── Core: lay out all items given a continuous pixel drag offset ──
  // dragPx > 0  → dragging right (cards follow right, prev comes in)
  // dragPx < 0  → dragging left  (cards follow left, next comes in)
  function applyLayout(dragPx, animated) {
    const g = gap();

    items.forEach((item, i) => {
      // frac: continuous fractional position (0 = center, +1 = one slot right, etc.)
      const frac = (i - activeIdx) + dragPx / g;

      const x = frac * g;
      const y = frac * frac * CURVE;
      const r = frac * ANGLE;
      const s = Math.max(0.72, 1 - Math.abs(frac) * 0.13);
      const o = Math.max(0, 1 - Math.abs(frac) * 0.5);
      const z = Math.round(100 - Math.abs(frac) * 10);

      item.style.transition    = animated
        ? 'transform 0.48s cubic-bezier(0.34,1.28,0.64,1), opacity 0.48s ease'
        : 'none';
      // translate(-50%,-50%) centres the card on its CSS anchor (left:50%, top:X%)
      item.style.transform     = `translate(-50%, -50%) translateX(${x}px) translateY(${y}px) rotate(${r}deg) scale(${s})`;
      item.style.opacity       = o;
      item.style.zIndex        = z;
      item.style.pointerEvents = 'none';
    });

    // nearest dot follows finger live
    const nearest = Math.max(0, Math.min(TOTAL - 1, Math.round(activeIdx - dragPx / g)));
    dots.forEach((d, i) => d.classList.toggle('c-slide__dot--active', i === nearest));
  }

  function snapTo(idx, animated = true) {
    activeIdx = Math.max(0, Math.min(TOTAL - 1, idx));
    dots.forEach((d, i) => d.classList.toggle('c-slide__dot--active', i === activeIdx));

    if (!animated) {
      applyLayout(0, false);
      if (items[activeIdx]) items[activeIdx].style.pointerEvents = 'auto';
      return;
    }

    // Double rAF: let the browser commit the drag-final frame (transition:none)
    // before we switch transition back on, so the snap actually animates.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        applyLayout(0, true);
        setTimeout(() => {
          if (items[activeIdx]) items[activeIdx].style.pointerEvents = 'auto';
        }, 520);
      });
    });
  }

  // ── Touch ─────────────────────────────────────────────────────
  slideEl.addEventListener('touchstart', (e) => {
    startX   = e.touches[0].clientX;
    dragX    = 0;
    dragging = true;
    e.stopPropagation();
  }, { passive: true });

  slideEl.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    dragX = e.touches[0].clientX - startX;
    // clamp so you can't drag past the first/last card too far
    const maxDrag = gap() * 0.85;
    if (activeIdx === 0)         dragX = Math.min(dragX,  maxDrag);
    if (activeIdx === TOTAL - 1) dragX = Math.max(dragX, -maxDrag);
    applyLayout(dragX, false);
    e.stopPropagation();
  }, { passive: true });

  slideEl.addEventListener('touchend', (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.changedTouches[0].clientX - startX;
    e.stopPropagation();
    const dir = dx < 0 ? 1 : -1;
    snapTo(Math.abs(dx) / gap() >= SNAP_RATIO ? activeIdx + dir : activeIdx);
  }, { passive: true });

  // ── Mouse (desktop drag) ───────────────────────────────────────
  slideEl.addEventListener('mousedown', (e) => {
    startX   = e.clientX;
    dragX    = 0;
    dragging = true;
    slideEl.style.cursor = 'grabbing';
    e.stopPropagation();
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging || !slideEl.classList.contains('slide--active')) return;
    dragX = e.clientX - startX;
    const maxDrag = gap() * 0.85;
    if (activeIdx === 0)         dragX = Math.min(dragX,  maxDrag);
    if (activeIdx === TOTAL - 1) dragX = Math.max(dragX, -maxDrag);
    applyLayout(dragX, false);
  });

  window.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    dragging = false;
    slideEl.style.cursor = '';
    if (!slideEl.classList.contains('slide--active')) return;
    const dx = e.clientX - startX;
    const dir = dx < 0 ? 1 : -1;
    snapTo(Math.abs(dx) / gap() >= SNAP_RATIO ? activeIdx + dir : activeIdx);
  });

  // ── Keyboard — intercept before presentation.js ───────────────
  document.addEventListener('keydown', (e) => {
    if (!slideEl.classList.contains('slide--active')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      e.stopImmediatePropagation();
      snapTo(activeIdx + 1);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopImmediatePropagation();
      snapTo(activeIdx - 1);
    }
  }, { capture: true });

  // ── "Дальше" button (last card) ───────────────────────────────
  const nextBtn = document.getElementById('cNextBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.presentation.next();
    });
  }

  // ── Reset to first card when slide becomes active ─────────────
  new MutationObserver(() => {
    if (slideEl.classList.contains('slide--active')) snapTo(0, false);
  }).observe(slideEl, { attributes: true, attributeFilter: ['class'] });

  snapTo(0, false);
}

function initStackSlide() {
  const slideEl = document.querySelector('[data-slide="7"]');
  if (!slideEl) return;

  const cards   = Array.from(slideEl.querySelectorAll('.stack-slide__card'));
  const hint    = document.getElementById('stackHint');
  const nextBtn = document.getElementById('stackNextBtn');
  const TOTAL   = cards.length;
  let current   = 0;

  // Pre-generate a unique resting rotation for each card (applied when it goes behind).
  // Range: ±7°, alternating sign so adjacent cards lean opposite ways.
  const rots = cards.map((_, i) => {
    const base = 2.5 + Math.random() * 4.5; // 2.5–7°
    return i % 2 === 0 ? base : -base;
  });
  rots[0] = 0; // first card starts straight (it's the initial hint card)

  // ── Layout all cards based on current top index ───────────────
  function layout(animated) {
    cards.forEach((card, i) => {
      card.style.transition = animated
        ? 'transform 0.5s cubic-bezier(0.34,1.2,0.64,1), opacity 0.45s ease'
        : 'none';

      if (i > current) {
        // Not revealed yet — hidden below, enter straight
        card.style.transform     = 'translateY(60px) scale(0.88) rotate(0deg)';
        card.style.opacity       = '0';
        card.style.zIndex        = i;
        card.style.pointerEvents = 'none';
      } else if (i === current) {
        // Top card — always straight so it's readable
        card.style.transform     = 'translateY(0) scale(1) rotate(0deg)';
        card.style.opacity       = '1';
        card.style.zIndex        = TOTAL + 10;
        card.style.pointerEvents = 'none';
        card.classList.toggle('stack-slide__card--pulse', current === 0);
      } else {
        // Settled in the stack — apply its resting tilt
        const depth = current - i;
        const r     = rots[i];
        card.style.transform     = `translateY(${-depth * 6}px) scale(${1 - depth * 0.03}) rotate(${r}deg)`;
        card.style.opacity       = '1';
        card.style.zIndex        = TOTAL + 10 - depth;
        card.style.pointerEvents = 'none';
      }
    });

    // Hide hint after first tap
    if (current > 0 && hint) hint.classList.add('stack-slide__hint--gone');

    // Reveal button when last card is on top
    if (current === TOTAL - 1 && nextBtn) {
      nextBtn.classList.add('stack-slide__next--visible');
    }
  }

  // ── Advance on tap ────────────────────────────────────────────
  function advance(e) {
    if (e.target.closest('#stackNextBtn')) return;
    if (current < TOTAL - 1) {
      current++;
      layout(true);
    }
  }

  // Prevent double-fire on mobile (touch → click)
  let lastTouch = 0;
  slideEl.addEventListener('touchend', (e) => {
    if (e.target.closest('#stackNextBtn')) return;
    lastTouch = Date.now();
    e.stopPropagation();
    if (current < TOTAL - 1) { current++; layout(true); }
  }, { passive: true });

  slideEl.addEventListener('click', (e) => {
    if (Date.now() - lastTouch < 350) return;
    advance(e);
  });

  // ── Keyboard: Space / ArrowRight advance stack ────────────────
  document.addEventListener('keydown', (e) => {
    if (!slideEl.classList.contains('slide--active')) return;
    if (current >= TOTAL - 1) return; // let presentation handle it
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      e.stopImmediatePropagation();
      current++;
      layout(true);
    }
  }, { capture: true });

  // ── "Дальше" button ───────────────────────────────────────────
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.presentation.next();
    });
  }

  // ── Reset when slide becomes active ──────────────────────────
  new MutationObserver(() => {
    if (slideEl.classList.contains('slide--active')) {
      current = 0;
      layout(false);
    }
  }).observe(slideEl, { attributes: true, attributeFilter: ['class'] });

  layout(false);
}

function initTiktokSlide() {
  const slideEl = document.querySelector('[data-slide="8"]');
  if (!slideEl) return;

  const track   = document.getElementById('ttSlide');
  const cards   = Array.from(slideEl.querySelectorAll('.tt-card'));
  const nextBtn = document.getElementById('ttNextBtn');
  const TOTAL   = cards.length;

  function currentCardIndex() {
    const h = track.clientHeight || 1;
    return Math.round(track.scrollTop / h);
  }

  function scrollToCard(idx, smooth = true) {
    const clamped = Math.max(0, Math.min(TOTAL - 1, idx));
    track.scrollTo({ top: clamped * track.clientHeight, behavior: smooth ? 'smooth' : 'instant' });
  }

  // ── Keyboard intercept ────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (!slideEl.classList.contains('slide--active')) return;

    const idx = currentCardIndex();

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (idx < TOTAL - 1) {
        scrollToCard(idx + 1);
      } else {
        window.presentation.next();
      }
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (idx > 0) {
        scrollToCard(idx - 1);
      } else {
        window.presentation.prev();
      }
    }
  }, { capture: true });

  // ── "Дальше" button ───────────────────────────────────────────
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.presentation.next();
    });
  }

  // ── Reset scroll to top when slide becomes active ─────────────
  new MutationObserver(() => {
    if (slideEl.classList.contains('slide--active')) {
      scrollToCard(0, false);
    }
  }).observe(slideEl, { attributes: true, attributeFilter: ['class'] });

  // ── Antony hearts: slides up from bottom on card 9 (photo-9.jpg) ─
  const card9       = cards[8]; // 0-indexed
  const antonyEl    = document.getElementById('antonyPeeker');
  let   antonyTimer = null;

  if (card9 && antonyEl) {
    const antonyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (!slideEl.classList.contains('slide--active')) return;
        if (antonyTimer !== null) return; // already animating

        const steps = [
          [0,    () => antonyEl.classList.add('antony-peeker--visible')],
          [2000, () => antonyEl.classList.remove('antony-peeker--visible')],
          [800,  () => { antonyTimer = null; }],
        ];

        let delay = 0;
        steps.forEach(([ms, fn]) => {
          delay += ms;
          antonyTimer = setTimeout(() => fn(), delay);
        });
      });
    }, { root: track, threshold: 0.85 });

    antonyObserver.observe(card9);
  }
}

function launchConfetti(canvas) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  const COLORS = [
    "#e8a0bf", "#f472b6", "#d4789a",
    "#fbbf24", "#c084fc", "#ffffff", "#fce7f3",
  ];

  const particles = Array.from({ length: 160 }, () => ({
    x: W * (0.05 + Math.random() * 0.9),
    y: -12 - Math.random() * H * 0.25,
    w: 6 + Math.random() * 10,
    h: 4 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 11,
    vx: (Math.random() - 0.5) * 3.5,
    vy: 1.5 + Math.random() * 3.5,
    alpha: 1,
    circle: Math.random() > 0.55,
  }));

  const t0 = performance.now();
  const FADE_START = 3200;
  const FADE_DUR = 1400;
  let raf;

  function tick(now) {
    ctx.clearRect(0, 0, W, H);
    const elapsed = now - t0;
    let alive = 0;

    for (const p of particles) {
      if (p.alpha <= 0) continue;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.055;
      p.rot += p.rotV;
      if (elapsed > FADE_START) {
        p.alpha = Math.max(0, 1 - (elapsed - FADE_START) / FADE_DUR);
      }
      if (p.y < H + 20) alive++;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      if (p.circle) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }

    if (alive > 0 && elapsed < FADE_START + FADE_DUR) {
      raf = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
  }

  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, W, H);
  };
}

function initFinalSlide() {
  const slideEl = document.querySelector('[data-slide="9"]');
  const canvas = document.getElementById("confettiCanvas");
  if (!slideEl || !canvas) return;

  let cancelConfetti = null;

  const observer = new MutationObserver(() => {
    if (slideEl.classList.contains("slide--active")) {
      setTimeout(() => {
        if (cancelConfetti) cancelConfetti();
        cancelConfetti = launchConfetti(canvas);
      }, 500);
    }
  });

  observer.observe(slideEl, { attributes: true, attributeFilter: ["class"] });
}
