/**
 * Parse PDB text and extract Cα atoms with secondary structure assignments.
 * Secondary structure is read from HELIX / SHEET records.
 * Residues not in any helix or sheet are labeled "loop".
 * Each contiguous loop segment gets a unique loopIndex so it can be colored distinctly.
 */
export function parsePDBtoCA(pdbText) {
  const lines = pdbText.split(/\r?\n/);

  // ---- 1. Parse HELIX / SHEET records ----
  const ssRanges = []; // {type:'helix'|'sheet', chainStart, seqStart, chainEnd, seqEnd}

  for (const L of lines) {
    if (L.startsWith('HELIX')) {
      // HELIX record (PDB format):
      //  col 20    : init chain
      //  col 22-25 : init seqNum
      //  col 32    : end chain
      //  col 34-37 : end seqNum
      const chainStart = (L.substring(19, 20) || '').trim() || ' ';
      const seqStart   = parseInt((L.substring(21, 25) || '').trim()) || 0;
      const chainEnd   = (L.substring(31, 32) || '').trim() || ' ';
      const seqEnd     = parseInt((L.substring(33, 37) || '').trim()) || 0;
      ssRanges.push({ type: 'helix', chainStart, seqStart, chainEnd, seqEnd });
    }
    if (L.startsWith('SHEET')) {
      // SHEET record:
      //  col 22    : init chain
      //  col 23-26 : init seqNum
      //  col 33    : end chain
      //  col 34-37 : end seqNum
      const chainStart = (L.substring(21, 22) || '').trim() || ' ';
      const seqStart   = parseInt((L.substring(22, 26) || '').trim()) || 0;
      const chainEnd   = (L.substring(32, 33) || '').trim() || ' ';
      const seqEnd     = parseInt((L.substring(33, 37) || '').trim()) || 0;
      ssRanges.push({ type: 'sheet', chainStart, seqStart, chainEnd, seqEnd });
    }
  }

  // helper: is a given (chain, resSeq) inside a helix or sheet?
  function getSSType(chain, resSeq) {
    for (const r of ssRanges) {
      if (chain === r.chainStart && resSeq >= r.seqStart && resSeq <= r.seqEnd) {
        return r.type; // 'helix' or 'sheet'
      }
    }
    return 'loop';
  }

  // ---- 2. Parse ATOM records (Cα only) ----
  const byRes = {};
  const coords = [];

  for (const L of lines) {
    if (!L) continue;
    if (L.startsWith('ATOM') || L.startsWith('HETATM')) {
      const atomName = (L.substring(12, 16) || '').trim();
      if (atomName !== 'CA') continue;

      const resname  = (L.substring(17, 20) || '').trim();
      const chain    = (L.substring(21, 22) || '').trim() || ' ';
      const resSeqStr = (L.substring(22, 26) || '').trim();
      const resSeq   = resSeqStr ? parseInt(resSeqStr) : null;

      const x = parseFloat(L.substring(30, 38));
      const y = parseFloat(L.substring(38, 46));
      const z = parseFloat(L.substring(46, 54));

      const key = `${chain}_${resSeq}`;
      if (!(key in byRes)) {
        byRes[key] = true;
        const ss = getSSType(chain, resSeq);
        coords.push({ x, y, z, chain, resSeq, resname, ss });
      }
    }
  }

  // ---- 3. Assign loop indices: each contiguous run of 'loop' gets a unique id ----
  let loopIdx = 0;
  let prevSS = null;
  for (let i = 0; i < coords.length; i++) {
    if (coords[i].ss === 'loop') {
      if (prevSS !== 'loop') loopIdx++;
      coords[i].loopIndex = loopIdx;
    } else {
      coords[i].loopIndex = -1;
    }
    prevSS = coords[i].ss;
  }

  // also assign helixIndex and sheetIndex for distinct coloring
  let helixIdx = 0;
  prevSS = null;
  for (let i = 0; i < coords.length; i++) {
    if (coords[i].ss === 'helix') {
      if (prevSS !== 'helix') helixIdx++;
      coords[i].helixIndex = helixIdx;
    } else {
      coords[i].helixIndex = -1;
    }
    prevSS = coords[i].ss;
  }

  let sheetIdx = 0;
  prevSS = null;
  for (let i = 0; i < coords.length; i++) {
    if (coords[i].ss === 'sheet') {
      if (prevSS !== 'sheet') sheetIdx++;
      coords[i].sheetIndex = sheetIdx;
    } else {
      coords[i].sheetIndex = -1;
    }
    prevSS = coords[i].ss;
  }

  return coords;
}


