const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
// accept text/plain or any text body
app.use(express.text({ type: '*/*', limit: '10mb' }));
// Also accept JSON body for achievements
app.use(express.json({ limit: '1mb' }));
// Serve static files from public/ (for Vina result files, index.html, etc.)
app.use(express.static(path.join(__dirname, 'public')));

const outPath = path.join(__dirname, 'public', 'auto_ligand.pdb');

app.post('/save_ligand', (req, res) => {
  const pdb = req.body || '';
  if (!pdb || pdb.length < 10) {
    return res.status(400).json({ ok: false, message: 'Empty or too short body' });
  }

  fs.writeFile(outPath, pdb, 'utf8', (err) => {
    if (err) {
      console.error('Failed to write auto_ligand.pdb', err);
      return res.status(500).json({ ok: false, message: 'Failed to save' });
    }
    console.log('Saved auto_ligand.pdb to', outPath);
    res.json({ ok: true, path: '/auto_ligand.pdb' });
  });
});

app.post('/save_protein_pdbqt', (req, res) => {
  const pdbqt = req.body || '';
  if (!pdbqt || pdbqt.length < 10) {
    return res.status(400).json({ ok: false, message: 'Empty or too short body' });
  }
  const dest = path.join(__dirname, 'public', 'protein.pdbqt');
  fs.writeFile(dest, pdbqt, 'utf8', (err) => {
    if (err) {
      console.error('Failed to write protein.pdbqt', err);
      return res.status(500).json({ ok: false, message: 'Failed to save' });
    }
    console.log('Saved protein.pdbqt to', dest);
    res.json({ ok: true, path: '/protein.pdbqt' });
  });
});

app.post('/save_ligand_pdbqt', (req, res) => {
  const pdbqt = req.body || '';
  if (!pdbqt || pdbqt.length < 10) {
    return res.status(400).json({ ok: false, message: 'Empty or too short body' });
  }
  const dest = path.join(__dirname, 'public', 'ligand.pdbqt');
  fs.writeFile(dest, pdbqt, 'utf8', (err) => {
    if (err) {
      console.error('Failed to write ligand.pdbqt', err);
      return res.status(500).json({ ok: false, message: 'Failed to save' });
    }
    console.log('Saved ligand.pdbqt to', dest);
    res.json({ ok: true, path: '/ligand.pdbqt' });
  });
});

app.post('/save_achievement', (req, res) => {
  const data = req.body;
  if (!data) return res.status(400).json({ ok: false, message: 'No data' });
  const outFile = path.join(__dirname, 'public', 'achievements.json');
  // Read existing achievements
  fs.readFile(outFile, 'utf8', (err, raw) => {
    let arr = [];
    if (!err && raw) {
      try { arr = JSON.parse(raw); } catch(e) { arr = []; }
    }
    // Add server time and store
    const entry = Object.assign({}, data, { serverTime: new Date().toISOString() });
    arr.push(entry);
    // Keep last 100
    if (arr.length > 100) arr = arr.slice(arr.length - 100);
    fs.writeFile(outFile, JSON.stringify(arr, null, 2), 'utf8', (werr) => {
      if (werr) {
        console.error('Failed to write achievements.json', werr);
        return res.status(500).json({ ok: false, message: 'Failed to save' });
      }
      res.json({ ok: true, saved: entry });
    });
  });
});

app.post('/save_score', (req, res) => {
  const data = req.body;
  if (!data) return res.status(400).json({ ok: false, message: 'No data' });
  const outFile = path.join(__dirname, 'public', 'scores.json');
  fs.readFile(outFile, 'utf8', (err, raw) => {
    let arr = [];
    if (!err && raw) {
      try { arr = JSON.parse(raw); } catch(e) { arr = []; }
    }
    // Normalize incoming fields
    const entry = Object.assign({}, data, { serverTime: new Date().toISOString() });
    // Ensure numeric score
    if (entry.score) entry.score = Number(entry.score);
    // Normalize rank to number or null
    if (entry.rank !== undefined && entry.rank !== null) {
      const r = Number(entry.rank);
      entry.rank = Number.isFinite(r) ? r : null;
    } else {
      entry.rank = null;
    }
    // Ensure playerName and rollNumber exist
    entry.playerName = entry.playerName || '';
    entry.rollNumber = entry.rollNumber || '';

    arr.push(entry);
    // Sort descending by score (highest first)
    try { arr.sort((a,b) => (Number(b.score) || 0) - (Number(a.score) || 0)); } catch(e) {}
    // Assign ranks based on sorted position
    arr.forEach((item, idx) => { item.rank = idx + 1; });
    // Keep top 100
    if (arr.length > 100) arr = arr.slice(0, 100);
    // Update the saved entry's rank for the response
    const savedIdx = arr.indexOf(entry);
    if (savedIdx !== -1) entry.rank = savedIdx + 1;
    fs.writeFile(outFile, JSON.stringify(arr, null, 2), 'utf8', (werr) => {
      if (werr) return res.status(500).json({ ok: false, message: 'Failed to save' });
      res.json({ ok: true, saved: entry, rank: entry.rank });
    });
  });
});

// Return leaderboard scores JSON (if present)
app.get('/scores', (req, res) => {
  const outFile = path.join(__dirname, 'public', 'scores.json');
  fs.readFile(outFile, 'utf8', (err, raw) => {
    if (err || !raw) return res.json([]);
    try {
      const arr = JSON.parse(raw);
      // Ensure ranks are assigned based on sorted position
      arr.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
      arr.forEach((item, idx) => { item.rank = idx + 1; });
      return res.json(arr);
    } catch(e) { return res.json([]); }
  });
});

// Health check endpoint (required by server-config.js to mark server as healthy)
app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log('Save-server listening on port', port));
