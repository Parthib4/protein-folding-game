(function(){
    function el(t, attrs={}){ const d=document.createElement(t); if(attrs.html) d.innerHTML=attrs.html; for(const k in attrs) if(k!=='html') d.setAttribute(k, attrs[k]); return d; }

    function getLevel(){ var s = document.getElementById('mini-game-level'); return s ? parseInt(s.value)||3 : 3; }

    function initActiveSite(root){
        root.innerHTML='';
        var level = getLevel();
        const info = el('div',{html:'<div class="mini-game-note">Repair the enzyme active site by positioning the substrate. Level ' + level + '. Align catalytic features for best score.</div>'});
        const board = el('div'); board.className='mini-game-board'; board.style.position='relative'; board.style.height='300px';
        const canvas = el('canvas'); canvas.className='mini-game-canvas'; canvas.width=560; canvas.height=300; board.appendChild(canvas);
        const status = el('div',{html:'<div style="margin-block-start:8px;color:#ccc">Alignment: <span id="active-align">--</span></div>'});
        const controls = el('div',{html:'<div style="display:flex; gap:8px; margin-block-start:8px;"><button id="active-randomize" class="hdr-btn">Randomize Substrate</button> <button id="active-evaluate" class="hdr-btn">Evaluate</button></div>'});

        root.appendChild(info); root.appendChild(board); root.appendChild(status); root.appendChild(controls);
        const ctx = canvas.getContext('2d');

        // place two catalytic residues (try seed from protein N/O atoms)
        let catA = {x:180,y:140}, catB = {x:340,y:160};
        try{
            if(window.proteinAtoms && window.proteinAtoms.length){ const pa = window.proteinAtoms; const n = pa.find(a=>(a.element||'').toUpperCase()==='N'); const o = pa.find(a=>(a.element||'').toUpperCase()==='O'); if(n && o){ // map coords
                    const minX = Math.min(...pa.map(a=>a.x)), maxX = Math.max(...pa.map(a=>a.x)); const minY = Math.min(...pa.map(a=>a.y)), maxY = Math.max(...pa.map(a=>a.y));
                    catA.x = 40 + ((n.x - minX)/(maxX-minX||1))*(canvas.width-80); catA.y = 20 + ((n.y - minY)/(maxY-minY||1))*(canvas.height-40);
                    catB.x = 40 + ((o.x - minX)/(maxX-minX||1))*(canvas.width-80); catB.y = 20 + ((o.y - minY)/(maxY-minY||1))*(canvas.height-40);
                } }
        }catch(e){}

        let substrate = {x:120,y:80, angle:0};

        function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height);
            // catalytic residues
            ctx.beginPath(); ctx.fillStyle='#ffd166'; ctx.arc(catA.x,catA.y,10,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#000'; ctx.fillText('Cat A', catA.x-18, catA.y-18);
            ctx.beginPath(); ctx.fillStyle='#06d6a0'; ctx.arc(catB.x,catB.y,10,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#000'; ctx.fillText('Cat B', catB.x-18, catB.y-18);
            // substrate as small triangle
            ctx.save(); ctx.translate(substrate.x, substrate.y); ctx.rotate(substrate.angle); ctx.beginPath(); ctx.fillStyle='rgba(180,200,255,0.95)'; ctx.moveTo(-12,-8); ctx.lineTo(14,0); ctx.lineTo(-12,8); ctx.closePath(); ctx.fill(); ctx.restore();
            // lines to cats
            ctx.beginPath(); ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.moveTo(substrate.x, substrate.y); ctx.lineTo(catA.x,catA.y); ctx.moveTo(substrate.x, substrate.y); ctx.lineTo(catB.x,catB.y); ctx.stroke();
        }

        function evaluate(){ // simple metric: angle difference between lines and desired geometry
            const vA = {x: catA.x - substrate.x, y: catA.y - substrate.y}; const vB = {x: catB.x - substrate.x, y: catB.y - substrate.y};
            const ang = Math.abs(Math.atan2(vA.y,vA.x) - Math.atan2(vB.y,vB.x));
            const angDeg = Math.abs((ang*180/Math.PI)%180);
            var idealAngle = 100 + level * 10;
            const score = Math.max(0, 100 - Math.abs(idealAngle - angDeg));
            document.getElementById('active-align').innerText = Math.round(score) + '%';
            if(score > 60){ const note = el('div',{html:'<div style="margin-block-start:8px;color:#00ff88; font-weight:800">Good alignment! +5 score</div>'}); root.appendChild(note); try{ window.STATE && (window.STATE.score = (window.STATE.score||0)+5); }catch(e){} }
        }

        // interactions: drag substrate, wheel rotate
        let dragging=false, off={x:0,y:0};
        canvas.addEventListener('pointerdown',(ev)=>{ const r=canvas.getBoundingClientRect(); const x=ev.clientX-r.left, y=ev.clientY-r.top; if(Math.hypot(x-substrate.x,y-substrate.y)<18){ dragging=true; off.x = substrate.x - x; off.y = substrate.y - y; canvas.setPointerCapture(ev.pointerId);} });
        canvas.addEventListener('pointermove',(ev)=>{ if(!dragging) return; const r=canvas.getBoundingClientRect(); const x=ev.clientX-r.left, y=ev.clientY-r.top; substrate.x = x + off.x; substrate.y = y + off.y; draw(); });
        canvas.addEventListener('pointerup',(ev)=>{ dragging=false; });
        canvas.addEventListener('wheel',(ev)=>{ ev.preventDefault(); substrate.angle += ev.deltaY>0?0.12:-0.12; draw(); });

        document.getElementById('active-evaluate').addEventListener('click', evaluate);
        document.getElementById('active-randomize').addEventListener('click', ()=>{ substrate.x = 80 + Math.random()*(canvas.width-160); substrate.y = 60 + Math.random()*(canvas.height-120); substrate.angle = Math.random()*Math.PI*2; draw(); });

        draw();
    }

    function wire(){ const btn = document.getElementById('btn-open-active-site'); const modal = document.getElementById('mini-games-modal'); const root = document.getElementById('mini-game-root'); const title = document.getElementById('mini-game-title'); if(btn) btn.addEventListener('click', ()=>{ title.innerText='Active Site Repair'; root.innerHTML=''; initActiveSite(root); modal.style.display='block'; }); }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
