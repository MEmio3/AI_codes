/* Linked-List Playground – Singly version with line-by-line pointer viz */

(() => {
  // ---------- DOM ----------
  const d = document;
  const nodeLayer = d.getElementById('nodeLayer');
  const wireLayer = d.getElementById('wireLayer');
  const viewport  = d.getElementById('viewport');

  const badgeHead = d.getElementById('badge-head');
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
  const seedBtn  = d.getElementById('seedBtn');
  const stepMode = d.getElementById('stepMode');

  const methodSelect = d.getElementById('methodSelect');
  const paramArea    = d.getElementById('paramArea');
  const runBtn  = d.getElementById('runBtn');
  const stepBtn = d.getElementById('stepBtn');
  const autoBtn = d.getElementById('autoBtn');
  const resetBtn = d.getElementById('resetBtn');
  const speedRange = d.getElementById('speedRange');

  const headVal = d.getElementById('headVal');
  const prevVal = d.getElementById('prevVal');
  const currVal = d.getElementById('currVal');
  const nextVal = d.getElementById('nextVal');
  const statusVal = d.getElementById('statusVal');

  const codeBlock = d.getElementById('codeBlock');
  const codeTitle = d.getElementById('codeTitle');

  // Theme
  const themeSwitch = d.getElementById('themeSwitch');
  const savedTheme = localStorage.getItem('ll-theme');
  if (savedTheme) d.documentElement.setAttribute('data-theme', savedTheme);
  themeSwitch.checked = d.documentElement.getAttribute('data-theme') === 'light';
  themeSwitch.addEventListener('change', () => {
    const mode = themeSwitch.checked ? 'light' : 'dark';
    d.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('ll-theme', mode);
    render(); // refresh colors
  });

  // ---------- List Model ----------
  let idSeq = 1;
  const nodes = new Map(); // id -> { id, value, nextId }
  let headId = null;

  function createNode(value) { return { id: String(idSeq++), value: String(value), nextId: null }; }
  const getById = (id) => (id ? nodes.get(id) : null);

  function asArray() {
    const arr = [];
    let cur = getById(headId);
    const seen = new Set();
    while (cur && !seen.has(cur.id)) { arr.push(cur); seen.add(cur.id); cur = getById(cur.nextId); }
    return arr;
  }
  const length = () => asArray().length;

  // Methods required
  function createFromArray(arr) {
    nodes.clear(); nodeLayer.innerHTML = ''; headId = null;
    arr.forEach(v => addTail(v));
    render();
  }

  function iterate(callback = () => {}) {
    let cur = getById(headId), i = 0;
    while (cur) { callback(cur, i); cur = getById(cur.nextId); i++; }
  }

  function count() { return length(); }

  function indexOf(value) {
    let idx = 0; let cur = getById(headId);
    while (cur) { if (cur.value == value) return idx; cur = getById(cur.nextId); idx++; }
    return -1;
  }

  function getNode(index) {
    if (index < 0) return null;
    let i = 0, cur = getById(headId);
    while (cur && i < index) { cur = getById(cur.nextId); i++; }
    return (i === index) ? cur : null;
  }

  function update(index, value) {
    const n = getNode(index);
    if (!n) return false;
    n.value = String(value);
    return true;
  }

  function search(value) { return indexOf(value) !== -1; }

  function addTail(value) {
    const n = createNode(value);
    nodes.set(n.id, n);
    if (!headId) { headId = n.id; return n; }
    let cur = getById(headId);
    while (cur.nextId) cur = getById(cur.nextId);
    cur.nextId = n.id;
    return n;
  }

  function insert(index, value) {
    index = Math.max(0, Math.min(index, length()));
    const n = createNode(value);
    nodes.set(n.id, n);
    if (index === 0) { n.nextId = headId; headId = n.id; return n; }
    const prev = getNode(index - 1);
    n.nextId = prev?.nextId ?? null;
    if (prev) prev.nextId = n.id;
    return n;
  }

  function removeAt(index) {
    if (index < 0 || index >= length()) return null;
    if (index === 0) { const removed = getById(headId); headId = removed?.nextId ?? null; if (removed) nodes.delete(removed.id); return removed; }
    const prev = getNode(index - 1);
    const target = prev ? getById(prev.nextId) : null;
    if (!target) return null;
    prev.nextId = target.nextId;
    nodes.delete(target.id);
    return target;
  }

  function remove(value) {
    const idx = indexOf(value);
    return removeAt(idx);
  }

  function copy() {
    const newMap = new Map();
    let newHead = null, newTail = null;
    iterate((node) => {
      const clone = { id: String(idSeq++), value: node.value, nextId: null };
      newMap.set(clone.id, clone);
      if (!newHead) { newHead = clone.id; newTail = clone; }
      else { newTail.nextId = clone.id; newTail = clone; }
    });
    // Replace current list with copy so the UI can show it
    nodes.clear();
    newMap.forEach((v, k) => nodes.set(k, v));
    headId = newHead;
    return newHead;
  }

  function reverseOutOfPlace() {
    let cur = getById(headId);
    let newHead = null;
    while (cur) {
      const clone = { id: String(idSeq++), value: cur.value, nextId: newHead };
      nodes.set(clone.id, clone);
      newHead = clone.id;
      cur = getById(cur.nextId);
    }
    // Remove old nodes: we technically duplicated; to keep it simple, rebuild cleanly:
    const values = [];
    let t = getById(headId);
    while (t) { values.push(t.value); t = getById(t.nextId); }
    nodes.clear();
    headId = null;
    values.reverse().forEach(v => addTail(v));
    return headId;
  }

  function reverseInPlace() {
    let prev = null, curr = getById(headId);
    while (curr) {
      const next = getById(curr.nextId);
      curr.nextId = prev ? prev.id : null;
      prev = curr;
      curr = next;
    }
    headId = prev ? prev.id : null;
    return headId;
  }

  function rotateLeft(k) {
    const n = length(); if (n <= 1) return headId;
    k = ((k % n) + n) % n; if (k === 0) return headId;
    const newTail = getNode(k - 1);
    const newHeadNode = getNode(k);
    // find tail
    let tail = getNode(n - 1);
    if (tail) tail.nextId = headId;
    headId = newHeadNode?.id ?? headId;
    if (newTail) newTail.nextId = null;
    return headId;
  }

  function rotateRight(k) {
    const n = length(); if (n <= 1) return headId;
    k = ((k % n) + n) % n;
    return rotateLeft(n - k);
  }

  // ---------- Rendering ----------
  const NODE_SPACING = 160;
  const VIEWPAD_X = 56;

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
      requestAnimationFrame(() => el.classList.remove('adding'));
      requestAnimationFrame(() => el.classList.add('added'));
    } else {
      el.querySelector('.pill').textContent = getById(id)?.value ?? '';
    }
    return el;
  }

  function removeNodeEl(id) {
    const el = d.querySelector(`.node[data-id="${id}"]`);
    if (el) { el.classList.add('removing'); setTimeout(() => el.remove(), 250); }
  }

  function positionForIndex(i) {
    const x = VIEWPAD_X + i * NODE_SPACING;
    const y = 90;
    return { x, y };
  }

  function pathCubic(x1, y1, x2, y2) {
    const mid = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
  }

  function drawEdge(x1, y1, x2, y2, cls = 'edge') {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('class', cls);
    p.setAttribute('d', pathCubic(x1, y1, x2, y2));
    p.setAttribute('marker-end', 'url(#arrow)');
    wireLayer.appendChild(p);
    return p;
  }

  function clearEdges() {
    wireLayer.querySelectorAll('path').forEach(p => p.remove());
  }

  function drawPointers(prevId, currId, nextId) {
    // Draw pointer arrows from badges to their nodes
    const list = asArray();
    function topOf(idx) {
      const pos = positionForIndex(idx);
      return { x: pos.x + 60, y: pos.y - 8 };
    }
    function placeBadge(badge, nodeId, cls) {
      if (!nodeId) { badge.classList.remove('show'); return null; }
      const idx = list.findIndex(n => n.id === nodeId);
      if (idx < 0) { badge.classList.remove('show'); return null; }
      const pos = positionForIndex(idx);
      badge.style.left = `${pos.x + 60}px`;
      badge.style.top = `${pos.y}px`;
      badge.classList.add('show');
      const tip = topOf(idx);
      return drawEdge(tip.x, tip.y - 20, tip.x, tip.y, `ptr ${cls}`);
    }

    const ptrs = [];
    const p1 = placeBadge(badgePrev, prevId, 'ptr-prev');
    const p2 = placeBadge(badgeCurr, currId, 'ptr-curr');
    const p3 = placeBadge(badgeNext, nextId, 'ptr-next');
    if (p1) ptrs.push(p1); if (p2) ptrs.push(p2); if (p3) ptrs.push(p3);

    // Head badge
    if (headId) {
      const idx = list.findIndex(n => n.id === headId);
      const pos = positionForIndex(Math.max(0, idx));
      badgeHead.style.left = `${VIEWPAD_X - 30}px`;
      badgeHead.style.top = `${pos.y + 14}px`;
      badgeHead.classList.add('show');
      const p = drawEdge(VIEWPAD_X - 20, pos.y + 14, pos.x, pos.y + 35, 'ptr ptr-head');
      ptrs.push(p);
    } else {
      badgeHead.classList.remove('show');
    }
    return ptrs;
  }

  function render(hotEdge = null) {
    const list = asArray();
    // Sync DOM nodes
    const seen = new Set(list.map(n => n.id));
    nodeLayer.querySelectorAll('.node').forEach(el => {
      if (!seen.has(el.dataset.id)) removeNodeEl(el.dataset.id);
    });
    list.forEach((n, i) => {
      const el = ensureNodeEl(n.id);
      const pos = positionForIndex(i);
      el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      el.classList.toggle('hot', hotEdge && (hotEdge.from === n.id || hotEdge.to === n.id));
    });

    // Edges
    clearEdges();
    // Draw next pointers as edges
    for (let i = 0; i < list.length - 1; i++) {
      const p1 = positionForIndex(i);
      const p2 = positionForIndex(i + 1);
      const edge = drawEdge(p1.x + 120, p1.y + 35, p2.x, p2.y + 35, 'edge');
      if (hotEdge && hotEdge.from === list[i].id && hotEdge.to === list[i + 1].id) edge.classList.add('hot');
    }

    // Update stats
    headVal.textContent = headId ?? 'null';
  }

  // ---------- Code Snippets (Java) ----------
  // Keep lines stable so we can highlight by number.
  const javaSnippets = {
    reverseInPlace:
`Node reverseInPlace(Node head) {
    Node prev = null;                 // 1
    Node curr = head;                 // 2
    while (curr != null) {            // 3
        Node next = curr.next;        // 4
        curr.next = prev;             // 5
        prev = curr;                  // 6
        curr = next;                  // 7
    }
    return prev;                      // 8
}`,
    iterate:
`void iterate(Node head) {
    Node curr = head;                 // 1
    int i = 0;                        // 2
    while (curr != null) {            // 3
        visit(curr, i);               // 4
        curr = curr.next;             // 5
        i++;                          // 6
    }
}`,
    search:
`int indexOf(Node head, String value) {
    Node curr = head;                 // 1
    int idx = 0;                      // 2
    while (curr != null) {            // 3
        if (curr.val.equals(value))   // 4
            return idx;               // 5
        curr = curr.next;             // 6
        idx++;                        // 7
    }
    return -1;                        // 8
}`,
    insert:
`Node insert(Node head, int index, String val) {
    if (index == 0) {                 // 1
        Node n = new Node(val);       // 2
        n.next = head;                // 3
        return n;                     // 4
    }
    Node prev = getNode(head, index-1); // 5
    Node n = new Node(val);           // 6
    n.next = prev.next;               // 7
    prev.next = n;                    // 8
    return head;                      // 9
}`,
    removeAt:
`Node removeAt(Node head, int index) {
    if (index == 0) {                 // 1
        return head.next;             // 2
    }
    Node prev = getNode(head, index-1); // 3
    Node target = prev.next;          // 4
    prev.next = target.next;          // 5
    return head;                      // 6
}`
  };

  function setCode(name) {
    codeTitle.textContent = `Java: ${name}`;
    const code = javaSnippets[name] || '// Code not shown for this method';
    const lines = code.split('\n').map((l, i) =>
      `<span class="line" data-line="${i+1}">${l.replace(/</g,'&lt;')}</span>`).join('');
    codeBlock.innerHTML = lines;
  }
  function highlightLines(...nums) {
    codeBlock.querySelectorAll('.line').forEach(s => s.classList.remove('hl'));
    nums.forEach(n => {
      const el = codeBlock.querySelector(`[data-line="${n}"]`);
      if (el) el.classList.add('hl');
    });
  }

  // ---------- Step Engine ----------
  let timer = null;
  const ctx = { prevId: null, currId: null, nextId: null, stage: 'idle', method: 'reverseInPlace' };

  function resetVizState() {
    clearInterval(timer);
    timer = null;
    ctx.prevId = ctx.currId = ctx.nextId = null;
    ctx.stage = 'idle';
    statusVal.textContent = 'idle';
    prevVal.textContent = 'null';
    currVal.textContent = 'null';
    nextVal.textContent = 'null';
    badgePrev.classList.remove('show');
    badgeCurr.classList.remove('show');
    badgeNext.classList.remove('show');
    render();
    highlightLines(); // clear
  }

  function updatePtrUI() {
    prevVal.textContent = ctx.prevId ?? 'null';
    currVal.textContent = ctx.currId ?? 'null';
    nextVal.textContent = ctx.nextId ?? 'null';
  }

  function drawAllPointers() {
    // refresh edges first, then draw ptr arrows
    render();
    drawPointers(ctx.prevId, ctx.currId, ctx.nextId);
  }

  function startAuto(stepFn) {
    clearInterval(timer);
    const speed = Number(speedRange.value);
    timer = setInterval(() => stepFn(), speed);
  }

  // --- Steppers for selected methods ---
  function step_reverseInPlace() {
    if (!headId) { statusVal.textContent = 'empty list'; highlightLines(1,2,8); return; }
    switch (ctx.stage) {
      case 'idle':
        setCode('reverseInPlace');
        ctx.method = 'reverseInPlace';
        ctx.prevId = null; ctx.currId = headId; ctx.nextId = null;
        ctx.stage = 'loopCheck';
        statusVal.textContent = 'init';
        highlightLines(1,2,3);
        updatePtrUI(); drawAllPointers();
        break;

      case 'loopCheck':
        highlightLines(3);
        statusVal.textContent = 'while check';
        if (!ctx.currId) {
          headId = ctx.prevId;
          render();
          highlightLines(8);
          statusVal.textContent = 'done';
          clearInterval(timer);
          return;
        }
        ctx.stage = 'step1';
        break;

      case 'step1': // next = curr.next
        ctx.nextId = getById(ctx.currId)?.nextId ?? null;
        highlightLines(4);
        statusVal.textContent = 'next = curr.next';
        updatePtrUI(); drawAllPointers();
        ctx.stage = 'step2';
        break;

      case 'step2': // curr.next = prev
        const curr = getById(ctx.currId);
        if (curr) curr.nextId = ctx.prevId;
        highlightLines(5);
        statusVal.textContent = 'rewire: curr.next = prev';
        // Glow the changed edge if exists
        render(ctx.prevId ? {from: ctx.currId, to: ctx.prevId} : null);
        drawAllPointers();
        ctx.stage = 'step3';
        break;

      case 'step3': // prev = curr
        ctx.prevId = ctx.currId;
        highlightLines(6);
        statusVal.textContent = 'prev = curr';
        updatePtrUI(); drawAllPointers();
        ctx.stage = 'step4';
        break;

      case 'step4': // curr = next
        ctx.currId = ctx.nextId;
        ctx.nextId = null;
        highlightLines(7);
        statusVal.textContent = 'curr = next';
        updatePtrUI(); drawAllPointers();
        ctx.stage = 'loopCheck';
        break;
    }
  }

  function step_iterate() {
    if (ctx.stage === 'idle') {
      setCode('iterate');
      ctx.method = 'iterate';
      ctx.currId = headId; ctx.prevId = null; ctx.nextId = null;
      statusVal.textContent = 'init';
      highlightLines(1,2,3);
      ctx.stage = 'loop';
      drawAllPointers(); updatePtrUI();
      return;
    }
    if (!ctx.currId) { highlightLines(3); statusVal.textContent = 'done'; return; }
    // visit
    highlightLines(4);
    statusVal.textContent = 'visit(curr)';
    const el = d.querySelector(`.node[data-id="${ctx.currId}"]`);
    if (el) { el.classList.add('hot'); setTimeout(()=>el.classList.remove('hot'), 350); }
    // move next
    setTimeout(() => {
      ctx.currId = getById(ctx.currId)?.nextId ?? null;
      highlightLines(5,6);
      statusVal.textContent = 'curr = curr.next';
      updatePtrUI(); drawAllPointers();
    }, 200);
  }

  function step_search() {
    if (ctx.stage === 'idle') {
      setCode('search');
      ctx.method = 'search';
      ctx.currId = headId; ctx.prevId = null; ctx.nextId = null;
      ctx.idx = 0;
      statusVal.textContent = 'init';
      highlightLines(1,2,3);
      ctx.stage = 'loop';
      drawAllPointers(); updatePtrUI();
      return;
    }
    const needle = (paramArea.querySelector('#param-value')?.value ?? '').trim();
    if (!needle) { statusVal.textContent = 'provide value'; return; }
    if (!ctx.currId) { highlightLines(8); statusVal.textContent = 'not found'; return; }

    const curNode = getById(ctx.currId);
    highlightLines(4);
    statusVal.textContent = `check "${curNode.value}"`;
    if (curNode.value === needle) {
      highlightLines(5);
      statusVal.textContent = `found at index ${ctx.idx}`;
      const el = d.querySelector(`.node[data-id="${ctx.currId}"]`);
      if (el) el.classList.add('hot');
      return;
    }
    setTimeout(() => {
      ctx.currId = curNode.nextId;
      ctx.idx++;
      highlightLines(6,7);
      statusVal.textContent = 'advance';
      updatePtrUI(); drawAllPointers();
    }, 200);
  }

  function step_insert() {
    const idx = Number(paramArea.querySelector('#param-index')?.value);
    const val = (paramArea.querySelector('#param-value')?.value ?? '').trim();
    if (Number.isNaN(idx) || !val) { statusVal.textContent = 'index & value required'; return; }

    if (ctx.stage === 'idle') {
      setCode('insert');
      ctx.method = 'insert';
      if (idx === 0) {
        highlightLines(1);
        statusVal.textContent = 'index == 0';
        ctx.stage = 'base';
      } else {
        ctx.walk = 0;
        ctx.targetPrev = idx - 1;
        ctx.currId = headId;
        statusVal.textContent = 'walk to prev';
        highlightLines(5);
        ctx.stage = 'walk';
        drawAllPointers(); updatePtrUI();
      }
      return;
    }

    if (ctx.stage === 'base') {
      // new head path
      const n = insert(0, val);
      render({from: n.id, to: getById(n.id)?.nextId});
      highlightLines(2,3,4);
      statusVal.textContent = 'inserted at head';
      clearInterval(timer);
      return;
    }

    if (ctx.stage === 'walk') {
      if (ctx.walk === ctx.targetPrev) {
        highlightLines(6,7,8,9);
        insert(idx, val);
        render();
        statusVal.textContent = `inserted @ ${idx}`;
        clearInterval(timer);
        return;
      }
      ctx.currId = getById(ctx.currId)?.nextId ?? null;
      ctx.walk++;
      updatePtrUI(); drawAllPointers();
    }
  }

  function step_removeAt() {
    const idx = Number(paramArea.querySelector('#param-index')?.value);
    if (Number.isNaN(idx)) { statusVal.textContent = 'index required'; return; }

    if (ctx.stage === 'idle') {
      setCode('removeAt');
      ctx.method = 'removeAt';
      if (idx === 0) {
        highlightLines(1,2);
        removeAt(0); render();
        statusVal.textContent = 'removed head';
        return;
      } else {
        ctx.walk = 0; ctx.targetPrev = idx - 1; ctx.currId = headId;
        highlightLines(3);
        statusVal.textContent = 'walk to prev';
        ctx.stage = 'walk';
        drawAllPointers(); updatePtrUI();
      }
      return;
    }

    if (ctx.stage === 'walk') {
      if (ctx.walk === ctx.targetPrev) {
        highlightLines(4,5,6);
        removeAt(idx); render();
        statusVal.textContent = `removed @ ${idx}`;
        clearInterval(timer);
        return;
      }
      ctx.currId = getById(ctx.currId)?.nextId ?? null;
      ctx.walk++;
      updatePtrUI(); drawAllPointers();
    }
  }

  // ---------- Method Runner glue ----------
  function buildParamsUI(method) {
    paramArea.innerHTML = '';
    const add = (id, ph, type='text') => {
      const el = d.createElement('input');
      el.id = id; el.className = 'input'; el.placeholder = ph; el.type = type;
      paramArea.appendChild(el);
      return el;
    };
    if (method === 'indexOf' || method === 'search' || method === 'remove') {
      add('param-value', 'value');
    } else if (method === 'getNode') {
      add('param-index', 'index', 'number');
    } else if (method === 'update') {
      add('param-index', 'index', 'number'); add('param-value', 'new value');
    } else if (method === 'insert') {
      add('param-index', 'index', 'number'); add('param-value', 'value');
    } else if (method === 'removeAt') {
      add('param-index', 'index', 'number');
    } else if (method === 'rotateLeft' || method === 'rotateRight') {
      add('param-k', 'k', 'number');
    }
  }

  function runInstant(method) {
    switch (method) {
      case 'iterate': iterate(); break;
      case 'count': statusVal.textContent = `count = ${count()}`; break;
      case 'indexOf': {
        const v = (paramArea.querySelector('#param-value')?.value ?? '').trim();
        statusVal.textContent = `indexOf("${v}") = ${indexOf(v)}`;
        break;
      }
      case 'getNode': {
        const i = Number(paramArea.querySelector('#param-index')?.value);
        const node = getNode(i);
        statusVal.textContent = node ? `getNode(${i}).id=${node.id}` : 'null';
        if (node) {
          const el = d.querySelector(`.node[data-id="${node.id}"]`);
          if (el) { el.classList.add('hot'); setTimeout(()=>el.classList.remove('hot'), 500); }
        }
        break;
      }
      case 'update': {
        const i = Number(paramArea.querySelector('#param-index')?.value);
        const v = (paramArea.querySelector('#param-value')?.value ?? '').trim();
        statusVal.textContent = update(i, v) ? 'updated' : 'index invalid';
        render();
        break;
      }
      case 'search': {
        const v = (paramArea.querySelector('#param-value')?.value ?? '').trim();
        statusVal.textContent = search(v) ? 'found' : 'not found';
        break;
      }
      case 'insert': {
        const i = Number(paramArea.querySelector('#param-index')?.value);
        const v = (paramArea.querySelector('#param-value')?.value ?? '').trim();
        insert(i, v); render();
        break;
      }
      case 'removeAt': {
        const i = Number(paramArea.querySelector('#param-index')?.value);
        removeAt(i); render();
        break;
      }
      case 'remove': {
        const v = (paramArea.querySelector('#param-value')?.value ?? '').trim();
        remove(v); render();
        break;
      }
      case 'copy': {
        copy(); render();
        statusVal.textContent = 'copied (now viewing copy)';
        break;
      }
      case 'reverseOutOfPlace': reverseOutOfPlace(); render(); break;
      case 'reverseInPlace': reverseInPlace(); render(); break;
      case 'rotateLeft': {
        const k = Number(paramArea.querySelector('#param-k')?.value);
        rotateLeft(k || 0); render(); break;
      }
      case 'rotateRight': {
        const k = Number(paramArea.querySelector('#param-k')?.value);
        rotateRight(k || 0); render(); break;
      }
    }
  }

  function doStep(method) {
    const steppers = {
      reverseInPlace: step_reverseInPlace,
      iterate: step_iterate,
      search: step_search,
      insert: step_insert,
      removeAt: step_removeAt
    };
    (steppers[method] || (() => runInstant(method)))();
  }

  // ---------- Wire up UI ----------
  // Quick controls
  addTailBtn.addEventListener('click', () => {
    const v = valueInput.value.trim(); if (!v) return;
    addTail(v); valueInput.value = ''; render();
  });
  insertBtn.addEventListener('click', () => {
    const idx = Number(indexInput.value); const v = insValueInput.value.trim();
    if (Number.isNaN(idx) || !v) return; insert(idx, v); render();
  });
  removeIndexBtn.addEventListener('click', () => {
    const idx = Number(remIndexInput.value); if (Number.isNaN(idx)) return;
    const removed = removeAt(idx); if (removed) removeNodeEl(removed.id); render();
  });
  removeValueBtn.addEventListener('click', () => {
    const v = remValueInput.value.trim(); if (!v) return;
    const removed = remove(v); if (removed) removeNodeEl(removed.id); render();
  });
  clearBtn.addEventListener('click', () => { nodes.clear(); headId = null; nodeLayer.innerHTML=''; render(); resetVizState(); });
  seedBtn.addEventListener('click', () => { nodes.clear(); headId = null; nodeLayer.innerHTML=''; ['10','20','30','40','50'].forEach(addTail); render(); resetVizState(); });
  d.getElementById('fromArrayBtn').addEventListener('click', () => {
    const raw = d.getElementById('arrayInput').value.trim();
    const arr = raw ? raw.split(',').map(s=>s.trim()).filter(Boolean) : [];
    if (arr.length) createFromArray(arr);
    resetVizState();
  });

  // Method runner
  methodSelect.addEventListener('change', () => {
    const m = methodSelect.value;
    buildParamsUI(m);
    setCode(m === 'reverseInPlace' || m === 'iterate' || m === 'search' || m === 'insert' || m === 'removeAt' ? m : 'reverseInPlace'); // default view
    resetVizState();
    statusVal.textContent = 'ready';
  });

  runBtn.addEventListener('click', () => {
    const m = methodSelect.value;
    if (stepMode.checked) {
      resetVizState(); doStep(m);
      // If method only has instant mode, we already executed above
    } else {
      runInstant(m);
    }
  });
  stepBtn.addEventListener('click', () => doStep(methodSelect.value));
  autoBtn.addEventListener('click', () => startAuto(() => doStep(methodSelect.value)));
  resetBtn.addEventListener('click', () => { resetVizState(); render(); });

  // Keep pointer positions on resize/scroll
  window.addEventListener('resize', () => { render(); drawPointers(ctx.prevId, ctx.currId, ctx.nextId); });
  viewport.addEventListener('scroll', () => { render(); drawPointers(ctx.prevId, ctx.currId, ctx.nextId); });

  // Initial boot
  setCode('reverseInPlace');
  render();
  resetVizState();
})();
