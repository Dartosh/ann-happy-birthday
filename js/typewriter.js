class Typewriter {
  constructor() {
    this._gen = 0;
  }

  abort() {
    this._gen++;
  }

  run(slide) {
    const elements = Array.from(slide.querySelectorAll('[data-reveal]'));
    if (!elements.length) return;

    this._prepareElements(elements);

    const gen = this._gen;
    const aborted = () => gen !== this._gen;

    const INITIAL_DELAY = 400;
    const GAP = 800;
    const CHAR_MS = 35;

    const sequence = async () => {
      await this._wait(INITIAL_DELAY);
      if (aborted()) return;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

        if (this._isInteractive(el)) {
          el.textContent = el.dataset.originalText;
          el.classList.add('revealed');
        } else {
          await this._typeElement(el, CHAR_MS, aborted);
          if (aborted()) return;
        }

        if (aborted()) return;
        if (i < elements.length - 1) {
          await this._wait(GAP);
          if (aborted()) return;
        }
      }
    };

    sequence();
  }

  _prepareElements(elements) {
    elements.forEach((el) => {
      if (!el.dataset.originalText && el.textContent.trim()) {
        el.dataset.originalText = el.textContent;
      }
      el.classList.remove('revealed', 'typing');
      el.textContent = '';
    });
  }

  async _typeElement(el, charMs, aborted) {
    const text = el.dataset.originalText || '';
    el.textContent = '';
    el.classList.add('revealed', 'typing');

    for (let i = 0; i < text.length; i++) {
      if (aborted()) return;
      el.textContent += text[i];
      await this._wait(charMs);
    }

    if (!aborted()) {
      el.classList.remove('typing');
    }
  }

  _isInteractive(el) {
    return el.tagName === 'BUTTON' || el.tagName === 'A';
  }

  _wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
