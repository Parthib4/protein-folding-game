(function(){
    function el(t, attrs={}){ const d=document.createElement(t); if(attrs.html) d.innerHTML=attrs.html; for(const k in attrs) if(k!=='html') d.setAttribute(k, attrs[k]); return d; }

    function getLevel(){ var s = document.getElementById('mini-game-level'); return s ? parseInt(s.value)||3 : 3; }

    function initRefold(root){
        root.innerHTML='';
        var level = getLevel();
        var pointCount = Math.min(12, 4 + level * 2);
        var perturbRange = 20 + level * 10;
        const info = el('div',{html:'<div class="mini-game-note">Refold the misfolded backbone segments to match the native shape. Level ' + level + ' (' + pointCount + ' residues).</div>'});
        const board = el('div'); board.className='mini-game-board'; board.style.position='relative'; board.style.height='300px';
        const canvas = el('canvas'); canvas.className='mini-game-canvas'; canvas.width=560; canvas.height=300; board.appendChild(canvas);
        const status = el('div',{html:'<div style="margin-block-start:8px;color:#ccc">RMSD: <span id="refold-rmsd">--</span></div>'});
        const controls = el('div',{html:'<div style="display:flex; gap:8px; margin-block-start:8px;"><button id="refold-randomize" class="hdr-btn">Randomize</button> <button id="refold-reset" class="hdr-btn">Reset</button></div>'});

        root.appendChild(info); root.appendChild(board); root.appendChild(status); root.appendChild(controls);
        const ctx = canvas.getContext('2d');

        // create a simplified backbone: use up to 8 C-alpha positions if protein present
        let native = [], current = [];
        function seedFromProtein(){
            native = [];
            if(window.proteinAtoms && window.proteinAtoms.length){
                // collect residues by resSeq and take CA-like atom (use element C as proxy)
                const byRes = {};
                window.proteinAtoms.forEach(a=>{ const key = a.resSeq || (a.resName + (a.serial||'')); if(!byRes[key]) byRes[key]=[]; byRes[key].push(a); });
                const residues = Object.values(byRes).slice(0,pointCount);
                residues.forEach(res=>{ const a = res[0]; native.push({x:a.x,y:a.y}); });
            }
            if(native.length < 4){
                native = [];
                for(let i=0;i<pointCount;i++){ native.push({x: i*20 + 80, y: 80 + Math.sin(i*0.8)*24}); }
            }
            current = native.map(p=>({x: p.x + (Math.random()-0.5)*perturbRange, y: p.y + (Math.random()-0.5)*perturbRange}));
        }

        function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height);
            // draw native path (faint)
            ctx.beginPath(); ctx.strokeStyle='rgba(0,200,120,0.15)'; ctx.lineWidth=3; native.forEach((p,i)=>{ if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); }); ctx.stroke();
            // draw current path and points
            ctx.beginPath(); ctx.strokeStyle='rgba(255,200,80,0.9)'; ctx.lineWidth=3; current.forEach((p,i)=>{ if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); }); ctx.stroke();
            current.forEach((p,i)=>{ ctx.beginPath(); ctx.fillStyle='#ffd166'; ctx.arc(p.x,p.y,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#000'; ctx.fillText(i+1,p.x,p.y+4); });
        }

        // compute simple RMSD-like metric in 2D
        function computeRMSD(){ if(!native.length) return Infinity; let s=0; for(let i=0;i<native.length;i++){ const nx=native[i].x, ny=native[i].y; const cx=current[i].x, cy=current[i].y; s += (nx-cx)*(nx-cx) + (ny-cy)*(ny-cy); } s = Math.sqrt(s / native.length); return Math.round(s);
        }

        // pointer drag to move points
        let dragIndex = -1, offset={x:0,y:0};
        canvas.addEventListener('pointerdown', (ev)=>{ const r=canvas.getBoundingClientRect(); const x=ev.clientX-r.left, y=ev.clientY-r.top; current.forEach((p,i)=>{ if(Math.hypot(p.x-x,p.y-y) < 12){ dragIndex=i; offset.x=p.x-x; offset.y=p.y-y; canvas.setPointerCapture(ev.pointerId); } }); });
        canvas.addEventListener('pointermove', (ev)=>{ if(dragIndex<0) return; const r=canvas.getBoundingClientRect(); const x=ev.clientX-r.left, y=ev.clientY-r.top; current[dragIndex].x = x + offset.x; current[dragIndex].y = y + offset.y; draw(); document.getElementById('refold-rmsd').innerText = computeRMSD(); });
        canvas.addEventListener('pointerup', (ev)=>{ dragIndex=-1; });

        document.getElementById('refold-randomize').addEventListener('click', ()=>{ current = native.map(p=>({x: p.x + (Math.random()-0.5)*perturbRange, y: p.y + (Math.random()-0.5)*perturbRange})); draw(); document.getElementById('refold-rmsd').innerText = computeRMSD(); });
        document.getElementById('refold-reset').addEventListener('click', ()=>{ seedFromProtein(); draw(); document.getElementById('refold-rmsd').innerText = computeRMSD(); });

        seedFromProtein(); draw(); document.getElementById('refold-rmsd').innerText = computeRMSD();
    }

    function wire(){ const btn = document.getElementById('btn-open-refold'); const modal = document.getElementById('mini-games-modal'); const root = document.getElementById('mini-game-root'); const title = document.getElementById('mini-game-title'); if(btn) btn.addEventListener('click', ()=>{ title.innerText='Refold Puzzle'; root.innerHTML=''; initRefold(root); modal.style.display='block'; }); }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
