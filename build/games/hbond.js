(function(){
    function createEl(tag, attrs={}){ const e = document.createElement(tag); for(const k in attrs) if(k==='html') e.innerHTML=attrs[k]; else e.setAttribute(k, attrs[k]); return e; }

    function getLevel(){ var s = document.getElementById('mini-game-level'); return s ? parseInt(s.value)||3 : 3; }

    function initHbond(root){
        root.innerHTML='';
        var level = getLevel();
        var donorCount = Math.min(6, 1 + level);
        var acceptCount = Math.min(6, 1 + level);
        const info = createEl('div',{html:'<div class="mini-game-note">Place hydrogen atoms to form H-bonds between donors and acceptors. Level ' + level + ' (' + donorCount + ' donors). Aim for ~2.8 \u00c5 distance.</div>'});
        const board = createEl('div'); board.className='mini-game-board'; board.style.position='relative'; board.style.height='260px';
        const canvas = createEl('canvas'); canvas.className='mini-game-canvas'; canvas.width=520; canvas.height=260; board.appendChild(canvas);
        root.appendChild(info); root.appendChild(board);
        const ctx = canvas.getContext('2d');

        // donors and acceptors (try to seed from loaded protein if available)
        let donors = [ {x:120,y:80, name:'N-H (donor)'}, {x:160,y:180, name:'OH (donor)'} ];
        let accepts = [ {x:380,y:80, name:'O (acceptor)'}, {x:340,y:190, name:'O (acceptor)'} ];
        try {
            if (window.proteinAtoms && Array.isArray(window.proteinAtoms) && window.proteinAtoms.length) {
                // pick up to 4 donor/acceptor atoms from protein (N -> donor, O -> acceptor)
                const prot = window.proteinAtoms;
                const donorsA = prot.filter(a=> (a.element||'').toUpperCase()==='N').slice(0,donorCount);
                const accA = prot.filter(a=> (a.element||'').toUpperCase()==='O').slice(0,acceptCount);
                if (donorsA.length || accA.length) {
                    // compute bounding box for normalization
                    const all = prot;
                    const minX = Math.min(...all.map(a=>a.x)), maxX = Math.max(...all.map(a=>a.x));
                    const minY = Math.min(...all.map(a=>a.y)), maxY = Math.max(...all.map(a=>a.y));
                    const w = Math.max(1, maxX-minX), h = Math.max(1, maxY-minY);
                    donors = donorsA.map(a=>({ x: 40 + ((a.x-minX)/w)*(canvas.width-80), y: 20 + ((a.y-minY)/h)*(canvas.height-40), name: 'N donor' }));
                    accepts = accA.map(a=>({ x: 40 + ((a.x-minX)/w)*(canvas.width-80), y: 20 + ((a.y-minY)/h)*(canvas.height-40), name: 'O acceptor' }));
                }
            }
        } catch(e){ console.warn('hbond: failed to seed from protein', e); }
        const placed = [];

        function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height); donors.forEach(d=>{ ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.arc(d.x,d.y,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#000'; ctx.fillText('D', d.x, d.y+4); }); accepts.forEach(a=>{ ctx.fillStyle='#06d6a0'; ctx.beginPath(); ctx.arc(a.x,a.y,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#000'; ctx.fillText('A', a.x, a.y+4); });
            placed.forEach(p=>{ ctx.beginPath(); ctx.fillStyle='#fff'; ctx.arc(p.x,p.y,6,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#88c'; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.tx,p.ty); ctx.stroke(); });
        }

        function addPlacement(e){ const r = canvas.getBoundingClientRect(); const x = e.clientX - r.left; const y = e.clientY - r.top; // find nearest donor and acceptor
            let best = null; donors.forEach(d=>{ const dd = Math.hypot(d.x-x,d.y-y); if(!best || dd < best.d){ best={type:'donor', item:d, d:dd}; } }); accepts.forEach(a=>{ const dd = Math.hypot(a.x-x,a.y-y); if(!best || dd < best.d){ best={type:'acceptor', item:a, d:dd}; } });
            // pick donor and nearest acceptor to make a bond
            if(best){ const donor = donors[0]; const acc = accepts.reduce((p,c)=> (Math.hypot(c.x-donor.x,c.y-donor.y) < Math.hypot(p.x-donor.x,p.y-donor.y))?c:p ); const dist = Math.hypot(donor.x-acc.x, donor.y-acc.y);
                placed.push({x: donor.x + (acc.x-donor.x)/2, y: donor.y + (acc.y-donor.y)/2, tx: acc.x, ty: acc.y, score: Math.max(0, Math.round(100 - Math.abs(dist-80)))});
            }
            draw(); checkAnswer();
        }

        function checkAnswer(){ let good = 0; placed.forEach(p=>{ if(p.score > 60) good++; }); if(good >= 1){ const s = createEl('div',{html:'<div style="margin-top:8px; color:#00ff88; font-weight:800">Good H-bond placed! +5 score</div>'}); root.appendChild(s); try{ window.STATE && (window.STATE.score = (window.STATE.score||0)+5); }catch(e){} }
        }

        canvas.addEventListener('click', addPlacement);
        draw();
    }

    function wire(){ const btn = document.getElementById('btn-open-hbond'); const modal = document.getElementById('mini-games-modal'); const root = document.getElementById('mini-game-root'); const title = document.getElementById('mini-game-title'); if(btn) btn.addEventListener('click', ()=>{ title.innerText='H-Bond Placement'; root.innerHTML=''; initHbond(root); modal.style.display='block'; }); }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
