class Presentation {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.slides = Array.from(this.container.querySelectorAll('.slide'));
    this.currentIndex = 0;
    this.isAnimating = false;
    this.totalSlides = this.slides.length;

    this.progressBar = document.getElementById('progressBar');
    this.typewriter = new Typewriter();

    this._touchStartX = 0;
    this._touchStartY = 0;
    this._swipeThreshold = 50;

    this._bindEvents();
    this._updateProgress();
  }

  _bindEvents() {
    this.container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      if (action === 'next') this.next();
      if (action === 'prev') this.prev();
    });

    this.container.addEventListener('touchstart', (e) => {
      this._touchStartX = e.changedTouches[0].clientX;
      this._touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - this._touchStartX;
      const dy = e.changedTouches[0].clientY - this._touchStartY;

      if (Math.abs(dx) < this._swipeThreshold) return;
      if (Math.abs(dy) > Math.abs(dx)) return;

      if (dx < 0) {
        this.next();
      } else {
        this.prev();
      }
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        this.next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      }
    });
  }

  goTo(index) {
    if (this.isAnimating) return;
    if (index < 0 || index >= this.totalSlides) return;
    if (index === this.currentIndex) return;

    this.isAnimating = true;
    this.typewriter.abort();

    const currentSlide = this.slides[this.currentIndex];
    const nextSlide = this.slides[index];
    const direction = index > this.currentIndex ? 1 : -1;

    currentSlide.classList.remove('slide--active');
    currentSlide.classList.add('slide--exit');

    nextSlide.style.transform = `translateX(${direction * 30}px)`;
    nextSlide.classList.add('slide--active');

    requestAnimationFrame(() => {
      nextSlide.style.transform = '';
    });

    const onTransitionEnd = () => {
      currentSlide.classList.remove('slide--exit');
      currentSlide.style.transform = '';
      this.isAnimating = false;
      currentSlide.removeEventListener('transitionend', onTransitionEnd);
    };

    currentSlide.addEventListener('transitionend', onTransitionEnd, { once: true });

    setTimeout(() => {
      if (this.isAnimating) onTransitionEnd();
    }, 800);

    this.currentIndex = index;
    this._updateProgress();
    this._onSlideChange(index);
  }

  next() {
    if (this.currentIndex < this.totalSlides - 1) {
      this.goTo(this.currentIndex + 1);
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.goTo(this.currentIndex - 1);
    }
  }

  _updateProgress() {
    const progress = this.totalSlides > 1
      ? (this.currentIndex / (this.totalSlides - 1)) * 100
      : 100;
    this.progressBar.style.width = `${progress}%`;
  }

  _onSlideChange(index) {
    const slide = this.slides[index];

    const animatedElements = slide.querySelectorAll('[data-animate]');
    animatedElements.forEach((el, i) => {
      el.style.animationDelay = `${i * 0.15 + 0.3}s`;
      el.classList.add(`animate-${el.dataset.animate}`);
    });

    this.typewriter.run(slide);
  }
}
