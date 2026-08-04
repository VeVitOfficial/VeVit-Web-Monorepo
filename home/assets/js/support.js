(() => {
  'use strict';

  const normalizeSearch = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('cs-CZ')
    .trim();

  const initCurrentYear = () => {
    const year = document.querySelector('[data-current-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  };

  const initFaq = () => {
    const search = document.getElementById('support-search');
    const items = Array.from(document.querySelectorAll('[data-faq-item]'));
    const categoryButtons = Array.from(document.querySelectorAll('[data-support-category]'));
    const noResults = document.getElementById('support-no-results');
    const resultCount = document.querySelector('[data-support-result-count]');
    if (!search || !items.length || !noResults || !resultCount) return;

    let activeCategory = 'all';

    const closeItem = (item) => {
      const question = item.querySelector('[data-faq-question]');
      const answer = question ? document.getElementById(question.getAttribute('aria-controls')) : null;
      if (!question || !answer) return;
      question.setAttribute('aria-expanded', 'false');
      answer.hidden = true;
    };

    items.forEach((item) => {
      closeItem(item);
      const question = item.querySelector('[data-faq-question]');
      if (!question) return;
      question.addEventListener('click', () => {
        const answer = document.getElementById(question.getAttribute('aria-controls'));
        if (!answer) return;
        const willOpen = question.getAttribute('aria-expanded') !== 'true';
        question.setAttribute('aria-expanded', String(willOpen));
        answer.hidden = !willOpen;
      });
    });

    const filterFaq = () => {
      const query = normalizeSearch(search.value);
      let visible = 0;

      items.forEach((item) => {
        const categoryMatch = activeCategory === 'all' || item.dataset.category === activeCategory;
        const textMatch = normalizeSearch(item.textContent).includes(query);
        item.hidden = !(categoryMatch && textMatch);
        if (!item.hidden) visible += 1;
      });

      noResults.hidden = visible !== 0;
      resultCount.textContent = visible === 1
        ? '1 nalezená odpověď'
        : `${visible} nalezených odpovědí`;
    };

    categoryButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activeCategory = button.dataset.supportCategory || 'all';
        categoryButtons.forEach((candidate) => {
          candidate.setAttribute('aria-pressed', String(candidate === button));
        });
        filterFaq();
      });
    });

    search.addEventListener('input', filterFaq);
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        search.focus();
      }
    });
    filterFaq();
  };

  const initSupportForm = () => {
    const form = document.getElementById('support-form');
    const status = document.getElementById('support-status');
    if (!form || !status) return;

    const showStatus = (message, ok) => {
      status.hidden = false;
      status.textContent = message;
      status.classList.toggle('is-success', ok);
      status.classList.toggle('is-error', !ok);
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      const originalLabel = submitButton ? submitButton.textContent : '';
      const payload = {};
      new FormData(form).forEach((value, key) => { payload[key] = value; });
      payload._subject = `VeVit podpora: ${payload.application} / ${payload.request_type}`;
      payload._template = 'table';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Odesílám...';
      }
      status.hidden = true;

      try {
        const response = await fetch('https://formsubmit.co/ajax/info@vevit.cz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok && String(data.success) !== 'true') throw new Error('Request failed');
        showStatus('Zpráva byla odeslána. Děkujeme.', true);
        form.reset();
      } catch {
        showStatus('Zprávu se nepodařilo odeslat. Napište na info@vevit.cz.', false);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalLabel;
        }
      }
    });
  };

  const initContactEmail = () => {
    const links = document.querySelectorAll('[data-contact-email]');
    if (!links.length || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const status = document.querySelector('[data-email-copy-status]');
    links.forEach((link) => {
      link.addEventListener('click', async (event) => {
        event.preventDefault();
        const email = link.href.replace(/^mailto:/i, '').split('?')[0];
        try {
          await navigator.clipboard.writeText(email);
          if (status) {
            status.hidden = false;
            status.textContent = `E-mail ${email} byl zkopírován.`;
            status.classList.add('is-success');
            status.classList.remove('is-error');
          }
        } catch {
          if (status) {
            status.hidden = false;
            status.textContent = `E-mail se nepodařilo zkopírovat. Adresa je ${email}.`;
            status.classList.add('is-error');
            status.classList.remove('is-success');
          }
        }
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initCurrentYear();
    initFaq();
    initSupportForm();
    initContactEmail();
  });
})();
