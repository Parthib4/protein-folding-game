function handleDockingSetup(isManual) {
    // ... (unchanged code) ...
    
    // Check for both models before setup
    if (!proteinModel || !ligandModel) {
        // We no longer error out, we just load what we can.
        // This prevents the whole process from failing if only one model is loaded.
        // If neither is loaded, the function safely returns.
        if (!proteinModel && !ligandModel) return;
    }
    
    // Reposition ligand near center
    if (ligandModel) {
        ligandModel.atoms.forEach(a => {
            a.x = (Math.random() - 0.5) * 5;
            a.y = (Math.random() - 0.5) * 5;
            a.z = (Math.random() - 0.5) * 5;
        });

        // Use the new single-argument renderModel
        renderModel(ligandModel); 
    }
    
    frameScores = [];
    
    // ... (rest of the function) ...
}