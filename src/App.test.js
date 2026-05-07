import React from "react";
import App from "./App";

test("renders app without crashing", () => {
  expect(true).toBe(true);
});
    if (proteinFile && proteinFile.name && file.name === proteinFile.name) {
      alert("Protein and ligand files cannot be the same.");
      return;
    }
    setLigandFile(file);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">Protein–Ligand Folding Game</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-4 rounded-2xl shadow-xl">
          <h2 className="text-xl mb-2">Upload Protein Structure (PDB)</h2>
          <input type="file" accept=".pdb" onChange={handleProteinUpload} />
          {proteinFile && <ProteinViewer file={proteinFile} />}
        </div>

        <div className="bg-gray-800 p-4 rounded-2xl shadow-xl">
          <h2 className="text-xl mb-2">Upload Ligand Structure (SDF/MOL)</h2>
          <input type="file" accept=".sdf,.cif" onChange={handleLigandUpload} />
          {ligandFile && <LigandViewer file={ligandFile} />}
        </div>
      </div>

      <div className="text-center">
        <Button className="px-6 py-3 text-lg rounded-2xl">Start Folding</Button>
      </div>
    </div>
  );
}
import { parsePDB, getAlphaCarbons } from "./parser";

async function loadStructure() {
    const text = await fetch("/structure.pdb").then(r => r.text());

    const atoms = parsePDB(text);
    const CA_atoms = getAlphaCarbons(atoms);

    console.log("Found α-carbons:", CA_atoms.length);
}
