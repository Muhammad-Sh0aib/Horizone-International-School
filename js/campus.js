document.addEventListener('DOMContentLoaded', () => {
  const facilityGrid = document.getElementById('facility-grid');
  const galleryGrid = document.getElementById('campus-gallery-grid');
  if (!facilityGrid || !galleryGrid) return;

  const facilityStatus = document.getElementById('facility-status');
  const galleryStatus = document.getElementById('gallery-status');
  const facilityEmpty = document.getElementById('facility-empty');
  const galleryEmpty = document.getElementById('gallery-empty');
  const facilityFilters = [...document.querySelectorAll('[data-facility-filter]')];
  const galleryFilters = [...document.querySelectorAll('[data-gallery-filter]')];
  const lightbox = document.getElementById('campus-lightbox');
  const lightboxDialog = lightbox.querySelector('[role="dialog"]');
  const lightboxImage = lightbox.querySelector('figure img');
  const lightboxCaption = lightbox.querySelector('figcaption');
  const lightboxCount = lightbox.querySelector('.campus-lightbox__count');
  const lightboxClose = lightbox.querySelector('.campus-lightbox__close');
  const lightboxPrevious = lightbox.querySelector('.campus-lightbox__previous');
  const lightboxNext = lightbox.querySelector('.campus-lightbox__next');
  const facilityDialog = document.getElementById('facility-dialog');
  const facilityPanel = facilityDialog.querySelector('[role="dialog"]');
  const facilityDialogContent = document.getElementById('facility-dialog-content');
  const facilityDialogClose = facilityDialog.querySelector('.facility-dialog__close');
  const mainContent = document.querySelector('main');
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  const backToTop = document.querySelector('.back-to-top');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let facilities = [];
  let galleryItems = [];
  let selectedFacilityCategory = 'all';
  let selectedGalleryCategory = 'all';
  let currentLightboxIndex = 0;
  let lightboxItems = [];
  let lastFocusedElement = null;
  let previousOverflow = '';
  let closeTimer;

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);

  const observeReveal = (container) => {
    const targets = container.querySelectorAll('[data-reveal]');
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        instance.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px 35px 0px' });
    targets.forEach((target, index) => {
      target.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
      observer.observe(target);
    });
  };

  const currentFocusable = (dialog) => [...dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getClientRects().length > 0);

  const setBackgroundInert = (inert) => {
    [mainContent, header, footer, backToTop].filter(Boolean).forEach((element) => {
      element.inert = inert;
    });
  };

  const lockPage = (trigger) => {
    lastFocusedElement = trigger || document.activeElement;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setBackgroundInert(true);
  };

  const unlockPage = () => {
    document.body.style.overflow = previousOverflow;
    setBackgroundInert(false);
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => lastFocusedElement?.focus(), reduceMotion.matches ? 0 : 230);
  };

  const renderFacilities = () => {
    const filtered = selectedFacilityCategory === 'all'
      ? facilities
      : facilities.filter((facility) => facility.category === selectedFacilityCategory);

    facilityGrid.innerHTML = filtered.map((facility) => `
      <article class="facility-card" data-reveal="fade-up">
        <div class="facility-card__image">
          <img src="${escapeHtml(facility.image)}" alt="${escapeHtml(facility.alt)}" loading="lazy" />
          <span class="facility-card__icon" aria-hidden="true"><i class="${escapeHtml(facility.icon)}"></i></span>
        </div>
        <div class="facility-card__content">
          <span class="facility-card__category">${escapeHtml(facility.categoryLabel)}</span>
          <h3>${escapeHtml(facility.name)}</h3>
          <p>${escapeHtml(facility.description)}</p>
          <button class="facility-card__details" type="button" data-facility-id="${escapeHtml(facility.id)}" aria-label="View details about ${escapeHtml(facility.name)}">View Details <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
        </div>
      </article>
    `).join('');

    facilityGrid.setAttribute('aria-busy', 'false');
    facilityEmpty.hidden = filtered.length !== 0;
    if (filtered.length) {
      const categoryLabel = selectedFacilityCategory === 'all'
        ? 'Campus'
        : facilityFilters.find((button) => button.dataset.facilityFilter === selectedFacilityCategory)?.textContent.trim() || 'Campus';
      facilityStatus.textContent = `Showing ${filtered.length} ${categoryLabel} ${filtered.length === 1 ? 'facility' : 'facilities'}`;
    } else {
      facilityStatus.textContent = 'No facilities found.';
    }
    observeReveal(facilityGrid);
  };

  const renderGallery = () => {
    const filtered = selectedGalleryCategory === 'all'
      ? galleryItems
      : galleryItems.filter((item) => item.category === selectedGalleryCategory);

    galleryGrid.innerHTML = filtered.map((item, index) => `
      <button class="campus-gallery-item" type="button" data-gallery-index="${index}" data-reveal="fade-up" aria-label="View ${escapeHtml(item.category)} image: ${escapeHtml(item.caption)}">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" loading="lazy" />
        <span class="campus-gallery-item__caption"><span>${escapeHtml(item.category)}</span><strong>${escapeHtml(item.caption)}</strong></span>
      </button>
    `).join('');

    galleryGrid.setAttribute('aria-busy', 'false');
    galleryEmpty.hidden = filtered.length !== 0;
    galleryStatus.textContent = filtered.length
      ? `Showing ${filtered.length} ${selectedGalleryCategory === 'all' ? 'campus' : selectedGalleryCategory} ${filtered.length === 1 ? 'image' : 'images'}`
      : 'No images available.';
    lightboxItems = filtered;
    observeReveal(galleryGrid);
  };

  const openFacilityDetails = (facility, trigger) => {
    if (!facility) return;
    window.clearTimeout(closeTimer);
    lockPage(trigger);
    facilityDialogContent.innerHTML = `
      <div class="facility-dialog__image"><img src="${escapeHtml(facility.image)}" alt="${escapeHtml(facility.alt)}" /></div>
      <div class="facility-dialog__copy">
        <span class="facility-card__category">${escapeHtml(facility.categoryLabel)}</span>
        <h2 id="facility-dialog-title">${escapeHtml(facility.name)}</h2>
        <p>${escapeHtml(facility.detail || facility.description)}</p>
      </div>
    `;
    facilityDialog.setAttribute('aria-hidden', 'false');
    facilityDialog.classList.add('is-open');
    document.body.classList.add('campus-lightbox-open');
    window.setTimeout(() => {
      if (facilityDialog.classList.contains('is-open')) facilityDialogClose.focus();
    }, 50);
  };

  const closeFacilityDetails = () => {
    if (!facilityDialog.classList.contains('is-open')) return;
    facilityDialog.classList.remove('is-open');
    facilityDialog.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('campus-lightbox-open');
    unlockPage();
    closeTimer = window.setTimeout(() => { facilityDialogContent.innerHTML = ''; }, reduceMotion.matches ? 0 : 230);
  };

  const updateLightbox = () => {
    const item = lightboxItems[currentLightboxIndex];
    if (!item) return;
    lightboxImage.src = item.image;
    lightboxImage.alt = item.alt;
    lightboxCaption.textContent = item.caption;
    lightboxCount.textContent = `${currentLightboxIndex + 1} of ${lightboxItems.length}`;
    lightboxPrevious.disabled = lightboxItems.length < 2;
    lightboxNext.disabled = lightboxItems.length < 2;
  };

  const openLightbox = (index, trigger) => {
    if (!lightboxItems.length) return;
    window.clearTimeout(closeTimer);
    currentLightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
    lockPage(trigger);
    updateLightbox();
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.add('is-open');
    document.body.classList.add('campus-lightbox-open');
    window.setTimeout(() => {
      if (lightbox.classList.contains('is-open')) lightboxClose.focus();
    }, 50);
  };

  const closeLightbox = () => {
    if (!lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('campus-lightbox-open');
    unlockPage();
    closeTimer = window.setTimeout(() => {
      lightboxImage.src = '';
      lightboxImage.alt = '';
      lightboxCaption.textContent = '';
    }, reduceMotion.matches ? 0 : 230);
  };

  const moveLightbox = (direction) => {
    if (lightboxItems.length < 2) return;
    currentLightboxIndex = (currentLightboxIndex + direction + lightboxItems.length) % lightboxItems.length;
    updateLightbox();
  };

  facilityFilters.forEach((button) => button.addEventListener('click', () => {
    selectedFacilityCategory = button.dataset.facilityFilter;
    facilityFilters.forEach((filter) => {
      const isActive = filter === button;
      filter.classList.toggle('is-active', isActive);
      filter.setAttribute('aria-pressed', String(isActive));
    });
    renderFacilities();
  }));

  galleryFilters.forEach((button) => button.addEventListener('click', () => {
    selectedGalleryCategory = button.dataset.galleryFilter;
    galleryFilters.forEach((filter) => {
      const isActive = filter === button;
      filter.classList.toggle('is-active', isActive);
      filter.setAttribute('aria-pressed', String(isActive));
    });
    renderGallery();
  }));

  facilityGrid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-facility-id]');
    if (!trigger) return;
    const facility = facilities.find((item) => item.id === trigger.dataset.facilityId);
    openFacilityDetails(facility, trigger);
  });

  facilityEmpty.querySelector('[data-show-all-facilities]').addEventListener('click', () => {
    const allFilter = facilityFilters.find((button) => button.dataset.facilityFilter === 'all');
    allFilter?.click();
    allFilter?.focus();
  });

  galleryGrid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-gallery-index]');
    if (!trigger) return;
    openLightbox(Number(trigger.dataset.galleryIndex), trigger);
  });

  facilityDialogClose.addEventListener('click', closeFacilityDetails);
  facilityDialog.addEventListener('click', (event) => {
    if (event.target === facilityDialog) closeFacilityDetails();
  });
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrevious.addEventListener('click', () => moveLightbox(-1));
  lightboxNext.addEventListener('click', () => moveLightbox(1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    const activeDialog = facilityDialog.classList.contains('is-open') ? facilityPanel : lightbox.classList.contains('is-open') ? lightboxDialog : null;
    if (!activeDialog) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      if (activeDialog === facilityPanel) closeFacilityDetails();
      else closeLightbox();
      return;
    }
    if (activeDialog === lightboxDialog && event.key === 'ArrowLeft') {
      event.preventDefault();
      moveLightbox(-1);
      return;
    }
    if (activeDialog === lightboxDialog && event.key === 'ArrowRight') {
      event.preventDefault();
      moveLightbox(1);
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = currentFocusable(activeDialog);
    if (!focusable.length) {
      event.preventDefault();
      activeDialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!activeDialog.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const faqItems = [...document.querySelectorAll('.campus-faq-item')];
  faqItems.forEach((item) => {
    const button = item.querySelector('.campus-faq-question');
    const panel = item.querySelector('.campus-faq-answer');
    button.addEventListener('click', () => {
      const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
      faqItems.forEach((otherItem) => {
        const otherButton = otherItem.querySelector('.campus-faq-question');
        const otherPanel = otherItem.querySelector('.campus-faq-answer');
        otherButton.setAttribute('aria-expanded', 'false');
        otherItem.classList.remove('is-open');
        otherPanel.hidden = true;
        otherPanel.style.maxHeight = '0px';
      });
      if (!shouldOpen) return;
      button.setAttribute('aria-expanded', 'true');
      item.classList.add('is-open');
      panel.hidden = false;
      panel.style.maxHeight = '0px';
      requestAnimationFrame(() => { panel.style.maxHeight = `${panel.scrollHeight}px`; });
    });
  });

  window.addEventListener('resize', () => {
    faqItems.forEach((item) => {
      const button = item.querySelector('.campus-faq-question');
      const panel = item.querySelector('.campus-faq-answer');
      if (button.getAttribute('aria-expanded') === 'true') {
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });

  fetch('data/campus.json')
    .then((response) => {
      if (!response.ok) throw new Error('Campus data could not be loaded.');
      return response.json();
    })
    .then((data) => {
      facilities = Array.isArray(data.facilities) ? data.facilities : [];
      galleryItems = Array.isArray(data.gallery) ? data.gallery : [];
      renderFacilities();
      renderGallery();
    })
    .catch((error) => {
      console.error(error);
      facilityGrid.setAttribute('aria-busy', 'false');
      galleryGrid.setAttribute('aria-busy', 'false');
      facilityGrid.innerHTML = '';
      galleryGrid.innerHTML = '';
      facilityStatus.textContent = 'Campus facilities could not be loaded.';
      galleryStatus.textContent = 'Campus images could not be loaded.';
      facilityEmpty.hidden = false;
      facilityEmpty.querySelector('h3').textContent = 'Campus information is temporarily unavailable.';
      facilityEmpty.querySelector('p').textContent = 'Please contact the school to learn more about the campus.';
      facilityEmpty.querySelector('[data-show-all-facilities]').hidden = true;
      galleryEmpty.hidden = false;
      galleryEmpty.querySelector('h3').textContent = 'Campus images are temporarily unavailable.';
    });
});
