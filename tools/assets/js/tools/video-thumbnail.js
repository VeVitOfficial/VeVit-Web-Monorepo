// Náhled videa — <video> + canvas (bez ffmpeg), čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('vt-drop'), list = ToolUI.el('vt-list'), work = ToolUI.el('vt-work');
  var video = ToolUI.el('vt-video'), cv = ToolUI.el('vt-canvas'), ctx = cv.getContext('2d');
  var time = ToolUI.el('vt-time'), format = ToolUI.el('vt-format'), dl = ToolUI.el('vt-dl'), err = ToolUI.el('vt-error');
  var file = null, url = null;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function capture() {
    if (!video.videoWidth) return;
    cv.width = video.videoWidth; cv.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    dl.disabled = false;
  }

  ToolUI.dropzone(drop, {
    accept: ['video/mp4', 'video/webm', 'video/ogg', 'video/*'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > 200 * 1024 * 1024) return fail('Video je příliš velké (max 200 MB).');
      if (!/video\//.test(f.type) && !/\.(mp4|webm|ogg|mov|mkv)$/i.test(f.name)) return fail('Vyberte video soubor.');
      file = f;
      ToolUI.renderFileList(list, [{ name: f.name, size: f.size }], function () { reset(); });
      list.classList.remove('hidden');
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(f);
      video.src = url;
      video.hidden = false;
      video.onloadedmetadata = function () {
        var t = parseFloat(time.value) || 0;
        if (t >= video.duration) t = Math.min(video.duration / 2, 1);
        try { video.currentTime = t; } catch (e) {}
      };
      video.onseeked = capture;
      video.onerror = function () { fail('Video se nepodařilo načíst (nepodporovaný kodek?).'); };
      work.classList.remove('hidden');
    },
    onError: fail
  });

  time.addEventListener('change', function () {
    var t = parseFloat(time.value) || 0;
    if (video.duration && t >= video.duration) t = video.duration - 0.1;
    try { video.currentTime = Math.max(0, t); } catch (e) {}
  });

  function reset() {
    file = null; list.classList.add('hidden'); work.classList.add('hidden'); dl.disabled = true;
    if (url) { URL.revokeObjectURL(url); url = null; }
  }

  dl.addEventListener('click', function () {
    cv.toBlob(function (b) { var ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[format.value]; ToolUI.download(b, 'nahled-videa.' + ext); }, format.value, 0.92);
  });
})();