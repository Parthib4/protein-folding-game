(function(){
    function createEl(tag, attrs={}){ const e = document.createElement(tag); for(const k in attrs) if(k==='html') e.innerHTML=attrs[k]; else e.setAttribute(k, attrs[k]); return e; }

    function getLevel(){ var s = document.getElementById('mini-game-level'); return s ? parseInt(s.value)||3 : 3; }

    function initElectrostatic(root){
        root.innerHTML = '';
        var level = getLevel();
        const board = createEl('div'); board.className='mini-game-board'; board.style.position='relative'; board.style.height='260px';
        const info = createEl('div',{html:'<div class="mini-game-note">Place charges and observe attraction/repulsion. Level ' + level + '. Drag charges to move them.</div>'});
        const canvas = createEl('canvas'); canvas.className='mini-game-canvas'; canvas.width = 520; canvas.height = 260; board.appendChild(canvas);
        root.appendChild(info); root.appendChild(board);

        const ctx = canvas.getContext('2d');
        // If a ligand is loaded, seed charges from ligand atom elements
        const charges = [];
        try {
            if (window.ligandAtoms && Array.isArray(window.ligandAtoms) && window.ligandAtoms.length) {
                // map ligand atoms to simple charges: O -> -1, N -> +1, others small random
                const atoms = window.ligandAtoms.slice(0, 8);
                // compute bounding box in atom coordinates
                let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
                atoms.forEach(a=>{ if(a.x<minX) minX=a.x; if(a.y<minY) minY=a.y; if(a.x>maxX) maxX=a.x; if(a.y>maxY) maxY=a.y; });
                const w = Math.max(1, maxX-minX), h = Math.max(1, maxY-minY);
                atoms.forEach((a,i)=>{
                    const nx = 40 + ((a.x - minX) / w) * (canvas.width - 80);
                    const ny = 20 + ((a.y - minY) / h) * (canvas.height - 40);
                    let q = 0;
                    const el = (a.element || '').toUpperCase();
                    if (el === 'O') q = -1; else if (el === 'N') q = 1; else if (el === 'H') q = 0.2; else q = Math.random()>0.5?0.6:-0.6;
                    charges.push({x: nx, y: ny, q});
                });
            }
        } catch (e) { console.warn('Electrostatic: failed to seed from ligand', e); }
        if (!charges.length) {
            for(var ci=0;ci<1+level;ci++) charges.push({x:60+ci*100,y:80+Math.random()*100,q:ci%2===0?1:-1});
        }
        let dragging = null; let offset = {x:0,y:0};

        function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height); // field lines simple visualization: draw arrows between opposite signs
            charges.forEach(c=>{ ctx.beginPath(); ctx.fillStyle = c.q>0 ? '#ffd166' : '#ef476f'; ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth=2; ctx.arc(c.x, c.y, 14, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#000'; ctx.font='12px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(c.q>0?'+':'-', c.x, c.y); });
            // draw simple force vectors
            for(let i=0;i<charges.length;i++){
                for(let j=i+1;j<charges.length;j++){
                    const a = charges[i], b = charges[j]; const dx=b.x-a.x, dy=b.y-a.y; const d2 = dx*dx+dy*dy; const f = (a.q*b.q) / Math.max(100, d2); const mag = Math.min(40, Math.abs(f)*1200);
                    ctx.beginPath(); ctx.strokeStyle = (a.q*b.q<0) ? 'rgba(0,255,136,0.9)' : 'rgba(255,80,80,0.6)'; ctx.lineWidth=2; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    // mid arrow
                    const mx = (a.x+b.x)/2, my = (a.y+b.y)/2; ctx.beginPath(); ctx.fillStyle = (a.q*b.q<0)?'#00ff88':'#ff7070'; ctx.arc(mx, my, Math.min(6,2+mag/12), 0, Math.PI*2); ctx.fill();
                }
            }
        }

        function getChargeAt(x,y){ for(let i=0;i<charges.length;i++){ const c=charges[i]; if(Math.hypot(c.x-x,c.y-y) < 16) return {c, i}; } return null; }

        canvas.addEventListener('pointerdown', (ev)=>{ const r = canvas.getBoundingClientRect(); const x = ev.clientX - r.left; const y = ev.clientY - r.top; const hit = getChargeAt(x,y); if(hit){ dragging = hit; offset.x = hit.c.x - x; offset.y = hit.c.y - y; canvas.setPointerCapture(ev.pointerId); } });
        canvas.addEventListener('pointermove', (ev)=>{ if(!dragging) return; const r = canvas.getBoundingClientRect(); const x = ev.clientX - r.left; const y = ev.clientY - r.top; dragging.c.x = x + offset.x; dragging.c.y = y + offset.y; draw(); });
        canvas.addEventListener('pointerup', (ev)=>{ if(!dragging) return; dragging = null; });

        // simple add/remove controls
        const toolbar = createEl('div'); toolbar.className='mini-game-toolbar'; toolbar.innerHTML = '<div style="color:#ccc">Charges: <span id="charge-count">3</span></div><div><button id="add-charge" class="hdr-btn">Add +</button> <button id="flip-sign" class="hdr-btn">Flip</button></div>';
        root.appendChild(toolbar);
        document.getElementById('add-charge').addEventListener('click', ()=>{ charges.push({x:60 + Math.random()*380, y:40 + Math.random()*180, q: Math.random()>0.5?1:-1}); document.getElementById('charge-count').innerText = charges.length; draw(); });
        document.getElementById('flip-sign').addEventListener('click', ()=>{ if(charges.length) charges[charges.length-1].q *= -1; draw(); });

        draw();
    }

    function wire(){
        const btn = document.getElementById('btn-open-electrostatic'); const modal = document.getElementById('mini-games-modal'); const root = document.getElementById('mini-game-root'); const title = document.getElementById('mini-game-title');
        if(btn) btn.addEventListener('click', ()=>{ title.innerText='Electrostatics'; root.innerHTML=''; initElectrostatic(root); modal.style.display='block'; });
    }

    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
