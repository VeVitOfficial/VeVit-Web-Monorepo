(function () {
  'use strict';
  document.querySelectorAll('form[data-agenda-json]').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const output = form.querySelector('output');
      const data = new FormData(form);
      const items = [];
      form.querySelectorAll('[data-order-item]').forEach(function (row) {
        const enabled = row.querySelector('input[type="checkbox"]');
        const quantity = row.querySelector('input[type="number"]');
        if (enabled && enabled.checked && quantity) {
          items.push({ order_item_id: Number(enabled.value), quantity: Number(quantity.value) });
        }
      });
      const body = {
        order: String(data.get('order') || ''),
        reason_code: String(data.get('reason_code') || ''),
        problem_description: String(data.get('problem_description') || ''),
        requested_resolution: String(data.get('requested_resolution') || ''),
        items: items
      };
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': String(data.get('csrf') || ''),
            'Idempotency-Key': crypto.randomUUID()
          },
          body: JSON.stringify(body)
        });
        const payload = await response.json();
        if (!response.ok) throw new Error('request rejected');
        const result = payload.claim || payload.return;
        output.textContent = 'Požadavek byl bezpečně uložen.';
        if (result && result.id) location.href = (payload.claim ? 'claim.php?id=' : 'return.php?id=') + encodeURIComponent(result.id);
      } catch (error) {
        output.textContent = 'Požadavek nelze odeslat. Zkontrolujte údaje a zkuste to znovu.';
      }
    });
  });
  document.querySelectorAll('form[data-agenda-upload]').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const data = new FormData(form);
      const output = form.querySelector('output');
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'X-CSRF-Token': String(data.get('csrf') || ''),
            'Idempotency-Key': crypto.randomUUID()
          },
          body: data
        });
        if (!response.ok) throw new Error('upload rejected');
        output.textContent = 'Příloha byla bezpečně nahrána.';
        form.reset();
      } catch (error) {
        output.textContent = 'Přílohu nelze nahrát.';
      }
    });
  });
  document.querySelectorAll('form[data-agenda-message]').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const data = new FormData(form);
      const output = form.querySelector('output');
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {'Content-Type':'application/json','X-CSRF-Token':String(data.get('csrf')||''),'Idempotency-Key':crypto.randomUUID()},
          body: JSON.stringify({id:String(data.get('id')||''),message:String(data.get('message')||'')})
        });
        if (!response.ok) throw new Error('message rejected');
        output.textContent = 'Zpráva byla uložena.';
        form.querySelector('textarea').value = '';
      } catch (error) {
        output.textContent = 'Zprávu nelze uložit.';
      }
    });
  });
  document.querySelectorAll('form[data-favorite-remove]').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const data = new FormData(form);
      const output = form.querySelector('output');
      try {
        const response = await fetch(form.action, {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: {'Content-Type':'application/json','X-CSRF-Token':String(data.get('csrf')||'')},
          body: JSON.stringify({product_id:Number(data.get('product_id'))})
        });
        if (!response.ok) throw new Error('favorite removal rejected');
        form.closest('article')?.remove();
      } catch (error) {
        output.textContent = 'Produkt nelze odebrat.';
      }
    });
  });
}());
