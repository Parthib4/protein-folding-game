let system = null;     // declare first
system = new THREE.Group();
scene.add(system);
function clearSystem() {
    if (!system) {
        console.warn("system is not defined yet");
        return;  // stop the crash
    }

    while (system.children.length > 0) {
        const obj = system.children[0];
        system.remove(obj);

        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    }
}
clearSystem();
system = new THREE.Group()
