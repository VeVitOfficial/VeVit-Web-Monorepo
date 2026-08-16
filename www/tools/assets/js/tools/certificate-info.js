// SSL certifikát info — volá serverový endpoint api/ssl-check.php.
(function () {
  'use strict';
  var domain = ToolUI.el('ci-domain'), run = ToolUI.el('ci-run'), err = ToolUI.el('ci-error');
  var prog = ToolUI.el('ci-prog'), progLabel = ToolUI.el('ci-prog-label');
  var result = ToolUI.el('ci-result');

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function set(id, v) { var el = ToolUI.el(id); el.textContent = v == null ? '—' : String(v); }

  run.addEventListener('click', function () {
    if (run.disabled) return;
    clearErr();
    var d = domain.value.trim();
    if (!d) return fail('Zadejte doménu.');
    result.classList.add('hidden');
    run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 30, 'Připojuji se k ' + d + ':443…');
    fetch('/tools/api/ssl-check.php?domain=' + encodeURIComponent(d), { headers: { 'Accept': 'application/json' } })
      .then(function (r) {
        return r.json().then(function (body) { return { ok: r.ok, status: r.status, body: body }; });
      }).then(function (res) {
        prog.classList.add('hidden'); progLabel.classList.add('hidden');
        if (!res.ok) return fail(res.body && res.body.message ? res.body.message : 'Kontrolu se nepodařilo dokončit.');
        var b = res.body;
        ToolUI.setProgress(prog, 100, 'Hotovo');
        var st = ToolUI.el('ci-status');
        st.className = 'certificate-status certificate-status-' + b.status;
        if (b.status === 'expires_soon') st.textContent = '⚠ Certifikát je ověřený, ale platnost brzy vyprší';
        else st.textContent = '✓ Certifikát je ověřený důvěryhodným řetězcem';
        set('ci-issuer', (b.issuer.O && b.issuer.O !== '—' ? b.issuer.O : b.issuer.CN) + (b.issuer.CN && b.issuer.O && b.issuer.CN !== b.issuer.O ? ' (' + b.issuer.CN + ')' : ''));
        set('ci-subject', (b.subject.O && b.subject.O !== '—' ? b.subject.O + ' — ' : '') + b.subject.CN);
        set('ci-from', b.validFrom); set('ci-to', b.validTo);
        set('ci-days', b.daysLeft == null ? '—' : (b.daysLeft + ' dní'));
        set('ci-serial', b.serialNumber);
        set('ci-sig', b.signatureType);
        set('ci-san', (b.san && b.san.length) ? b.san.join(', ') : '—');
        result.classList.remove('hidden');
        if (window.toast) toast.success('Certifikát načten');
      }).catch(function (e) {
        prog.classList.add('hidden'); progLabel.classList.add('hidden');
        fail('Síťová chyba při kontrole certifikátu. Zkuste to prosím znovu.');
      }).finally(function () { run.disabled = false; });
  });
  domain.addEventListener('keydown', function (e) { if (e.key === 'Enter') run.click(); });
})();
