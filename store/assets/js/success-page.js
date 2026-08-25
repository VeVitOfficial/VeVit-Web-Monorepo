(function initSuccessPage() {
  'use strict';
  const page = document.getElementById('successPage');
  if (!page) return;
  document.querySelectorAll('.request-download').forEach(button => button.addEventListener('click', async () => {
    const originalNodes = Array.from(button.childNodes).map(node => node.cloneNode(true));
    button.disabled = true;
    button.textContent = 'Připravuji…';
    try {
      const response = await fetch('api/request-download.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': page.dataset.downloadCsrf || '' },
        body: JSON.stringify({ order: page.dataset.orderId || '', item_id: Number(button.dataset.itemId) }),
      });
      const data = await response.json();
      if (!response.ok || !data.download?.token) throw new Error(data.error?.message || 'Stažení není k dispozici.');
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'download.php';
      for (const [name, value] of [['token', data.download.token], ['csrf', page.dataset.downloadCsrf || '']]) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      setTimeout(() => form.remove(), 0);
      button.textContent = 'Stahování zahájeno';
    } catch (error) {
      window.showToast?.(error.message || 'Chyba při komunikaci. Zkuste to znovu.', 'error');
      button.disabled = false;
      button.replaceChildren(...originalNodes);
    }
  }));
}());
