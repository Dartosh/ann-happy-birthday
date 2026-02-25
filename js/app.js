document.addEventListener("DOMContentLoaded", () => {
  window.presentation = new Presentation("#presentation");
  runPeekerAnimation();
  initCarousel();
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
