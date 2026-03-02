(function(){
    function e(t,a={}){ const n=document.createElement(t); if(a.html) n.innerHTML=a.html; for(const k in a) if(k!=='html') n.setAttribute(k,a[k]); return n; }
    function getLevel(){ var s = document.getElementById('mini-game-level'); return s ? parseInt(s.value)||3 : 3; }
    function initMutate(root){
        root.innerHTML='';
        var level = getLevel();
        const note = e('div',{html:'<div class="mini-game-note">Mutate an amino acid and observe stability estimate. Level ' + level + '.</div>'});
        const controls = e('div',{html:'<div style="display:flex;gap:8px;margin-top:8px;"><select id="mut-res-select"></select><select id="mut-aa-select"></select><button id="mut-apply" class="hdr-btn">Apply Mutation</button></div>'});
        const board = e('div'); board.className='mini-game-board'; board.style.height='260px';
        const info = e('div',{html:'<div style="color:#ccc;margin-top:8px">Stability impact: <span id="mut-impact">--</span></div>'});
        root.appendChild(note); root.appendChild(controls); root.appendChild(board); root.appendChild(info);
        const resSel = document.getElementById('mut-res-select'); const aaSel = document.getElementById('mut-aa-select');
        const aaList = ['Ala','Arg','Asn','Asp','Cys','Glu','Gln','Gly','His','Ile','Leu','Lys','Met','Phe','Pro','Ser','Thr','Trp','Tyr','Val'];
        aaList.forEach(a=>{ const o = document.createElement('option'); o.value=a; o.innerText=a; aaSel.appendChild(o); });

        // populate residues from proteinAtoms (resSeq/resName)
        const residues = [];
        try{
            if(window.proteinAtoms && window.proteinAtoms.length){
                const byRes = {};
                window.proteinAtoms.forEach(a=>{ const key = (a.resSeq!==null && a.resSeq!==undefined)? String(a.resSeq) : (a.resName||'UNK') + (a.serial||''); if(!byRes[key]) byRes[key]={name: a.resName||key, idx:key}; });
                Object.keys(byRes).slice(0,60).forEach(k=>{ residues.push(byRes[k]); });
            }
        }catch(e){}
        if(!residues.length) residues.push({name:'Res1', idx:'1'},{name:'Res2', idx:'2'});
        residues.forEach(r=>{ const o=document.createElement('option'); o.value=r.idx; o.innerText=(r.name||r.idx)+' ('+r.idx+')'; resSel.appendChild(o); });

        function estimateImpact(from,to){ // abstract estimate: polar->nonpolar large effect, charge swap worse
            const polar = new Set(['Arg','Asn','Asp','Glu','Gln','His','Lys','Ser','Thr','Tyr']);
            const fromP = polar.has(from); const toP = polar.has(to);
            let score = 0;
            if(from === to) score = 0; else { score = (fromP === toP) ? -(3 + level) : -(10 + level * 2); }
            // add small randomization for teaching variability
            score += Math.round((Math.random()-0.4)*6);
            return score; // negative => destabilizing
        }

        document.getElementById('mut-apply').addEventListener('click', ()=>{
            const res = resSel.value; const aa = aaSel.value;
            const from = (window.proteinAtoms && window.proteinAtoms.length) ? (window.proteinAtoms.find(a=>String(a.resSeq)===String(res))||{}).resName || 'X' : 'X';
            const impact = estimateImpact(from, aa);
            const el = document.getElementById('mut-impact'); if(el) el.innerText = (impact >=0 ? '+'+impact : impact) + ' (conceptual)';
            // visual cue: flash board
            board.style.boxShadow = '0 0 18px rgba(255,200,100,0.2)'; setTimeout(()=>board.style.boxShadow='',600);
            try{ if(impact < -10) showTemporaryToast && showTemporaryToast('Mutation predicted to be destabilizing'); } catch(e){}
        });
    }
    function wire(){ const btn=document.getElementById('btn-open-mutate'); const modal=document.getElementById('mini-games-modal'); const root=document.getElementById('mini-game-root'); const title=document.getElementById('mini-game-title'); if(btn) btn.addEventListener('click', ()=>{ title.innerText='Mutate Amino Acid (Simulation)'; root.innerHTML=''; initMutate(root); modal.style.display='block'; }); }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
