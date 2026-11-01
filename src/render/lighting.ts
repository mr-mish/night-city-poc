import * as THREE from 'three';

/**
 * Fixed night lighting tuned for the oblique view: tops (normal +Y) and south facades (normal +Z)
 * are the only visible faces, so the moon comes from the south-west and above to light both.
 * Kept bright enough that albedo detail reads, dark enough that emissive neon dominates.
 * Replaced by the day/night cycle in M5.
 */
export function setupNightLighting(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x07051a);
  scene.add(new THREE.HemisphereLight(0x8a7cff, 0x221430, 1.1));
  scene.add(new THREE.AmbientLight(0x3a3060, 0.9));
  const moon = new THREE.DirectionalLight(0xa8c8ff, 0.9);
  moon.position.set(-20, 60, 50);
  scene.add(moon);
}
