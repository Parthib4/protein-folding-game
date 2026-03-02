function update3DPositions(model) {
    // Force a full re-render when atoms move, as bond meshes must be recalculated.
    // If the model is null or undefined, the function will stop.
    if (!model) return; 

    renderModel(model); 
}