/**
 * Parse PDB text and extract HETATM ligand atoms (non-water).
 * Returns array of {x, y, z, element, resname, chain, resSeq}
 */
export function parsePDBLigand(pdbText) {
  const lines = pdbText.split(/\r?\n/);
  const atoms = [];

  for (const L of lines) {
    if (!L) continue;
    if (L.startsWith('HETATM')) {
      const resname = (L.substring(17, 20) || '').trim();
      // skip water - HOH, WAT, DOD, H2O, TIP3, TIP4, TIP5, etc.
      if (resname === 'HOH' || resname === 'WAT' || resname === 'DOD' || resname === 'H2O' || resname === 'TIP3' || resname === 'TIP4' || resname === 'TIP5') continue;

      const atomName = (L.substring(12, 16) || '').trim();
      const chain    = (L.substring(21, 22) || '').trim() || ' ';
      const resSeqStr = (L.substring(22, 26) || '').trim();
      const resSeq   = resSeqStr ? parseInt(resSeqStr) : null;
      const element  = (L.substring(76, 78) || '').trim() || atomName.charAt(0);

      const x = parseFloat(L.substring(30, 38));
      const y = parseFloat(L.substring(38, 46));
      const z = parseFloat(L.substring(46, 54));

      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        atoms.push({ x, y, z, element, resname, atomName, chain, resSeq });
      }
    }
  }
  return atoms;
}


/**
 * Parse Vina PDBQT/PDB text and extract docked ligand atoms from the first pose.
 * - Accepts both ATOM and HETATM records
 * - If MODEL/ENDMDL blocks exist, uses the first MODEL only
 * Returns array of {x, y, z, element, resname, atomName, chain, resSeq}
 */
export function parseDockedLigandFromPDBQT(vinaText) {
  if (!vinaText) return [];
  const lines = String(vinaText).split(/\r?\n/);
  const hasModelBlocks = lines.some((line) => /^MODEL\b/i.test(String(line || '').trim()));

  const poseLines = [];
  if (hasModelBlocks) {
    let inFirstModel = false;
    for (const rawLine of lines) {
      const line = rawLine || '';
      const trimmed = line.trim();
      if (!inFirstModel && /^MODEL\b/i.test(trimmed)) {
        inFirstModel = true;
        continue;
      }
      if (inFirstModel && /^ENDMDL\b/i.test(trimmed)) break;
      if (inFirstModel) poseLines.push(line);
    }
  } else {
    poseLines.push(...lines);
  }

  const atoms = [];
  for (const line of poseLines) {
    const rec = (line.substring(0, 6) || '').trim();
    if (rec !== 'ATOM' && rec !== 'HETATM') continue;

    const atomName = (line.substring(12, 16) || '').trim();
    const resname = (line.substring(17, 20) || '').trim() || 'LIG';
    const chain = (line.substring(21, 22) || '').trim() || 'L';
    const resSeqStr = (line.substring(22, 26) || '').trim();
    const resSeq = resSeqStr ? parseInt(resSeqStr, 10) : null;

    const x = parseFloat(line.substring(30, 38));
    const y = parseFloat(line.substring(38, 46));
    const z = parseFloat(line.substring(46, 54));
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;

    let element = (line.substring(76, 78) || '').trim();
    if (!element && atomName) {
      const cleaned = atomName.replace(/[^A-Za-z]/g, '').toUpperCase();
      if (cleaned.length >= 2 && ['CL', 'BR', 'FE', 'ZN', 'MG', 'MN', 'CA', 'NA'].includes(cleaned)) {
        element = cleaned;
      } else if (cleaned.length >= 1) {
        element = cleaned.charAt(0);
      }
    }

    atoms.push({
      x,
      y,
      z,
      element: (element || 'C').toUpperCase(),
      resname,
      atomName,
      chain,
      resSeq
    });
  }

  return atoms;
}
