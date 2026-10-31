import * as THREE from 'three';

/** Fixed night lighting for M1. Replaced by the day/night cycle in M5. */
export function setupNightLighting(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x07051a);
  scene.add(new THREE.HemisphereLight(0x6a5cff, 0x1a0c24, 0.7));
  scene.add(new THREE.AmbientLight(0x30284a, 0.35));
  const moon = new THREE.DirectionalLight(0x9fc4ff, 0.7);
  moon.position.set(25, 60, 45); // lights the visible +X and +Z faces unequally
  scene.add(moon);
}
