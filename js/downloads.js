/**
 * Horizon International School - Downloads Page JavaScript
 * Handles dynamic JSON document loading, multi-criteria filtering (category, audience, format),
 * live keyword search, dynamic sorting, accessible details modal, and FAQ accordion.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const docsList = document.getElementById('documents-list');
  const docsStatus = document.getElementById('downloads-status');
  const docsEmpty = document.getElementById('downloads-empty');
  const docsError = document.getElementById('downloads-error');
  const searchInput = document.getElementById('downloads-search-input');
  const searchClearBtn = document.getElementById('downloads-search-clear');
  const categoryButtons = [...document.querySelectorAll('[data-doc-category]')];
  const audienceSelect = document.getElementById('audience-filter');
  const sortSelect = document.getElementById('sort-filter');
  const resetFiltersBtn = document.getElementById('downloads-reset-filters');
  const emptyResetBtn = document.getElementById('empty-reset-btn');

  // Modal Elements
  const docModal = document.getElementById('doc-modal');
  const modalDialog = docModal?.querySelector('[role="dialog"]');
  const modalCloseBtn = docModal?.querySelector('.doc-modal__close');
  const modalContent = document.getElementById('doc-modal-content');

  // FAQ Elements
  const faqItems = [...document.querySelectorAll('.downloads-faq-item')];

  // Background Inert Elements
  const mainContent = document.querySelector('main');
  const siteHeader = document.querySelector('.site-header');
  const siteFooter = document.querySelector('.site-footer');
  const backToTop = document.querySelector('.back-to-top');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // State
  let allDocuments = [];
  let currentCategory = 'all';
  let currentAudience = 'all';
  let currentSort = 'recent';
  let searchQuery = '';
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

  // Focus Trapper for Modal
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

  // Filter and Sort Calculation
  const getFilteredDocuments = () => {
    const q = searchQuery.trim().toLowerCase();

    let filtered = allDocuments.filter((doc) => {
      // Category Match
      const matchesCategory = currentCategory === 'all' || doc.category === currentCategory;

      // Audience Match
      const matchesAudience =
        currentAudience === 'all' ||
        (Array.isArray(doc.audience) && (doc.audience.includes('all') || doc.audience.includes(currentAudience)));

      // Search Query Match
      const matchesSearch =
        !q ||
        (doc.title && doc.title.toLowerCase().includes(q)) ||
        (doc.description && doc.description.toLowerCase().includes(q)) ||
        (doc.categoryLabel && doc.categoryLabel.toLowerCase().includes(q)) ||
        (doc.format && doc.format.toLowerCase().includes(q)) ||
        (doc.audienceLabels && doc.audienceLabels.some((a) => a.toLowerCase().includes(q))) ||
        (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(q)));

      return matchesCategory && matchesAudience && matchesSearch;
    });

    // Sort Results
    filtered.sort((a, b) => {
      if (currentSort === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (currentSort === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      if (currentSort === 'category') {
        return (a.categoryLabel || a.category).localeCompare(b.categoryLabel || b.category);
      }
      // Default: 'recent'
      const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      // If dates match, place available items first
      return (b.available === true ? 1 : 0) - (a.available === true ? 1 : 0);
    });

    return filtered;
  };

  // Render Main Documents List
  const renderDocuments = () => {
    if (!docsList) return;

    const filtered = getFilteredDocuments();

    // Update Live Result Counter
    if (docsStatus) {
      if (filtered.length === 0) {
        docsStatus.textContent = 'No matching documents found';
      } else if (filtered.length === 1) {
        docsStatus.textContent = 'Showing 1 document';
      } else {
        docsStatus.textContent = `Showing ${filtered.length} documents`;
      }
    }

    // Handle Empty State
    if (filtered.length === 0) {
      docsList.innerHTML = '';
      if (docsEmpty) docsEmpty.hidden = false;
      return;
    }

    if (docsEmpty) docsEmpty.hidden = true;

    docsList.innerHTML = filtered
      .map((doc, index) => {
        const isPdf = doc.format && doc.format.toUpperCase() === 'PDF';
        const fileIcon = isPdf ? 'fa-file-pdf' : 'fa-file-lines';

        return `
        <article class="document-item" data-reveal="fade-up" data-delay="${(index % 3) * 50}">
          <div class="document-type-badge" aria-hidden="true">
            <i class="fa-solid ${fileIcon}"></i>
            <span>${escapeHtml(doc.format || 'DOC')}</span>
          </div>

          <div class="document-main-info">
            <div class="document-meta-row">
              <span class="badge--category">${escapeHtml(doc.categoryLabel || doc.category)}</span>
              ${
                doc.audienceLabels && Array.isArray(doc.audienceLabels)
                  ? doc.audienceLabels.map((lbl) => `<span class="badge--audience">${escapeHtml(lbl)}</span>`).join('')
                  : ''
              }
              ${
                doc.available
                  ? `<span class="badge--available"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Verified File</span>`
                  : `<span class="badge--unavailable"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> ${escapeHtml(doc.statusBadge || 'Under Revision')}</span>`
              }
            </div>

            <h3 class="document-title">${escapeHtml(doc.title)}</h3>
            <p class="document-desc">${escapeHtml(doc.description)}</p>

            <div class="document-file-details">
              <span><i class="fa-solid fa-hard-drive" aria-hidden="true"></i> ${escapeHtml(doc.sizeFormatted || 'Standard File')}</span>
              ${
                doc.lastUpdatedFormatted
                  ? `<span><i class="fa-regular fa-calendar-check" aria-hidden="true"></i> Updated: ${escapeHtml(doc.lastUpdatedFormatted)}</span>`
                  : ''
              }
            </div>
          </div>

          <div class="document-actions-cell">
            ${
              doc.available && doc.file
                ? `
                <a href="${escapeHtml(doc.file)}" download class="button button--primary button--sm" title="Download ${escapeHtml(doc.title)}">
                  <i class="fa-solid fa-download" aria-hidden="true"></i> Download
                </a>
                <a href="${escapeHtml(doc.file)}" target="_blank" rel="noopener noreferrer" class="button button--secondary button--sm" title="View ${escapeHtml(doc.title)} in new tab">
                  <i class="fa-regular fa-eye" aria-hidden="true"></i> View
                </a>
              `
                : `
                <a href="mailto:admissions@horizoninternationalschool.edu?subject=Document%20Inquiry:%20${encodeURIComponent(doc.title)}" class="button button--secondary button--sm">
                  <i class="fa-solid fa-envelope" aria-hidden="true"></i> Inquire
                </a>
              `
            }
            <button type="button" class="button button--secondary button--sm" data-doc-details="${escapeHtml(doc.id)}" aria-label="View details for ${escapeHtml(doc.title)}">
              <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            </button>
          </div>
        </article>
      `;
      })
      .join('');

    observeReveals(docsList);

    // Attach Details Modal Triggers
    docsList.querySelectorAll('[data-doc-details]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openDocModal(btn.dataset.docDetails, btn);
      });
    });
  };

  // Open Document Details Modal
  const openDocModal = (docId, triggerEl) => {
    const doc = allDocuments.find((d) => d.id === docId);
    if (!doc || !docModal || !modalContent) return;

    const isPdf = doc.format && doc.format.toUpperCase() === 'PDF';

    modalContent.innerHTML = `
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
        <div class="document-type-badge" style="width: 58px; height: 58px;" aria-hidden="true">
          <i class="fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-file-lines'}" style="font-size: 1.6rem;"></i>
          <span>${escapeHtml(doc.format || 'PDF')}</span>
        </div>
        <div>
          <span class="badge--category">${escapeHtml(doc.categoryLabel || doc.category)}</span>
          <h2 id="doc-modal-title" style="margin: 6px 0 0; font-size: 1.5rem; color: var(--primary-color);">${escapeHtml(doc.title)}</h2>
        </div>
      </div>

      <p style="font-size: 0.96rem; line-height: 1.65; color: var(--text-color); margin-bottom: 20px;">
        ${escapeHtml(doc.description)}
      </p>

      ${
        doc.statusNote
          ? `
        <div style="padding: 12px 16px; border-radius: var(--radius-xs); background: rgba(217, 168, 75, 0.12); border-left: 3px solid var(--accent-color); margin-bottom: 20px; font-size: 0.88rem;">
          <strong style="color: var(--primary-color);">Note:</strong> ${escapeHtml(doc.statusNote)}
        </div>
      `
          : ''
      }

      <div class="doc-modal-meta-grid">
        <div class="doc-modal-meta-item">
          <strong>Intended Audience</strong>
          <span>${escapeHtml(doc.audienceLabels ? doc.audienceLabels.join(', ') : 'School Community')}</span>
        </div>
        <div class="doc-modal-meta-item">
          <strong>File Format</strong>
          <span>${escapeHtml(doc.format || 'PDF Document')}</span>
        </div>
        <div class="doc-modal-meta-item">
          <strong>File Size</strong>
          <span>${escapeHtml(doc.sizeFormatted || 'Standard')}</span>
        </div>
        <div class="doc-modal-meta-item">
          <strong>Last Updated</strong>
          <span>${escapeHtml(doc.lastUpdatedFormatted || 'Regular Term Schedule')}</span>
        </div>
      </div>

      <div class="doc-modal-actions">
        ${
          doc.available && doc.file
            ? `
            <a href="${escapeHtml(doc.file)}" download class="button button--primary" style="min-height: 44px;">
              <i class="fa-solid fa-download" aria-hidden="true"></i> Download File
            </a>
            <a href="${escapeHtml(doc.file)}" target="_blank" rel="noopener noreferrer" class="button button--secondary" style="min-height: 44px;">
              <i class="fa-regular fa-eye" aria-hidden="true"></i> View in New Tab
            </a>
          `
            : `
            <a href="mailto:admissions@horizoninternationalschool.edu?subject=Document%20Request:%20${encodeURIComponent(doc.title)}" class="button button--primary" style="min-height: 44px;">
              <i class="fa-solid fa-envelope" aria-hidden="true"></i> Contact School Office
            </a>
          `
        }
        <button type="button" class="button button--secondary" data-modal-close-action style="min-height: 44px;">
          Close
        </button>
      </div>
    `;

    modalContent.querySelector('[data-modal-close-action]')?.addEventListener('click', closeDocModal);

    lockPage(triggerEl);
    docModal.classList.add('is-open');
    docModal.setAttribute('aria-hidden', 'false');
    modalDialog?.focus();
  };

  const closeDocModal = () => {
    if (!docModal || !docModal.classList.contains('is-open')) return;
    docModal.classList.remove('is-open');
    docModal.setAttribute('aria-hidden', 'true');
    unlockPage();
  };

  modalCloseBtn?.addEventListener('click', closeDocModal);
  docModal?.addEventListener('click', (e) => {
    if (e.target === docModal || e.target.classList.contains('doc-modal__backdrop')) {
      closeDocModal();
    }
  });

  // Global Keyboard Listener for Modal (Escape, Tab Trap)
  document.addEventListener('keydown', (e) => {
    if (!docModal?.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeDocModal();
      return;
    }
    trapFocus(modalDialog, e);
  });

  // Category Filter Button Clicks
  categoryButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      currentCategory = btn.dataset.docCategory || 'all';
      renderDocuments();
    });
  });

  // Audience & Sort Change
  audienceSelect?.addEventListener('change', (e) => {
    currentAudience = e.target.value;
    renderDocuments();
  });

  sortSelect?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderDocuments();
  });

  // Search Input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClearBtn) searchClearBtn.hidden = !searchQuery;
      renderDocuments();
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchQuery = '';
        if (searchClearBtn) searchClearBtn.hidden = true;
        renderDocuments();
      }
    });
  }

  searchClearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    searchQuery = '';
    searchClearBtn.hidden = true;
    renderDocuments();
    searchInput?.focus();
  });

  // Reset Filters Function
  const resetAllFilters = () => {
    currentCategory = 'all';
    currentAudience = 'all';
    currentSort = 'recent';
    searchQuery = '';

    if (searchInput) searchInput.value = '';
    if (searchClearBtn) searchClearBtn.hidden = true;
    if (audienceSelect) audienceSelect.value = 'all';
    if (sortSelect) sortSelect.value = 'recent';

    categoryButtons.forEach((b) => {
      const isAll = b.dataset.docCategory === 'all';
      b.classList.toggle('is-active', isAll);
      b.setAttribute('aria-pressed', String(isAll));
    });

    renderDocuments();
  };

  resetFiltersBtn?.addEventListener('click', resetAllFilters);
  emptyResetBtn?.addEventListener('click', resetAllFilters);

  // Quick Action Buttons
  document.querySelectorAll('[data-quick-doc-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.quickDocTarget;
      openDocModal(targetId, btn);
    });
  });

  // Category Link Jump (e.g. from sections)
  document.querySelectorAll('[data-category-jump]').forEach((link) => {
    link.addEventListener('click', () => {
      const targetCat = link.dataset.categoryJump;
      const matchingBtn = categoryButtons.find((b) => b.dataset.docCategory === targetCat);
      if (matchingBtn) {
        matchingBtn.click();
      }
      document.getElementById('document-library')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // FAQ Accordion
  faqItems.forEach((item) => {
    const btn = item.querySelector('.downloads-faq-question');
    const panel = item.querySelector('.downloads-faq-answer');
    if (!btn || !panel) return;

    btn.addEventListener('click', () => {
      const isCurrentlyOpen = item.classList.contains('is-open');

      // Close all others
      faqItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-open');
          const otherBtn = other.querySelector('.downloads-faq-question');
          const otherPanel = other.querySelector('.downloads-faq-answer');
          otherBtn?.setAttribute('aria-expanded', 'false');
          if (otherPanel) {
            otherPanel.style.maxHeight = '0px';
            otherPanel.hidden = true;
          }
        }
      });

      // Toggle current
      if (isCurrentlyOpen) {
        item.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = '0px';
        setTimeout(() => {
          panel.hidden = true;
        }, 300);
      } else {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        panel.style.maxHeight = '0px';
        requestAnimationFrame(() => {
          panel.style.maxHeight = `${panel.scrollHeight}px`;
        });
      }
    });
  });

  window.addEventListener('resize', () => {
    faqItems.forEach((item) => {
      if (item.classList.contains('is-open')) {
        const panel = item.querySelector('.downloads-faq-answer');
        if (panel) panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });

  // -------------------------------------------------------------
  // Data Initialization
  // -------------------------------------------------------------
  const initDownloads = async () => {
    try {
      const response = await fetch('data/downloads.json');
      if (!response.ok) throw new Error('Failed to load downloads data');
      const data = await response.json();

      allDocuments = Array.isArray(data) ? data : Array.isArray(data.documents) ? data.documents : [];
      renderDocuments();
    } catch (err) {
      console.error('Error loading downloads:', err);
      if (docsList) docsList.innerHTML = '';
      if (docsStatus) docsStatus.textContent = '';
      if (docsError) docsError.hidden = false;
    }
  };

  initDownloads();
});
