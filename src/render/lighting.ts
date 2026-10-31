import * as THREE from 'three';

/** Fixed night lighting for M1. Replaced by the day/night cycle in M5. */
export function setupNightLighting(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x07051a);
  scene.add(new THREE.HemisphereLight(0x6a5cff, 0x1a0c24, 1.4));
  scene.add(new THREE.AmbientLight(0x30284a, 0.8));
  const moon = new THREE.DirectionalLight(0x9fc4ff, 0.9);
  moon.position.set(-30, 60, 20);
  scene.add(moon);
}
