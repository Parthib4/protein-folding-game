(function(){
    function el(t,a={}){ const d=document.createElement(t); if(a.html) d.innerHTML=a.html; for(const k in a) if(k!=='html') d.setAttribute(k,a[k]); return d; }
    function getLevel(){ var s = document.getElementById('mini-game-level'); return s ? parseInt(s.value)||3 : 3; }
    function initPredict(root){
        root.innerHTML='';
        var level = getLevel();
        var sampleCount = Math.min(20, 6 + level * 3);
        const note = el('div',{html:'<div class="mini-game-note">Predict structural consequences. Level ' + level + ' (' + sampleCount + ' atoms sampled).</div>'});
        const controls = el('div',{html:'<div style="display:flex;gap:8px;margin-top:8px;"><button id="pred-run" class="hdr-btn">Run Prediction</button> <button id="pred-reset" class="hdr-btn">Reset</button></div>'});
        const board = el('div'); board.className='mini-game-board'; board.style.height='260px'; const canvas = el('canvas'); canvas.className='mini-game-canvas'; canvas.width=560; canvas.height=260; board.appendChild(canvas);
        const out = el('div',{html:'<div style="color:#ccc;margin-top:8px">Estimated RMSD: <span id="pred-rmsd">--</span></div>'});
        root.appendChild(note); root.appendChild(controls); root.appendChild(board); root.appendChild(out);
        const ctx = canvas.getContext('2d');
        // baseline backbone
        let backbone = [];
        function seed(){ backbone = [];
            if(window.proteinAtoms && window.proteinAtoms.length){ const pa = window.proteinAtoms.slice(0,sampleCount);
                const minX=Math.min(...pa.map(a=>a.x)), maxX=Math.max(...pa.map(a=>a.x)), minY=Math.min(...pa.map(a=>a.y)), maxY=Math.max(...pa.map(a=>a.y)); const w=maxX-minX||1,h=maxY-minY||1;
                pa.forEach((a,i)=>{ backbone.push({x:40+((a.x-minX)/w)*(canvas.width-80), y:20+((a.y-minY)/h)*(canvas.height-40)}); });
            } else { for(let i=0;i<sampleCount;i++) backbone.push({x:80 + i*40, y:120 + Math.sin(i*0.8)*20}); }
        }
        function draw(b){ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.beginPath(); ctx.strokeStyle='rgba(255,200,80,0.9)'; ctx.lineWidth=3; b.forEach((p,i)=>{ if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); }); ctx.stroke(); b.forEach((p,i)=>{ ctx.beginPath(); ctx.fillStyle='#ffd166'; ctx.arc(p.x,p.y,6,0,Math.PI*2); ctx.fill(); }); }
        function predict(){ // simulate perturbations caused by mutations/conditions (randomized based on small heuristics)
            var perturbAmt = 15 + level * 8;
            const pred = backbone.map(p=>({x: p.x + (Math.random()-0.5)*perturbAmt, y: p.y + (Math.random()-0.5)*perturbAmt})); draw(pred);
            // compute RMSD-like measure
            let s=0; for(let i=0;i<backbone.length;i++){ const dx=backbone[i].x-pred[i].x, dy=backbone[i].y-pred[i].y; s+=dx*dx+dy*dy; } s = Math.sqrt(s/backbone.length); const rms = Math.round(s);
            document.getElementById('pred-rmsd').innerText = rms;
            // also set a conservative upper-bound RMSD estimate in the HUD if present
            try{
                const upper = Math.round(rms * 1.5 + 2); // conservative multiplier + offset
                const el = document.getElementById('score-rmsd-upper'); if(el) el.innerText = upper;
            }catch(e){ /* ignore */ }
        }
        document.getElementById('pred-run').addEventListener('click', predict); document.getElementById('pred-reset').addEventListener('click', ()=>{ seed(); draw(backbone); document.getElementById('pred-rmsd').innerText='--'; });
        seed(); draw(backbone);
    }
    function wire(){ const btn=document.getElementById('btn-open-predict'); const modal=document.getElementById('mini-games-modal'); const root=document.getElementById('mini-game-root'); const title=document.getElementById('mini-game-title'); if(btn) btn.addEventListener('click', ()=>{ title.innerText='Predict Structural Changes'; root.innerHTML=''; initPredict(root); modal.style.display='block'; }); }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
