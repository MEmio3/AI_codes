/* Linked-List Playground – pure JS */

(() => {
  // DOM refs
  const d = document;
  const nodeLayer = d.getElementById('nodeLayer');
  const wireLayer = d.getElementById('wireLayer');
  const viewport = d.getElementById('viewport');
  const badgePrev = d.getElementById('badge-prev');
  const badgeCurr = d.getElementById('badge-curr');
  const badgeNext = d.getElementById('badge-next');

  const valueInput = d.getElementById('valueInput');
  const addTailBtn = d.getElementById('addTailBtn');

  const indexInput = d.getElementById('indexInput');
  const insValueInput = d.getElementById('insValueInput');
  const insertBtn = d.getElementById('insertBtn');

  const remIndexInput = d.getElementById('remIndexInput');
  const remValueInput = d.getElementById('remValueInput');
  const removeIndexBtn = d.getElementById('removeIndexBtn');
  const removeValueBtn = d.getElementById('removeValueBtn');

  const clearBtn = d.getElementById('clearBtn');
  const seedBtn = d.getElementById('seedBtn');

  const revStartBtn = d.getElementById('revStartBtn');
  const revStepBtn = d.getElementById('revStepBtn');
  const revAutoBtn = d.getElementById('revAutoBtn');
  const revResetBtn = d.getElementById('revResetBtn');
  const speedRange = d.getElementById('speedRange');

  const headVal = d.getElementById('headVal');
  const prevVal = d.getElementById('prevVal');
  const currVal = d.getElementById('currVal');
  const nextVal = d.getElementById('nextVal');
  const revStatus = d.getElementById('revStatus');

  const codeBlock = d.getElementById('codeBlock');

  // Theme
  const themeSwitch = d.getElementById('themeSwitch');
  const savedTheme = localStorage.getItem('ll-theme');
  if (savedTheme) d.documentElement.setAttribute('data-theme', savedTheme);
  themeSwitch.checked = d.documentElement.getAttribute('data-theme') === 'light';
  themeSwitch.addEventListener('change', () => {
    const mode = themeSwitch.checked ? 'light' : 'dark';
    d.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('ll-theme', mode);
    render(); // update wire colors
  });

  /* ========= Linked list data structure ========= */
  let idSeq = 1;
  const nodes = new Map(); // id -> { id, value, nextId }
  let headId = null;

  function createNode(value) {
    return { id: String(idSeq++), value: String(value), nextId: null };
  }
  function getById(id) { return id ? nodes.get(id) : null; }

  function asArray() {
    const arr = [];
    let cur = getById(headId);
    const guard = new Set();
    while (cur && !guard.has(cur.id)) {
      arr.push(cur);
      guard.add(cur.id);
      cur = getById(cur.nextId);
    }
    return arr;
  }

  function length() { return asArray().length; }

  function addTail(value) {
    const n = createNode(value);
    nodes.set(n.id, n);
    if (!headId) { headId = n.id; return n; }
    let cur = getById(headId);
    while (cur.nextId) cur = getById(cur.nextId);
    cur.nextId = n.id;
    return n;
  }

  function insertAt(index, value) {
    index = Math.max(0, Math.min(index, length()));
    const n = createNode(value);
    nodes.set(n.id, n);
    if (index === 0) { n.nextId = headId; headId = n.id; return n; }
    let prev = getByIndex(index - 1);
    n.nextId = prev.nextId;
    prev.nextId = n.id;
    return n;
  }

  function removeAt(index) {
    if (index < 0 || index >= length()) return null;
    if (index === 0) {
      const removed = getById(headId);
      headId = removed ? removed.nextId : null;
      if (removed) nodes.delete(removed.id);
      return removed;
    }
    const prev = getByIndex(index - 1);
    const target = getById(prev?.nextId);
    if (!target) return null;
    prev.nextId = target.nextId;
    nodes.delete(target.id);
    return target;
  }

  function removeByValue(value) {
    let idx = 0;
    for (const n of asArray()) {
      if (n.value === String(value)) return removeAt(idx);
      idx++;
    }
    return null;
  }

  function getByIndex(index) {
    let i = 0, cur = getById(headId);
    while (cur && i < index) { cur = getById(cur.nextId); i++; }
    return (i === index) ? cur : null;
    }

  /* ========= Rendering ========= */
  const NODE_SPACING = 150;
  const VIEWPAD_X = 40;

  function ensureNodeEl(id) {
    let el = d.querySelector(`.node[data-id="${id}"]`);
    if (!el) {
      el = d.createElement('div');
      el.className = 'node adding';
      el.dataset.id = id;
      const pill = d.createElement('div');
      pill.className = 'pill';
      pill.textContent = getById(id)?.value;
      el.appendChild(pill);
      nodeLayer.appendChild(el);
      // pop-in
      requestAnimationFrame(() => el.classList.remove('adding'));
      requestAnimationFrame(() => el.classList.add('added'));
    } else {
      el.querySelector('.pill').textContent = getById(id)?.value;
    }
    return el;
  }

  function removeNodeEl(id) {
    const el = d.querySelector(`.node[data-id="${id}"]`);
    if (el) {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 250);
    }
  }

  function positionForIndex(i) {
    const x = VIEWPAD_X + i * NODE_SPACING;
    const y = 70;
    return { x, y };
  }

  function drawWires(list) {
    // Resize svg width to content
    const width = Math.max(viewport.clientWidth, VIEWPAD_X * 2 + Math.max(0, list.length - 1) * NODE_SPACING + 120);
    wireLayer.setAttribute('width', width);
    wireLayer.setAttribute('height', viewport.clientHeight);

    // Clear previous paths
    wireLayer.querySelectorAll('path').forEach(p => p.remove());

    for (let i = 0; i < list.length - 1; i++) {
      const p1 = positionForIndex(i);
      const p2 = positionForIndex(i + 1);
      const x1 = p1.x + 110; // right edge of node
      const y1 = p1.y + 32;
      const x2 = p2.x;       // left edge of next node
      const y2 = p2.y + 32;
      const mid = (x1 + x2) / 2;
      const dpath = `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', dpath);
      path.setAttribute('marker-end', 'url(#arrow)');
      wireLayer.appendChild(path);
    }
  }

  function placeBadges(prevId, currId, nextId) {
    function place(badge, nodeId) {
      if (!nodeId) { badge.classList.remove('show'); return; }
      const list = asArray();
      const idx = list.findIndex(n => n.id === nodeId);
      if (idx === -1) { badge.classList.remove('show'); return; }
      const pos = positionForIndex(idx);
      badge.style.left = `${pos.x + 55}px`;
      badge.style.top = `${pos.y}px`;
      badge.classList.add('show');
    }
    place(badgePrev, prevId);
    place(badgeCurr, currId);
    place(badgeNext, nextId);
  }

  function render() {
    const list = asArray();

    // ensure DOM nodes exist & position them
    const seen = new Set(list.map(n => n.id));
    // remove stray DOM for deleted nodes
    nodeLayer.querySelectorAll('.node').forEach(el => {
      if (!seen.has(el.dataset.id)) removeNodeEl(el.dataset.id);
    });

    list.forEach((n, i) => {
      const el = ensureNodeEl(n.id);
      const pos = positionForIndex(i);
      el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    });

    // wires
    drawWires(list);

    // stats
    headVal.textContent = headId ?? 'null';
  }

  /* ========= Java code highlighting ========= */
  function highlightLines(...lines) {
    codeBlock.querySelectorAll('span').forEach(s => s.classList.remove('hl'));
    lines.forEach(n => {
      const el = codeBlock.querySelector(`[data-line="${n}"]`);
      if (el) el.classList.add('hl');
    });
  }

  /* ========= Reverse engine ========= */
  let rev = null; // { stage, prevId, currId, nextId, timer }

  function revResetState() {
    clearInterval(rev?.timer);
    rev = { stage: 'idle', prevId: null, currId: null, nextId: null, timer: null };
    badgePrev.classList.remove('show');
    badgeCurr.classList.remove('show');
    badgeNext.classList.remove('show');
    prevVal.textContent = 'null';
    currVal.textContent = 'null';
    nextVal.textContent = 'null';
    revStatus.textContent = 'idle';
    highlightLines(); // clear
  }

  function revStart() {
    revResetState();
    rev.stage = 'init';
    stepReverse(); // initialize
  }

  function stepReverse() {
    // Guard: empty list
    if (!headId) {
      highlightLines(2,3,10);
      revStatus.textContent = 'empty list';
      return;
    }

    switch (rev.stage) {
      case 'init': {
        rev.prevId = null;
        rev.currId = headId;
        rev.nextId = null;
        rev.stage = 'loopCheck';
        revStatus.textContent = 'initialized';
        highlightLines(2,3);
        updatePtrUI();
        placeBadges(rev.prevId, rev.currId, rev.nextId);
        break;
      }
      case 'loopCheck': {
        highlightLines(4);
        revStatus.textContent = 'loop check';
        if (!rev.currId) {
          // done
          headId = rev.prevId;
          render();
          highlightLines(10);
          revStatus.textContent = 'done';
          clearInterval(rev.timer);
          return;
        }
        rev.stage = 'step1next';
        updatePtrUI();
        placeBadges(rev.prevId, rev.currId, rev.nextId);
        break;
      }
      case 'step1next': {
        rev.nextId = getById(rev.currId)?.nextId ?? null; // next = curr.next
        highlightLines(5);
        revStatus.textContent = 'next = curr.next';
        updatePtrUI();
        placeBadges(rev.prevId, rev.currId, rev.nextId);
        breakTo('step2relink');
        break;
      }
      case 'step2relink': {
        // curr.next = prev
        const curr = getById(rev.currId);
        if (curr) curr.nextId = rev.prevId;
        render();
        highlightLines(6);
        revStatus.textContent = 'curr.next = prev (rewire)';
        updatePtrUI();
        placeBadges(rev.prevId, rev.currId, rev.nextId);
        breakTo('step3prev');
        break;
      }
      case 'step3prev': {
        // prev = curr
        rev.prevId = rev.currId;
        highlightLines(7);
        revStatus.textContent = 'prev = curr';
        updatePtrUI();
        placeBadges(rev.prevId, rev.currId, rev.nextId);
        breakTo('step4curr');
        break;
      }
      case 'step4curr': {
        // curr = next
        rev.currId = rev.nextId;
        rev.nextId = null;
        highlightLines(8);
        revStatus.textContent = 'curr = next';
        updatePtrUI();
        placeBadges(rev.prevId, rev.currId, rev.nextId);
        rev.stage = 'loopCheck';
        break;
      }
    }
  }

  function breakTo(nextStage) {
    // small helper to mark transition
    rev.stage = nextStage;
  }

  function updatePtrUI() {
    prevVal.textContent = rev.prevId ?? 'null';
    currVal.textContent = rev.currId ?? 'null';
    nextVal.textContent = rev.nextId ?? 'null';
  }

  function startAuto() {
    clearInterval(rev.timer);
    const speed = Number(speedRange.value);
    rev.timer = setInterval(() => {
      // Advance multiple micro-steps to look smooth:
      // step1next -> step2relink -> step3prev -> step4curr -> loopCheck
      if (rev.stage === 'idle') revStart();
      else stepReverse();
    }, speed);
  }

  /* ========= Wire up UI ========= */
  addTailBtn.addEventListener('click', () => {
    const v = valueInput.value.trim();
    if (!v) return;
    addTail(v);
    valueInput.value = '';
    render();
  });

  insertBtn.addEventListener('click', () => {
    const idx = Number(indexInput.value);
    const v = insValueInput.value.trim();
    if (Number.isNaN(idx) || v.length === 0) return;
    insertAt(idx, v);
    render();
  });

  removeIndexBtn.addEventListener('click', () => {
    const idx = Number(remIndexInput.value);
    if (Number.isNaN(idx)) return;
    const removed = removeAt(idx);
    if (removed) removeNodeEl(removed.id);
    render();
  });

  removeValueBtn.addEventListener('click', () => {
    const v = remValueInput.value.trim();
    if (!v) return;
    const removed = removeByValue(v);
    if (removed) removeNodeEl(removed.id);
    render();
  });

  clearBtn.addEventListener('click', () => {
    nodes.clear(); headId = null;
    nodeLayer.innerHTML = '';
    render(); revResetState();
  });

  seedBtn.addEventListener('click', () => {
    nodes.clear(); headId = null; nodeLayer.innerHTML = '';
    ['10','20','30','40','50'].forEach(addTail);
    render(); revResetState();
  });

  revStartBtn.addEventListener('click', () => revStart());
  revStepBtn.addEventListener('click', () => {
    if (!rev || rev.stage === 'idle') revStart();
    else stepReverse();
  });
  revAutoBtn.addEventListener('click', () => {
    if (!rev || rev.stage === 'idle') revStart();
    startAuto();
  });
  revResetBtn.addEventListener('click', () => {
    revResetState();
    render();
  });

  window.addEventListener('resize', render);
  viewport.addEventListener('scroll', () => {
    // keep badges roughly in place by re-placing after scroll
    if (rev) placeBadges(rev.prevId, rev.currId, rev.nextId);
  });

  // Initial
  render();
  revResetState();
})();
