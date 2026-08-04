'use strict';

document.getElementById('form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  const response = await fetch('/account/api/onboarding.php', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: document.getElementById('name').value,
      nickname: document.getElementById('nickname').value,
    }),
  });
  if (response.ok) {
    location.replace('/account');
    return;
  }
  const data = await response.json().catch(() => ({}));
  document.getElementById('error').textContent = data.error || 'Profil se nepodařilo uložit.';
  button.disabled = false;
});
