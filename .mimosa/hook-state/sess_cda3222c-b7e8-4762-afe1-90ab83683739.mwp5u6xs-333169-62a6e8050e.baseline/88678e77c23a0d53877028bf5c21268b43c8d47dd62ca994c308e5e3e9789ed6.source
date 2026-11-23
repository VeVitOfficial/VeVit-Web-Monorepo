(function initAdminAgenda() {
  'use strict';
  const csrf = document.body.dataset.adminCsrf || '';
  async function send(form, body) {
    const output = form.querySelector('output');
    try {
      const response = await fetch(form.dataset.endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf, 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify(body),
      });
      output.textContent = response.ok ? 'Změna byla uložena.' : 'Změnu nelze provést.';
      if (response.ok) setTimeout(() => location.reload(), 500);
    } catch {
      output.textContent = 'Služba není dostupná.';
    }
  }
  document.querySelectorAll('.admin-delivery-create').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const items = [];
    form.querySelectorAll('[data-delivery-item]').forEach(input => {
      const quantity = Number(input.value);
      if (Number.isInteger(quantity) && quantity > 0) items.push({ order_item_id: Number(input.dataset.deliveryItem), quantity });
    });
    send(form, { order_id: Number(data.get('order_id')), data: { carrier_code: String(data.get('carrier_code') || ''), tracking_number: String(data.get('tracking_number') || ''), tracking_url: String(data.get('tracking_url') || ''), items } });
  }));
  document.querySelectorAll('.admin-agenda-form').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const detail = {};
    for (const key of ['public_message', 'internal_note', 'carrier_code', 'tracking_number', 'tracking_url', 'shipped_at', 'estimated_delivery_at', 'delivered_at', 'received_at', 'inspected_at', 'completed_at', 'decision', 'resolution_outcome']) {
      if (data.has(key) && data.get(key) !== '') detail[key] = key.endsWith('_at') ? new Date(data.get(key)).toISOString() : data.get(key);
    }
    const target = String(data.get('target_status'));
    const itemValues = {};
    form.querySelectorAll('[data-item-quantity]').forEach(input => {
      const quantity = Number(input.value);
      if (Number.isInteger(quantity) && quantity >= 0) itemValues[input.dataset.itemQuantity] = quantity;
    });
    if (form.dataset.entity === 'claim' && target === 'resolved') {
      detail.approved_items = {};
      for (const [id, quantity] of Object.entries(itemValues)) if (quantity > 0) detail.approved_items[id] = quantity;
    }
    if (form.dataset.entity === 'return' && (target === 'received' || target === 'inspected')) detail[`${target}_items`] = itemValues;
    send(form, { id: data.get('id'), expected_version: Number(data.get('expected_version')), target_status: target, data: detail });
  }));
}());
