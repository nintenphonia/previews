(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  document.addEventListener('contextmenu', function (e) {
    if (e.target.tagName !== 'INPUT') e.preventDefault();
  });

  /* back to top */
  $$('[data-top]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
  var fab = $('.fab');
  if (fab) {
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        fab.classList.toggle('show', window.scrollY > 480);
        tick = false;
      });
    }, { passive: true });
  }

  /* previews player */
  var list = $('.tracks');
  if (list) {
    var audio = new Audio();
    audio.preload = 'none';
    var cur = null;
    var stop = function () {
      if (!cur) return;
      cur.classList.remove('playing');
      var b = $('.play', cur);
      b.textContent = '▶';
      b.setAttribute('aria-pressed', 'false');
      $('.bar i', cur).style.width = '0';
      cur = null;
    };
    var toggle = function (li) {
      if (cur === li) { audio.pause(); stop(); return; }
      stop();
      cur = li;
      li.classList.add('playing');
      var b = $('.play', li);
      b.textContent = '❚❚';
      b.setAttribute('aria-pressed', 'true');
      audio.src = li.dataset.src;
      var p = audio.play();
      if (p && p.catch) p.catch(function () { stop(); });
    };
    $$('li', list).forEach(function (li) {
      li.addEventListener('click', function () { toggle(li); });
    });
    audio.addEventListener('timeupdate', function () {
      if (!cur || !audio.duration) return;
      $('.bar i', cur).style.width = (audio.currentTime / audio.duration * 100) + '%';
    });
    audio.addEventListener('ended', stop);
  }

  /* home: search + filters */
  var home = $('#home');
  if (home) {
    var input = $('#q');
    var status = $('#status');
    var popular = $('#popular');
    var tiles = $$('.tile[data-cats]', home);
    var secs = $$('.sec[data-sec]', home);
    var chips = $$('.chip', home);
    var f = 'all';
    var q = '';

    var norm = function (s) {
      return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    };
    tiles.forEach(function (t) {
      t._cats = ' ' + t.dataset.cats + ' ';
      t._text = norm(t.dataset.text + ' ' + (t.dataset.tracks || '').replace(/\|/g, ' '));
      t._title = norm(t.dataset.text);
      t._tracks = t.dataset.tracks ? t.dataset.tracks.split('|') : [];
      t._snip = $('.snip', t);
    });

    var hasAll = function (hay, words) {
      return words.every(function (w) { return hay.indexOf(w) > -1; });
    };

    var apply = function () {
      var words = norm(q).split(/\s+/).filter(Boolean);
      var active = f !== 'all' || words.length > 0;
      var n = 0;
      tiles.forEach(function (t) {
        var ok = f === 'all' || t._cats.indexOf(' ' + f + ' ') > -1;
        if (ok && words.length) ok = hasAll(t._text, words);
        t.hidden = !ok;
        var hit = '';
        if (ok && words.length && !hasAll(t._title, words)) {
          for (var i = 0; i < t._tracks.length; i++) {
            if (hasAll(norm(t._tracks[i]), words)) { hit = t._tracks[i]; break; }
          }
        }
        t._snip.textContent = hit ? '♪ ' + hit : '';
        if (ok) n++;
      });
      secs.forEach(function (s) {
        s.hidden = !$('.tile[data-cats]:not([hidden])', s);
      });
      if (popular) popular.hidden = active;
      status.textContent = !active ? '' :
        n ? n + (n === 1 ? ' result' : ' results') :
        'Nothing matches. Try the name of a game, like Zelda or Chrono Trigger.';
      chips.forEach(function (c) {
        var on = c.dataset.f === f;
        c.classList.toggle('on', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    };

    var setFilter = function (name, scroll) {
      f = name;
      if (history.replaceState) {
        history.replaceState(null, '', f === 'all' ? location.pathname + location.search : '#' + f);
      }
      apply();
      if (scroll) {
        var on = $('.chip.on', home);
        if (on && on.scrollIntoView) on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    };

    chips.forEach(function (c) {
      c.addEventListener('click', function () { setFilter(c.dataset.f, true); });
    });
    input.addEventListener('input', function () { q = input.value; apply(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') { input.value = ''; q = ''; apply(); input.blur(); }
    });

    var h = decodeURIComponent(location.hash.slice(1));
    if (chips.some(function (c) { return c.dataset.f === h; })) f = h;
    window.addEventListener('hashchange', function () {
      var nh = decodeURIComponent(location.hash.slice(1)) || 'all';
      if (chips.some(function (c) { return c.dataset.f === nh; })) { f = nh; apply(); }
    });
    apply();
  }
})();
