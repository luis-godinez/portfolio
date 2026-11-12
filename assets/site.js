// Luis Godinez · portfolio scripts: journey placement, chapter bar, side panels, illustrations.
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (document.documentElement.classList.contains('embed') && window.parent !== window) {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !document.querySelector('dialog.lightbox[open]')) window.parent.postMessage({ type: 'portfolio-close' }, '*');
    });
  }

  // Theme: the head script sets it before paint. The menu offers System (follow the device's light or dark setting,
  // including when it changes) or a fixed Light, Dark or X-ray; a fixed choice is remembered.
  var root = document.documentElement, pick = document.querySelector('.theme-pick');
  var tpSystem = window.matchMedia('(prefers-color-scheme: dark)');
  var tpName = { system: 'System', light: 'Light', dark: 'Dark', xray: 'X-ray' };
  var tpUrlTheme = /[?&]theme=/.test(location.search);
  var tpStored = function () { try { var t = localStorage.getItem('theme'); return /^(light|dark|xray)$/.test(t) ? t : null; } catch (e) { return null; } };
  var tpChoice = function () { return tpUrlTheme ? root.dataset.theme : (tpStored() || 'system'); };
  var tpApply = function () { var t = tpStored(); if (!tpUrlTheme) root.dataset.theme = t || (tpSystem.matches ? 'dark' : 'light'); tpShow(); };
  var tpShow = function () {
    if (!pick) return;
    var c = tpChoice();
    pick.querySelector('.tp-cur').textContent = tpName[c];
    pick.querySelector('.tp-btn').setAttribute('aria-label', 'Theme: ' + tpName[c]);
    tpOpts.forEach(function (o) { o.setAttribute('aria-selected', String(o.dataset.v === c)); });
  };
  if (pick) {
    var tpBtn = pick.querySelector('.tp-btn'), tpList = pick.querySelector('.tp-list');
    var tpOpts = Array.prototype.slice.call(tpList.querySelectorAll('[role="option"]')), tpAt = 0;
    var tpMark = function (k) { tpAt = (k + tpOpts.length) % tpOpts.length; tpOpts.forEach(function (o, n) { o.classList.toggle('active', n === tpAt); }); };
    var tpOpen = function () { tpList.hidden = false; tpBtn.setAttribute('aria-expanded', 'true'); tpMark(Math.max(0, tpOpts.findIndex(function (o) { return o.dataset.v === tpChoice(); }))); tpList.focus(); };
    var tpClose = function (refocus) { tpList.hidden = true; tpBtn.setAttribute('aria-expanded', 'false'); if (refocus) tpBtn.focus(); };
    var tpPickIt = function (v) {
      tpUrlTheme = false;
      try { if (v === 'system') localStorage.removeItem('theme'); else localStorage.setItem('theme', v); } catch (e) {}
      tpApply(); tpClose(true);
    };
    tpBtn.addEventListener('click', function () { if (tpList.hidden) tpOpen(); else tpClose(true); });
    tpBtn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); tpOpen(); } });
    tpOpts.forEach(function (o, n) { o.addEventListener('click', function () { tpPickIt(o.dataset.v); }); o.addEventListener('mousemove', function () { tpMark(n); }); });
    tpList.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); tpMark(tpAt + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); tpMark(tpAt - 1); }
      else if (e.key === 'Home') { e.preventDefault(); tpMark(0); }
      else if (e.key === 'End') { e.preventDefault(); tpMark(tpOpts.length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tpPickIt(tpOpts[tpAt].dataset.v); }
      else if (e.key === 'Escape' || e.key === 'Tab') { tpClose(e.key === 'Escape'); }
    });
    document.addEventListener('click', function (e) { if (!tpList.hidden && !pick.contains(e.target)) tpClose(false); });
    tpShow();
  }
  if (tpSystem.addEventListener) tpSystem.addEventListener('change', function () { if (!tpStored() && !tpUrlTheme) tpApply(); });

  // Journey: place each station exactly on the drawn path.
  var journey = document.querySelector('.journey');
  if (journey) {
    var main = journey.querySelector('.path'), ahead = journey.querySelector('.ahead');
    var vb = journey.querySelector('svg').viewBox.baseVal;
    var onPath = function (p, x) {
      var lo = 0, hi = p.getTotalLength(), pt = p.getPointAtLength(0);
      for (var k = 0; k < 30; k++) {
        var mid = (lo + hi) / 2; pt = p.getPointAtLength(mid);
        if (pt.x < x) lo = mid; else hi = mid;
      }
      return pt;
    };
    journey.querySelectorAll('.stn').forEach(function (s) {
      var x = parseFloat(s.dataset.x);
      var pt = onPath(x > main.getPointAtLength(main.getTotalLength()).x ? ahead : main, x);
      s.style.left = (pt.x / vb.width * 100) + '%';
      s.style.top = (pt.y / vb.height * 100) + '%';
    });
  }

  // Company bar: shown only while a company section is in view, with that section marked.
  var bar = document.querySelector('.chapters-bar');
  if (bar && journey) {
    var links = {}, cur = bar.querySelector('.cur');
    bar.querySelectorAll('a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    // Mark the section that sits at the middle of the screen, and nothing when none does (the case studies
    // above the sections, for one), so a section never stays marked after you scroll away from it.
    var sections = Array.prototype.slice.call(document.querySelectorAll('.chapter')), ticking = false;
    var mark = function () {
      ticking = false;
      var mid = window.innerHeight * 0.45, here = null;
      sections.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) here = s.id; });
      Object.keys(links).forEach(function (k) { links[k].classList.toggle('here', k === here); });
      if (cur) cur.textContent = here && links[here] ? links[here].title : '';
      bar.classList.toggle('show', !!here);
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(mark); } }, { passive: true });
    window.addEventListener('resize', mark);
    mark();
  }

  // Landing cue: a link to a section makes the whole section glow, every time, even on a repeat click.
  document.querySelectorAll('.journey a[href^="#"], .chapters-bar a[href^="#"], header.nav nav a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (!el || !(el.classList.contains('chapter') || el.classList.contains('lands'))) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      el.classList.remove('landed'); void el.offsetWidth; el.classList.add('landed');
      el.addEventListener('animationend', function () { el.classList.remove('landed'); }, { once: true });
      setTimeout(function () { el.classList.remove('landed'); }, reduced ? 2000 : 3400);
    });
  });

  // Case-study images open large: click an image or video, then click anywhere or press Escape to close.
  if (document.body.classList.contains('page')) {
    var box = document.createElement('dialog');
    box.className = 'lightbox'; box.setAttribute('aria-label', 'Enlarged image');
    box.innerHTML = '<button class="close" type="button">Close · Esc</button><div class="media"></div><p class="cap mono"></p>';
    document.body.appendChild(box);
    var media = box.querySelector('.media'), cap = box.querySelector('.cap'), opener = null;
    var embedded = document.documentElement.classList.contains('embed') && window.parent !== window;
    var tell = function (open) { if (embedded) window.parent.postMessage({ type: 'portfolio-lightbox', open: open }, '*'); };
    var shut = function () { if (!box.open) return; box.close(); media.innerHTML = ''; tell(false); if (opener) opener.focus(); };
    // Inside the project overlay, the overlay's one close button closes this first.
    window.addEventListener('message', function (e) { if (e.source === window.parent && e.data && e.data.type === 'portfolio-close-lightbox') shut(); });
    document.querySelectorAll('.step .vis img, .step .vis video, .page-hero img').forEach(function (el) {
      el.classList.add('zoomable'); el.tabIndex = 0;
      var go = function () {
        opener = el; media.innerHTML = '';
        var big = el.tagName === 'VIDEO' ? document.createElement('video') : document.createElement('img');
        big.src = el.currentSrc || el.src;
        if (el.tagName === 'VIDEO') { big.muted = true; big.loop = true; big.playsInline = true; if (!reduced) big.autoplay = true; }
        else big.alt = el.alt;
        media.appendChild(big);
        var fc = el.closest('figure') && el.closest('figure').querySelector('figcaption');
        cap.textContent = fc ? fc.textContent : '';
        box.showModal(); tell(true);
      };
      el.addEventListener('click', go);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    box.addEventListener('click', shut);
    box.addEventListener('cancel', function (e) { e.preventDefault(); shut(); });
  }

  // Project overlay: every card opens the same way. Small projects come from a <template>; case studies
  // load their page in a frame. The address becomes #/<name>, so back closes it and a link opens straight to it.
  var panel = document.querySelector('dialog.panel');
  if (panel) {
    var inner = panel.querySelector('.inner'), label = panel.querySelector('.bar .mono'), lastTrigger = null;
    var lastPointer = false;   // whether the latest input was a mouse or touch rather than a key
    document.addEventListener('pointerdown', function () { lastPointer = true; }, true);
    document.addEventListener('keydown', function (e) { lastPointer = false; var q = document.querySelector('[data-quiet-focus]'); if (q && e.key === 'Tab') q.removeAttribute('data-quiet-focus'); }, true);
    var CASES = ['platform', 'feedback', 'luna', 'loon'];
    var ignorePop = false, savedY = 0, imageOpen = false;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    var restore = function () {
      var html = document.documentElement, prev = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto'; window.scrollTo(0, savedY); html.style.scrollBehavior = prev;
    };
    var hide = function () {
      if (!panel.open) return;
      panel.classList.remove('in');
      // Drop a case study's frame at once, so its own history can't absorb the step back.
      if (panel.classList.contains('case')) inner.innerHTML = '';
      imageOpen = false;
      var done = function () {
        panel.close(); inner.innerHTML = ''; document.body.classList.remove('locked');
        restore();
        if (turns) turns.scope(null);   // the page's turns resume
        // Focus goes back to the card that opened the panel, so Tab carries on from there. After a mouse or touch close
        // it stays unmarked; the ring is for keyboard users, who need to see where they landed.
        if (lastTrigger) {
          if (lastPointer) { lastTrigger.setAttribute('data-quiet-focus', ''); lastTrigger.addEventListener('blur', function q() { this.removeAttribute('data-quiet-focus'); this.removeEventListener('blur', q); }); }
          lastTrigger.focus({ preventScroll: true });
        }
      };
      if (reduced) done(); else setTimeout(done, 300);
    };
    var show = function (name) {
      inner.innerHTML = '';
      var tpl = document.getElementById('panel-' + name);
      if (tpl) {
        panel.classList.remove('case'); label.textContent = 'Project';
        inner.appendChild(tpl.content.cloneNode(true));
        panel.setAttribute('aria-labelledby', 'p-' + name); panel.removeAttribute('aria-label');
      } else if (CASES.indexOf(name) > -1) {
        panel.classList.add('case'); label.textContent = 'Case study';
        var fr = document.createElement('iframe');
        fr.src = name + '.html?embed&theme=' + (document.documentElement.dataset.theme || 'light'); fr.title = 'Case study';
        inner.appendChild(fr);
        panel.removeAttribute('aria-labelledby'); panel.setAttribute('aria-label', 'Case study');
      } else return false;
      if (!panel.open) { savedY = window.scrollY; document.body.classList.add('locked'); panel.showModal(); }
      panel.scrollTop = 0;
      requestAnimationFrame(function () { if (panel.open) panel.classList.add('in'); });
      if (turns) turns.scope(panel);   // the page's turns pause; the panel's drawings play once, alone
      ownClocks(panel); startIllustrations(panel); watchDrawings(panel); holdStill(panel);   // a panel's own drawings restart and hold too
      return true;
    };
    var open = function (name, trigger) {
      lastTrigger = trigger || null;
      if (show(name)) history.pushState({ panel: name }, '', '#/' + name);
    };
    var close = function () {
      // One layer at a time: an enlarged image inside a case study closes before the case study does.
      var fr0 = inner.querySelector('iframe');
      if (imageOpen && fr0) { fr0.contentWindow.postMessage({ type: 'portfolio-close-lightbox' }, '*'); return; }
      var pushed = history.state && history.state.panel;
      hide();
      if (pushed) { ignorePop = true; history.back(); }
    };
    // Escape pressed inside a case study's frame arrives as a message.
    window.addEventListener('message', function (e) {
      var fr = inner.querySelector('iframe');
      if (!fr || e.source !== fr.contentWindow || !e.data) return;
      if (e.data.type === 'portfolio-lightbox') imageOpen = !!e.data.open;
      if (e.data.type === 'portfolio-close') close();
    });
    document.querySelectorAll('[data-panel]').forEach(function (t) {
      t.addEventListener('click', function () { open(t.dataset.panel, t); });
    });
    // Case-study cards stay real links (new tab, copy link), but a plain click opens the overlay.
    document.querySelectorAll('a.card[href$=".html"], a.fcard[href$=".html"]').forEach(function (a) {
      var name = a.getAttribute('href').replace('.html', '');
      if (CASES.indexOf(name) < 0) return;
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault(); open(name, a);
      });
    });
    window.addEventListener('popstate', function (e) {
      if (ignorePop) { ignorePop = false; return; }
      if (e.state && e.state.panel) show(e.state.panel); else hide();
    });
    panel.querySelector('.close').addEventListener('click', close);
    panel.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    // A shared link to #/<name> opens that project, with the landing page underneath for back to return to.
    var m = location.hash.match(/^#\/([\w-]+)$/);
    if (m && (document.getElementById('panel-' + m[1]) || CASES.indexOf(m[1]) > -1)) {
      history.replaceState(null, '', location.pathname + location.search);
      open(m[1]);
    }
  }

  // Illustration: a synthetic 3D scene beside time-synced plots, sharing one playhead.
  function platformIllustration(canvas) {
    var ctx = canvas.getContext('2d'), w = 0, h = 0, dpr = Math.max(1, window.devicePixelRatio || 1);
    // Colours come from the theme tokens, read again whenever the theme changes, so any theme draws correctly.
    var scratch = document.createElement('canvas').getContext('2d'), pal = null;
    var rgbOf = function (name) {
      scratch.fillStyle = '#000'; scratch.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      var c = scratch.fillStyle, m = /^#(..)(..)(..)$/.exec(c);
      return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : c.match(/[\d.]+/g).slice(0, 3).map(Number);
    };
    var readPalette = function () {
      var ink = rgbOf('--text'), panel = rgbOf('--surface-raised'), voice = rgbOf('--signal-3'), seen = rgbOf('--seen'), line = rgbOf('--line'), accent = rgbOf('--accent');
      pal = {
        ink: ink.join(','), panel: panel.join(','), voice: voice.join(','), seen: seen.join(','), line: line.join(','), accent: accent.join(','),
        // Light type on a dark panel needs more weight to read the same.
        onDark: (panel[0] * 299 + panel[1] * 587 + panel[2] * 114) / 1000 < 128
      };
    };
    readPalette();
    new MutationObserver(function () { readPalette(); if (kick) kick(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    var kick = null;
    var pts = [], i, rnd = (function () { var s = 7; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
    for (i = 0; i < 900; i++) pts.push([rnd() * 8 - 4, 0, rnd() * 8 - 4]);                 // floor
    for (i = 0; i < 520; i++) pts.push([-4, rnd() * 2.6, rnd() * 8 - 4]);                 // wall
    for (i = 0; i < 520; i++) pts.push([rnd() * 8 - 4, rnd() * 2.6, -4]);                 // wall
    var box = function (cx, cz, sx, sy, sz, n) { for (var j = 0; j < n; j++) { var f = rnd() * 3 | 0, a = rnd(), b = rnd(); var p = f === 0 ? [cx + (a - .5) * sx, sy, cz + (b - .5) * sz] : f === 1 ? [cx + (rnd() < .5 ? -.5 : .5) * sx, a * sy, cz + (b - .5) * sz] : [cx + (a - .5) * sx, b * sy, cz + (rnd() < .5 ? -.5 : .5) * sz]; pts.push(p); } };
    box(1.6, -1.8, 1.4, .9, 1, 260); box(-1.8, 1.4, .8, 1.3, .8, 220); box(1.9, 2, 1, .5, 1.6, 200);
    var resize = function () {
      var r = canvas.getBoundingClientRect(); w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    if (window.ResizeObserver) new ResizeObserver(function () { resize(); if (kick) kick(); }).observe(canvas);   // a held frame is not redrawn by itself
    // Perception, simplified: a camera's field of view sweeps the room and only what it has seen appears, fading as its
    // estimate ages; two people stand in the room, and whoever is speaking is located by the direction of their voice.
    // Every motion is a whole number of cycles of one LOOP, so the scene ends where it began and restarts with the site's
    // other drawings. Speaking turns (an even number per loop) and sound rings divide it evenly too.
    var LOOP = 40, W = 2 * Math.PI / LOOP, TURN = LOOP / 8, RING = 28 / LOOP;
    var sx = .6, sy = 1.3, sz = .9, hfov = .5, vfov = .34, MEM = 9;
    // two people walk slow loops through the open floor, clear of the furniture, in opposite directions
    var walk = [[-2.4, -2.0, .9, .7, 2 * W], [3.1, .4, .6, 1.2, -W]];
    var where = function (n, tt) { var p = walk[n], a = tt * p[4] + n * 2; return [p[0] + Math.cos(a) * p[2], p[1] + Math.sin(a) * p[3]]; };
    var jit = pts.map(function () { return [rnd() - .5, rnd() - .5, rnd() - .5]; });
    var aim = function (tt) { return [3.1 + Math.sin(tt * 2 * W) * 1.1, -.3 + Math.sin(tt * 3 * W) * .22]; };
    var inView = function (x, y, z, a) {
      var dx = x - sx, dy = y - sy, dz = z - sz, flat = Math.hypot(dx, dz);
      var ang = Math.atan2(dz, dx) - a[0]; ang = Math.atan2(Math.sin(ang), Math.cos(ang));
      return Math.abs(ang) < hfov && Math.abs(Math.atan2(dy, flat) - a[1]) < vfov;
    };
    var turnAt = function (tt) { return tt - Math.floor(tt / TURN) * TURN; };   // also right for the history before 0
    var speakerAt = function (tt) { return Math.floor(tt / TURN) & 1; };
    var voiceAt = function (tt) { var turn = turnAt(tt); return Math.min(1, turn / .8, (TURN - turn) / .8); };   // each turn fades in and out
    // A person is detected while seen in the field of view (full), or heard while speaking, fading in with the voice
    // (fainter, since sound gives a direction more than a position).
    var detected = function (n, tt) {
      var pp = where(n, tt);
      return Math.max(inView(pp[0], 1.2, pp[1], aim(tt)) ? 1 : 0, n === speakerAt(tt) ? .75 * voiceAt(tt) : 0);
    };
    // Memory is sampled on a fixed grid of scene time, never on frame times, so what the scene remembers depends on the
    // moment alone: the same at t and t + LOOP, and the same just after a restart as on a fresh load.
    var STEP = .05, KEEP = Math.ceil(MEM / STEP);
    var UP = 1 - Math.pow(.88, 3), DOWN = 1 - Math.pow(.965, 3);   // presence eases in over about half a second and out over about two
    var ease = function (p, goal, steps) { return p + (goal - p) * (1 - Math.pow(1 - (goal > p ? UP : DOWN), steps)); };
    var seenAt, presence, lastPos, lastStep;
    var forget = function () {
      seenAt = new Float64Array(pts.length).fill(-1e9);
      presence = [0, 0];   // how strongly each person is detected, eased so nobody pops in or out
      lastPos = [where(0, 0), where(1, 0)]; lastStep = -Infinity;
    };
    forget();
    var look = function (g) {   // record what the field of view covers at grid step g
      var tt = g * STEP, a = aim(tt);
      for (var n = 0; n < pts.length; n++) if (inView(pts[n][0], pts[n][1], pts[n][2], a)) seenAt[n] = tt;
      for (n = 0; n < 2; n++) { var goal = detected(n, tt); presence[n] = ease(presence[n], goal, 1); if (goal > 0) lastPos[n] = where(n, tt); }
    };
    // Steps memory up to t. On first paint, after a restart and after time off screen, the last MEM seconds are replayed
    // from the loop's own history, so the scene carries on instead of starting empty.
    var catchUp = function (t) {
      var g = Math.floor(t / STEP);
      if (g < lastStep || g - lastStep > KEEP) { forget(); lastStep = g - KEEP - 1; }
      for (var k = lastStep + 1; k <= g; k++) look(k);
      lastStep = g;
      return g;
    };
    // Until the site starts it on view, it holds a still: the opening frame, or on the home page the finished one.
    // Its progress line fills over one pass up to HOLD and stays full to the loop's end; waiting, it shows empty.
    var HOLD = +canvas.dataset.hold || LOOP;
    var t0 = performance.now(), held = !reduced, holdT = 0, waiting = false;
    var frame = function (now) {
      var t = held ? holdT : reduced ? 4 : Math.max(0, (now - t0) / 1000), g = catchUp(t);
      var dark = pal.onDark, ink = pal.ink;
      ctx.fillStyle = 'rgb(' + pal.panel + ')'; ctx.fillRect(0, 0, w, h);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';   // no miter spikes at the signal peaks; set per frame, as a resize resets them
      var split = w > 420 ? w * 0.6 : w, cam = t * W + 0.6;   // the view orbits the room once per loop
      var a = aim(t);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, split, h); ctx.clip();   // the scene keeps to its own column, clear of the charts
      var proj = function (p) {
        var x = p[0], y = p[1] - 1, z = p[2];
        var cx = x * Math.cos(cam) - z * Math.sin(cam), cz = x * Math.sin(cam) + z * Math.cos(cam);
        var cy = y * Math.cos(.5) + cz * Math.sin(.5); cz = -y * Math.sin(.5) + cz * Math.cos(.5) + 10.5;
        var f = Math.min(split * .92, h) * 1.05 / cz;
        return [split / 2 + cx * f, h / 2 - cy * f - h * .16, cz];
      };
      var fade = function (age) { return age > MEM ? 0 : Math.pow(1 - age / MEM, 1.6); };
      // Point cloud, drawn the way point-cloud viewers do: round points, sized by distance (near large, far small), and
      // depth carried by one colour fading toward the background, never by a second hue. Points are grouped into a few
      // depth and age bands and each band filled in one pass, far bands first so near points sit in front.
      var BANDS = 10, fresh = [], old = [];
      for (var bi = 0; bi < BANDS; bi++) { fresh.push([]); old.push([]); }
      var depthBand = function (cz) { return Math.min(BANDS - 1, Math.max(0, Math.floor((cz - 7) / 7 * BANDS))); };
      for (i = 0; i < pts.length; i++) {
        var p = pts[i], age = t - seenAt[i], now_ = inView(p[0], p[1], p[2], a);
        if (!now_ && age > MEM) continue;
        var u = now_ ? 0 : age * .035, q = proj([p[0] + jit[i][0] * u, p[1] + jit[i][1] * u, p[2] + jit[i][2] * u]);   // older estimates drift
        var r_ = (now_ ? 1.7 : 1.05) * Math.pow(9 / q[2], 1.6);   // perspective: radius falls with distance
        if (now_) fresh[depthBand(q[2])].push(q[0], q[1], r_);
        else old[Math.min(BANDS - 1, Math.floor((1 - fade(age)) * BANDS))].push(q[0], q[1], r_ * (dark ? 1 : 1.1), q[2]);
      }
      var disc = function (xyr, step) { ctx.beginPath(); for (var d = 0; d < xyr.length; d += step) { ctx.moveTo(xyr[d] + xyr[d + 2], xyr[d + 1]); ctx.arc(xyr[d], xyr[d + 1], xyr[d + 2], 0, 6.283); } ctx.fill(); };
      var acc = pal.seen.split(',').map(Number), bg = pal.panel.split(',').map(Number);
      // what the camera has seen and is forgetting: ink, fading with age
      for (bi = BANDS - 1; bi >= 0; bi--) if (old[bi].length) {
        var a_ = (dark ? .42 : .5) * Math.pow(1 - (bi + .5) / BANDS, 1.6);
        ctx.fillStyle = 'rgba(' + ink + ',' + a_.toFixed(3) + ')'; disc(old[bi], 4);
      }
      // what the camera sees now: the accent, blending toward the background with distance
      for (bi = BANDS - 1; bi >= 0; bi--) if (fresh[bi].length) {
        var k_ = (bi + .5) / BANDS * .72;
        ctx.fillStyle = 'rgb(' + acc.map(function (v, n) { return Math.round(v + (bg[n] - v) * k_); }).join(',') + ')'; disc(fresh[bi], 3);
      }
      // People, in ink: drawn once seen and left where last seen, fading like the points; whoever is speaking is also heard, with sound rings in the voice colour,
      // so they show where they are now even out of view
      var speaker = speakerAt(t), o = proj([sx, sy, sz]), voice = pal.voice;
      [0, 1].forEach(function (n) {
        // A person is drawn only while detected; undetected, they fade out where last found.
        var heard = n === speaker, target = detected(n, t);
        var al = reduced ? target : ease(presence[n], target, (t - g * STEP) / STEP);
        if (al < .01) return;
        var pp = target > 0 ? where(n, t) : lastPos[n];
        var head = proj([pp[0], 1.65, pp[1]]), neck = proj([pp[0], 1.42, pp[1]]), feet = proj([pp[0], 0, pp[1]]), r = (feet[1] - head[1]) * .12;
        ctx.strokeStyle = 'rgba(' + ink + ',' + (.8 * al).toFixed(2) + ')'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(head[0], head[1], r, 0, 7); ctx.stroke();
        var hip = proj([pp[0], .72, pp[1]]), mid = [(neck[0] + hip[0]) / 2, (neck[1] + hip[1]) / 2];   // ends projected, so the body stays upright in perspective
        ctx.beginPath(); ctx.ellipse(mid[0], mid[1], r * .95, Math.hypot(neck[0] - hip[0], neck[1] - hip[1]) / 2, Math.atan2(neck[1] - hip[1], neck[0] - hip[0]) + Math.PI / 2, 0, 7); ctx.stroke();   // the torso
        ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(feet[0], feet[1]); ctx.stroke();   // the legs
        ctx.beginPath();                                                                                  // the footprint on the floor
        for (var m = 0; m <= 24; m++) { var a_ = m / 24 * Math.PI * 2, e = proj([pp[0] + Math.cos(a_) * .3, 0, pp[1] + Math.sin(a_) * .3]); if (m) ctx.lineTo(e[0], e[1]); else ctx.moveTo(e[0], e[1]); }
        ctx.stroke();
        if (heard) {
          var env = voiceAt(t);
          for (var k = 0; k < 3; k++) {   // sound spreading from the speaker
            var ph = (t * RING + k / 3) % 1, rr = .25 + ph * 1.1;
            ctx.strokeStyle = 'rgba(' + voice + ',' + (.6 * (1 - ph) * env).toFixed(2) + ')'; ctx.beginPath();
            for (var q2 = 0; q2 <= 32; q2++) { var th_ = q2 / 32 * Math.PI * 2, e2 = proj([pp[0] + Math.cos(th_) * rr, 1.6, pp[1] + Math.sin(th_) * rr]); if (q2) ctx.lineTo(e2[0], e2[1]); else ctx.moveTo(e2[0], e2[1]); }
            ctx.stroke();
          }
        }
      });
      // The camera and its field of view
      var ray = function (da, db, len) {
        var c = Math.cos(a[1] + db);
        return [sx + c * Math.cos(a[0] + da) * len, sy + Math.sin(a[1] + db) * len, sz + c * Math.sin(a[0] + da) * len];
      };
      var corners = [[-hfov, -vfov], [hfov, -vfov], [hfov, vfov], [-hfov, vfov]].map(function (c) { return proj(ray(c[0], c[1], 3.2)); });
      ctx.strokeStyle = 'rgba(' + ink + ',.55)'; ctx.lineWidth = 1;   // the instrument in ink; brass is only what it sees
      corners.forEach(function (e) { ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); });
      ctx.beginPath(); corners.forEach(function (e, n) { if (n) ctx.lineTo(e[0], e[1]); else ctx.moveTo(e[0], e[1]); }); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = 'rgba(' + ink + ',.85)'; ctx.beginPath(); ctx.arc(o[0], o[1], 4, 0, 7); ctx.fill();
      if (split < w) {   // soften the scene's edge where the charts begin
        var bg = pal.panel, gr = ctx.createLinearGradient(split - 28, 0, split, 0);
        gr.addColorStop(0, 'rgba(' + bg + ',0)'); gr.addColorStop(1, 'rgba(' + bg + ',1)'); ctx.fillStyle = gr; ctx.fillRect(split - 28, 0, 28, h);
      }
      ctx.restore();
      if (split < w) {
        // Three synthetic signals on a shared timeline; the playhead marks the moment shown in 3D.
        var x0 = split + 18, x1 = w - 16, tracks = ['Telemetry', 'Audio', 'Events'], th = (h - 40) / 3;
        ctx.font = '9px "JetBrains Mono", Menlo, monospace'; ctx.textBaseline = 'top';
        for (var k = 0; k < 3; k++) {
          var y0 = 16 + k * th;
          ctx.fillStyle = 'rgba(' + ink + ',.5)'; ctx.fillText(tracks[k].toUpperCase(), x0, y0);
          ctx.strokeStyle = 'rgba(' + ink + ',.12)'; ctx.beginPath(); ctx.moveTo(x0, y0 + th - 8); ctx.lineTo(x1, y0 + th - 8); ctx.stroke();
          ctx.strokeStyle = 'rgba(' + ink + ',.75)'; ctx.beginPath();
          // half-pixel steps: the audio wave cycles every ~12 px, and coarser sampling let its peaks shimmer as it slid
          for (var x = x0; x <= x1; x += .5) {
            // each term scrolls a whole number of its own cycles per loop
            var u = (x - x0) / (x1 - x0) * 6, v;
            if (k === 0) v = Math.sin(u * 1.1 + t * 6 * W) * .6 + Math.sin(u * 3.7 + t * 21 * W) * .15;
            else if (k === 1) v = (Math.sin(u * 9 + t * 52 * W) * Math.sin(u * .9 + t * 5 * W)) * .8;
            else v = Math.abs(Math.sin(u * .7 + t * 4 * W)) > .6 ? .7 : -.3;
            var y = y0 + 14 + (1 - (v + 1) / 2) * (th - 28);
            if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        var px = x0 + (x1 - x0) * 0.62;
        ctx.strokeStyle = 'rgb(' + pal.seen + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, 10); ctx.lineTo(px, h - 18); ctx.stroke();
        ctx.lineWidth = 1;
      }
      if (!reduced) {   // the progress line, drawn from this frame's own time so it cannot drift from the scene
        ctx.fillStyle = 'rgb(' + pal.line + ')'; ctx.fillRect(0, h - 2, w, 2);
        ctx.fillStyle = 'rgb(' + pal.accent + ')'; ctx.fillRect(0, h - 2, waiting ? 0 : w * Math.min((held ? holdT : t % LOOP) / HOLD, 1), 2);
      }
      if (!held && !reduced && canvas.isConnected && visible && shown()) requestAnimationFrame(frame); else running = false;
    };
    // Only animate while on screen.
    var visible = true, running = false;
    // A canvas inside something hidden (a closed panel) stops drawing until it is shown and kicked again.
    var shown = function () { return !canvas.checkVisibility || canvas.checkVisibility({ visibilityProperty: true }); };
    kick = function () { if (!running) { running = true; requestAnimationFrame(frame); } };
    canvas.kick = kick;
    // The site's playback logic drives these, as it rewinds, starts and holds every other animated drawing.
    canvas.hold = HOLD;
    canvas.restart = function () { t0 = performance.now(); held = false; waiting = false; forget(); kick(); };
    canvas.rest = function () { held = true; holdT = 0; waiting = false; forget(); kick(); };
    canvas.holdAt = function (tt, wait) { held = true; holdT = tt; waiting = !!wait; kick(); };
    canvas.isHeld = function () { return held; };
    canvas.clock = function () { return held ? holdT : (performance.now() - t0) / 1000; };
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) kick(); }).observe(canvas);
    kick();
  }

  function startIllustrations(root) {
    root.querySelectorAll('canvas[data-illus="platform"]').forEach(function (c) {
      if (c.dataset.on) return; c.dataset.on = '1'; platformIllustration(c);
    });
  }
  startIllustrations(document);
  // Drawings shown through <use> share the clock of the hidden svg that defines them, so restarting one would restart
  // all. Each shown copy becomes a real clone instead, on its own svg's clock. Markers stay in the host's defs, where
  // url(#...) still finds them; ids are dropped so the page keeps one of each.
  function ownClocks(root) {
    root.querySelectorAll('svg use').forEach(function (use) {
      var src = document.querySelector(use.getAttribute('href')), host = src && src.ownerSVGElement;
      if (!host || host.getAttribute('width') !== '0') return;
      var copy = src.cloneNode(true), svg = use.ownerSVGElement;
      copy.querySelectorAll('defs').forEach(function (d) { d.remove(); });
      copy.removeAttribute('id'); copy.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
      use.replaceWith(copy);
      if (host.dataset.hold && !svg.dataset.hold) svg.dataset.hold = host.dataset.hold;
      host.pauseAnimations();   // nothing shows the host itself
    });
  }
  ownClocks(document);

  // Playback. Case study pages (and those pages inside the home page's side panel) loop every animated drawing: it starts
  // from its beginning when at least 35% of it is on screen and starts over once it has left the screen entirely. The home
  // page plays its drawings in turns instead (below), which needs a clock it can pause and hold. An <img> drawing's clock
  // can't be, so over http each one is fetched and shown inline. fetch fails on file://, so a page opened from disk keeps
  // the looping behaviour everywhere. Each drawing draws its own progress line, so the line and the drawing share one clock.
  // An inline drawing is rewound on its own clock and stops while off screen, and so is a canvas drawing. An <img> drawing
  // restarts when its address changes, because a new image document begins its timeline at 0; only the active theme's copy
  // is restarted.
  var home = !!document.querySelector('dialog.panel');
  var inlining = home && !reduced && /^https?:$/.test(location.protocol);
  var canHover = window.matchMedia('(hover: hover)').matches;
  var commonDur = function (durs) {   // ties go to the longer loop, so the line never ends before the drawing does
    var n = {}, best = 0;
    durs.forEach(function (d) { var v = parseFloat(d); if (v > 0) n[v] = (n[v] || 0) + 1; });
    Object.keys(n).forEach(function (v) { v = +v; if (!best || n[v] > n[best] || (n[v] === n[best] && v > best)) best = v; });
    return best;
  };
  var ANIMS = 'animate, animateTransform, animateMotion, set';
  var loopOf = function (svg) { return commonDur(Array.prototype.map.call(svg.querySelectorAll(ANIMS), function (a) { return a.getAttribute('dur') || ''; })); };
  // The finished frame is the drawing's own fact, its data-hold: the last moment before its loop fades or resets.
  var holdOf = function (svg, loop) { return Math.min(+svg.dataset.hold || loop, loop - .05); };
  var drawings = [], restarts = 0;
  var showing = function (el) { return getComputedStyle(el).display !== 'none'; };
  var begin = function (d) {
    d.on = true;
    if (d.svg) { d.svg.pauseAnimations(); d.svg.setCurrentTime(0); if (!document.hidden) d.svg.unpauseAnimations(); }
    else if (d.canvas) d.canvas.restart();
    // each restart loads the file under a new address: images with one address share one timeline, and a changed fragment
    // does not reliably rewind it, so a card and its panel, or a theme's copy, would start from wherever the other left it
    else d.imgs.forEach(function (im) { if (showing(im)) im.src = im.base + '?r=' + (++restarts); });
  };
  var rest = function (d) {   // off screen: rewound and stopped, so it shows its opening frame on the way back in
    d.on = false;
    if (d.svg) { d.svg.pauseAnimations(); d.svg.setCurrentTime(0); }
    if (d.canvas) d.canvas.rest();
  };
  // A drawing is judged by its shown part: an <img> drawing has one copy per theme, and only one has a box.
  var looker = !reduced && new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var d = e.target.drawing; if (!d) return;
      e.target.seen = e.intersectionRatio >= .35 || e.intersectionRect.height >= innerHeight * .35 ? 2 : e.isIntersecting ? 1 : 0;   // a drawing taller than the screen still starts
      var best = Math.max.apply(null, d.parts.map(function (p) { return p.seen || 0; }));
      if (best === 2 && !d.on) begin(d); else if (best === 0) rest(d);
    });
  }, { threshold: [0, .35] });
  // An inline drawing carries its progress line inside itself, a track and a fill that grows from the start to the hold
  // and stays full to the loop's end, on the drawing's own clock, so rewinding, pausing and holding the drawing moves the
  // line with it. The line runs along the bottom edge of the svg's box, where the svg's own clip leaves it: it is stroked
  // twice as thick as it shows and centred on that edge, so exactly 2 px remain at any scale.
  var drawLine = function (svg, loop, hold) {
    var NS = 'http://www.w3.org/2000/svg';
    if (!svg.viewBox.baseVal.width || !loop) return;
    var make = function (tag, attrs, parent) {
      var el = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
      parent.appendChild(el); return el;
    };
    var g = make('g', { 'class': 'progline', 'aria-hidden': 'true' }, svg);
    var stroke = function (colour) {
      return make('line', { 'stroke-width': 4, 'vector-effect': 'non-scaling-stroke', style: 'stroke:var(' + colour + ')' }, g);
    };
    var back = stroke('--line'), fill = stroke('--accent');
    var grow = make('animate', { attributeName: 'x2', dur: loop + 's', repeatCount: 'indefinite', keyTimes: '0;' + hold / loop + ';1' }, fill);
    var place = function () {   // the svg's box edges in its own user units, since the box can be larger than the viewBox
      var m = svg.getScreenCTM(), r = svg.getBoundingClientRect();
      if (!m || !r.width) return;
      var x0 = (r.left - m.e) / m.a, x1 = (r.right - m.e) / m.a, y = (r.bottom - m.f) / m.d;
      [back, fill].forEach(function (l) { l.setAttribute('x1', x0); l.setAttribute('y1', y); l.setAttribute('y2', y); });
      back.setAttribute('x2', x1); grow.setAttribute('values', x0 + ';' + x1 + ';' + x1);
    };
    place();
    if (window.ResizeObserver) new ResizeObserver(place).observe(svg);
  };
  var track = function (d) { d.parts.forEach(function (p) { p.drawing = d; looker.observe(p); }); drawings.push(d); };
  // Image drawings found under root, grouped by the box that holds one copy per theme.
  var imgGroups = function (root) {
    var groups = [];
    root.querySelectorAll('img').forEach(function (im) {
      var src = im.getAttribute('src') || '';
      if (im.base || !/\.svg$/.test(src) || im.closest('dialog.lightbox')) return;
      im.base = src;
      var g = groups.filter(function (x) { return x.parent === im.parentNode; })[0];
      if (g) g.imgs.push(im); else groups.push({ parent: im.parentNode, imgs: [im] });
    });
    return groups;
  };

  // Home page: animated drawings take turns. One plays at a time, a single pass from its start to its finished frame,
  // which it then holds without drawing again, its line full. A drawing waiting for its turn shows its finished frame,
  // still, with an empty line. The first turn goes to the drawing nearest the middle of the screen and the next to the
  // following unplayed one in reading order; a scroll hands the turn over only when another is clearly nearer the middle.
  // Where there is hover, hovering or keyboard-focusing a drawing's card plays it at once, looping, and holds the turns until the
  // pointer or focus leaves; a pass still running then carries on as the turn. A drawing scrolled fully off screen may
  // play again when it comes back. While a panel is open only its drawings take turns.
  var turns = null;
  if (inlining) turns = (function () {
    var list = [], playing = null, hovered = null, scope = null, timer = 0, settle = 0, seq = 0, lastDone = null, entries = [];
    var FADE = 75;   // each half of the ~150 ms fade that hides the jump from the finished frame back to the first
    var svgOf = function (p) { return p.tagName === 'svg' ? p : p.shadowRoot && p.shadowRoot.querySelector('svg'); };
    var svgsOf = function (d) { return d.parts.map(svgOf).filter(Boolean); };
    var clock = function (d) { return d.canvas ? d.canvas.clock() : svgsOf(d)[0].getCurrentTime(); };
    var lead = function (d) { return d.parts.filter(function (p) { return p.checkVisibility({ visibilityProperty: true }); })[0] || d.parts[0]; };
    var empty = function (svg, on) { var f = svg.querySelector('.progline line:last-child'); if (f) f.style.visibility = on ? 'hidden' : ''; };
    var holdEnd = function (d, wait) {   // the finished frame, still; a drawing not yet played shows its line empty
      if (d.canvas) d.canvas.holdAt(d.hold, wait);
      else svgsOf(d).forEach(function (s) { s.pauseAnimations(); s.setCurrentTime(d.hold); empty(s, wait); });
    };
    var halt = function (d) {   // stopped before its pass ended: back to waiting, so it still gets a whole turn
      if (playing === d) { playing = null; clearTimeout(timer); }
      d.token = 0; d.state = 'wait';
      d.parts.forEach(function (p) { p.classList.remove('swap'); });
      holdEnd(d, true);
    };
    var arm = function (d) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (playing !== d) return;
        if (clock(d) < d.hold - .01) arm(d);   // a hidden tab pauses the clock, so check before ending
        else if (hovered === d) start(d);   // a hovered drawing goes round again until the pointer or focus leaves
        else finish(d);
      }, Math.max(20, (d.hold - clock(d)) * 1000 + 20));
    };
    var start = function (d) {
      if (playing && playing !== d) halt(playing);
      clearTimeout(timer);
      playing = d; d.state = 'play'; var token = d.token = ++seq;
      d.parts.forEach(function (p) { p.classList.add('swap'); });
      setTimeout(function () {
        if (playing !== d || d.token !== token) return;
        if (d.canvas) d.canvas.restart();
        else svgsOf(d).forEach(function (s) { empty(s, false); s.pauseAnimations(); s.setCurrentTime(0); if (!document.hidden) s.unpauseAnimations(); });
        d.parts.forEach(function (p) { p.classList.remove('swap'); });
        arm(d);
      }, FADE);
    };
    var finish = function (d) {
      playing = null; d.state = 'done'; lastDone = d;
      holdEnd(d, false);
      evaluate('finish');
    };
    var inScope = function (d) { return scope ? scope.contains(lead(d)) : !lead(d).closest('dialog'); };
    var io = function (d) { return lead(d).io || {}; };
    var enough = function (d) {
      var m = io(d); return !!m.isect && (m.ratio >= .35 || m.ih >= innerHeight * .35) && lead(d).checkVisibility({ visibilityProperty: true });
    };
    var rectOf = function (d) { return lead(d).getBoundingClientRect(); };
    // Rows are read left to right, then down; a drawing starts a new row once it sits below half the row's height.
    var reading = function (arr) {
      var rs = arr.map(function (d) { return { d: d, r: rectOf(d) }; }).sort(function (a, b) { return a.r.top - b.r.top; });
      var rows = [], row = null;
      rs.forEach(function (x) { if (!row || x.r.top >= row.top + row.h / 2) rows.push(row = { top: x.r.top, h: x.r.height, xs: [] }); row.xs.push(x); });
      return [].concat.apply([], rows.map(function (r) { return r.xs.sort(function (a, b) { return a.r.left - b.r.left; }).map(function (x) { return x.d; }); }));
    };
    var dist = function (d) { var r = rectOf(d); return Math.abs((r.top + r.bottom) / 2 - innerHeight / 2); };
    var centred = function (arr) {   // a near tie goes to the first in reading order, so a row starts at its left
      var best = null;
      reading(arr).forEach(function (d) { if (!best || dist(d) < dist(best) - 8) best = d; });
      return best;
    };
    var waiting = function () { return list.filter(function (d) { return d.state === 'wait' && inScope(d) && enough(d); }); };
    var evaluate = function (why) {
      if (playing && (!playing.parts[0].isConnected || !inScope(playing) || !enough(playing))) halt(playing);
      if (hovered) return;
      var fresh = waiting(), pick = null;
      if (playing) {
        if (why === 'scroll') { var best = centred(fresh); if (best && dist(best) < dist(playing) - innerHeight * .15) pick = best; }
      } else if (fresh.length) {
        if (why === 'finish' && lastDone && lastDone.parts[0].isConnected) {
          var order = reading(fresh.concat([lastDone]));
          pick = order[order.indexOf(lastDone) + 1] || reading(fresh)[0];
        } else pick = centred(fresh);
      }
      if (pick) start(pick);
    };
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var d = e.target.tdraw; if (!d) return;
        e.target.io = { isect: e.isIntersecting, ratio: e.intersectionRatio, ih: e.intersectionRect.height };
        // fully gone: eligible to play again. A copy hidden by the theme reports as gone too, and is not a reason to stop.
        if (!e.isIntersecting && d.state !== 'wait' && e.target.checkVisibility({ visibilityProperty: true })) halt(d);
      });
      evaluate('view');
    }, { threshold: [0, .35, .6, 1] });
    document.addEventListener('scroll', function () { clearTimeout(settle); settle = setTimeout(function () { evaluate('scroll'); }, 150); }, { capture: true, passive: true });
    // Scrolling slides cards under a pointer that has not moved, and the browser reports that as entering them; only a
    // pointer that moved is pointing at something. Coming back to the drawing already playing lets it carry on.
    var px = null, py = null;
    document.addEventListener('pointermove', function (e) { px = e.screenX; py = e.screenY; }, { passive: true });
    var still = function (e) { return px !== null && e.screenX === px && e.screenY === py; };
    var hoverOn = function (d) { if (!inScope(d)) return; hovered = d; if (playing !== d) start(d); };
    var hoverOff = function (d) {
      if (hovered !== d) return;
      hovered = null;
      evaluate('resume');
    };
    var add = function (d) {
      d.state = 'wait';
      d.parts.forEach(function (p) { p.tdraw = d; p.classList.add('fade'); seen.observe(p); });
      if (canHover) {   // a tap on a touch screen only opens the panel; it is never hover
        var el = lead(d).closest('.card, .fcard') || lead(d);
        el.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch' && !still(e)) hoverOn(d); });
        // an entry ignored because the page scrolled under a still pointer is taken up by the pointer's first real move
        el.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch' && hovered !== d && !still(e)) hoverOn(d); });
        el.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') hoverOff(d); });
        el.addEventListener('focusin', function () { if (el.matches(':focus-visible') || el.querySelector(':focus-visible')) hoverOn(d); });
        el.addEventListener('focusout', function (e) { if (!el.contains(e.relatedTarget)) hoverOff(d); });
      }
      holdEnd(d, true);
      list.push(d);
    };
    // An image drawing's copy for the shown theme is fetched and put in a shadow root, which keeps its ids and its own
    // <style> apart from the page's. The <img> stays until the copy is ready, so the card never flashes or shifts. The host
    // takes the image's classes (which pick its theme), inline style and fit, and its alt as its accessible name.
    var inline = function (im, text) {
      var fill = !!im.closest('.art'), pos = im.style.objectPosition || '';
      var host = document.createElement('span');
      host.className = (im.className ? im.className + ' ' : '') + 'inl';
      if (im.getAttribute('style')) host.setAttribute('style', im.getAttribute('style'));
      host.setAttribute('role', 'img'); host.setAttribute('aria-label', im.alt || '');
      var meet = im.style.objectFit === 'contain' || im.classList.contains('contain') || !fill;
      var sh = host.attachShadow({ mode: 'open' });
      sh.innerHTML = '<style>:host{display:block;overflow:hidden;box-sizing:border-box}svg{display:block;width:100%;height:' +
        (fill ? '100%' : 'auto') + '}</style>' + text;
      var svg = sh.querySelector('svg');
      if (!svg || !svg.querySelector(ANIMS)) return null;
      svg.setAttribute('preserveAspectRatio', 'xMid' + (/bottom/.test(pos) ? 'YMax' : /top/.test(pos) ? 'YMin' : 'YMid') + (meet ? ' meet' : ' slice'));
      return host;
    };
    var adopt = function (im, host) {
      var svg = svgOf(host), loop = loopOf(svg), parent = im.parentNode, d = parent.tdraw;
      svg.pauseAnimations();
      im.replaceWith(host);
      if (d) {   // another theme's copy of a drawing already in play: it joins in step
        d.parts.push(host); host.tdraw = d; host.classList.add('fade'); seen.observe(host);
        if (d.state === 'play' && !d.canvas) { svg.setCurrentTime(clock(d)); if (!document.hidden) svg.unpauseAnimations(); }
        else { svg.setCurrentTime(d.hold); empty(svg, d.state === 'wait'); }
      } else {
        d = { parts: [host], hold: holdOf(svg, loop) }; parent.tdraw = d; add(d);
      }
      evaluate('watch');
    };
    var fetchAll = function () {
      entries = entries.filter(function (e) { return e.im.isConnected && e.im.tagName === 'IMG'; });
      entries.forEach(function (e) {
        if (e.busy || e.done || !showing(e.im)) return;
        e.busy = true;
        fetch(e.im.getAttribute('src')).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (text) {
          e.busy = false;
          if (!e.im.isConnected) return;
          var host = inline(e.im, text); e.done = true;
          if (host) adopt(e.im, host);   // a static drawing stays an image
        }).catch(function () {   // the image goes on looping as it did before
          e.busy = false; e.done = true;
          track({ imgs: [e.im], parts: [e.im], on: false });
        });
      });
    };
    var watch = function (root) {
      list = list.filter(function (d) { if (d.parts[0].isConnected) return true; d.parts.forEach(function (p) { seen.unobserve(p); }); if (playing === d) playing = null; return false; });
      root.querySelectorAll('svg').forEach(function (svg) {
        if (svg.drawn || svg.ownerSVGElement || svg.getAttribute('width') === '0' || svg.hasAttribute('data-loop')) return;   // nested svgs and the hidden host aren't shown
        if (!svg.querySelector(ANIMS)) return;
        svg.drawn = true;
        var loop = loopOf(svg), hold = holdOf(svg, loop);
        drawLine(svg, loop, hold);
        add({ parts: [svg], hold: hold });
      });
      root.querySelectorAll('canvas[data-illus="platform"]').forEach(function (c) {
        if (c.drawn || !c.holdAt) return;
        c.drawn = true;
        add({ parts: [c], canvas: c, hold: c.hold });
      });
      imgGroups(root).forEach(function (g) { g.imgs.forEach(function (im) { entries.push({ im: im }); }); });
      fetchAll();
      evaluate('watch');
    };
    // A hidden tab stops the inline clock and its line together, so they stay in step.
    document.addEventListener('visibilitychange', function () {
      if (!playing || playing.canvas) return;
      svgsOf(playing).forEach(function (s) { if (document.hidden) s.pauseAnimations(); else s.unpauseAnimations(); });
    });
    return {
      watch: watch,
      theme: function () { fetchAll(); evaluate('view'); },
      scope: function (el) {
        scope = el; hovered = null;
        list = list.filter(function (d) { if (d.parts[0].isConnected) return true; d.parts.forEach(function (p) { seen.unobserve(p); }); return false; });
        if (playing && (!playing.parts[0].isConnected || !inScope(playing))) halt(playing);
        evaluate('scope');
      }
    };
  })();

  function watchDrawings(root) {
    if (turns) turns.watch(root);
    if (!looker) return;
    drawings = drawings.filter(function (d) { if (d.parts[0].isConnected) return true; d.parts.forEach(function (p) { looker.unobserve(p); }); return false; });   // a closed panel takes its drawings with it
    // A drawing marked data-loop, like the process loop, keeps out of the turns and runs whenever it is on screen.
    if (turns) root.querySelectorAll('svg[data-loop]').forEach(function (svg) {
      if (svg.drawn) return;
      svg.drawn = true; svg.pauseAnimations(); svg.setCurrentTime(0);
      track({ svg: svg, parts: [svg], on: false });
    });
    if (!turns) {
      root.querySelectorAll('svg').forEach(function (svg) {
        if (svg.drawn || svg.ownerSVGElement || svg.getAttribute('width') === '0') return;   // nested svgs and the hidden host aren't shown
        if (!svg.querySelector(ANIMS)) return;
        svg.drawn = true; svg.pauseAnimations(); svg.setCurrentTime(0);
        var loop = loopOf(svg);
        if (!svg.hasAttribute('data-loop')) drawLine(svg, loop, holdOf(svg, loop));
        track({ svg: svg, parts: [svg], on: false });
      });
      root.querySelectorAll('canvas[data-illus="platform"]').forEach(function (c) {
        if (c.drawn || !c.restart) return;
        c.drawn = true;
        track({ canvas: c, parts: [c], on: false });
      });
      imgGroups(root).forEach(function (g) { track({ imgs: g.imgs, parts: g.imgs, on: false }); });
    }
  }
  watchDrawings(document);
  if (turns) { var pnl = document.querySelector('dialog.panel'); if (pnl && pnl.open) turns.scope(pnl); }   // opened from a #/ link before the turns began
  if (looker) {
    // A hidden tab stops the inline clocks; their lines are part of them, so they stop together.
    document.addEventListener('visibilitychange', function () {
      drawings.forEach(function (d) {
        if (!d.svg || !d.on) return;
        if (document.hidden) d.svg.pauseAnimations(); else d.svg.unpauseAnimations();
      });
    });
    // The new theme's copy of an image drawing has been running unseen; start it from the top.
    new MutationObserver(function () {
      drawings.forEach(function (d) { if (d.imgs && d.on) begin(d); });
      if (turns) turns.theme();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  // Inline drawings animate with SMIL, which CSS can't stop; hold them still when motion is reduced, on the finished
  // frame each names with data-hold (copies of the shared drawings take the host's).
  function holdStill(root) {
    if (reduced) root.querySelectorAll('svg').forEach(function (svg) {
      if (!svg.pauseAnimations) return;
      svg.pauseAnimations();
      if (svg.dataset.hold) svg.setCurrentTime(+svg.dataset.hold);
    });
  }
  holdStill(document);
  // Looping CAD videos hold their poster frame when motion is reduced.
  if (reduced) document.querySelectorAll('video[autoplay]').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
})();
