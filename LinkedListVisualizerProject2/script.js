/* Linked-List Quest — gamey singly-list visualizer with centered nodes, between-node arrows, animated insert/remove, and a fun level system. */

(() => {
  // ============== DOM
  const $ = (s)=>document.querySelector(s);
  const nodesLayer = $("#nodes");
  const wires = $("#wires");
  const viewport = $("#viewport");
  const chipHead = $("#chipHead");
  const chipNull = $("#chipNull");

  // tools
  const valInput=$("#valInput"), addTailBtn=$("#addTailBtn");
  const idxInput=$("#idxInput"), insValInput=$("#insValInput"), insertBtn=$("#insertBtn");
  const remIdxInput=$("#remIdxInput"), removeIdxBtn=$("#removeIdxBtn");
  const remValInput=$("#remValInput"), removeValBtn=$("#removeValBtn");
  const arrInput=$("#arrInput"), fromArrBtn=$("#fromArrBtn");
  const seedBtn=$("#seedBtn"), clearBtn=$("#clearBtn");
  // runner
  const stepMode=$("#stepMode"), runBtn=$("#runBtn"), stepBtn=$("#stepBtn"), autoBtn=$("#autoBtn"), resetBtn=$("#resetBtn"), speed=$("#speedRange");
  const prevOut=$("#prevOut"), currOut=$("#currOut"), nextOut=$("#nextOut"), statusOut=$("#statusOut");
  const code=$("#code");
  // game
  const playModeBtn=$("#playModeBtn"), sandboxModeBtn=$("#sandboxModeBtn"), themeBtn=$("#themeBtn");
  const levelBadge=$("#levelBadge"), levelTitle=$("#levelTitle"), levelDesc=$("#levelDesc");
  const startPreview=$("#startPreview"), targetPreview=$("#targetPreview"), movesUsed=$("#movesUsed"), movesCap=$("#movesCap");
  const star1=$("#star1"), star2=$("#star2"), star3=$("#star3");
  const startLevel=$("#startLevel"), checkLevel=$("#checkLevel"), nextLevel=$("#nextLevel"), prevLevel=$("#prevLevel");
  const gameHud=$("#gameHud");

  // ============== Theme
  themeBtn.addEventListener('click', ()=>{
    const t = document.documentElement.getAttribute('data-theme')==='light'?'dark':'light';
    document.documentElement.setAttribute('data-theme', t);
    render();
  });

  // ============== Model
  let idSeq=1; const map=new Map(); let headId=null;
  const byId=(id)=>id?map.get(id):null;
  const make=(v)=>({id:String(idSeq++),value:String(v),nextId:null});
  const toArray=()=>{const a=[],seen=new Set(); let c=byId(headId); while(c && !seen.has(c.id)){a.push(c); seen.add(c.id); c=byId(c.nextId);} return a;};
  const length=()=>toArray().length;

  function addTail(v){ const n=make(v); map.set(n.id,n); if(!headId) headId=n.id; else { let c=byId(headId); while(c.nextId) c=byId(c.nextId); c.nextId=n.id; } return n; }
  function getNode(i){ if(i<0) return null; let c=byId(headId),k=0; while(c && k<i){ c=byId(c.nextId); k++; } return k===i?c:null; }
  function indexOf(v){ let i=0,c=byId(headId); while(c){ if(c.value==v) return i; c=byId(c.nextId); i++; } return -1; }
  function insert(i,v){ i=Math.max(0,Math.min(i,length())); const n=make(v); map.set(n.id,n);
    if(i===0){ n.nextId=headId; headId=n.id; return n; }
    const p=getNode(i-1); n.nextId=p?.nextId??null; if(p) p.nextId=n.id; return n; }
  function removeAt(i){ if(i<0||i>=length()) return null;
    if(i===0){ const r=byId(headId); headId=r?.nextId??null; if(r) map.delete(r.id); return r; }
    const p=getNode(i-1); const t=p?byId(p.nextId):null; if(!t) return null; p.nextId=t.nextId; map.delete(t.id); return t; }
  function removeByValue(v){ const i=indexOf(v); return i>=0?removeAt(i):null; }
  function reverseInPlace(){ let prev=null, curr=byId(headId);
    while(curr){ const next=byId(curr.nextId); curr.nextId=prev?prev.id:null; prev=curr; curr=next; } headId=prev?prev.id:null; }
  function reverseOutOfPlace(){ const vals=toArray().map(n=>n.value).reverse(); map.clear(); headId=null; vals.forEach(addTail); }
  function rotateLeft(k){ const n=length(); if(n<=1) return; k=((k%n)+n)%n; if(k===0) return;
    const newTail=getNode(k-1), newHead=getNode(k), tail=getNode(n-1);
    if(tail) tail.nextId=headId; headId=newHead?.id??headId; if(newTail) newTail.nextId=null; }
  function rotateRight(k){ const n=length(); if(n<=1) return; k=((k%n)+n)%n; rotateLeft(n-k); }

  // ============== Render (centered + between-node arrows)
  const W=120,H=70,G=160,PAD=56; let baseX=PAD;
  const pos=(i)=>({x:baseX+i*G, y:130});
  const contentW=(len)=> len? W+(len-1)*G : W;

  function ensureNodeEl(id, idx){
    let el = nodesLayer.querySelector(`.node[data-id="${id}"]`);
    if(!el){
      el = document.createElement('div'); el.className='node adding'; el.dataset.id=id;
      const pill=document.createElement('div'); pill.className='pill'; pill.textContent = byId(id)?.value ?? '';
      el.appendChild(pill); nodesLayer.appendChild(el);
      requestAnimationFrame(()=>{ el.classList.remove('adding'); el.classList.add('added'); });
    } else {
      el.querySelector('.pill').textContent = byId(id)?.value ?? '';
    }
    const p=pos(idx); el.style.transform=`translate(${p.x}px, ${p.y}px)`; return el;
  }

  function removeNodeEl(id, burst=false){
    const el=nodesLayer.querySelector(`.node[data-id="${id}"]`); if(!el) return;
    if(burst){ const b=document.createElement('div'); b.className='burst'; el.appendChild(b); setTimeout(()=>{ el.classList.add('explode'); setTimeout(()=>el.remove(),240); },40); }
    else { el.classList.add('explode'); setTimeout(()=>el.remove(),240); }
  }

  const clearEdges=()=>wires.querySelectorAll('path').forEach(p=>p.remove());
  const edge=(x1,y1,x2,y2,cls='edge')=>{
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('class',cls); p.setAttribute('d',`M ${x1} ${y1} L ${x2} ${y2}`); p.setAttribute('marker-end','url(#arrow)');
    wires.appendChild(p); return p;
  };

  function placeChips(arr){
    const nodesW = contentW(arr.length);
    baseX = Math.max((viewport.clientWidth - nodesW)/2, PAD);

    const midY = 130 + H/2;
    const leftX = baseX - 70;
    const nullX = baseX + nodesW + 20;

    chipHead.style.left=`${leftX}px`; chipHead.style.top=`${midY-20}px`;
    chipNull.style.left=`${nullX}px`; chipNull.style.top=`${midY-20}px`;

    clearEdges();
    if(arr.length===0){
      edge(leftX+54, midY-6, nullX, midY-6, 'edge'); // HEAD -> NULL
      return;
    }
    // HEAD -> first
    const f=pos(0), l=pos(arr.length-1);
    edge(leftX+54, midY-6, f.x, f.y + H/2, 'edge');

    // list edges between nodes
    for(let i=0;i<arr.length-1;i++){
      const a=pos(i), b=pos(i+1);
      edge(a.x+W, a.y+H/2, b.x, b.y+H/2, 'edge');
    }
    // last -> NULL
    edge(l.x+W, midY-6, nullX, midY-6, 'edge');
  }

  function render(hot=null){
    const arr=toArray();
    const nodesW = contentW(arr.length);
    wires.setAttribute('width', Math.max(viewport.clientWidth, nodesW + PAD*3));
    wires.setAttribute('height', viewport.clientHeight);

    const seen=new Set(arr.map(n=>n.id));
    nodesLayer.querySelectorAll('.node').forEach(el=>{ if(!seen.has(el.dataset.id)) removeNodeEl(el.dataset.id); });
    arr.forEach((n,i)=>ensureNodeEl(n.id,i));
    placeChips(arr);

    if(hot){
      const a=arr.findIndex(n=>n.id===hot.from), b=arr.findIndex(n=>n.id===hot.to);
      if(a>=0 && b>=0){
        const p1=pos(a), p2=pos(b);
        const e=edge(p1.x+W, p1.y+H/2, p2.x, p2.y+H/2, 'edge hot');
        setTimeout(()=>e.classList.add('fade'), 450);
        setTimeout(()=>e.remove(), 720);
      }
    }
  }
  window.addEventListener('resize', render);
  viewport.addEventListener('scroll', render);

  // ============== Animations for gamey feel
  function hotBetween(idxA, idxB){
    const a=pos(idxA), b=pos(idxB);
    const e=edge(a.x+W, a.y+H/2, b.x, b.y+H/2, 'edge hot');
    setTimeout(()=>e.classList.add('fade'), 450);
    setTimeout(()=>e.remove(), 720);
  }
  function animateInsertAt(i, v){
    const before=toArray(); i=Math.max(0,Math.min(i,before.length));
    if(i>0 && i<before.length) hotBetween(i-1,i);  // split
    insert(i, v); render();
    const after=toArray();
    if(i>0) hotBetween(i-1,i);
    if(i<after.length-1) hotBetween(i,i+1);
  }
  function animateRemoveAt(i){
    const arr=toArray(); if(i<0||i>=arr.length) return;
    if(i>0) hotBetween(i-1, i); // old edge
    removeNodeEl(arr[i].id, true);
    removeAt(i); render();
    const arr2=toArray();
    if(i>0 && i<=arr2.length) hotBetween(i-1, i); // new edge
  }
  function animateRemoveValue(v){
    const i=indexOf(String(v)); if(i>=0) animateRemoveAt(i);
  }

  // ============== Tools wiring
  addTailBtn.addEventListener('click', ()=>{ const v=valInput.value.trim(); if(!v) return; addTail(v); render(); bumpMove(); });
  insertBtn.addEventListener('click', ()=>{ const i=Number(idxInput.value); const v=insValInput.value.trim(); if(Number.isNaN(i)||!v) return; animateInsertAt(i,v); bumpMove(); });
  removeIdxBtn.addEventListener('click', ()=>{ const i=Number(remIdxInput.value); if(Number.isNaN(i)) return; animateRemoveAt(i); bumpMove(); });
  removeValBtn.addEventListener('click', ()=>{ const v=remValInput.value.trim(); if(!v) return; animateRemoveValue(v); bumpMove(); });
  fromArrBtn.addEventListener('click', ()=>{ const raw=arrInput.value.trim(); const arr=raw?raw.split(',').map(s=>s.trim()).filter(Boolean):[]; map.clear(); headId=null; nodesLayer.innerHTML=''; arr.forEach(addTail); render(); bumpMove(); });
  seedBtn.addEventListener('click', ()=>{ map.clear(); headId=null; nodesLayer.innerHTML=''; ['10','20','30','40','50'].forEach(addTail); render(); resetRunner(false); });
  clearBtn.addEventListener('click', ()=>{ map.clear(); headId=null; nodesLayer.innerHTML=''; render(); resetRunner(false); });

  // ============== Runner: Reverse In-Place (teaching moment)
  const JAVA =
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
}`;
  code.innerHTML = JAVA.split('\n').map((l,i)=>`<span class="line" data-n="${i+1}">${l.replace(/</g,'&lt;')}</span>`).join('');
  const hl = (...nums)=>{ code.querySelectorAll('.line').forEach(el=>el.classList.remove('hl')); nums.forEach(n=>{ const el=code.querySelector(`.line[data-n="${n}"]`); if(el) el.classList.add('hl'); }); };

  let timer=null;
  const ctx = {stage:'idle', prev:null, curr:null, next:null};
  function resetRunner(clear=true){
    clearInterval(timer); timer=null;
    Object.assign(ctx,{stage:'idle',prev:null,curr:null,next:null});
    prevOut.textContent=currOut.textContent=nextOut.textContent='null';
    statusOut.textContent='ready'; hl();
    if(clear) render();
  }
  const updateStats=()=>{ prevOut.textContent=ctx.prev??'null'; currOut.textContent=ctx.curr??'null'; nextOut.textContent=ctx.next??'null'; };

  function stepReverse(){
    if(!headId){ statusOut.textContent='empty'; hl(1,2,8); return; }
    switch(ctx.stage){
      case 'idle':
        ctx.prev=null; ctx.curr=headId; ctx.next=null; ctx.stage='check'; statusOut.textContent='init'; hl(1,2,3); updateStats(); render(); break;
      case 'check':
        hl(3);
        if(!ctx.curr){ headId=ctx.prev; statusOut.textContent='done'; hl(8); render(); clearInterval(timer); return; }
        ctx.stage='next'; break;
      case 'next':
        ctx.next = byId(ctx.curr)?.nextId ?? null; statusOut.textContent='next = curr.next'; hl(4); updateStats(); render(); ctx.stage='rewire'; break;
      case 'rewire':
        byId(ctx.curr).nextId = ctx.prev; statusOut.textContent='curr.next = prev'; hl(5);
        render(ctx.prev?{from:ctx.curr,to:ctx.prev}:null); ctx.stage='p=curr'; break;
      case 'p=curr':
        ctx.prev = ctx.curr; statusOut.textContent='prev = curr'; hl(6); updateStats(); render(); ctx.stage='c=next'; break;
      case 'c=next':
        ctx.curr = ctx.next; ctx.next=null; statusOut.textContent='curr = next'; hl(7); updateStats(); render(); ctx.stage='check'; break;
    }
  }

  runBtn.addEventListener('click', ()=> stepMode.checked ? (resetRunner(false), stepReverse()) : (reverseInPlace(), render()));
  stepBtn.addEventListener('click', stepReverse);
  autoBtn.addEventListener('click', ()=>{ clearInterval(timer); timer=setInterval(stepReverse, Number(speed.value)); });
  resetBtn.addEventListener('click', ()=> resetRunner());

  // ============== GAME: Levels, scoring, confetti
  const levels = [
    { id:1, title:"Warm-up: build [10,20,30]", desc:"Use Add Tail to match the target.", start:[], target:['10','20','30'], cap:3 },
    { id:2, title:"Insert in the Middle", desc:"Place 99 at index 1.", start:['10','20','30'], target:['10','99','20','30'], cap:2 },
    { id:3, title:"Remove the Imposter", desc:"Remove first 5.", start:['5','7','5','9'], target:['5','7','9'], cap:2 },
    { id:4, title:"Reverse!", desc:"Reverse the entire list in place.", start:['1','2','3','4'], target:['4','3','2','1'], cap:4, must:'reverse' },
    { id:5, title:"Rotate Right k=2", desc:"Rotate right by 2.", start:['1','2','3','4','5'], target:['4','5','1','2','3'], cap:3, rotate:{dir:'right',k:2} }
  ];
  let levelIdx = 0, moveCount = 0;

  function chipPreview(container, arr){
    container.innerHTML = '';
    if(!arr.length){ container.textContent='[]'; return; }
    arr.forEach((v,i)=>{
      const n=document.createElement('span'); n.className='pnode'; n.textContent=v; container.appendChild(n);
      if(i<arr.length-1){ const a=document.createElement('span'); a.className='arrow'; a.textContent='→'; container.appendChild(a); }
    });
    const nullChip=document.createElement('span'); nullChip.className='pnode'; nullChip.textContent='NULL';
    container.appendChild(document.createTextNode(' ')); container.appendChild(nullChip);
  }

  function loadLevel(i){
    levelIdx = (i+levels.length)%levels.length;
    const L = levels[levelIdx];
    levelBadge.textContent = `L${L.id}`;
    levelTitle.textContent = L.title;
    levelDesc.textContent = L.desc;
    movesCap.textContent = L.cap;
    moveCount = 0; movesUsed.textContent = '0';
    star1.textContent='☆'; star2.textContent='☆'; star3.textContent='☆';

    // build start state
    map.clear(); headId=null; nodesLayer.innerHTML='';
    (L.start.length?L.start:[]).forEach(addTail);
    render();

    chipPreview(startPreview, L.start);
    chipPreview(targetPreview, L.target);
  }

  function bumpMove(){
    if(!gameHud.classList.contains('hide')){
      moveCount++; movesUsed.textContent=String(moveCount);
      // playful wiggle when exceeding cap
      const cap = levels[levelIdx].cap;
      if(moveCount>cap){ gameHud.classList.add('overcap'); setTimeout(()=>gameHud.classList.remove('overcap'),240); }
    }
  }

  function currentValues(){ return toArray().map(n=>n.value); }

  function winConfetti(){
    const box = $("#confetti");
    for(let i=0;i<80;i++){
      const c=document.createElement('div'); c.className='conf';
      const x = Math.random()*window.innerWidth; const y=0; const delay=Math.random()*150;
      c.style.left=`${x}px`; c.style.top=`${y}px`; c.style.background = i%3? 'var(--accent)':'var(--violet)';
      c.style.animationDelay = `${delay}ms`; box.appendChild(c);
      setTimeout(()=>c.remove(), 1200+delay);
    }
  }

  function checkWin(){
    const L = levels[levelIdx];
    const ok = JSON.stringify(currentValues()) === JSON.stringify(L.target);
    if(!ok){ statusOut.textContent='not yet — keep going!'; return; }

    // stars: based on moves vs cap
    const ratio = moveCount / L.cap;
    if(ratio<=1) { star1.textContent='★'; star2.textContent='★'; star3.textContent='★'; }
    else if(ratio<=1.5) { star1.textContent='★'; star2.textContent='★'; }
    else { star1.textContent='★'; }

    statusOut.textContent='level complete!';
    winConfetti();
  }

  // game controls
  startLevel.addEventListener('click', ()=> loadLevel(levelIdx));
  checkLevel.addEventListener('click', checkWin);
  nextLevel.addEventListener('click', ()=> { loadLevel(levelIdx+1); });
  prevLevel.addEventListener('click', ()=> { loadLevel(levelIdx-1); });

  // ============== Mode switching
  function setMode(play=true){
    if(play){ playModeBtn.classList.add('active'); sandboxModeBtn.classList.remove('active'); gameHud.classList.remove('hide'); }
    else { sandboxModeBtn.classList.add('active'); playModeBtn.classList.remove('active'); gameHud.classList.add('hide'); }
  }
  playModeBtn.addEventListener('click', ()=> setMode(true));
  sandboxModeBtn.addEventListener('click', ()=> setMode(false));

  // ============== Boot
  function boot(){
    setMode(true);
    loadLevel(0);
    // default code highlight blank
    hl();
    render();
  }
  boot();
})();
