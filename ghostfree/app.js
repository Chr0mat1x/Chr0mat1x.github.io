/* GhostFree — stealth overlay client.
   Vanilla ES2020, no build step. Talks to the local FastAPI proxy. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  const STORE_KEY = 'ghostfree.v1';
  const loadStore = () => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch { return {}; }
  };
  const saveStore = (patch) => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ ...loadStore(), ...patch })); }
    catch { /* storage disabled — run stateless */ }
  };

  const saved = loadStore();

  const DEFAULT_TRIGGERS = ['?', 'как', 'что', 'чем', 'почему', 'зачем', 'когда', 'расскажи', 'объясни', 'сколько', 'какой', 'какая', 'какие', 'можешь', 'what', 'how', 'why', 'when', 'explain', 'tell me', 'difference'];

  const state = {
    config: null,
    mode: saved.mode || 'answer',
    context: saved.context || '',
    history: [],
    busy: false,
    hidden: false,
    collapsed: false,
    controller: null,
    recognition: null,
    listening: false,
    // Auto-answer: listens to the room and answers detected questions.
    auto: false,
    autoMode: saved.autoMode || 'answer',
    autoConfirm: !!saved.autoConfirm,
    autoTriggers: saved.autoTriggers || DEFAULT_TRIGGERS.join(', '),
    recLang: saved.recLang || 'ru-RU',
    autoRec: null,
    autoCommitted: '',
    autoBuffer: '',
    lastAuto: '',
    autoPending: null,
  };

  const token = new URLSearchParams(location.search).get('token') || saved.token || '';
  const params = new URLSearchParams(location.search);
  const EMBED = params.get('embed') === '1';
  if (EMBED) document.documentElement.classList.add('embed');

  // Static deployment: the same client also runs with no backend at all (e.g.
  // GitHub Pages), calling the key-less Pollinations gateway straight from the
  // browser. The gateway sends `Access-Control-Allow-Origin: *`, so no proxy is
  // needed; `hosts.js` (generated per deployment) supplies the base URL and the
  // mode prompts the FastAPI app otherwise serves.
  const hosts = window.__GHOSTFREE_HOSTS || null;
  const isStatic = !!(hosts && hosts.static && hosts.apiBase);

  // A page cannot draw over another tab, so the panel is moved into a separate
  // always-on-top window (Document Picture-in-Picture, Chrome 116+). That window
  // is a real document, so microphone and the mic permission prompt keep working.
  const FLOAT = params.get('float') === '1';
  const canFloat = () => !!window.documentPictureInPicture;
  let pipWin = null;
  let placeholder = null;
  let dragWired = false;

  const dom = {
    root: $('#root'),
    stream: $('#stream'),
    input: $('#input'),
    form: $('#composer'),
    modes: $('#modes'),
    context: $('#context'),
    status: $('#status'),
    net: $('#net'),
    netText: $('#net-text'),
    badge: $('#model-badge'),
    dragbar: $('#dragbar'),
    peek: $('#peek'),
    mic: $('#btn-mic'),
    float: $('#btn-float'),
    auto: $('#btn-auto'),
    autoPanel: $('#auto-panel'),
    autoMode: $('#auto-mode'),
    autoConfirm: $('#auto-confirm'),
    autoTriggers: $('#auto-triggers'),
    autoNote: $('#auto-note'),
    autoHeard: $('#auto-heard'),
    autoLang: $('#auto-lang'),
    collapse: $('#btn-collapse'),
    hide: $('#btn-hide'),
    send: $('#btn-send'),
  };
  // ── Rendering ──────────────────────────────────────────────────
  const STATUS_TEXT = {
    idle: 'готов', thinking: 'думает…', listening: 'слушает…', error: 'ошибка',
  };
  const setStatus = (name) => {
    dom.status.dataset.state = name;
    dom.status.textContent = STATUS_TEXT[name] || name;
    dom.root.dataset.state = name;
  };

  // Live reachability of the GhostFree server. Without this the panel looks
  // identical whether the backend is healthy or gone.
  const setNet = (state, text) => {
    dom.net.dataset.state = state;
    dom.netText.textContent = text;
    dom.net.title = `Связь с сервером: ${text}`;
  };

  const ping = async () => {
    setNet('checking', 'связь…');
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      // Static mode has no own server; reachability means the model gateway.
      const url = isStatic ? `${hosts.apiBase}/models` : '/healthz';
      const resp = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setNet('ok', 'на связи');
      return true;
    } catch {
      setNet('down', 'нет связи');
      return false;
    }
  };

  const probeAndPing = async () => {
    if (!(await ping())) {
      addError(isStatic
        ? 'Нет связи с бесплатным шлюзом модели. Проверь интернет и обнови страницу.'
        : 'Нет связи с сервером GhostFree. Похоже, он остановлен — запусти его заново и обнови страницу.');
      return;
    }
    pingTimer = setInterval(ping, 15000);
  };
  let pingTimer = null;

  // Minimal, safe formatter: escapes HTML, then styles ```blocks``` and `code`.
  const escapeHtml = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const renderText = (raw) => {
    const parts = escapeHtml(raw).split(/```/);
    return parts.map((chunk, i) => {
      if (i % 2 === 1) {
        const body = chunk.replace(/^[a-zA-Z0-9+#-]*\n/, '');
        return `<pre><code>${body.replace(/\n$/, '')}</code></pre>`;
      }
      return chunk.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    }).join('');
  };

  // LaTeX: formulas arrive as $...$ (inline) or $$...$$ (display) and are
  // typeset by the vendored KaTeX auto-render after the text is inserted.
  const KATEX_DELIMITERS = [
    { left: '$$', right: '$$', display: true },
    { left: '\\[', right: '\\]', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\(', right: '\\)', display: false },
  ];
  const paintMath = (node) => {
    if (typeof window.renderMathInElement !== 'function') return;
    try {
      window.renderMathInElement(node, {
        delimiters: KATEX_DELIMITERS,
        throwOnError: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
      });
    } catch { /* a malformed formula must never break the answer */ }
  };
  let mathFrame = null;
  const scheduleMath = (node) => {
    if (mathFrame) return;
    mathFrame = requestAnimationFrame(() => { mathFrame = null; paintMath(node); });
  };

  const atBottom = () =>
    dom.stream.scrollHeight - dom.stream.scrollTop - dom.stream.clientHeight < 48;
  const scrollDown = (force) => {
    if (force || atBottom()) dom.stream.scrollTop = dom.stream.scrollHeight;
  };

  const showEmpty = () => {
    if (dom.stream.querySelector('.turn')) return;
    dom.stream.replaceChildren(
      el('div', 'empty'),
    );
    const box = dom.stream.firstChild;
    box.innerHTML =
      'Задай вопрос интервьюера.<br />' +
      '<kbd>Enter</kbd> — ответить · <kbd>Ctrl</kbd>+<kbd>M</kbd> — микрофон<br />' +
      '<kbd>Ctrl</kbd>+<kbd>B</kbd> — свернуть · <kbd>Ctrl</kbd>+<kbd>H</kbd> — спрятать';
  };

  const clearEmpty = () => {
    const box = dom.stream.querySelector('.empty');
    if (box) box.remove();
  };

  const addTurn = (role, text) => {
    clearEmpty();
    const wrap = el('div', `turn turn--${role}`);
    const label = el('div', 'turn__role', role === 'user' ? 'интервьюер' : 'ghost');
    const body = el('div', 'turn__text');
    if (role === 'user') body.textContent = text;
    else body.innerHTML = renderText(text);
    wrap.append(label, body);
    dom.stream.append(wrap);
    scrollDown(true);
    return { wrap, body };
  };

  const addError = (message) => {
    clearEmpty();
    const wrap = el('div', 'turn turn--error');
    wrap.append(el('div', 'turn__role', 'сбой'), el('div', 'turn__text', message));
    dom.stream.append(wrap);
    scrollDown(true);
  };
  // ── Ask / stream ───────────────────────────────────────────────
  const setBusy = (busy) => {
    state.busy = busy;
    dom.send.disabled = busy;
    dom.input.disabled = busy;
  };

  const parseSse = (block) => {
    let event = 'message';
    const dataLines = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (!dataLines.length) return null;
    try { return { event, data: JSON.parse(dataLines.join('\n')) }; }
    catch { return null; }
  };

  const readStream = async (resp, onEvent) => {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let cut;
      while ((cut = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, cut);
        buffer = buffer.slice(cut + 2);
        // Static mode receives raw OpenAI chunks and folds them into the same
        // {event, data} shape the server emits, so callers stay identical.
        const evt = isStatic ? staticEvent(parseSse(block)) : parseSse(block);
        if (evt) onEvent(evt);
      }
    }
  };

  const staticEvent = (parsed) => {
    if (!parsed) return null;
    const data = parsed.data || {};
    if (data.error) {
      return { event: 'error', data: { message: data.error.message || 'ошибка шлюза' } };
    }
    const choice = (data.choices || [])[0];
    if (!choice) return null;
    const text = (choice.delta || {}).content || '';
    return text ? { event: 'delta', data: { text } } : null;
  };

  // Mirror of the server's _build_messages/_payload so a backend-less deployment
  // answers identically: same system prompt per mode, same context block.
  const buildStaticPayload = ({ messages, mode, context, question }) => {
    const cfg = state.config || {};
    const modes = cfg.modes || [];
    const chosen = modes.find((m) => m.id === mode)
      || modes.find((m) => m.id === cfg.default_mode) || modes[0] || {};
    let system = chosen.system || '';
    if (context && context.trim()) {
      system += '\n\nКонтекст кандидата (резюме, описание вакансии, заметки) — '
        + 'используй его в ответах:\n' + context.trim();
    }
    const out = [{ role: 'system', content: system }];
    for (const turn of messages) out.push({ role: turn.role, content: turn.content });
    if (question && question.trim()) out.push({ role: 'user', content: question.trim() });
    const body = {
      model: hosts.model,
      messages: out,
      stream: true,
      temperature: hosts.temperature,
      max_tokens: hosts.maxTokens,
    };
    if (hosts.reasoningEffort) body.reasoning_effort = hosts.reasoningEffort;
    return body;
  };

  const ask = async (question) => {
    if (state.busy) return;
    const q = (question != null ? question : dom.input.value).trim();
    if (!q) return;

    addTurn('user', q);
    state.history.push({ role: 'user', content: q });
    dom.input.value = '';
    autosize();
    setBusy(true);
    setStatus('thinking');

    const answer = addTurn('assistant', '');
    const caret = el('span', 'caret');
    answer.body.append(caret);
    let text = '';

    // The free gateway can take 20-30s to the first token. Show that we are
    // alive and counting, so an empty panel never looks like a hang.
    const wait = el('div', 'wait');
    const waitBar = el('span', 'wait__bar');
    const waitText = el('span', 'wait__text', 'печатает…');
    wait.append(waitBar, waitText);
    answer.body.append(wait);
    const t0 = Date.now();
    const timer = setInterval(() => {
      const secs = Math.round((Date.now() - t0) / 1000);
      waitText.textContent = secs >= 20
        ? `печатает… ${secs} с · бесплатный шлюз думает дольше обычного`
        : `печатает… ${secs} с`;
    }, 500);
    const clearWait = () => { clearInterval(timer); wait.remove(); };

    const controller = new AbortController();
    state.controller = controller;

    try {
      // Static mode builds the OpenAI payload here and streams straight from the
      // gateway; server mode posts the same data to the FastAPI proxy, which owns
      // the system prompts. Both paths feed the identical SSE reader below.
      const payload = {
        messages: state.history.slice(0, -1).slice(-12),
        mode: state.mode,
        context: state.context,
        question: q,
      };
      const resp = isStatic
        ? await fetch(`${hosts.apiBase}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildStaticPayload(payload)),
            signal: controller.signal,
          })
        : await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Access-Token': token } : {}) },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

      if (!resp.ok) {
        const detail = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status} ${detail.slice(0, 160)}`.trim());
      }

      await readStream(resp, ({ event, data }) => {
        if (event === 'ping') {
          waitText.textContent = 'печатает…';
        } else if (event === 'delta') {
          if (!text) clearWait();
          text += data.text || '';
          answer.body.innerHTML = renderText(text);
          answer.body.append(caret);
          scheduleMath(answer.body);
          scrollDown(false);
        } else if (event === 'error') {
          throw new Error(data.message || 'неизвестная ошибка');
        }
      });

      clearWait();
      caret.remove();
      if (!text.trim()) answer.body.textContent = '(пустой ответ)';
      else { paintMath(answer.body); state.history.push({ role: 'assistant', content: text }); }
      setStatus('idle');
    } catch (err) {
      clearWait();
      caret.remove();
      if (err.name === 'AbortError') {
        answer.body.innerHTML = renderText(text || '');
        answer.body.append(el('em', null, text ? ' [прервано]' : 'прервано'));
      } else {
        answer.wrap.remove();
        addError(String(err.message || err));
        setStatus('error');
        setTimeout(() => { if (!state.busy) setStatus('idle'); }, 2500);
      }
    } finally {
      state.controller = null;
      setBusy(false);
      dom.input.focus();
    }
  };

  const stop = () => { if (state.controller) state.controller.abort(); };
  // ── Voice input (Web Speech API) ───────────────────────────────
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  // Shared microphone-error reporting. Most Web Speech failures (no device,
  // blocked origin, offline) were previously swallowed, so pressing the mic
  // looked like nothing happened at all.
  const reportSpeechError = (event, onFatal) => {
    const code = event.error;
    if (code === 'not-allowed' || code === 'service-not-allowed') {
      addError('Нет доступа к микрофону. Разреши его в настройках браузера для этой страницы.');
      onFatal();
    } else if (code === 'audio-capture') {
      addError('Микрофон не найден. Подключи его и попробуй снова.');
      onFatal();
    } else if (code === 'network') {
      addError('Распознавание речи требует интернет (сервис Google). Проверь соединение.');
      onFatal();
    } else if (code === 'aborted') {
      setStatus('idle');
    }
  };
  // Web Speech defaults to the browser UI language, which is often en-US even
  // when the interview is in Russian. Without an explicit ru-RU the recognizer
  // "hears" nothing usable and the panel looks like it is not listening.
  const recLang = () => state.recLang || 'ru-RU';
  // Chrome refuses microphone access to a cross-origin iframe unless the
  // embedding page grants it, so the bookmarklet overlay cannot listen even
  // though the standalone page can. Detect it instead of failing silently.
  const micBlockedByIframe = () => {
    try {
      return !!(document.featurePolicy && !document.featurePolicy.allowsFeature('microphone'));
    } catch {
      return false;
    }
  };
  const MIC_BLOCKED_HINT = 'Chrome не даёт микрофон оверлею на чужой странице. Открой GhostFree отдельной вкладкой — там голос работает.';

  const buildRecognition = () => {
    if (!SpeechRec) return null;
    const rec = new SpeechRec();
    rec.lang = recLang();
    rec.continuous = true;
    rec.interimResults = true;

    let finalText = '';
    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else interim += chunk;
      }
      dom.input.value = (finalText + interim).trim();
      autosize();
    };
    rec.onerror = (event) => reportSpeechError(event, stopVoice);
    rec.onend = () => {
      if (state.listening) { try { rec.start(); } catch { /* already started */ } }
    };
    return rec;
  };

  const startVoice = () => {
    if (micBlockedByIframe()) { addError(MIC_BLOCKED_HINT); return; }
    if (!state.recognition) state.recognition = buildRecognition();
    if (!state.recognition) { addError('Браузер не поддерживает распознавание речи (нужен Chrome/Edge).'); return; }
    state.listening = true;
    dom.mic.classList.add('is-active');
    try { state.recognition.start(); } catch { /* ignore double start */ }
    setStatus('listening');
  };

  const stopVoice = () => {
    state.listening = false;
    dom.mic.classList.remove('is-active');
    if (state.recognition) { try { state.recognition.stop(); } catch { /* not running */ } }
    if (!state.busy) setStatus('idle');
  };

  const toggleVoice = () => (state.listening ? stopVoice() : startVoice());

  // ── Auto-answer: listen to the room, detect questions, answer them ──
  const parseTriggers = () => state.autoTriggers
    .split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

  const looksLikeQuestion = (text) => {
    const t = text.trim();
    if (t.length < 8) return false;
    if (t.includes('?')) return true;
    const low = ' ' + t.toLowerCase() + ' ';
    return parseTriggers().some((word) => word && low.includes(word));
  };

  const isEcho = (text) => {
    const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    const heard = norm(text);
    if (!heard) return true;
    const spoken = norm(state.history.filter((m) => m.role === 'assistant').slice(-3).map((m) => m.content).join(' '));
    return spoken.includes(heard);
  };

  const setAutoNote = (msg) => { dom.autoNote.textContent = msg; };

  const answerAuto = async (question) => {
    const mode = state.autoMode;
    state.autoBuffer = '';
    setAutoNote('Отвечаю…');
    if (mode === state.mode) { await ask(question); }
    else {
      const prev = state.mode;
      state.mode = mode;
      try { await ask(question); } finally { state.mode = prev; }
    }
    state.lastAuto = question;
    // Drop the answered transcript. Otherwise the next recognized phrase is
    // concatenated onto every earlier question, so each turn re-answers the
    // whole growing pile and takes longer and longer.
    state.autoCommitted = '';
    state.autoBuffer = '';
    setAutoNote('Слушаю микрофон. Когда услышу вопрос — отвечу сам.');
  };

  const handleHeard = (text) => {
    state.autoBuffer = text;
    if (!state.auto) return;
    if (state.busy || state.autoPending) return;
    if (!looksLikeQuestion(text) || isEcho(text)) return;
    const question = text.trim();
    if (question.toLowerCase() === state.lastAuto.toLowerCase()) return;
    if (state.autoConfirm) {
      state.autoPending = question;
      setAutoNote(`Услышал вопрос: «${question}» — нажми Ctrl+L, чтобы ответить.`);
      return;
    }
    answerAuto(question);
  };

  const buildAutoRecognition = () => {
    if (!SpeechRec) return null;
    const rec = new SpeechRec();
    rec.lang = recLang();
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) state.autoCommitted += ' ' + chunk;
        else interim += chunk;
      }
      const heard = (state.autoCommitted + ' ' + interim).replace(/\s+/g, ' ').trim();
      dom.autoHeard.hidden = false;
      dom.autoHeard.textContent = heard ? '👂 ' + heard : '';
      handleHeard(heard);
      // Cap the carried-over transcript so a long interview cannot grow it
      // without bound; the boundary is not mid-question because it only trims
      // after a question has already been answered.
      if (state.autoCommitted.length > 600) state.autoCommitted = state.autoCommitted.slice(-300);
    };
    rec.onerror = (event) => {
      if (event.error === 'no-speech') {
        setAutoNote('Тишина в эфире. Слушаю дальше.');
        return;
      }
      reportSpeechError(event, stopAuto);
    };
    rec.onend = () => { if (state.auto) { try { rec.start(); } catch { /* already started */ } } };
    return rec;
  };

  const startAuto = () => {
    if (micBlockedByIframe()) { addError(MIC_BLOCKED_HINT); return; }
    if (!state.autoRec) state.autoRec = buildAutoRecognition();
    if (!state.autoRec) { addError('Браузер не поддерживает распознавание речи (нужен Chrome/Edge).'); return; }
    state.auto = true;
    state.autoBuffer = '';
    state.autoCommitted = '';
    dom.auto.hidden = false;
    dom.auto.classList.add('is-active');
    dom.auto.setAttribute('aria-pressed', 'true');
    dom.autoPanel.hidden = false;
    dom.autoHeard.hidden = false;
    dom.autoHeard.textContent = '';
    try { state.autoRec.start(); } catch { /* ignore double start */ }
    setAutoNote('Слушаю микрофон. Когда услышу вопрос — отвечу сам.');
    setStatus('listening');
  };

  const stopAuto = () => {
    state.auto = false;
    state.autoPending = null;
    dom.auto.classList.remove('is-active');
    dom.auto.setAttribute('aria-pressed', 'false');
    if (state.autoRec) { try { state.autoRec.stop(); } catch { /* not running */ } }
    setAutoNote('Авто-ответ выключен.');
    if (!state.busy && !state.listening) setStatus('idle');
  };

  const toggleAuto = () => (state.auto ? stopAuto() : startAuto());

  // ── Modes ──────────────────────────────────────────────────────
  const buildModes = () => {
    dom.modes.replaceChildren();
    const modes = (state.config && state.config.modes) || [];
    if (!modes.some((m) => m.id === state.mode)) state.mode = (state.config && state.config.default_mode) || 'answer';
    for (const mode of modes) {
      const btn = el('button', 'mode', mode.label);
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.title = mode.hint || '';
      btn.dataset.id = mode.id;
      btn.setAttribute('aria-selected', String(mode.id === state.mode));
      btn.addEventListener('click', () => {
        state.mode = mode.id;
        saveStore({ mode: mode.id });
        for (const b of dom.modes.children) b.setAttribute('aria-selected', String(b.dataset.id === mode.id));
        dom.input.focus();
      });
      dom.modes.append(btn);
    }
  };
  // ── Visibility, collapse, drag ─────────────────────────────────
  const setHidden = (hidden) => {
    state.hidden = hidden;
    dom.root.dataset.hidden = String(hidden);
    dom.peek.hidden = !hidden;
    saveStore({ hidden: false }); // never persist hidden state across reloads
    // When embedded by the bookmarklet, ask the host page to tear us down.
    if (hidden && EMBED && window.parent !== window) {
      window.parent.postMessage({ type: 'ghostfree:close' }, '*');
    }
  };

  const toggleHidden = () => setHidden(!state.hidden);

  const setCollapsed = (collapsed) => {
    state.collapsed = collapsed;
    dom.root.dataset.collapsed = String(collapsed);
    dom.collapse.textContent = collapsed ? '+' : '–';
    if (!collapsed) { dom.input.focus(); scrollDown(true); }
  };

  // Allow the panel to be pushed mostly off-screen so it does not cover the
  // interview page, but never let the header grip leave the viewport — a panel
  // dragged fully away can never be grabbed back.
  const KEEP_GRIP = 72;
  const clampToViewport = () => {
    const view = dom.root.ownerDocument.defaultView || window;
    const width = dom.root.offsetWidth;
    const left = Math.min(
      Math.max(parseFloat(dom.root.style.left) || 0, KEEP_GRIP - width),
      view.innerWidth - KEEP_GRIP,
    );
    const top = Math.min(Math.max(parseFloat(dom.root.style.top) || 0, 4), view.innerHeight - 44);
    dom.root.style.left = `${left}px`;
    dom.root.style.top = `${top}px`;
    dom.root.style.right = 'auto';
  };

  const resetPosition = () => {
    dom.root.style.left = '';
    dom.root.style.top = '';
    dom.root.style.right = '';
    saveStore({ pos: null });
  };

  const makeDraggable = () => {
    if (dragWired) return;
    dragWired = true;
    let startX = 0, startY = 0, originLeft = 0, originTop = 0, dragging = false;

    const onMove = (event) => {
      if (!dragging) return;
      const point = event.touches ? event.touches[0] : event;
      const width = dom.root.offsetWidth;
      const left = Math.min(Math.max(originLeft + point.clientX - startX, KEEP_GRIP - width), innerWidth - KEEP_GRIP);
      const top = Math.min(Math.max(originTop + point.clientY - startY, 4), innerHeight - 44);
      dom.root.style.left = `${left}px`;
      dom.root.style.top = `${top}px`;
      dom.root.style.right = 'auto';
    };
    const onUp = () => {
      dragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      clampToViewport();
      saveStore({ pos: { left: dom.root.style.left, top: dom.root.style.top } });
    };
    const onDown = (event) => {
      if (event.target.closest('button')) return;
      const rect = dom.root.getBoundingClientRect();
      const point = event.touches ? event.touches[0] : event;
      dragging = true;
      startX = point.clientX; startY = point.clientY;
      originLeft = rect.left; originTop = rect.top;
      const moveTarget = dom.root.ownerDocument;
      moveTarget.addEventListener('mousemove', onMove);
      moveTarget.addEventListener('mouseup', onUp);
      moveTarget.addEventListener('touchmove', onMove, { passive: true });
      moveTarget.addEventListener('touchend', onUp);
      event.preventDefault();
    };

    dom.dragbar.addEventListener('mousedown', onDown);
    dom.dragbar.addEventListener('touchstart', onDown, { passive: false });
    dom.dragbar.addEventListener('dblclick', (event) => {
      if (event.target.closest('button')) return;
      resetPosition();
    });
  };
  // ── Composer & shortcuts ───────────────────────────────────────
  function autosize() {
    dom.input.style.height = 'auto';
    dom.input.style.height = `${Math.min(dom.input.scrollHeight, 160)}px`;
  }

  const onKey = (event) => {
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === 'h') { event.preventDefault(); toggleHidden(); return; }
    if (mod && event.key.toLowerCase() === 'b') { event.preventDefault(); setCollapsed(!state.collapsed); return; }
    if (mod && event.key.toLowerCase() === 'm') { event.preventDefault(); toggleVoice(); return; }
    if (mod && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      if (state.autoPending) { const q = state.autoPending; state.autoPending = null; answerAuto(q); }
      else toggleAuto();
      return;
    }
    if (event.key === 'Escape') {
      if (state.autoPending) { state.autoPending = null; state.autoCommitted = ''; setAutoNote('Ок, пропустил.'); }
      else if (state.busy) stop();
      else if (state.listening) stopVoice();
      else if (state.auto) stopAuto();
      else if (state.hidden) setHidden(false);
      else setCollapsed(true);
    }
  };

  const buildAutoControls = () => {
    const modes = (state.config && state.config.modes) || [];
    dom.autoMode.replaceChildren();
    for (const mode of modes) {
      const opt = el('option', null, mode.label);
      opt.value = mode.id;
      opt.title = mode.hint || '';
      dom.autoMode.append(opt);
    }
    if (modes.some((m) => m.id === state.autoMode)) dom.autoMode.value = state.autoMode;
    else state.autoMode = (state.config && state.config.default_mode) || 'answer';
    dom.autoConfirm.checked = state.autoConfirm;
    dom.autoTriggers.value = state.autoTriggers;
    dom.autoLang.value = state.recLang;
  };

  const wire = () => {
    dom.form.addEventListener('submit', (event) => { event.preventDefault(); ask(); });
    dom.input.addEventListener('input', autosize);
    dom.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        ask();
      }
    });
    dom.mic.addEventListener('click', toggleVoice);
    dom.auto.addEventListener('click', toggleAuto);
    dom.autoMode.addEventListener('change', () => {
      state.autoMode = dom.autoMode.value;
      saveStore({ autoMode: state.autoMode });
    });
    dom.autoConfirm.addEventListener('change', () => {
      state.autoConfirm = dom.autoConfirm.checked;
      state.autoPending = null;
      saveStore({ autoConfirm: state.autoConfirm });
    });
    dom.autoTriggers.addEventListener('input', () => {
      state.autoTriggers = dom.autoTriggers.value;
      saveStore({ autoTriggers: state.autoTriggers });
    });
    dom.autoLang.addEventListener('input', () => {
      state.recLang = dom.autoLang.value.trim() || 'ru-RU';
      saveStore({ recLang: state.recLang });
      // Rebuild so a running recognizer picks the new language immediately.
      if (state.autoRec) { try { state.autoRec.stop(); } catch { /* not running */ } state.autoRec = null; if (state.auto) { try { state.autoRec = buildAutoRecognition(); state.autoRec.start(); } catch { /* retry on next toggle */ } } }
      if (state.recognition) { try { state.recognition.stop(); } catch { /* not running */ } state.recognition = null; if (state.listening) startVoice(); }
    });
    dom.collapse.addEventListener('click', () => setCollapsed(!state.collapsed));
    dom.float.addEventListener('click', toggleFloat);
    dom.hide.addEventListener('click', () => setHidden(true));
    dom.peek.addEventListener('click', () => setHidden(false));
    dom.context.addEventListener('input', () => {
      state.context = dom.context.value;
      saveStore({ context: state.context });
    });
    document.addEventListener('keydown', onKey);
    window.addEventListener('blur', () => { if (state.listening) stopVoice(); });
  };

  // ── Floating window ────────────────────────────────────────────
  // Move the live panel into a separate always-on-top window. Because it is a
  // top-level document, speech recognition and the microphone prompt behave as
  // on the normal page — unlike the bookmarklet's cross-origin iframe.
  const openFloat = async () => {
    if (pipWin) { pipWin.focus(); return; }
    if (!canFloat()) {
      addError('Окно поверх вкладок требует Chrome 116+ (Document Picture-in-Picture). Открой GhostFree отдельным окном браузера и закрепи его.');
      return;
    }
    let win;
    try {
      win = await window.documentPictureInPicture.requestWindow({ width: 440, height: 640 });
    } catch {
      addError('Браузер не дал открыть окно поверх вкладок. Разреши всплывающие окна и попробуй ещё раз.');
      return;
    }
    pipWin = win;
    const doc = win.document;
    // The PiP document starts empty and has no styles of its own, so carry over
    // the fonts and stylesheets the panel depends on. An explicit <base> keeps
    // root-relative asset paths resolving exactly as on the original page.
    doc.title = 'GhostFree';
    const base = doc.createElement('base');
    base.href = document.baseURI;
    doc.head.append(base);
    for (const link of document.querySelectorAll('link[rel="stylesheet"], style')) {
      doc.head.append(link.cloneNode(true));
    }
    doc.documentElement.classList.add('floatwin');
    doc.documentElement.lang = 'ru';
    placeholder = document.createComment('ghostfree-float');
    dom.root.parentNode.insertBefore(placeholder, dom.root);
    doc.body.append(dom.root);
    win.addEventListener('pagehide', () => {
      pipWin = null;
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.insertBefore(dom.root, placeholder);
        placeholder.remove();
      }
      placeholder = null;
      clampToViewport();
      saveStore({ pos: { left: dom.root.style.left, top: dom.root.style.top } });
    });
    dom.input.focus();
  };

  const closeFloat = () => { if (pipWin) pipWin.close(); };

  const toggleFloat = () => (pipWin ? closeFloat() : openFloat());

  // ── Boot ───────────────────────────────────────────────────────
  const applySavedLayout = () => {
    if (saved.pos && saved.pos.left && saved.pos.top) {
      dom.root.style.left = saved.pos.left;
      dom.root.style.top = saved.pos.top;
      dom.root.style.right = 'auto';
      clampToViewport();
    }
  };

  const boot = async () => {
    dom.context.value = state.context;
    autosize();
    applySavedLayout();
    wire();
    makeDraggable();
    setHidden(false);
    setCollapsed(false);
    setStatus('idle');
    showEmpty();

    try {
      if (isStatic) {
        state.config = hosts.config;
        dom.badge.textContent = state.config.model || 'model';
      } else {
        const resp = await fetch('/api/config', {
          headers: token ? { 'X-Access-Token': token } : {},
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        state.config = await resp.json();
        dom.badge.textContent = state.config.model || 'model';
      }
    } catch (err) {
      dom.badge.textContent = 'offline';
      addError(`Не удалось загрузить конфиг: ${err.message}. Проверь, что сервер запущен.`);
    }

    buildModes();
    buildAutoControls();
    if (canFloat()) dom.float.hidden = false;
    dom.input.focus();
    probeAndPing();
  };

  // Debug hook: lets a page drive the listener without a real microphone.
  window.__ghostfree = {
    feed: (text) => { dom.autoHeard.hidden = false; dom.autoHeard.textContent = text ? '👂 ' + text : ''; handleHeard(text); },
    setAuto: (on) => {
      state.auto = !!on;
      dom.autoPanel.hidden = !on;
      dom.auto.classList.toggle('is-active', !!on);
    },
    looksLikeQuestion,
    isEcho,
    openFloat,
    closeFloat,
    isFloating: () => !!pipWin,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
