(function(){
    function el(t,a={}){ const d=document.createElement(t); if(a.html) d.innerHTML=a.html; for(const k in a) if(k!=='html') d.setAttribute(k,a[k]); return d; }
    function getLevel(){ var s = document.getElementById('mini-game-level'); return s ? parseInt(s.value)||3 : 3; }
    function initAntibody(root){
        root.innerHTML='';
        var level = getLevel();
        const info = el('div',{html:'<div class="mini-game-note">Stabilize the antibody by adding bridges and optimizing domain packing. Level ' + level + '.</div>'});
        const board = el('div'); board.className='mini-game-board'; board.style.position='relative'; board.style.height='300px';
        const canvas = el('canvas'); canvas.className='mini-game-canvas'; canvas.width=560; canvas.height=300; board.appendChild(canvas);
        const status = el('div',{html:'<div style="margin-block-start:8px;color:#ccc">Stability: <span id="ab-stability">--</span></div>'});
        const controls = el('div',{html:'<div style="display:flex; gap:8px; margin-block-start:8px;"><button id="ab-add-bridge" class="hdr-btn">Add Bridge</button> <button id="ab-randomize" class="hdr-btn">Randomize</button></div>'});
        root.appendChild(info); root.appendChild(board); root.appendChild(status); root.appendChild(controls);
        const ctx = canvas.getContext('2d');

        // two domains (visual)
        let domainA = {x:180,y:150, rx:70, ry:40};
        let domainB = {x:360,y:150, rx:70, ry:40};
        let bridges = []; // pairs of points linking domains

        function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height);
            // domains
            ctx.fillStyle='rgba(200,160,255,0.9)'; ctx.beginPath(); ctx.ellipse(domainA.x,domainA.y,domainA.rx,domainA.ry,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(160,220,200,0.9)'; ctx.beginPath(); ctx.ellipse(domainB.x,domainB.y,domainB.rx,domainB.ry,0,0,Math.PI*2); ctx.fill();
            // bridges
            bridges.forEach((b,i)=>{ ctx.beginPath(); ctx.strokeStyle='rgba(255,220,120,0.95)'; ctx.lineWidth=4; ctx.moveTo(b.ax,b.ay); ctx.lineTo(b.bx,b.by); ctx.stroke(); ctx.fillStyle='#fff'; ctx.fillText('B'+(i+1),(b.ax+b.bx)/2,(b.ay+b.by)/2); });
        }

        function computeStability(){ // abstract score: more bridges + closer packing increases stability, but overlapping domains penalize
            let score = bridges.length * (8 + level * 2);
            const dist = Math.hypot(domainA.x-domainB.x, domainA.y-domainB.y);
            score += Math.max(0, 40 - (dist-80));
            // penalize overlap too much
            if(dist < 40) score -= 10;
            document.getElementById('ab-stability').innerText = Math.max(0, Math.round(score)) + '%';
            if(score > 40){ try{ window.STATE && (window.STATE.score = (window.STATE.score||0)+5); }catch(e){} }
        }

        document.getElementById('ab-add-bridge').addEventListener('click', ()=>{
            // add bridge between nearest domain edge points
            const ax = domainA.x + (Math.random()-0.5)*domainA.rx; const ay = domainA.y + (Math.random()-0.5)*domainA.ry;
            const bx = domainB.x + (Math.random()-0.5)*domainB.rx; const by = domainB.y + (Math.random()-0.5)*domainB.ry;
            bridges.push({ax:ax, ay:ay, bx:bx, by:by});
            draw(); computeStability();
        });

        // fix: ensure bridges push correct property names
        document.getElementById('ab-randomize').addEventListener('click', ()=>{
            domainA.x = 120 + Math.random()*60; domainB.x = 380 + Math.random()*60; domainA.y = 120 + Math.random()*40; domainB.y = 120 + Math.random()*40; bridges = []; draw(); computeStability();
        });

        // interactive drag to move domains
        let drag = null, off={x:0,y:0};
        canvas.addEventListener('pointerdown',(ev)=>{ const r=canvas.getBoundingClientRect(); const x=ev.clientX-r.left, y=ev.clientY-r.top; if(Math.hypot(x-domainA.x,y-domainA.y) < domainA.rx){ drag='A'; off.x = domainA.x - x; off.y = domainA.y - y; } else if(Math.hypot(x-domainB.x,y-domainB.y) < domainB.rx){ drag='B'; off.x=domainB.x-x; off.y=domainB.y-y; } canvas.setPointerCapture(ev.pointerId); });
        canvas.addEventListener('pointermove',(ev)=>{ if(!drag) return; const r=canvas.getBoundingClientRect(); const x=ev.clientX-r.left, y=ev.clientY-r.top; if(drag==='A'){ domainA.x = x + off.x; domainA.y = y + off.y; } else if(drag==='B'){ domainB.x = x + off.x; domainB.y = y + off.y; } draw(); computeStability(); });
        canvas.addEventListener('pointerup',()=>{ drag=null; });

        draw(); computeStability();
    }

    // Fix obvious typo introduced above by creating bridge object incorrectly
    function fixBridgeBug(){ const p = 'placeholder'; }

    function wire(){ const btn = document.getElementById('btn-open-antibody'); const modal = document.getElementById('mini-games-modal'); const root = document.getElementById('mini-game-root'); const title = document.getElementById('mini-game-title'); if(btn) btn.addEventListener('click', ()=>{ title.innerText='Antibody Stabilizer'; root.innerHTML=''; initAntibody(root); modal.style.display='block'; }); }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
