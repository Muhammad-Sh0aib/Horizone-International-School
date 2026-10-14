/**
 * Horizon International School - Contact Page JavaScript
 * Handles real-time form validation, character counter, static submission dispatch modal,
 * email client mailto generation, clipboard copy, and accessible FAQ accordion.
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------
  // DOM Elements
  // -------------------------------------------------------------
  const form = document.getElementById('contact-form');
  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const phoneInput = document.getElementById('contact-phone');
  const roleSelect = document.getElementById('contact-role');
  const subjectSelect = document.getElementById('contact-subject');
  const messageInput = document.getElementById('contact-message');
  const privacyCheck = document.getElementById('contact-privacy');
  const charCounter = document.getElementById('char-count');
  const submitBtn = document.getElementById('contact-submit-btn');

  // Modal Elements
  const modal = document.getElementById('contact-modal');
  const modalDialog = modal?.querySelector('[role="dialog"]');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalPreview = document.getElementById('modal-preview');
  const modalMailtoBtn = document.getElementById('modal-mailto-btn');
  const modalCopyBtn = document.getElementById('modal-copy-btn');
  const modalDoneBtn = document.getElementById('modal-done-btn');

  // FAQ Elements
  const faqItems = [...document.querySelectorAll('.contact-faq-item')];

  // Background Containers for inert locking
  const mainContent = document.querySelector('main');
  const siteHeader = document.querySelector('.site-header');
  const siteFooter = document.querySelector('.site-footer');
  const backToTop = document.querySelector('.back-to-top');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let lastFocusedElement = null;

  // -------------------------------------------------------------
  // Message Character Counter
  // -------------------------------------------------------------
  if (messageInput && charCounter) {
    const updateCharCount = () => {
      const len = messageInput.value.length;
      charCounter.textContent = String(len);

      charCounter.classList.toggle('is-warning', len > 800 && len <= 950);
      charCounter.classList.toggle('is-max', len > 950);
    };

    messageInput.addEventListener('input', updateCharCount);
    updateCharCount();
  }

  // -------------------------------------------------------------
  // Validation Helpers
  // -------------------------------------------------------------
  const setError = (inputEl, errorId, message) => {
    const errorEl = document.getElementById(errorId);
    inputEl.classList.add('has-error');
    inputEl.setAttribute('aria-invalid', 'true');
    if (errorEl) {
      errorEl.textContent = message;
    }
  };

  const clearError = (inputEl, errorId) => {
    const errorEl = document.getElementById(errorId);
    inputEl.classList.remove('has-error');
    inputEl.removeAttribute('aria-invalid');
    if (errorEl) {
      errorEl.textContent = '';
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return true; // Optional field
    return /^[\d\s+()\-]{7,20}$/.test(phone.trim());
  };

  // Real-time error clearing on input
  nameInput?.addEventListener('input', () => {
    if (nameInput.value.trim().length >= 2) clearError(nameInput, 'name-error');
  });

  emailInput?.addEventListener('input', () => {
    if (validateEmail(emailInput.value)) clearError(emailInput, 'email-error');
  });

  phoneInput?.addEventListener('input', () => {
    if (validatePhone(phoneInput.value)) clearError(phoneInput, 'phone-error');
  });

  subjectSelect?.addEventListener('change', () => {
    if (subjectSelect.value) clearError(subjectSelect, 'subject-error');
  });

  messageInput?.addEventListener('input', () => {
    if (messageInput.value.trim().length >= 20) clearError(messageInput, 'message-error');
  });

  privacyCheck?.addEventListener('change', () => {
    if (privacyCheck.checked) clearError(privacyCheck, 'privacy-error');
  });

  // -------------------------------------------------------------
  // Modal Accessibility (Scroll Lock, Focus Trap, Escape)
  // -------------------------------------------------------------
  const setBackgroundInert = (isInert) => {
    [mainContent, siteHeader, siteFooter, backToTop].filter(Boolean).forEach((el) => {
      el.inert = isInert;
    });
  };

  const openModal = (triggerEl) => {
    if (!modal) return;
    lastFocusedElement = triggerEl || document.activeElement;
    document.body.style.overflow = 'hidden';
    setBackgroundInert(true);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modalDialog?.focus();
  };

  const closeModal = () => {
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');

    document.body.style.overflow = '';
    setBackgroundInert(false);

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      setTimeout(() => lastFocusedElement.focus(), prefersReducedMotion.matches ? 0 : 200);
    }
  };

  modalCloseBtn?.addEventListener('click', closeModal);
  modalDoneBtn?.addEventListener('click', () => {
    closeModal();
    form?.reset();
    if (charCounter) charCounter.textContent = '0';
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('contact-modal__backdrop')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!modal?.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }

    // Trap focus inside modal
    if (e.key === 'Tab') {
      const focusableEls = [
        ...modalDialog.querySelectorAll('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])')
      ].filter((el) => !el.hidden && el.offsetParent !== null);

      if (focusableEls.length === 0) {
        e.preventDefault();
        return;
      }

      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  });

  // -------------------------------------------------------------
  // Form Submission Handler
  // -------------------------------------------------------------
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    let firstInvalid = null;

    // Validate Name
    const nameVal = nameInput.value.trim();
    if (nameVal.length < 2) {
      setError(nameInput, 'name-error', 'Please enter your full name (at least 2 characters).');
      isValid = false;
      if (!firstInvalid) firstInvalid = nameInput;
    } else {
      clearError(nameInput, 'name-error');
    }

    // Validate Email
    const emailVal = emailInput.value.trim();
    if (!validateEmail(emailVal)) {
      setError(emailInput, 'email-error', 'Please enter a valid email address.');
      isValid = false;
      if (!firstInvalid) firstInvalid = emailInput;
    } else {
      clearError(emailInput, 'email-error');
    }

    // Validate Phone (optional)
    const phoneVal = phoneInput.value.trim();
    if (!validatePhone(phoneVal)) {
      setError(phoneInput, 'phone-error', 'Please enter a valid phone number or leave this field empty.');
      isValid = false;
      if (!firstInvalid) firstInvalid = phoneInput;
    } else {
      clearError(phoneInput, 'phone-error');
    }

    // Validate Subject
    const subjectVal = subjectSelect.value;
    if (!subjectVal) {
      setError(subjectSelect, 'subject-error', 'Please select an inquiry subject.');
      isValid = false;
      if (!firstInvalid) firstInvalid = subjectSelect;
    } else {
      clearError(subjectSelect, 'subject-error');
    }

    // Validate Message
    const messageVal = messageInput.value.trim();
    if (messageVal.length < 20) {
      setError(messageInput, 'message-error', 'Please provide at least 20 characters describing your inquiry.');
      isValid = false;
      if (!firstInvalid) firstInvalid = messageInput;
    } else if (messageVal.length > 1000) {
      setError(messageInput, 'message-error', 'Message exceeds the 1,000 character limit.');
      isValid = false;
      if (!firstInvalid) firstInvalid = messageInput;
    } else {
      clearError(messageInput, 'message-error');
    }

    // Validate Privacy
    if (!privacyCheck.checked) {
      setError(privacyCheck, 'privacy-error', 'Please acknowledge communication handling to proceed.');
      isValid = false;
      if (!firstInvalid) firstInvalid = privacyCheck;
    } else {
      clearError(privacyCheck, 'privacy-error');
    }

    if (!isValid) {
      firstInvalid?.focus();
      return;
    }

    // Valid: Show submission loading state
    submitBtn.classList.add('is-loading');
    submitBtn.setAttribute('disabled', 'true');
    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span class="button-spinner" aria-hidden="true"></span> Preparing Inquiry...`;

    setTimeout(() => {
      submitBtn.classList.remove('is-loading');
      submitBtn.removeAttribute('disabled');
      submitBtn.innerHTML = originalBtnHtml;

      const roleVal = roleSelect.value || 'Parent / Visitor';

      // Format Text for Dispatch
      const formattedSummary = `Subject: ${subjectVal}
From: ${nameVal} (${roleVal})
Email: ${emailVal}
Phone: ${phoneVal || 'Not provided'}

Message:
${messageVal}`;

      // Populate preview box
      if (modalPreview) {
        modalPreview.textContent = formattedSummary;
      }

      // Configure mailto link
      const emailRecipient = 'admissions@horizoninternationalschool.edu';
      const emailSubject = encodeURIComponent(`[Horizon Inquiry] ${subjectVal} - ${nameVal}`);
      const emailBody = encodeURIComponent(formattedSummary);
      const mailtoUrl = `mailto:${emailRecipient}?subject=${emailSubject}&body=${emailBody}`;

      if (modalMailtoBtn) {
        modalMailtoBtn.setAttribute('href', mailtoUrl);
      }

      // Configure copy button
      if (modalCopyBtn) {
        modalCopyBtn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(formattedSummary);
            const origText = modalCopyBtn.innerHTML;
            modalCopyBtn.innerHTML = `<i class="fa-solid fa-check" aria-hidden="true"></i> Copied to Clipboard!`;
            setTimeout(() => {
              modalCopyBtn.innerHTML = origText;
            }, 2500);
          } catch (err) {
            console.warn('Clipboard write failed:', err);
          }
        };
      }

      openModal(submitBtn);
    }, 600);
  });

  // -------------------------------------------------------------
  // Quick Action Buttons (e.g. Schedule Visit, Pre-fill Subject)
  // -------------------------------------------------------------
  document.querySelectorAll('[data-set-subject]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetSubject = btn.dataset.setSubject;
      if (subjectSelect) {
        subjectSelect.value = targetSubject;
        clearError(subjectSelect, 'subject-error');
      }

      const formSection = document.getElementById('contact-form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          nameInput?.focus();
        }, 500);
      }
    });
  });

  // -------------------------------------------------------------
  // FAQ Accordion
  // -------------------------------------------------------------
  faqItems.forEach((item) => {
    const btn = item.querySelector('.contact-faq-question');
    const panel = item.querySelector('.contact-faq-answer');
    if (!btn || !panel) return;

    btn.addEventListener('click', () => {
      const isCurrentlyOpen = item.classList.contains('is-open');

      // Close all others
      faqItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-open');
          const otherBtn = other.querySelector('.contact-faq-question');
          const otherPanel = other.querySelector('.contact-faq-answer');
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
        const panel = item.querySelector('.contact-faq-answer');
        if (panel) panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });
});
