/**
 * Horizon International School - Events Page JavaScript
 * Handles dynamic JSON loading, chronological sorting, search, category filtering,
 * accessible modal, interactive calendar, .ics generation, gallery lightbox, and FAQ accordion.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Core Elements
  const eventsGrid = document.getElementById('upcoming-events-grid');
  const eventsStatus = document.getElementById('events-status');
  const eventsEmpty = document.getElementById('events-empty');
  const eventsError = document.getElementById('events-error');
  const searchInput = document.getElementById('events-search-input');
  const searchClearBtn = document.getElementById('events-search-clear');
  const filterButtons = [...document.querySelectorAll('[data-event-category]')];
  const clearFiltersBtn = document.getElementById('clear-filters-btn');

  // Modal Elements
  const eventModal = document.getElementById('event-modal');
  const modalDialog = eventModal?.querySelector('[role="dialog"]');
  const modalCloseBtn = eventModal?.querySelector('.event-modal__close');
  const modalContent = document.getElementById('event-modal-content');

  // Calendar Elements
  const calendarMonthTitle = document.getElementById('calendar-month-title');
  const calendarDaysGrid = document.getElementById('calendar-days-grid');
  const calendarPrevBtn = document.getElementById('calendar-prev-btn');
  const calendarNextBtn = document.getElementById('calendar-next-btn');
  const calendarTodayBtn = document.getElementById('calendar-today-btn');
  const calendarPanelDate = document.getElementById('calendar-panel-date');
  const calendarPanelCount = document.getElementById('calendar-panel-count');
  const calendarEventsList = document.getElementById('calendar-events-list');

  // Archive Elements
  const archiveGrid = document.getElementById('archive-grid');
  const archiveYearsWrap = document.getElementById('archive-years');
  const archiveEmpty = document.getElementById('archive-empty');

  // Gallery & Lightbox Elements
  const galleryGrid = document.getElementById('events-gallery-grid');
  const galleryFilters = [...document.querySelectorAll('[data-gallery-category]')];
  const lightbox = document.getElementById('events-lightbox');
  const lightboxDialog = lightbox?.querySelector('[role="dialog"]');
  const lightboxImage = lightbox?.querySelector('.events-lightbox__figure img');
  const lightboxCaption = lightbox?.querySelector('.events-lightbox__figure figcaption');
  const lightboxCount = lightbox?.querySelector('.events-lightbox__count');
  const lightboxClose = lightbox?.querySelector('.events-lightbox__close');
  const lightboxPrev = lightbox?.querySelector('.events-lightbox__previous');
  const lightboxNext = lightbox?.querySelector('.events-lightbox__next');

  // FAQ Elements
  const faqItems = [...document.querySelectorAll('.events-faq-item')];

  // Global Page Elements for Accessibility Focus Lock
  const mainContent = document.querySelector('main');
  const siteHeader = document.querySelector('.site-header');
  const siteFooter = document.querySelector('.site-footer');
  const backToTop = document.querySelector('.back-to-top');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // State Management
  let allEvents = [];
  let upcomingEvents = [];
  let pastEvents = [];
  let galleryItems = [];
  let currentActiveCategory = 'all';
  let currentSearchQuery = '';
  let activeArchiveYear = 'all';
  let activeGalleryCategory = 'all';

  // Calendar State
  let calendarYear = 2026;
  let calendarMonth = 9; // 0-indexed (9 = October)
  let selectedDateString = '2026-10-17';

  // Lightbox State
  let currentLightboxIndex = 0;
  let filteredGalleryItems = [];

  // Focus Trapping State
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

  // Utility: Date Formatting
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDisplayDate = (dateStr) => {
    const d = parseLocalDate(dateStr);
    return `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  // Accessibility: Background Inert & Focus Lock
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

  // Generate .ics file for calendar export
  const downloadIcsFile = (event) => {
    if (!event) return;
    const dateObj = parseLocalDate(event.date);
    const startHour = event.startTime ? parseInt(event.startTime.split(':')[0], 10) : 9;
    const startMin = event.startTime ? parseInt(event.startTime.split(':')[1], 10) : 0;
    const endHour = event.endTime ? parseInt(event.endTime.split(':')[0], 10) : startHour + 2;
    const endMin = event.endTime ? parseInt(event.endTime.split(':')[1], 10) : 0;

    const pad = (n) => String(n).padStart(2, '0');
    const y = dateObj.getFullYear();
    const m = pad(dateObj.getMonth() + 1);
    const d = pad(dateObj.getDate());

    const dtStart = `${y}${m}${d}T${pad(startHour)}${pad(startMin)}00`;
    const dtEnd = `${y}${m}${d}T${pad(endHour)}${pad(endMin)}00`;
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const cleanTitle = (event.title || 'Horizon Event').replace(/,/g, '\\,');
    const cleanLocation = (event.location || 'Horizon International School').replace(/,/g, '\\,');
    const cleanDesc = (event.shortDescription || event.description || '').replace(/\n/g, '\\n').replace(/,/g, '\\,');

    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Horizon International School//Events Page//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id || 'event'}-${Date.now()}@horizoninternationalschool.edu`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${cleanTitle}`,
      `DESCRIPTION:${cleanDesc}`,
      `LOCATION:${cleanLocation}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.id || 'horizon-event'}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Open Event Details Modal
  const openEventModal = (eventId, triggerEl) => {
    const event = allEvents.find((e) => e.id === eventId);
    if (!event || !eventModal || !modalContent) return;

    const dateFormatted = formatDisplayDate(event.date);

    modalContent.innerHTML = `
      <div class="modal-header-banner">
        <img src="${escapeHtml(event.image)}" alt="${escapeHtml(event.imageAlt || event.title)}" />
        <div class="modal-header-overlay"></div>
        <div class="modal-header-details">
          <span class="badge badge--accent">${escapeHtml(event.categoryLabel || event.category)}</span>
          <h2 id="modal-event-title">${escapeHtml(event.title)}</h2>
        </div>
      </div>
      <div class="modal-body">
        <div class="modal-meta-grid">
          <div class="modal-meta-item">
            <i class="fa-regular fa-calendar" aria-hidden="true"></i>
            <div>
              <strong>Date</strong>
              <span>${dateFormatted}</span>
            </div>
          </div>
          <div class="modal-meta-item">
            <i class="fa-regular fa-clock" aria-hidden="true"></i>
            <div>
              <strong>Time</strong>
              <span>${escapeHtml(event.time || 'Schedule announced on campus')}</span>
            </div>
          </div>
          <div class="modal-meta-item">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            <div>
              <strong>Location</strong>
              <span>${escapeHtml(event.location || 'Horizon International School')}</span>
            </div>
          </div>
        </div>

        <h3 class="modal-section-title">Overview</h3>
        <p class="modal-description">${escapeHtml(event.description || event.shortDescription)}</p>

        ${
          event.whatToExpect && Array.isArray(event.whatToExpect) && event.whatToExpect.length > 0
            ? `
          <h3 class="modal-section-title">What to Expect</h3>
          <ul class="modal-expect-list">
            ${event.whatToExpect.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        `
            : ''
        }

        ${
          event.audience
            ? `
          <div class="modal-audience-box">
            <strong>Audience:</strong> ${escapeHtml(event.audience)}
          </div>
        `
            : ''
        }

        ${
          event.registrationNote
            ? `
          <p style="font-size: 0.88rem; color: var(--muted-text-color); margin-bottom: 24px;">
            <i class="fa-solid fa-circle-info" aria-hidden="true" style="color: var(--accent-color); margin-right: 6px;"></i>
            ${escapeHtml(event.registrationNote)}
          </p>
        `
            : ''
        }

        <div class="modal-actions">
          <button type="button" class="button button--primary" data-modal-download-ics="${escapeHtml(event.id)}">
            <i class="fa-solid fa-calendar-plus" aria-hidden="true"></i> Add to Calendar (.ics)
          </button>
          <a href="mailto:admissions@horizoninternationalschool.edu?subject=Event%20Enquiry:%20${encodeURIComponent(event.title)}" class="button button--secondary">
            <i class="fa-solid fa-envelope" aria-hidden="true"></i> Contact School About Event
          </a>
          <button type="button" class="button button--secondary" data-modal-close-btn>
            Close
          </button>
        </div>
      </div>
    `;

    // Modal Action Bindings
    modalContent.querySelector('[data-modal-download-ics]')?.addEventListener('click', () => {
      downloadIcsFile(event);
    });
    modalContent.querySelector('[data-modal-close-btn]')?.addEventListener('click', closeEventModal);

    lockPage(triggerEl);
    eventModal.classList.add('is-open');
    eventModal.setAttribute('aria-hidden', 'false');
    modalDialog?.focus();
  };

  const closeEventModal = () => {
    if (!eventModal || !eventModal.classList.contains('is-open')) return;
    eventModal.classList.remove('is-open');
    eventModal.setAttribute('aria-hidden', 'true');
    unlockPage();
  };

  modalCloseBtn?.addEventListener('click', closeEventModal);
  eventModal?.addEventListener('click', (e) => {
    if (e.target === eventModal || e.target.classList.contains('event-modal__backdrop')) {
      closeEventModal();
    }
  });

  // Render Upcoming Events Grid
  const renderUpcomingEvents = () => {
    if (!eventsGrid) return;

    let filtered = upcomingEvents.filter((ev) => {
      const matchesCategory =
        currentActiveCategory === 'all' ||
        ev.category === currentActiveCategory ||
        (ev.tags && ev.tags.map((t) => t.toLowerCase()).includes(currentActiveCategory));

      const q = currentSearchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        (ev.title && ev.title.toLowerCase().includes(q)) ||
        (ev.categoryLabel && ev.categoryLabel.toLowerCase().includes(q)) ||
        (ev.category && ev.category.toLowerCase().includes(q)) ||
        (ev.description && ev.description.toLowerCase().includes(q)) ||
        (ev.shortDescription && ev.shortDescription.toLowerCase().includes(q)) ||
        (ev.location && ev.location.toLowerCase().includes(q)) ||
        (ev.tags && ev.tags.some((t) => t.toLowerCase().includes(q)));

      return matchesCategory && matchesQuery;
    });

    // Update Result Counter
    if (eventsStatus) {
      if (filtered.length === 0) {
        eventsStatus.textContent = 'No matching events found';
      } else if (filtered.length === 1) {
        eventsStatus.textContent = 'Showing 1 upcoming event';
      } else {
        eventsStatus.textContent = `Showing ${filtered.length} upcoming events`;
      }
    }

    if (filtered.length === 0) {
      eventsGrid.innerHTML = '';
      if (eventsEmpty) eventsEmpty.hidden = false;
      return;
    }

    if (eventsEmpty) eventsEmpty.hidden = true;

    eventsGrid.innerHTML = filtered
      .map((ev, index) => {
        const d = parseLocalDate(ev.date);
        const monthStr = monthShort[d.getMonth()];
        const dayNum = d.getDate();

        return `
        <article class="event-card" data-reveal="fade-up" data-delay="${(index % 3) * 60}">
          <div class="event-card__media-wrap">
            <img class="event-card__img" src="${escapeHtml(ev.image)}" alt="${escapeHtml(ev.imageAlt || ev.title)}" loading="lazy" />
            <div class="event-card__date-pill">
              <span class="event-card__date-month">${monthStr}</span>
              <span class="event-card__date-day">${dayNum}</span>
            </div>
            <span class="event-card__category-tag">${escapeHtml(ev.categoryLabel || ev.category)}</span>
          </div>
          <div class="event-card__body">
            <div class="event-card__meta">
              <div class="event-card__meta-item">
                <i class="fa-regular fa-clock" aria-hidden="true"></i>
                <span>${escapeHtml(ev.time || 'Time announced soon')}</span>
              </div>
              <div class="event-card__meta-item">
                <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                <span>${escapeHtml(ev.location || 'Horizon Campus')}</span>
              </div>
            </div>
            <h3 class="event-card__title">${escapeHtml(ev.title)}</h3>
            <p class="event-card__desc">${escapeHtml(ev.shortDescription || ev.description)}</p>
            <div class="event-card__footer">
              <button type="button" class="button button--primary" data-open-event="${escapeHtml(ev.id)}">
                View Event Details
              </button>
              <button type="button" class="button button--icon-only" data-card-ics="${escapeHtml(ev.id)}" title="Add to calendar" aria-label="Add ${escapeHtml(ev.title)} to calendar">
                <i class="fa-solid fa-calendar-plus" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </article>
      `;
      })
      .join('');

    observeReveals(eventsGrid);

    // Event Delegation for Cards
    eventsGrid.querySelectorAll('[data-open-event]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openEventModal(btn.dataset.openEvent, btn);
      });
    });

    eventsGrid.querySelectorAll('[data-card-ics]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ev = allEvents.find((x) => x.id === btn.dataset.cardIcs);
        if (ev) downloadIcsFile(ev);
      });
    });
  };

  // Filter Categories Click Handling
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      currentActiveCategory = btn.dataset.eventCategory || 'all';
      renderUpcomingEvents();
    });
  });

  // Search Input Handling
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      if (searchClearBtn) {
        searchClearBtn.hidden = !currentSearchQuery;
      }
      renderUpcomingEvents();
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        currentSearchQuery = '';
        if (searchClearBtn) searchClearBtn.hidden = true;
        renderUpcomingEvents();
      }
    });
  }

  searchClearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    currentSearchQuery = '';
    searchClearBtn.hidden = true;
    renderUpcomingEvents();
    searchInput?.focus();
  });

  clearFiltersBtn?.addEventListener('click', () => {
    currentActiveCategory = 'all';
    currentSearchQuery = '';
    if (searchInput) searchInput.value = '';
    if (searchClearBtn) searchClearBtn.hidden = true;
    filterButtons.forEach((b) => {
      const isAll = b.dataset.eventCategory === 'all';
      b.classList.toggle('is-active', isAll);
      b.setAttribute('aria-pressed', String(isAll));
    });
    renderUpcomingEvents();
  });

  // Category Section Cards: Click to Filter and Scroll
  document.querySelectorAll('[data-category-filter-target]').forEach((card) => {
    card.addEventListener('click', () => {
      const targetCategory = card.dataset.categoryFilterTarget;
      if (!targetCategory) return;

      const matchingBtn = filterButtons.find((b) => b.dataset.eventCategory === targetCategory);
      if (matchingBtn) {
        matchingBtn.click();
      }

      document.getElementById('upcoming-events')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Family Events CTA Link
  document.querySelector('[data-filter-family-events]')?.addEventListener('click', () => {
    const familyBtn = filterButtons.find((b) => b.dataset.eventCategory === 'parent-events');
    if (familyBtn) {
      familyBtn.click();
    }
    document.getElementById('upcoming-events')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Featured Event Trigger Binding
  document.querySelectorAll('[data-event-modal-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const eventId = trigger.dataset.eventModalTrigger;
      openEventModal(eventId, trigger);
    });
  });

  document.querySelectorAll('[data-add-to-calendar]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const eventId = btn.dataset.addToCalendar;
      const ev = allEvents.find((x) => x.id === eventId);
      if (ev) downloadIcsFile(ev);
    });
  });

  // -------------------------------------------------------------
  // Interactive Calendar Component
  // -------------------------------------------------------------
  const renderCalendar = () => {
    if (!calendarMonthTitle || !calendarDaysGrid) return;

    calendarMonthTitle.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

    // Compute first day and total days
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 is Sun
    // Adjust for Monday start: 0->6, 1->0, 2->1 ...
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    let daysHtml = '';

    // Empty cells before first day
    for (let i = 0; i < startOffset; i++) {
      daysHtml += '<div class="calendar-day-cell is-empty" aria-hidden="true"></div>';
    }

    const pad = (n) => String(n).padStart(2, '0');
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    // Fill days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarYear}-${pad(calendarMonth + 1)}-${pad(day)}`;
      const dayEvents = allEvents.filter((ev) => ev.date === dateStr);
      const hasEvents = dayEvents.length > 0;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDateString;

      let classList = ['calendar-day-cell'];
      if (hasEvents) classList.push('has-events');
      if (isToday) classList.push('is-today');
      if (isSelected) classList.push('is-selected');

      daysHtml += `
        <button
          type="button"
          class="${classList.join(' ')}"
          data-calendar-date="${dateStr}"
          aria-label="${day} ${monthNames[calendarMonth]} ${calendarYear}${hasEvents ? ` (${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''})` : ''}"
          ${isSelected ? 'aria-current="date"' : ''}
        >
          ${day}
        </button>
      `;
    }

    calendarDaysGrid.innerHTML = daysHtml;

    // Attach Click Events to Calendar Days
    calendarDaysGrid.querySelectorAll('[data-calendar-date]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedDateString = btn.dataset.calendarDate;
        renderCalendar();
        renderCalendarSidebar();
      });
    });

    renderCalendarSidebar();
  };

  const renderCalendarSidebar = () => {
    if (!calendarPanelDate || !calendarEventsList) return;

    const selDate = parseLocalDate(selectedDateString);
    calendarPanelDate.textContent = `${monthShort[selDate.getMonth()]} ${selDate.getDate()}, ${selDate.getFullYear()}`;

    const matchingEvents = allEvents.filter((ev) => ev.date === selectedDateString);

    if (calendarPanelCount) {
      if (matchingEvents.length === 0) {
        calendarPanelCount.textContent = 'No events scheduled on this date';
      } else {
        calendarPanelCount.textContent = `${matchingEvents.length} event${matchingEvents.length > 1 ? 's' : ''} on this date`;
      }
    }

    if (matchingEvents.length === 0) {
      // Find events in the current month to be helpful
      const currentMonthEvents = allEvents.filter((ev) => {
        const d = parseLocalDate(ev.date);
        return d.getFullYear() === calendarYear && d.getMonth() === calendarMonth;
      });

      calendarEventsList.innerHTML = `
        <div class="calendar-no-events">
          <i class="fa-regular fa-calendar-check" aria-hidden="true"></i>
          <p>No events scheduled on this date.</p>
          ${
            currentMonthEvents.length > 0
              ? `<p style="font-size: 0.85rem; margin-top: 8px;"><strong>${currentMonthEvents.length} event(s)</strong> are scheduled in ${monthNames[calendarMonth]}. Select highlighted days to view details.</p>`
              : ''
          }
        </div>
      `;
      return;
    }

    calendarEventsList.innerHTML = matchingEvents
      .map(
        (ev) => `
      <article class="calendar-mini-event">
        <span class="calendar-mini-event__category">${escapeHtml(ev.categoryLabel || ev.category)}</span>
        <h4 class="calendar-mini-event__title">${escapeHtml(ev.title)}</h4>
        <div class="calendar-mini-event__time">
          <i class="fa-regular fa-clock" aria-hidden="true"></i>
          <span>${escapeHtml(ev.time || 'Time announced soon')}</span>
        </div>
        <button type="button" class="button button--primary calendar-mini-event__btn" data-calendar-mini-view="${escapeHtml(ev.id)}">
          View Event Details
        </button>
      </article>
    `
      )
      .join('');

    calendarEventsList.querySelectorAll('[data-calendar-mini-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openEventModal(btn.dataset.calendarMiniView, btn);
      });
    });
  };

  calendarPrevBtn?.addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) {
      calendarMonth = 11;
      calendarYear--;
    }
    renderCalendar();
  });

  calendarNextBtn?.addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) {
      calendarMonth = 0;
      calendarYear++;
    }
    renderCalendar();
  });

  calendarTodayBtn?.addEventListener('click', () => {
    const today = new Date();
    calendarYear = today.getFullYear();
    calendarMonth = today.getMonth();
    const pad = (n) => String(n).padStart(2, '0');
    selectedDateString = `${calendarYear}-${pad(calendarMonth + 1)}-${pad(today.getDate())}`;
    renderCalendar();
  });

  // -------------------------------------------------------------
  // Archive (Past Events) Component
  // -------------------------------------------------------------
  const renderArchive = () => {
    if (!archiveGrid || !archiveYearsWrap) return;

    // Collect available years from past events
    const years = [...new Set(pastEvents.map((ev) => parseLocalDate(ev.date).getFullYear()))].sort((a, b) => b - a);

    if (years.length === 0) {
      archiveYearsWrap.innerHTML = '';
      archiveGrid.innerHTML = '';
      if (archiveEmpty) archiveEmpty.hidden = false;
      return;
    }

    if (archiveEmpty) archiveEmpty.hidden = true;

    // Render Year Buttons
    archiveYearsWrap.innerHTML = `
      <button type="button" class="archive-year-btn ${activeArchiveYear === 'all' ? 'is-active' : ''}" data-archive-year="all" aria-pressed="${activeArchiveYear === 'all'}">
        All Years
      </button>
      ${years
        .map(
          (yr) => `
        <button type="button" class="archive-year-btn ${String(activeArchiveYear) === String(yr) ? 'is-active' : ''}" data-archive-year="${yr}" aria-pressed="${String(activeArchiveYear) === String(yr)}">
          ${yr}
        </button>
      `
        )
        .join('')}
    `;

    archiveYearsWrap.querySelectorAll('.archive-year-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeArchiveYear = btn.dataset.archiveYear;
        renderArchive();
      });
    });

    // Filter past events
    const filteredArchive = pastEvents.filter((ev) => {
      if (activeArchiveYear === 'all') return true;
      return parseLocalDate(ev.date).getFullYear() === Number(activeArchiveYear);
    });

    archiveGrid.innerHTML = filteredArchive
      .map((ev, index) => {
        const d = parseLocalDate(ev.date);
        const dateStr = `${monthShort[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

        return `
        <article class="archive-card" data-reveal="fade-up" data-delay="${(index % 3) * 60}">
          <div class="archive-card__media">
            <img src="${escapeHtml(ev.image)}" alt="${escapeHtml(ev.imageAlt || ev.title)}" loading="lazy" />
            <span class="archive-card__badge badge--archived">${escapeHtml(ev.categoryLabel || ev.category)}</span>
          </div>
          <div class="archive-card__body">
            <div class="archive-card__date">
              <i class="fa-regular fa-calendar-check" aria-hidden="true"></i>
              <span>${dateStr}</span>
            </div>
            <h3 class="archive-card__title">${escapeHtml(ev.title)}</h3>
            <p class="archive-card__desc">${escapeHtml(ev.shortDescription || ev.description)}</p>
            <div class="archive-card__footer">
              <button type="button" class="button button--secondary" style="min-height: 38px; font-size: 0.82rem; padding: 0 16px;" data-archive-view="${escapeHtml(ev.id)}">
                View Event Recap
              </button>
            </div>
          </div>
        </article>
      `;
      })
      .join('');

    observeReveals(archiveGrid);

    archiveGrid.querySelectorAll('[data-archive-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openEventModal(btn.dataset.archiveView, btn);
      });
    });
  };

  // -------------------------------------------------------------
  // Event Gallery & Lightbox Component
  // -------------------------------------------------------------
  const renderGallery = () => {
    if (!galleryGrid) return;

    filteredGalleryItems = galleryItems.filter((item) => {
      if (activeGalleryCategory === 'all') return true;
      return item.category === activeGalleryCategory;
    });

    galleryGrid.innerHTML = filteredGalleryItems
      .map((item, index) => {
        // Create an alternating rhythm
        const isWide = index === 0 || index === 5;
        const isTall = index === 2 || index === 6;
        let classModifier = '';
        if (isWide) classModifier = 'event-gallery-item--wide';
        else if (isTall) classModifier = 'event-gallery-item--tall';

        return `
        <div class="event-gallery-item ${classModifier}" data-gallery-index="${index}" tabindex="0" role="button" aria-label="View photo: ${escapeHtml(item.title)}">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || item.title)}" loading="lazy" />
          <div class="event-gallery-item__overlay">
            <span>${escapeHtml(item.categoryLabel || item.category)}</span>
            <strong>${escapeHtml(item.title)}</strong>
          </div>
        </div>
      `;
      })
      .join('');

    galleryGrid.querySelectorAll('.event-gallery-item').forEach((item) => {
      item.addEventListener('click', () => {
        openLightbox(Number(item.dataset.galleryIndex), item);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(Number(item.dataset.galleryIndex), item);
        }
      });
    });
  };

  galleryFilters.forEach((btn) => {
    btn.addEventListener('click', () => {
      galleryFilters.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      activeGalleryCategory = btn.dataset.galleryCategory || 'all';
      renderGallery();
    });
  });

  const openLightbox = (index, triggerEl) => {
    if (!lightbox || !lightboxImage || filteredGalleryItems.length === 0) return;
    currentLightboxIndex = (index + filteredGalleryItems.length) % filteredGalleryItems.length;
    updateLightboxContent();

    lockPage(triggerEl);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    lightboxDialog?.focus();
  };

  const updateLightboxContent = () => {
    const item = filteredGalleryItems[currentLightboxIndex];
    if (!item) return;

    lightboxImage.src = item.image;
    lightboxImage.alt = item.alt || item.title;
    if (lightboxCaption) {
      lightboxCaption.textContent = item.caption || item.title;
    }
    if (lightboxCount) {
      lightboxCount.textContent = `Photo ${currentLightboxIndex + 1} of ${filteredGalleryItems.length}`;
    }
  };

  const closeLightbox = () => {
    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    unlockPage();
  };

  const moveLightbox = (direction) => {
    if (filteredGalleryItems.length === 0) return;
    currentLightboxIndex = (currentLightboxIndex + direction + filteredGalleryItems.length) % filteredGalleryItems.length;
    updateLightboxContent();
  };

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', () => moveLightbox(-1));
  lightboxNext?.addEventListener('click', () => moveLightbox(1));
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Global Keyboard Listener (Escape, Arrows, Tab Trap)
  document.addEventListener('keydown', (e) => {
    // Modal Trap & Close
    if (eventModal?.classList.contains('is-open')) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeEventModal();
        return;
      }
      trapFocus(modalDialog, e);
      return;
    }

    // Lightbox Trap & Navigation
    if (lightbox?.classList.contains('is-open')) {
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
    }
  });

  // -------------------------------------------------------------
  // FAQ Accordion
  // -------------------------------------------------------------
  faqItems.forEach((item) => {
    const btn = item.querySelector('.events-faq-question');
    const panel = item.querySelector('.events-faq-answer');
    if (!btn || !panel) return;

    btn.addEventListener('click', () => {
      const isCurrentlyOpen = item.classList.contains('is-open');

      // Close all others
      faqItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-open');
          const otherBtn = other.querySelector('.events-faq-question');
          const otherPanel = other.querySelector('.events-faq-answer');
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
        const panel = item.querySelector('.events-faq-answer');
        if (panel) panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });

  // -------------------------------------------------------------
  // SEO: Dynamic JSON-LD Structured Data for Events
  // -------------------------------------------------------------
  const injectEventSchema = (events) => {
    try {
      const validUpcoming = events.filter((e) => e.status !== 'past');
      if (validUpcoming.length === 0) return;

      const schemaData = {
        '@context': 'https://schema.org',
        '@graph': validUpcoming.map((ev) => ({
          '@type': 'Event',
          '@id': `https://horizoninternationalschool.edu/events#${ev.id}`,
          name: ev.title,
          description: ev.shortDescription || ev.description,
          startDate: `${ev.date}T${ev.startTime || '09:00'}:00`,
          endDate: `${ev.date}T${ev.endTime || '13:00'}:00`,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: 'Horizon International School',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Karachi',
              addressCountry: 'PK'
            }
          },
          image: [ev.image],
          organizer: {
            '@type': 'EducationalOrganization',
            name: 'Horizon International School',
            url: 'https://horizoninternationalschool.edu'
          }
        }))
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schemaData);
      document.head.appendChild(script);
    } catch (err) {
      console.warn('Could not inject JSON-LD schema:', err);
    }
  };

  // -------------------------------------------------------------
  // Data Fetching and Initialization
  // -------------------------------------------------------------
  const initPage = async () => {
    try {
      const response = await fetch('data/events.json');
      if (!response.ok) throw new Error('Failed to load events data');
      const data = await response.json();

      allEvents = Array.isArray(data) ? data : Array.isArray(data.events) ? data.events : [];
      galleryItems = Array.isArray(data.gallery) ? data.gallery : [];

      // Sort events
      const now = new Date();
      // Reset hours to start of day for accurate upcoming vs past comparison
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      upcomingEvents = allEvents
        .filter((ev) => {
          if (ev.status === 'past') return false;
          const evTime = parseLocalDate(ev.date).getTime();
          return evTime >= todayStart;
        })
        .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));

      pastEvents = allEvents
        .filter((ev) => {
          if (ev.status === 'past') return true;
          const evTime = parseLocalDate(ev.date).getTime();
          return evTime < todayStart;
        })
        .sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));

      // Synchronize Calendar month to the earliest upcoming event
      if (upcomingEvents.length > 0) {
        const firstDate = parseLocalDate(upcomingEvents[0].date);
        calendarYear = firstDate.getFullYear();
        calendarMonth = firstDate.getMonth();
        selectedDateString = upcomingEvents[0].date;
      }

      // Render components
      renderUpcomingEvents();
      renderCalendar();
      renderArchive();
      renderGallery();
      injectEventSchema(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      if (eventsGrid) eventsGrid.innerHTML = '';
      if (eventsStatus) eventsStatus.textContent = '';
      if (eventsError) eventsError.hidden = false;
    }
  };

  initPage();
});
