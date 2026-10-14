/**
 * Horizon International School - Gallery Page JavaScript
 * Handles dynamic JSON loading, responsive masonry layout, category filtering,
 * keyword search, load-more pagination, interactive accessible lightbox,
 * and collection linking.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const galleryGrid = document.getElementById('gallery-masonry-grid');
  const galleryStatus = document.getElementById('gallery-status');
  const galleryEmpty = document.getElementById('gallery-empty');
  const galleryError = document.getElementById('gallery-error');
  const searchInput = document.getElementById('gallery-search-input');
  const searchClearBtn = document.getElementById('gallery-search-clear');
  const filterButtons = [...document.querySelectorAll('[data-gallery-filter]')];
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  const loadMoreBtn = document.getElementById('gallery-load-more-btn');
  const loadMoreWrap = document.getElementById('gallery-load-more-wrap');
  const loadMoreStatus = document.getElementById('gallery-load-more-status');

  // Featured Story Elements
  const storyTitle = document.getElementById('story-title');
  const storyDesc = document.getElementById('story-desc');
  const storyCategory = document.getElementById('story-category');
  const storyImg = document.getElementById('story-img');
  const storyBtn = document.getElementById('story-view-btn');

  // Lightbox Elements
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxDialog = lightbox?.querySelector('[role="dialog"]');
  const lightboxImg = lightbox?.querySelector('.gallery-lightbox__figure img');
  const lightboxCategory = lightbox?.querySelector('.gallery-lightbox__category');
  const lightboxTitle = lightbox?.querySelector('.gallery-lightbox__title');
  const lightboxCaption = lightbox?.querySelector('.gallery-lightbox__caption');
  const lightboxCount = lightbox?.querySelector('.gallery-lightbox__count');
  const lightboxClose = lightbox?.querySelector('.gallery-lightbox__close');
  const lightboxPrev = lightbox?.querySelector('.gallery-lightbox__previous');
  const lightboxNext = lightbox?.querySelector('.gallery-lightbox__next');

  // Accessibility Background Inert Elements
  const mainContent = document.querySelector('main');
  const siteHeader = document.querySelector('.site-header');
  const siteFooter = document.querySelector('.site-footer');
  const backToTop = document.querySelector('.back-to-top');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // State
  let allPhotos = [];
  let currentCategory = 'all';
  let searchQuery = '';
  let visibleLimit = 12;
  const BATCH_SIZE = 8;
  let currentFilteredPhotos = [];
  let currentLightboxIndex = 0;
  let lastFocusedElement = null;

  // Utility: HTML Escaping
  const escapeHtml = (str = '') =>
    String(str).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  // Accessibility: Background Inert & Page Scroll Lock
  const setBackgroundInert = (isInert) => {
    [mainContent, siteHeader, siteFooter, backToTop].filter(Boolean).forEach((el) => {
      el.inert = isInert;
    });
  };

  const lockPage = (triggerEl) => {
    lastFocusedElement = triggerEl || document.activeElement;
    document.body.style.overflow = 'hidden';
    setBackgroundInert(true);
  };

  const unlockPage = () => {
    document.body.style.overflow = '';
    setBackgroundInert(false);
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      setTimeout(() => lastFocusedElement.focus(), prefersReducedMotion.matches ? 0 : 200);
    }
  };

  // Focus Trapper
  const trapFocus = (dialogEl, event) => {
    if (event.key !== 'Tab') return;
    const focusableEls = [
      ...dialogEl.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ].filter((el) => !el.hidden && el.offsetParent !== null);

    if (focusableEls.length === 0) {
      event.preventDefault();
      dialogEl.focus();
      return;
    }

    const firstEl = focusableEls[0];
    const lastEl = focusableEls[focusableEls.length - 1];

    if (event.shiftKey && document.activeElement === firstEl) {
      event.preventDefault();
      lastEl.focus();
    } else if (!event.shiftKey && document.activeElement === lastEl) {
      event.preventDefault();
      firstEl.focus();
    }
  };

  // Intersection Observer for Reveal animations
  const observeReveals = (container = document) => {
    const targets = container.querySelectorAll('[data-reveal]');
    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    targets.forEach((t, i) => {
      const delay = t.dataset.delay || Math.min(i % 3, 2) * 60;
      t.style.transitionDelay = `${delay}ms`;
      observer.observe(t);
    });
  };

  // Filter calculation
  const getFilteredPhotos = () => {
    const q = searchQuery.trim().toLowerCase();
    return allPhotos.filter((photo) => {
      const matchesCategory = currentCategory === 'all' || photo.category === currentCategory;
      const matchesSearch =
        !q ||
        (photo.title && photo.title.toLowerCase().includes(q)) ||
        (photo.caption && photo.caption.toLowerCase().includes(q)) ||
        (photo.categoryLabel && photo.categoryLabel.toLowerCase().includes(q)) ||
        (photo.category && photo.category.toLowerCase().includes(q)) ||
        (photo.tags && photo.tags.some((tag) => tag.toLowerCase().includes(q)));

      return matchesCategory && matchesSearch;
    });
  };

  // Render Main Gallery Grid
  const renderGallery = () => {
    if (!galleryGrid) return;

    currentFilteredPhotos = getFilteredPhotos();
    const totalMatching = currentFilteredPhotos.length;

    // Update Live Status Text
    if (galleryStatus) {
      if (totalMatching === 0) {
        galleryStatus.textContent = 'No photos found';
      } else if (totalMatching === 1) {
        galleryStatus.textContent = 'Showing 1 photo';
      } else if (visibleLimit >= totalMatching) {
        galleryStatus.textContent = `Showing all ${totalMatching} photos`;
      } else {
        galleryStatus.textContent = `Showing ${Math.min(visibleLimit, totalMatching)} of ${totalMatching} photos`;
      }
    }

    // Handle Empty State
    if (totalMatching === 0) {
      galleryGrid.innerHTML = '';
      if (galleryEmpty) galleryEmpty.hidden = false;
      if (loadMoreWrap) loadMoreWrap.hidden = true;
      return;
    }

    if (galleryEmpty) galleryEmpty.hidden = true;

    // Slice for pagination
    const photosToRender = currentFilteredPhotos.slice(0, visibleLimit);

    galleryGrid.innerHTML = photosToRender
      .map((photo, index) => {
        let modifier = '';
        if (photo.aspectRatio === 'wide') modifier = 'gallery-card--wide';
        else if (photo.aspectRatio === 'tall') modifier = 'gallery-card--tall';

        return `
        <article
          class="gallery-card ${modifier}"
          data-photo-index="${index}"
          data-reveal="fade-up"
          data-delay="${(index % 3) * 60}"
          tabindex="0"
          role="button"
          aria-label="View photo: ${escapeHtml(photo.title)}"
        >
          <img
            class="gallery-card__img"
            src="${escapeHtml(photo.image)}"
            alt="${escapeHtml(photo.alt || photo.title)}"
            loading="lazy"
            onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80';"
          />
          <div class="gallery-card__overlay">
            <span class="gallery-card__category">${escapeHtml(photo.categoryLabel || photo.category)}</span>
            <h3 class="gallery-card__title">${escapeHtml(photo.title)}</h3>
            ${photo.caption ? `<p class="gallery-card__caption">${escapeHtml(photo.caption)}</p>` : ''}
            <span class="gallery-card__action">
              <i class="fa-solid fa-expand" aria-hidden="true"></i> View Full Photo
            </span>
          </div>
        </article>
      `;
      })
      .join('');

    observeReveals(galleryGrid);

    // Attach Click and Keyboard listener to Cards
    galleryGrid.querySelectorAll('.gallery-card').forEach((card) => {
      const idx = Number(card.dataset.photoIndex);
      card.addEventListener('click', () => openLightbox(idx, card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(idx, card);
        }
      });
    });

    // Update Load More Button
    if (loadMoreWrap && loadMoreBtn) {
      const remaining = totalMatching - visibleLimit;
      if (remaining > 0) {
        loadMoreWrap.hidden = false;
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = `<i class="fa-solid fa-images" aria-hidden="true"></i> Load More Photos (${remaining} remaining)`;
        if (loadMoreStatus) {
          loadMoreStatus.textContent = `${totalMatching - remaining} of ${totalMatching} photos visible`;
        }
      } else {
        loadMoreWrap.hidden = true;
      }
    }
  };

  // Load More Button Click
  loadMoreBtn?.addEventListener('click', () => {
    visibleLimit += BATCH_SIZE;
    renderGallery();
  });

  // Filter Buttons Click
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      currentCategory = btn.dataset.galleryFilter || 'all';
      visibleLimit = 12; // Reset pagination
      renderGallery();
    });
  });

  // Search Input Handling
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClearBtn) {
        searchClearBtn.hidden = !searchQuery;
      }
      visibleLimit = 12; // Reset pagination
      renderGallery();
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchQuery = '';
        if (searchClearBtn) searchClearBtn.hidden = true;
        visibleLimit = 12;
        renderGallery();
      }
    });
  }

  searchClearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    searchQuery = '';
    searchClearBtn.hidden = true;
    visibleLimit = 12;
    renderGallery();
    searchInput?.focus();
  });

  clearFiltersBtn?.addEventListener('click', () => {
    currentCategory = 'all';
    searchQuery = '';
    visibleLimit = 12;
    if (searchInput) searchInput.value = '';
    if (searchClearBtn) searchClearBtn.hidden = true;
    filterButtons.forEach((b) => {
      const isAll = b.dataset.galleryFilter === 'all';
      b.classList.toggle('is-active', isAll);
      b.setAttribute('aria-pressed', String(isAll));
    });
    renderGallery();
  });

  // -------------------------------------------------------------
  // Lightbox Interactions
  // -------------------------------------------------------------
  const openLightbox = (index, triggerEl) => {
    if (!lightbox || currentFilteredPhotos.length === 0) return;
    currentLightboxIndex = (index + currentFilteredPhotos.length) % currentFilteredPhotos.length;
    updateLightbox();

    lockPage(triggerEl);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    lightboxDialog?.focus();
  };

  const updateLightbox = () => {
    const photo = currentFilteredPhotos[currentLightboxIndex];
    if (!photo) return;

    if (lightboxImg) {
      lightboxImg.src = photo.image;
      lightboxImg.alt = photo.alt || photo.title;
    }
    if (lightboxCategory) {
      lightboxCategory.textContent = photo.categoryLabel || photo.category;
    }
    if (lightboxTitle) {
      lightboxTitle.textContent = photo.title;
    }
    if (lightboxCaption) {
      lightboxCaption.textContent = photo.caption || '';
      lightboxCaption.hidden = !photo.caption;
    }
    if (lightboxCount) {
      lightboxCount.textContent = `${currentLightboxIndex + 1} / ${currentFilteredPhotos.length}`;
    }
  };

  const closeLightbox = () => {
    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    unlockPage();
  };

  const moveLightbox = (direction) => {
    if (currentFilteredPhotos.length === 0) return;
    currentLightboxIndex = (currentLightboxIndex + direction + currentFilteredPhotos.length) % currentFilteredPhotos.length;
    updateLightbox();
  };

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', () => moveLightbox(-1));
  lightboxNext?.addEventListener('click', () => moveLightbox(1));
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard Navigation for Lightbox
  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveLightbox(-1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveLightbox(1);
      return;
    }
    trapFocus(lightboxDialog, e);
  });

  // -------------------------------------------------------------
  // Collections Section Linking & Counts
  // -------------------------------------------------------------
  const updateCollectionBadges = () => {
    document.querySelectorAll('[data-collection-target]').forEach((card) => {
      const targetCategory = card.dataset.collectionTarget;
      const countEl = card.querySelector('.collection-card__badge');
      if (countEl && targetCategory) {
        const count = allPhotos.filter((p) => p.category === targetCategory).length;
        countEl.textContent = `${count} Photos`;
      }

      card.addEventListener('click', () => {
        const matchingBtn = filterButtons.find((b) => b.dataset.galleryFilter === targetCategory);
        if (matchingBtn) {
          matchingBtn.click();
        }
        document.getElementById('main-gallery')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  };

  // Story "View Photos" Button
  storyBtn?.addEventListener('click', () => {
    const storyCat = storyBtn.dataset.storyCategory || 'academics';
    const matchingBtn = filterButtons.find((b) => b.dataset.galleryFilter === storyCat);
    if (matchingBtn) {
      matchingBtn.click();
    }
    document.getElementById('main-gallery')?.scrollIntoView({ behavior: 'smooth' });
  });

  // -------------------------------------------------------------
  // Data Fetching & Initialization
  // -------------------------------------------------------------
  const initGallery = async () => {
    try {
      const response = await fetch('data/gallery.json');
      if (!response.ok) throw new Error('Failed to load gallery.json');
      const data = await response.json();

      allPhotos = Array.isArray(data) ? data : Array.isArray(data.photos) ? data.photos : [];

      // Populate Featured Story if available
      if (data.featuredStory) {
        if (storyTitle) storyTitle.textContent = data.featuredStory.title;
        if (storyDesc) storyDesc.textContent = data.featuredStory.description;
        if (storyCategory) storyCategory.textContent = data.featuredStory.categoryLabel || data.featuredStory.category;
        if (storyImg && data.featuredStory.image) {
          storyImg.src = data.featuredStory.image;
          storyImg.alt = data.featuredStory.alt || data.featuredStory.title;
        }
        if (storyBtn && data.featuredStory.category) {
          storyBtn.dataset.storyCategory = data.featuredStory.category;
        }
      }

      renderGallery();
      updateCollectionBadges();
    } catch (err) {
      console.error('Gallery loading failed:', err);
      if (galleryGrid) galleryGrid.innerHTML = '';
      if (galleryStatus) galleryStatus.textContent = '';
      if (galleryError) galleryError.hidden = false;
      if (loadMoreWrap) loadMoreWrap.hidden = true;
    }
  };

  initGallery();
});
