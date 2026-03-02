(function(){
    function q(sel){ return document.querySelector(sel); }
    function createEl(t, attrs={}){ const e = document.createElement(t); if(attrs.html) e.innerHTML = attrs.html; for(const k in attrs) if(k!=='html') e.setAttribute(k, attrs[k]); return e; }

    function getLevel(){ var s = document.getElementById('mini-game-level'); return s ? parseInt(s.value)||3 : 3; }

    function initDocking(root){
        root.innerHTML = '';
        var level = getLevel();
        const info = createEl('div',{html:'<div class="mini-game-note">Dock the ligand into the target pocket. Level ' + level + '. Drag to move, mousewheel to rotate.</div>'});
        const board = createEl('div'); board.className='mini-game-board'; board.style.position='relative'; board.style.height='320px';
        const canvas = createEl('canvas'); canvas.className='mini-game-canvas'; canvas.width = 560; canvas.height = 320; board.appendChild(canvas);
        const status = createEl('div',{html:'<div style="margin-top:8px;color:#ccc">Score: <span id="dock-score">0</span></div>'});
        const controls = createEl('div',{html:'<div style="display:flex; gap:8px; margin-top:8px;"><button id="btn-evaluate" class="hdr-btn">Evaluate Dock</button> <button id="btn-randomize" class="hdr-btn">Randomize Pose</button></div>'});
        root.appendChild(info); root.appendChild(board); root.appendChild(status); root.appendChild(controls);

        const ctx = canvas.getContext('2d');
        // pocket center: use protein centroid if available, otherwise center
        let pocket = {x: canvas.width/2, y: canvas.height/2};
        try {
            if (window.proteinAtoms && window.proteinAtoms.length){
                const pa = window.proteinAtoms; let cx=0,cy=0; pa.forEach(a=>{cx+=a.x; cy+=a.y;}); cx/=pa.length; cy/=pa.length; pocket.x = 40 + ((cx - Math.min(...pa.map(a=>a.x))) / (Math.max(...pa.map(a=>a.x)) - Math.min(...pa.map(a=>a.x))||1)) * (canvas.width-80); pocket.y = 20 + ((cy - Math.min(...pa.map(a=>a.y))) / (Math.max(...pa.map(a=>a.y)) - Math.min(...pa.map(a=>a.y))||1)) * (canvas.height-40);
            }
        } catch(e){ console.warn('docking: pocket calc', e); }

        // ligand representation: centroid-based
        let ligandRep = {x:80, y:canvas.height/2, angle:0, size:28};
        try {
            if (window.ligandAtoms && window.ligandAtoms.length){ const la = window.ligandAtoms; let lx=0,ly=0; la.forEach(a=>{lx+=a.x; ly+=a.y}); lx/=la.length; ly/=la.length; ligandRep.x = 40 + ((lx - Math.min(...la.map(a=>a.x))) / (Math.max(...la.map(a=>a.x)) - Math.min(...la.map(a=>a.x))||1)) * (canvas.width-160); ligandRep.y = 20 + ((ly - Math.min(...la.map(a=>a.y))) / (Math.max(...la.map(a=>a.y)) - Math.min(...la.map(a=>a.y))||1)) * (canvas.height-40); ligandRep.size = Math.min(40, 8 + Math.sqrt(la.length)); }
        } catch(e){}

        function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height); // draw pocket
            ctx.beginPath(); ctx.strokeStyle='rgba(0,170,255,0.35)'; ctx.lineWidth=2; ctx.arc(pocket.x,pocket.y,48,0,Math.PI*2); ctx.stroke(); ctx.fillStyle='rgba(0,170,255,0.04)'; ctx.fill(); ctx.fillStyle='#99d'; ctx.font='12px monospace'; ctx.fillText('Pocket', pocket.x-20, pocket.y-56);
            // ligand
            ctx.save(); ctx.translate(ligandRep.x, ligandRep.y); ctx.rotate(ligandRep.angle); ctx.fillStyle='rgba(255,200,100,0.95)'; ctx.beginPath(); ctx.rect(-ligandRep.size/1.5, -ligandRep.size/2, ligandRep.size*1.2, ligandRep.size); ctx.fill(); ctx.restore();
            // helper lines
            ctx.beginPath(); ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.moveTo(ligandRep.x, ligandRep.y); ctx.lineTo(pocket.x,pocket.y); ctx.stroke();
        }

        function computeScore(){ // simple scoring: proximity, clashes (if any protein atoms are too near), basic electrostatic complement
            let score = 0; const dx = ligandRep.x - pocket.x, dy = ligandRep.y - pocket.y; const dist = Math.sqrt(dx*dx+dy*dy);
            // proximity bonus
            score += Math.max(0, 30 - dist);
            // clashes: count protein atoms mapped near ligandRep (if protein available)
            let clashes = 0; try { if (window.proteinAtoms && window.proteinAtoms.length){ const pa = window.proteinAtoms; // map protein atoms to canvas coords approximate
                    const minX = Math.min(...pa.map(a=>a.x)), maxX = Math.max(...pa.map(a=>a.x)); const minY = Math.min(...pa.map(a=>a.y)), maxY = Math.max(...pa.map(a=>a.y));
                    pa.forEach(a=>{ const px = 40 + ((a.x - minX)/(maxX-minX||1))*(canvas.width-80); const py = 20 + ((a.y - minY)/(maxY-minY||1))*(canvas.height-40); const d = Math.hypot(px-ligandRep.x, py-ligandRep.y); if(d < ligandRep.size*0.9) clashes++; });
                }}catch(e){}
            score -= clashes * (8 + level * 2);
            // electrostatic complement: basic: if ligand has N and protein has O nearby it's good
            let electro = 0; try { if (window.ligandAtoms && window.proteinAtoms){ const la = window.ligandAtoms.slice(0,8), pa = window.proteinAtoms.slice(0,80); la.forEach(l=>{ pa.forEach(p=>{ if((l.element||'').toUpperCase()==='N' && (p.element||'').toUpperCase()==='O'){ electro += 1; } if((l.element||'').toUpperCase()==='O' && (p.element||'').toUpperCase()==='N'){ electro += 1; } }); }); } } catch(e){}
            score += electro * 4;
            return {score: Math.round(score), clashes, dist, electro};
        }

        function evaluate(){ const s = computeScore(); document.getElementById('dock-score').innerText = s.score; if(s.score > 30){ const note = createEl('div',{html:'<div style="margin-top:8px;color:#00ff88; font-weight:800">Successful pose! +' + Math.max(5, Math.round(s.score/5)) + ' score</div>'}); root.appendChild(note); try{ window.STATE && (window.STATE.score = (window.STATE.score||0) + Math.max(5, Math.round(s.score/5))); }catch(e){} }
        }

        // interactions
        let dragging=false; let dragOffset={x:0,y:0};
        canvas.addEventListener('pointerdown', (ev)=>{ const r = canvas.getBoundingClientRect(); const x = ev.clientX - r.left, y = ev.clientY - r.top; if(Math.hypot(x-ligandRep.x,y-ligandRep.y) < ligandRep.size*1.2){ dragging=true; dragOffset.x = ligandRep.x - x; dragOffset.y = ligandRep.y - y; canvas.setPointerCapture(ev.pointerId); } });
        canvas.addEventListener('pointermove', (ev)=>{ if(!dragging) return; const r = canvas.getBoundingClientRect(); const x = ev.clientX - r.left, y = ev.clientY - r.top; ligandRep.x = x + dragOffset.x; ligandRep.y = y + dragOffset.y; draw(); document.getElementById('dock-score').innerText = computeScore().score; });
        canvas.addEventListener('pointerup', (ev)=>{ dragging=false; });
        canvas.addEventListener('wheel', (ev)=>{ ev.preventDefault(); ligandRep.angle += ev.deltaY > 0 ? 0.15 : -0.15; draw(); document.getElementById('dock-score').innerText = computeScore().score; });

        document.getElementById('btn-evaluate').addEventListener('click', evaluate);
        document.getElementById('btn-randomize').addEventListener('click', ()=>{ ligandRep.x = 60 + Math.random()*(canvas.width-120); ligandRep.y = 40 + Math.random()*(canvas.height-80); ligandRep.angle = Math.random()*Math.PI*2; draw(); document.getElementById('dock-score').innerText = computeScore().score; });

        draw(); document.getElementById('dock-score').innerText = computeScore().score;
    }

    function wire(){ const btn = document.getElementById('btn-open-docking'); const modal = document.getElementById('mini-games-modal'); const root = document.getElementById('mini-game-root'); const title = document.getElementById('mini-game-title'); if(btn) btn.addEventListener('click', ()=>{ title.innerText='Docking Trainer'; root.innerHTML=''; initDocking(root); modal.style.display='block'; }); }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
