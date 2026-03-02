(function(){
    function createEl(tag, attrs={}){ const e = document.createElement(tag); for(const k in attrs) if(k==='html') e.innerHTML=attrs[k]; else e.setAttribute(k, attrs[k]); return e; }

    function makeShape(id, label, x, y, w, h, color){
        const d = createEl('div'); d.className = 'shape'; d.style.left = x+'px'; d.style.top = y+'px'; d.style.width = w+'px'; d.style.height = h+'px'; d.style.background = color; d.dataset.id = id; d.innerText = label; d.style.borderRadius = '6px'; d.style.display='flex'; d.style.alignItems='center'; d.style.justifyContent='center'; d.style.userSelect='none';
        return d;
    }

    function makeTarget(id, label, x, y, w, h){
        const t = createEl('div'); t.className = 'target'; t.style.left = x+'px'; t.style.top = y+'px'; t.style.width = w+'px'; t.style.height = h+'px'; t.dataset.id = id; t.innerText = label; t.style.borderRadius='6px'; t.style.display='flex'; t.style.alignItems='center'; t.style.justifyContent='center'; t.style.opacity='0.85'; return t;
    }

    function getLevel(){ var s = document.getElementById('mini-game-level'); return s ? parseInt(s.value)||3 : 3; }

    function initShapeMatching(root){
        root.innerHTML = '';
        var level = getLevel();
        var count = Math.min(6, 2 + level);
        var boardH = 60 + count * 90;
        const board = createEl('div'); board.className='mini-game-board'; board.style.position='relative'; board.style.height=boardH+'px';
        let infoHtml = '<div class="mini-game-note">Drag the colored shapes onto matching outlines. Level ' + level + ' (' + count + ' shapes)</div>';
        try {
            if (window.proteinAtoms && Array.isArray(window.proteinAtoms)) infoHtml += '<div style="color:#aaa; margin-top:6px;">Protein atoms: ' + window.proteinAtoms.length + '</div>';
            if (window.ligandAtoms && Array.isArray(window.ligandAtoms)) infoHtml += '<div style="color:#aaa;">Ligand atoms: ' + window.ligandAtoms.length + '</div>';
        } catch(e){}
        const info = createEl('div',{html:infoHtml});
        const scoreEl = createEl('div',{html:'<span style="color:#ccc">Matches:</span> <span id="shape-matches" class="game-success">0/' + count + '</span>'});

        var colors = ['#ffd166','#06d6a0','#118ab2','#ef476f','#8338ec','#ff6b6b'];
        var targets = [], shapes = [];
        for(var i=0;i<count;i++){ var label = String.fromCharCode(65+i); targets.push({id:label, label:label, x:260,y:20+i*90,w:80,h:80}); shapes.push({id:label, label:label, x:20,y:20+i*90,w:80,h:80,color:colors[i%colors.length]}); }
        try {
            if (window.ligandAtoms && Array.isArray(window.ligandAtoms) && window.ligandAtoms.length) {
                const atoms = window.ligandAtoms.slice(0, count);
                const minX = Math.min(...atoms.map(a=>a.x)), maxX = Math.max(...atoms.map(a=>a.x));
                const minY = Math.min(...atoms.map(a=>a.y)), maxY = Math.max(...atoms.map(a=>a.y));
                const w = Math.max(1, maxX-minX), h = Math.max(1, maxY-minY);
                shapes = atoms.map((a,i)=>({ id: String.fromCharCode(65+i), label: (a.resName||'') || String.fromCharCode(65+i), x: 20, y: 20 + i*90, w: Math.min(120, 40 + (Math.abs(a.x-minX)/w)*120), h: Math.min(120, 40 + (Math.abs(a.y-minY)/h)*120), color: colors[i%colors.length] }));
                targets = atoms.map((a,i)=>({ id: String.fromCharCode(65+i), label: (a.resName||'T'), x: 260, y: 20 + i*90, w: shapes[i].w, h: shapes[i].h }));
            }
        } catch(e) { console.warn('shape matching: failed to use ligandAtoms', e); }

        const targetEls = targets.map(t=>{ const el = makeTarget(t.id,t.label,t.x,t.y,t.w,t.h); board.appendChild(el); return el; });
        const shapeEls = shapes.map(s=>{ const el = makeShape(s.id,s.label,s.x,s.y,s.w,s.h,s.color); board.appendChild(el); return el; });

        root.appendChild(info); root.appendChild(board); root.appendChild(scoreEl);

        let matches = 0;
        var snapDist = Math.max(15, 50 - level * 8);
        function updateScore(){ const el = document.getElementById('shape-matches'); if(el) el.innerText = matches + '/' + count; }

        shapeEls.forEach(sh => {
            sh.addEventListener('pointerdown', function(ev){
                sh.setPointerCapture(ev.pointerId);
                const startX = ev.clientX; const startY = ev.clientY;
                const ox = parseFloat(sh.style.left); const oy = parseFloat(sh.style.top);
                function move(e){ const nx = ox + (e.clientX - startX); const ny = oy + (e.clientY - startY); sh.style.left = nx + 'px'; sh.style.top = ny + 'px'; }
                function up(e){
                    sh.releasePointerCapture(ev.pointerId);
                    document.removeEventListener('pointermove', move);
                    document.removeEventListener('pointerup', up);
                    const sx = parseFloat(sh.style.left), sy = parseFloat(sh.style.top);
                    const id = sh.dataset.id;
                    const target = targetEls.find(t=>t.dataset.id===id);
                    if(target){
                        const tx = parseFloat(target.style.left), ty = parseFloat(target.style.top);
                        const dx = (sx - tx), dy = (sy - ty);
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        if(dist < snapDist){
                            sh.style.left = (tx + 8) + 'px'; sh.style.top = (ty + 8) + 'px';
                            sh.style.cursor = 'default';
                            sh.draggable = false;
                            if(!sh.dataset.matched){ sh.dataset.matched = '1'; matches++; updateScore(); checkWin(); }
                        }
                    }
                }
                document.addEventListener('pointermove', move);
                document.addEventListener('pointerup', up);
            });
        });

        function checkWin(){ if(matches >= count){ var bonus = 5 + level * 5; const note = createEl('div',{html:'<div style="margin-top:8px; color:#00ff88; font-weight:800">All matched! +' + bonus + ' score</div>'}); root.appendChild(note); try { window.STATE && (window.STATE.score = (window.STATE.score||0)+bonus); } catch(e){} }
        }
    }

    function wireLauncher(){
        const modal = document.getElementById('mini-games-modal');
        const root = document.getElementById('mini-game-root');
        const title = document.getElementById('mini-game-title');
        const closeBtns = [document.getElementById('close-mini-games'), document.getElementById('mini-game-close')];
        function open(titleText, initFn){ title.innerText = titleText; if(root) initFn(root); modal.style.display = 'block'; }
        closeBtns.forEach(b=>{ if(b) b.addEventListener('click', ()=>{ modal.style.display='none'; root.innerHTML=''; }); });
        const resetBtn = document.getElementById('mini-game-reset'); if(resetBtn) resetBtn.addEventListener('click', ()=>{ root.innerHTML=''; initShapeMatching(root); });

        const btn = document.getElementById('btn-open-shape-matching'); if(btn) btn.addEventListener('click', ()=>{ open('Shape Matching', initShapeMatching); });
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireLauncher); else wireLauncher();
})();
