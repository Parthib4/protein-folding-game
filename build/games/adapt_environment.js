(function(){
    function el(t,a={}){ const d=document.createElement(t); if(a.html) d.innerHTML=a.html; for(const k in a) if(k!=='html') d.setAttribute(k,a[k]); return d; }
    function getLevel(){ var s = document.getElementById('mini-game-level'); return s ? parseInt(s.value)||3 : 3; }
    function initAdapt(root){
        root.innerHTML='';
        var level = getLevel();
        const note = el('div',{html:'<div class="mini-game-note">Adapt to extreme environments (temperature/pH). Level ' + level + '.</div>'});
        const controls = el('div',{html:'<div style="display:flex; gap:8px; align-items:center; margin-top:8px;"><label style="color:#ccc">Temp</label><input id="env-temp" type="range" min="0" max="120" value="37" style="width:160px"/><label style="color:#ccc">pH</label><input id="env-ph" type="range" min="0" max="14" value="7" style="width:160px"/></div>'});
        const info = el('div',{html:'<div style="color:#ccc;margin-top:8px">Stability: <span id="env-stability">--</span></div>'});
        const board = el('div'); board.className='mini-game-board'; board.style.height='200px';
        root.appendChild(note); root.appendChild(controls); root.appendChild(board); root.appendChild(info);
        const temp = document.getElementById('env-temp'); const ph = document.getElementById('env-ph');
        function compute(){ const t = parseFloat(temp.value); const p = parseFloat(ph.value); // conceptual model: stability decreases away from physiological (37C, pH7)
            let score = 100 - Math.abs(t-37)*(0.5 + level*0.2) - Math.abs(p-7)*(3 + level);
            // add small influence of hydrophobic content if protein present
            try{ if(window.proteinAtoms && window.proteinAtoms.length){ const hydrophobic = ['A','V','I','L','M','F','W','Y']; let count=0; window.proteinAtoms.forEach(a=>{ if(a.resName && hydrophobic.includes((a.resName||'').charAt(0))) count++; }); const frac = Math.min(1, count / Math.max(1, window.proteinAtoms.length)); score += (frac-0.4)*20; } }catch(e){}
            score = Math.round(Math.max(0, Math.min(100, score)));
            document.getElementById('env-stability').innerText = score + '%';
            if(score > 70) showTemporaryToast && showTemporaryToast('Structure seems stable under these conditions (conceptual)');
        }
        temp.addEventListener('input', compute); ph.addEventListener('input', compute); compute();
    }
    function wire(){ const btn=document.getElementById('btn-open-adapt'); const modal=document.getElementById('mini-games-modal'); const root=document.getElementById('mini-game-root'); const title=document.getElementById('mini-game-title'); if(btn) btn.addEventListener('click', ()=>{ title.innerText='Adapt to Environment'; root.innerHTML=''; initAdapt(root); modal.style.display='block'; }); }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
