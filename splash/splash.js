(function () {
  const POLL_INTERVAL = 200;
  const TIMEOUT_MS = 30000;
  const FADE_OUT_MS = 500;
  const PROGRESS_PATH = '/tmp/42-session-splash';

  const stepsEl = document.getElementById('splash-steps');
  const usernameEl = document.getElementById('splash-username');
  const avatarEl = document.getElementById('splash-avatar');

  const params = new URLSearchParams(window.location.search);
  const username = params.get('user') || '';
  usernameEl.textContent = username || 'loading...';

  if (username) {
    avatarEl.src = '/tmp/codam-web-greeter-user-avatar';
    avatarEl.addEventListener('error', function () {
      avatarEl.style.display = 'none';
    });
  } else {
    avatarEl.style.display = 'none';
  }

  let lastLength = 0;
  let done = false;

  function addStep(status, message) {
    const el = document.createElement('div');
    el.className = 'splash-step';
    if (status === 'done') {
      el.classList.add('done');
      el.textContent = '\u2713 ' + message;
    } else if (status === 'error') {
      el.classList.add('error');
      el.textContent = '\u2717 ' + message;
    } else {
      el.textContent = '> ' + message;
    }
    stepsEl.appendChild(el);
  }

  function closeSplash() {
    if (done) return;
    done = true;
    document.body.classList.add('fade-out');
    setTimeout(function () {
      window.close();
    }, FADE_OUT_MS);
  }

  function poll() {
    if (done) return;
    fetch(PROGRESS_PATH + '?t=' + Date.now())
      .then(function (r) { return r.text(); })
      .then(function (text) {
        var lines = text.split('\n').filter(function (l) { return l.trim(); });
        for (var i = lastLength; i < lines.length; i++) {
          var colonIdx = lines[i].indexOf(':');
          if (colonIdx === -1) continue;
          var status = lines[i].substring(0, colonIdx).trim();
          var message = lines[i].substring(colonIdx + 1).trim();
          addStep(status, message);
          if (status === 'done') {
            setTimeout(closeSplash, 300);
            return;
          }
        }
        lastLength = lines.length;
      })
      .catch(function () {});
  }

  var pollTimer = setInterval(poll, POLL_INTERVAL);
  poll();

  setTimeout(function () {
    clearInterval(pollTimer);
    closeSplash();
  }, TIMEOUT_MS);
})();