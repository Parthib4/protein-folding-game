// Parse PDB text and return atom objects
export function parsePDB(pdbText) {
    const atoms = [];
    const lines = pdbText.split("\n");

    lines.forEach(line => {
        if (line.startsWith("ATOM") || line.startsWith("HETATM")) {

            const atom = {
                atomName: line.substring(12, 16).trim(), // "CA", "N", "C", "O"
                resName: line.substring(17, 20).trim(), // "ALA", "GLY"
                chainID: line.substring(21, 22).trim(),
                resSeq: parseInt(line.substring(22, 26).trim()),

                x: parseFloat(line.substring(30, 38)),
                y: parseFloat(line.substring(38, 46)),
                z: parseFloat(line.substring(46, 54)),
            };

            atoms.push(atom);
        }
    });

    return atoms;
}
export function getAlphaCarbons(atoms) {
    return atoms.filter(a => a.atomName === "CA");
}
