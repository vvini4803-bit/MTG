import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';

export type LandmarkId =
  | 'temple'
  | 'shrine'
  | 'school'
  | 'farms'
  | 'temple1'
  | 'kindergarden'
  | 'panchayat'
  | 'water';

export interface Village3DSceneProps {
  selectedId?: string;
  onSelect?: (id: LandmarkId) => void;
  isKannada?: boolean;
}

type TimeOfDay = 'day' | 'sunset' | 'night';

// ============================================================================
// 1. PROCEDURAL CANVASES: SIGNAGE, MURALS, ROAD & SKY BACKDROP
// ============================================================================

/** High-Resolution School Banner: "ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ ಮುತ್ಸಾಗೊಂದಿ" */
function createSchoolBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Warm cream/yellow background matching reference
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Royal blue borders
  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(0, 0, canvas.width, 16);
  ctx.fillRect(0, canvas.height - 16, canvas.width, 16);

  // Karnataka State Emblem (Red top half, Yellow bottom half circle)
  const cx = 110;
  const cy = 128;
  const r = 75;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(cx - r, cy - r, r * 2, r);
  ctx.fillStyle = '#FBBF24';
  ctx.fillRect(cx - r, cy, r * 2, r);
  ctx.restore();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Bold Kannada Signage
  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'bold 54px "Noto Sans Kannada", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ', 225, 95);

  ctx.fillStyle = '#B91C1C';
  ctx.font = 'bold 36px "Noto Sans Kannada", "Segoe UI", sans-serif';
  ctx.fillText('ಮುತ್ಸಾಗೊಂದಿ • ಹೊಸದುರ್ಗ ತಾಲೂಕು', 230, 165);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/** Anganwadi Preschool Mural Wall Art */
function createAnganwadiMuralTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Cheerful sky-blue background
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Lower yellow plinth
  ctx.fillStyle = '#FDE047';
  ctx.fillRect(0, canvas.height - 48, canvas.width, 48);

  // Painted sun & playful preschool motifs
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(80, 75, 45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.arc(170, 240, 100, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(340, 240, 110, Math.PI, 0);
  ctx.fill();

  // White cloud puffs
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(280, 60, 28, 0, Math.PI * 2);
  ctx.arc(310, 50, 35, 0, Math.PI * 2);
  ctx.arc(345, 60, 26, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

/** Dark Matte Asphalt Road Texture */
function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2B2F38';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle realistic road grain
  for (let i = 0; i < 3500; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const g = 40 + Math.random() * 30;
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

/** Panoramic Landscape Backdrop (Sky, Distant Green Hills, Birds & Sunflare) */
function createBackdropTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Sky Gradient from Azure Blue to Golden Horizon
  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGrad.addColorStop(0.0, '#38BDF8');   // Vivid Azure Blue
  skyGrad.addColorStop(0.4, '#7DD3FC');   // Soft Sky Blue
  skyGrad.addColorStop(0.7, '#BAE6FD');   // Atmospheric Haze
  skyGrad.addColorStop(1.0, '#FEF08A');   // Warm Golden Horizon
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Golden Sunburst in Top-Right Corner (Matches reference photograph)
  const sunX = canvas.width * 0.88;
  const sunY = canvas.height * 0.18;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 320);
  sunGlow.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  sunGlow.addColorStop(0.2, 'rgba(254, 240, 138, 0.9)');
  sunGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
  sunGlow.addColorStop(1.0, 'rgba(245, 158, 11, 0.0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. Layered Distant Green Hills (Karnataka landscape)
  // Far ridge
  ctx.fillStyle = '#64748B88';
  ctx.beginPath();
  ctx.moveTo(0, canvas.height * 0.72);
  for (let x = 0; x <= canvas.width; x += 40) {
    const y = canvas.height * 0.72 + Math.sin(x * 0.003) * 60 + Math.cos(x * 0.007) * 30;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.fill();

  // Mid ridge with trees
  ctx.fillStyle = '#4B7A50';
  ctx.beginPath();
  ctx.moveTo(0, canvas.height * 0.78);
  for (let x = 0; x <= canvas.width; x += 30) {
    const y = canvas.height * 0.78 + Math.sin(x * 0.005 + 1.2) * 50 + Math.cos(x * 0.01) * 20;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.fill();

  // Distant tiny white village houses on the hilltops (as in reference background)
  const houseCoords = [
    { x: canvas.width * 0.12, y: canvas.height * 0.74 },
    { x: canvas.width * 0.32, y: canvas.height * 0.75 },
    { x: canvas.width * 0.65, y: canvas.height * 0.76 },
    { x: canvas.width * 0.82, y: canvas.height * 0.78 }
  ];
  houseCoords.forEach((h) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(h.x, h.y, 22, 14);
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(h.x - 2, h.y);
    ctx.lineTo(h.x + 11, h.y - 10);
    ctx.lineTo(h.x + 24, h.y);
    ctx.fill();
  });

  // 4. Flock of Birds in V-Formation near the Sun (Exact reference detail)
  const birds = [
    { x: canvas.width * 0.78, y: canvas.height * 0.15, s: 7 },
    { x: canvas.width * 0.80, y: canvas.height * 0.14, s: 6 },
    { x: canvas.width * 0.82, y: canvas.height * 0.16, s: 7 },
    { x: canvas.width * 0.84, y: canvas.height * 0.17, s: 5 },
    { x: canvas.width * 0.86, y: canvas.height * 0.19, s: 6 }
  ];
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  birds.forEach((b) => {
    ctx.beginPath();
    ctx.moveTo(b.x - b.s, b.y + b.s * 0.4);
    ctx.quadraticCurveTo(b.x - b.s * 0.4, b.y - b.s * 0.5, b.x, b.y);
    ctx.quadraticCurveTo(b.x + b.s * 0.4, b.y - b.s * 0.5, b.x + b.s, b.y + b.s * 0.4);
    ctx.stroke();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// ============================================================================
// 2. MAIN 3D COMPONENT
// ============================================================================

export const Village3DScene: React.FC<Village3DSceneProps> = ({
  selectedId = 'temple',
  onSelect,
  isKannada = true
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
  const villageGroupRef = useRef<THREE.Group | null>(null);

  // Exact reference camera angles (Elevated isometric aerial perspective)
  const targetRotationYRef = useRef(0.0);
  const currentRotationYRef = useRef(0.0);
  const targetRotationXRef = useRef(0.04);
  const currentRotationXRef = useRef(0.04);

  const targetZoomRef = useRef(33);
  const currentZoomRef = useRef(33);
  const isAutoRotatingRef = useRef(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');

  const landmarkObjectsRef = useRef<{ [key in LandmarkId]?: THREE.Object3D }>({});
  const interactiveMeshesRef = useRef<{ mesh: THREE.Mesh; id: LandmarkId }[]>([]);
  const lightsRef = useRef<{
    sunLight?: THREE.DirectionalLight;
    ambientLight?: THREE.AmbientLight;
    hemiLight?: THREE.HemisphereLight;
  }>({});

  const prevSelectedIdRef = useRef<string | null>(null);

  // Map incoming selection ID
  const activeLandmarkId: LandmarkId = useMemo(() => {
    const raw = (selectedId || '').toLowerCase();
    if (raw.includes('thimmappa') || raw.includes('stone') || raw.includes('shrine') || raw.includes('huchharaya')) return 'shrine';
    if (raw.includes('kalle') || raw.includes('temple1')) return 'temple';
    if (raw.includes('anganwadi') || raw.includes('kindergarden')) return 'kindergarden';
    if (raw.includes('school') || raw.includes('hall') || raw.includes('panchayat')) return 'school';
    if (raw.includes('farm') || raw.includes('areca') || raw.includes('coconut')) return 'farms';
    if (raw.includes('water')) return 'water';
    return 'temple';
  }, [selectedId]);

  // Smooth focus on selected landmark ONLY when user actively triggers it
  const focusOnLandmark = useCallback((id: LandmarkId) => {
    if (id === 'shrine') {
      targetRotationYRef.current = 0.22;
      targetZoomRef.current = 26;
    } else if (id === 'school') {
      targetRotationYRef.current = 0.0;
      targetZoomRef.current = 25;
    } else if (id === 'farms') {
      targetRotationYRef.current = -0.35;
      targetZoomRef.current = 26;
    } else if (id === 'temple') {
      targetRotationYRef.current = 0.18;
      targetZoomRef.current = 25;
    } else if (id === 'temple1' || id === 'kindergarden') {
      targetRotationYRef.current = -0.22;
      targetZoomRef.current = 26;
    } else {
      targetRotationYRef.current = 0.0;
      targetZoomRef.current = 33;
    }
  }, []);

  const resetToMasterReferenceView = () => {
    targetRotationYRef.current = 0.0;
    targetRotationXRef.current = 0.04;
    targetZoomRef.current = 33;
  };

  // Only animate camera on subsequent user clicks, NEVER on initial mount
  useEffect(() => {
    if (prevSelectedIdRef.current !== null && prevSelectedIdRef.current !== activeLandmarkId) {
      focusOnLandmark(activeLandmarkId);
    }
    prevSelectedIdRef.current = activeLandmarkId;
  }, [activeLandmarkId, focusOnLandmark]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    interactiveMeshesRef.current = [];
    landmarkObjectsRef.current = {};

    const width = container.clientWidth;
    const height = container.clientHeight || 560;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xd6e8fa, 0.008);

    // --- Isometric Aerial Perspective Camera Matching Reference Image ---
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.5, 250);
    camera.position.set(0, 23.5, currentZoomRef.current);
    camera.lookAt(0, 1.8, 0);

    // --- WebGL Renderer ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- Atmospheric Landscape Backdrop (Hills, Sky, Sun & Birds) ---
    const backdropGeo = new THREE.PlaneGeometry(110, 52);
    const backdropMat = new THREE.MeshBasicMaterial({
      map: createBackdropTexture(),
      depthWrite: false
    });
    const backdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
    backdropMesh.position.set(0, 14, -28);
    scene.add(backdropMesh);

    // --- Natural Warm Sunlight from TOP-RIGHT (Matching Reference Photo) ---
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.05);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0xc2410c, 0.7);
    scene.add(hemiLight);

    // Sun positioned in upper right, casting soft shadows towards bottom-left
    const sunLight = new THREE.DirectionalLight(0xfffae0, 2.7);
    sunLight.position.set(24, 32, -14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -26;
    sunLight.shadow.camera.right = 26;
    sunLight.shadow.camera.top = 26;
    sunLight.shadow.camera.bottom = -26;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    lightsRef.current = { sunLight, ambientLight, hemiLight };

    // --- Master Village Diorama Group ---
    const villageGroup = new THREE.Group();
    scene.add(villageGroup);
    villageGroupRef.current = villageGroup;

    // --- Shared High-Fidelity Materials ---
    const asphaltMat = new THREE.MeshStandardMaterial({
      map: createAsphaltTexture(),
      roughness: 0.85,
      metalness: 0.1
    });

    const lushGrassMat = new THREE.MeshStandardMaterial({
      color: 0x228B22,
      roughness: 0.8,
      metalness: 0.05
    });

    const redSoilMat = new THREE.MeshStandardMaterial({
      color: 0xA03612,
      roughness: 0.92,
      metalness: 0.02
    });

    const weatheredGraniteMat = new THREE.MeshStandardMaterial({
      color: 0x6B6560,
      roughness: 0.95,
      metalness: 0.05
    });

    const templeGoldMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      roughness: 0.25,
      metalness: 0.92
    });

    const templeYellowMat = new THREE.MeshStandardMaterial({
      color: 0xFDE047,
      roughness: 0.5,
      metalness: 0.1
    });

    const templeBlueMat = new THREE.MeshStandardMaterial({
      color: 0x38BDF8,
      roughness: 0.45,
      metalness: 0.1
    });

    const templePinkMat = new THREE.MeshStandardMaterial({
      color: 0xF472B6,
      roughness: 0.5,
      metalness: 0.1
    });

    const whiteWallMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.65,
      metalness: 0.02
    });

    const foliageGreen1 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
    const foliageGreen2 = new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.8 });
    const foliageGreen3 = new THREE.MeshStandardMaterial({ color: 0x22C55E, roughness: 0.75 });
    const barkBrownMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.9 });

    // Interactive Mesh Registration
    const registerInteractive = (mesh: THREE.Mesh, id: LandmarkId) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      interactiveMeshesRef.current.push({ mesh, id });
    };

    // Helper: Realistic Organic Tree (Multi-cluster volumetric foliage)
    const createOrganicTree = (scale = 1.0, type: 'banyan' | 'neem' | 'shrub' = 'banyan'): THREE.Group => {
      const tree = new THREE.Group();
      const trunkH = 1.8 * scale;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.28 * scale, trunkH, 8), barkBrownMat);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      tree.add(trunk);

      const clusters = type === 'banyan' ? 5 : 4;
      for (let i = 0; i < clusters; i++) {
        const mat = i % 3 === 0 ? foliageGreen1 : i % 3 === 1 ? foliageGreen2 : foliageGreen3;
        const rad = (0.9 + Math.random() * 0.4) * scale;
        const cluster = new THREE.Mesh(new THREE.DodecahedronGeometry(rad, 1), mat);
        const ang = (i / clusters) * Math.PI * 2;
        const dist = 0.5 * scale;
        cluster.position.set(
          Math.cos(ang) * dist,
          trunkH + 0.5 * scale + (i === 0 ? 0.4 : 0),
          Math.sin(ang) * dist
        );
        cluster.scale.set(1.1, 0.85, 1.0);
        cluster.castShadow = true;
        cluster.receiveShadow = true;
        tree.add(cluster);
      }
      return tree;
    };

    // =========================================================================
    // 3. DIORAMA BASE & TOPOGRAPHY (Matching Reference Image)
    // =========================================================================
    const terrainGroup = new THREE.Group();
    villageGroup.add(terrainGroup);

    // Main Curved Diorama Slab Base
    const baseGeo = new THREE.CylinderGeometry(19.5, 20.5, 2.8, 54);
    const baseUnderMat = new THREE.MeshStandardMaterial({ color: 0x3F2615, roughness: 0.95 });
    const baseMesh = new THREE.Mesh(baseGeo, baseUnderMat);
    baseMesh.position.y = -1.4;
    baseMesh.receiveShadow = true;
    terrainGroup.add(baseMesh);

    // Top Natural Green Grass Layer
    const topGrassGeo = new THREE.CylinderGeometry(19.4, 19.5, 0.4, 54);
    const topGrassMesh = new THREE.Mesh(topGrassGeo, lushGrassMat);
    topGrassMesh.position.y = 0.1;
    topGrassMesh.receiveShadow = true;
    terrainGroup.add(topGrassMesh);

    // Upper Left Raised Earthen Mound for Old Stone Structure
    const stoneHill = new THREE.Mesh(new THREE.ConeGeometry(5.8, 2.8, 28), redSoilMat);
    stoneHill.position.set(-9.2, 1.3, -5.8);
    stoneHill.receiveShadow = true;
    terrainGroup.add(stoneHill);

    // Upper Center Tiered Terrace for Community Hall
    const hallTerrace = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.8, 6.2), redSoilMat);
    hallTerrace.position.set(0.5, 0.4, -7.2);
    hallTerrace.receiveShadow = true;
    terrainGroup.add(hallTerrace);

    // Upper Right Plantation Flat Agricultural Earth Bed with Furrows
    const plantationSoil = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.35, 10.5), redSoilMat);
    plantationSoil.position.set(10.2, 0.25, -4.8);
    plantationSoil.receiveShadow = true;
    terrainGroup.add(plantationSoil);

    // Foreground Lush Shrub Knoll (Between Road Forks - exactly as in reference)
    const frontKnoll = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.4, 24), lushGrassMat);
    frontKnoll.position.set(0, 0.6, 6.2);
    frontKnoll.receiveShadow = true;
    terrainGroup.add(frontKnoll);

    // Clustered boulders & flowering bushes on the front knoll
    for (let fb = 0; fb < 8; fb++) {
      const bGeo = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.4, 0);
      const boulder = new THREE.Mesh(bGeo, weatheredGraniteMat);
      boulder.position.set(
        (Math.random() - 0.5) * 3.5,
        0.5 + Math.random() * 0.3,
        6.0 + (Math.random() - 0.5) * 1.6
      );
      boulder.castShadow = true;
      terrainGroup.add(boulder);

      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.55 + Math.random() * 0.3, 7, 7), foliageGreen2);
      bush.position.set(
        (Math.random() - 0.5) * 3.8,
        0.7 + Math.random() * 0.3,
        6.2 + (Math.random() - 0.5) * 1.8
      );
      bush.castShadow = true;
      terrainGroup.add(bush);
    }

    // Soft clouds framing the base perimeter (miniature diorama floating edge)
    const cloudsGroup = new THREE.Group();
    villageGroup.add(cloudsGroup);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 1.0,
      transparent: true,
      opacity: 0.88
    });

    for (let c = 0; c < 22; c++) {
      const ang = (c / 22) * Math.PI * 2;
      const dist = 19.5 + Math.random() * 2.5;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(2.5 + Math.random() * 1.8, 8, 8), cloudMat);
      puff.position.set(Math.cos(ang) * dist, -0.6 + Math.sin(c * 2) * 0.4, Math.sin(ang) * dist);
      puff.scale.set(1.5, 0.65, 1.1);
      cloudsGroup.add(puff);
    }

    // =========================================================================
    // 4. CENTRAL CURVING ROAD NETWORK WITH WHITE MARKINGS (Exact Blueprint)
    // =========================================================================
    const roadGroup = new THREE.Group();
    villageGroup.add(roadGroup);

    // Main sweeping road: from bottom left, around temple, up past school
    const mainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-14.5, 0.32, 9.5),
      new THREE.Vector3(-6.5, 0.32, 7.2),
      new THREE.Vector3(-2.8, 0.32, 4.5),   // Around front knoll
      new THREE.Vector3(0.0, 0.32, 2.0),    // Central junction
      new THREE.Vector3(2.4, 0.32, -0.2),
      new THREE.Vector3(1.2, 0.32, -3.8),
      new THREE.Vector3(-3.2, 0.32, -5.2),
      new THREE.Vector3(-12.5, 0.32, -6.5)
    ]);

    const roadGeo = new THREE.TubeGeometry(mainCurve, 64, 1.45, 6, false);
    const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
    roadMesh.scale.set(1, 0.07, 1);
    roadMesh.position.y = 0.32;
    roadMesh.receiveShadow = true;
    roadGroup.add(roadMesh);

    // Right fork: from central junction, past white shrine & anganwadi into plantation
    const forkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.32, 2.0),
      new THREE.Vector3(4.5, 0.32, 3.8),
      new THREE.Vector3(9.2, 0.32, 7.2),
      new THREE.Vector3(14.8, 0.32, 9.8)
    ]);
    const forkGeo = new THREE.TubeGeometry(forkCurve, 36, 1.35, 6, false);
    const forkMesh = new THREE.Mesh(forkGeo, asphaltMat);
    forkMesh.scale.set(1, 0.07, 1);
    forkMesh.position.y = 0.32;
    forkMesh.receiveShadow = true;
    roadGroup.add(forkMesh);

    // White dashed centerlines along the roads
    const dashCurvePoints = mainCurve.getPoints(44);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    for (let i = 0; i < dashCurvePoints.length - 1; i += 2) {
      const p1 = dashCurvePoints[i];
      const p2 = dashCurvePoints[i + 1];
      const dashGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p1.x, 0.36, p1.z),
        new THREE.Vector3(p2.x, 0.36, p2.z)
      ]);
      const dashLine = new THREE.Line(dashGeo, dashMat);
      roadGroup.add(dashLine);
    }

    // =========================================================================
    // 5. LEFT / CENTER: SRI KALLESHWARA SWAMY TEMPLE (Main Attraction)
    // =========================================================================
    const templeGroup = new THREE.Group();
    templeGroup.position.set(-7.0, 0.4, 2.2);
    villageGroup.add(templeGroup);
    landmarkObjectsRef.current['temple'] = templeGroup;

    // Courtyard Plinth
    const tCourtyard = new THREE.Mesh(
      new THREE.BoxGeometry(7.4, 0.4, 8.8),
      new THREE.MeshStandardMaterial({ color: 0xFDE68A, roughness: 0.8 })
    );
    tCourtyard.position.set(0, 0.2, 0);
    tCourtyard.receiveShadow = true;
    templeGroup.add(tCourtyard);

    // Perimeter Compound Wall with Yellow Stucco
    const tWallMat = new THREE.MeshStandardMaterial({ color: 0xFEF08A, roughness: 0.7 });
    const tWallBack = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.45, 0.3), tWallMat);
    tWallBack.position.set(0, 1.05, -4.25);
    templeGroup.add(tWallBack);

    const tWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.45, 8.5), tWallMat);
    tWallLeft.position.set(-3.55, 1.05, 0);
    templeGroup.add(tWallLeft);

    const tWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.45, 8.5), tWallMat);
    tWallRight.position.set(3.55, 1.05, 0);
    templeGroup.add(tWallRight);

    // Decorative Arches (Pink & Turquoise arches matching reference outer wall)
    for (let a = -3.2; a <= 3.2; a += 1.3) {
      const archM = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16, 1, false, 0, Math.PI),
        templePinkMat
      );
      archM.rotation.z = Math.PI;
      archM.rotation.y = Math.PI / 2;
      archM.position.set(-3.6, 1.75, a);
      templeGroup.add(archM);

      const archInner = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.5), templeBlueMat);
      archInner.position.set(-3.6, 1.2, a);
      templeGroup.add(archInner);
    }

    // --- Multi-Tiered Colorful Dravidian Gopuram Tower ---
    const gopura = new THREE.Group();
    gopura.position.set(-1.8, 0.4, -2.0);
    templeGroup.add(gopura);

    // Tier 1 (Base - Yellow & Stone)
    const gTier1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 3.2), templeYellowMat);
    gTier1.position.y = 0.9;
    registerInteractive(gTier1, 'temple');
    gopura.add(gTier1);

    // Tier 2 (Turquoise Blue with niches)
    const gTier2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.5, 2.6), templeBlueMat);
    gTier2.position.y = 2.5;
    registerInteractive(gTier2, 'temple');
    gopura.add(gTier2);

    // Tier 3 (Coral Pink with cornices)
    const gTier3 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.3, 2.1), templePinkMat);
    gTier3.position.y = 3.85;
    registerInteractive(gTier3, 'temple');
    gopura.add(gTier3);

    // Tier 4 (Orange/Red)
    const gTier4 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.6), new THREE.MeshStandardMaterial({ color: 0xEA580C }));
    gTier4.position.y = 5.0;
    registerInteractive(gTier4, 'temple');
    gopura.add(gTier4);

    // Sikhara Rounded Cap & 3 Golden Kalasha Finials
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.2, 0.9, 16), templeGoldMat);
    dome.position.y = 6.0;
    gopura.add(dome);

    for (let k = -0.42; k <= 0.42; k += 0.42) {
      const kalasha = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.8, 12), templeGoldMat);
      kalasha.position.set(k, 6.75, 0);
      gopura.add(kalasha);
    }

    // Inner Courtyard Mandapa (Colonnaded Hall)
    const mandapaRoof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.4, 4.4), tWallMat);
    mandapaRoof.position.set(1.2, 1.9, 0.6);
    registerInteractive(mandapaRoof, 'temple');
    templeGroup.add(mandapaRoof);

    // Columns
    const colMat = new THREE.MeshStandardMaterial({ color: 0xDC2626 });
    for (let cx = -0.4; cx <= 2.8; cx += 1.6) {
      for (let cz = -1.2; cz <= 2.4; cz += 1.8) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8), colMat);
        pillar.position.set(cx, 0.95, cz);
        templeGroup.add(pillar);
      }
    }

    // Saffron / Orange Flags fluttering on tall poles (Dhwaja)
    const flagMat = new THREE.MeshStandardMaterial({ color: 0xF97316, roughness: 0.4, side: THREE.DoubleSide });
    for (let f = 0; f < 3; f++) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.4, 6), new THREE.MeshStandardMaterial({ color: 0x78716C }));
      pole.position.set(-0.2 + f * 1.3, 2.2, 3.0);
      templeGroup.add(pole);

      const fShape = new THREE.Shape();
      fShape.moveTo(0, 0);
      fShape.lineTo(1.0, 0.4);
      fShape.lineTo(0, 0.8);
      fShape.closePath();
      const flagM = new THREE.Mesh(new THREE.ShapeGeometry(fShape), flagMat);
      flagM.position.set(-0.2 + f * 1.3, 3.6, 3.0);
      flagM.rotation.y = 0.25;
      templeGroup.add(flagM);
    }

    // Entrance Archway facing road
    const entrance = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 0.4), templeYellowMat);
    entrance.position.set(1.2, 1.3, 4.3);
    templeGroup.add(entrance);

    // Surrounding Shady Trees around the temple
    const templeTrees = [
      { x: -4.5, z: -3.0 },
      { x: -4.8, z: 1.5 },
      { x: -4.2, z: 4.8 },
      { x: 4.2, z: -2.5 },
      { x: 4.5, z: 2.8 }
    ];
    templeTrees.forEach((pos) => {
      const tr = createOrganicTree(1.15, 'banyan');
      tr.position.set(pos.x, 0, pos.z);
      templeGroup.add(tr);
    });

    // =========================================================================
    // 6. UPPER LEFT: OLD STONE STRUCTURE (Megalithic Granite Dolmen / Cave)
    // =========================================================================
    const stoneGroup = new THREE.Group();
    stoneGroup.position.set(-9.2, 1.4, -5.8);
    villageGroup.add(stoneGroup);
    landmarkObjectsRef.current['shrine'] = stoneGroup;

    // Heavy weathered granite jamb pillars
    const stoneJambL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 1.2), weatheredGraniteMat);
    stoneJambL.position.set(-1.4, 1.25, 0);
    registerInteractive(stoneJambL, 'shrine');
    stoneGroup.add(stoneJambL);

    const stoneJambR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 1.2), weatheredGraniteMat);
    stoneJambR.position.set(1.4, 1.25, 0);
    registerInteractive(stoneJambR, 'shrine');
    stoneGroup.add(stoneJambR);

    // Rear chamber
    const stoneBackWall = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.5, 1.4), weatheredGraniteMat);
    stoneBackWall.position.set(0, 1.25, -1.1);
    registerInteractive(stoneBackWall, 'shrine');
    stoneGroup.add(stoneBackWall);

    // Massive Stone Lintel (Roof slab)
    const stoneCap = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.9, 3.4), weatheredGraniteMat);
    stoneCap.position.set(0, 2.85, -0.4);
    registerInteractive(stoneCap, 'shrine');
    stoneGroup.add(stoneCap);

    // Boulders, irregular rocks, and dry shrubs piled around
    for (let r = 0; r < 24; r++) {
      const rMesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.45 + Math.random() * 0.55, 0),
        weatheredGraniteMat
      );
      rMesh.position.set(
        (Math.random() - 0.5) * 4.8,
        0.3 + Math.random() * 2.4,
        (Math.random() - 0.5) * 4.0
      );
      rMesh.scale.set(1.2, 0.75, 1.1);
      rMesh.castShadow = true;
      registerInteractive(rMesh, 'shrine');
      stoneGroup.add(rMesh);
    }

    // Wild dry grass and greenery on top of the stone roof
    const wildRoofGrass = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8), foliageGreen3);
    wildRoofGrass.position.set(-0.7, 3.5, -0.2);
    stoneGroup.add(wildRoofGrass);

    // =========================================================================
    // 7. UPPER CENTER: VILLAGE COMMUNITY HALL / GOVT PRIMARY SCHOOL
    // =========================================================================
    const schoolGroup = new THREE.Group();
    schoolGroup.position.set(0.5, 0.4, -7.2);
    villageGroup.add(schoolGroup);
    landmarkObjectsRef.current['school'] = schoolGroup;
    landmarkObjectsRef.current['panchayat'] = schoolGroup;

    // School Building (Yellow/Cream stucco with blue doors matching reference)
    const schoolWallMat = new THREE.MeshStandardMaterial({ color: 0xFEF08A, roughness: 0.6 });
    const schoolBuilding = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.8, 4.0), schoolWallMat);
    schoolBuilding.position.y = 1.4;
    registerInteractive(schoolBuilding, 'school');
    schoolGroup.add(schoolBuilding);

    // Kannada Signboard Banner across top: "ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ ಮುತ್ಸಾಗೊಂದಿ"
    const schoolBannerMat = new THREE.MeshStandardMaterial({
      map: createSchoolBannerTexture(),
      roughness: 0.4
    });
    const schoolBanner = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.0, 0.1), schoolBannerMat);
    schoolBanner.position.set(0, 2.75, 2.05);
    registerInteractive(schoolBanner, 'school');
    schoolGroup.add(schoolBanner);

    // Veranda Pillars with Indian Tricolor Painting (Saffron, White, Green) as in reference!
    const saffronMat = new THREE.MeshStandardMaterial({ color: 0xF97316 });
    const whitePillarMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const greenPillarMat = new THREE.MeshStandardMaterial({ color: 0x16A34A });

    const pillarPositionsX = [-2.6, -0.9, 0.9, 2.6];
    pillarPositionsX.forEach((px) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(px, 0, 2.2);

      // Bottom green segment
      const pGreen = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 12), greenPillarMat);
      pGreen.position.y = 0.4;
      pGroup.add(pGreen);

      // Middle white segment
      const pWhite = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 12), whitePillarMat);
      pWhite.position.y = 1.2;
      pGroup.add(pWhite);

      // Top saffron segment
      const pSaffron = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 12), saffronMat);
      pSaffron.position.y = 2.0;
      pGroup.add(pSaffron);

      schoolGroup.add(pGroup);
    });

    // Blue Metal Doors & Windows on front facade
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1E40AF, roughness: 0.4 });
    const sDoorL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 0.12), doorMat);
    sDoorL.position.set(-1.9, 0.9, 2.02);
    schoolGroup.add(sDoorL);

    const sDoorR = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 0.12), doorMat);
    sDoorR.position.set(1.9, 0.9, 2.02);
    schoolGroup.add(sDoorR);

    // Front Windows with posters
    const winMat = new THREE.MeshStandardMaterial({ color: 0x60A5FA, roughness: 0.2 });
    for (let w = -0.85; w <= 0.85; w += 0.85) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.12), winMat);
      win.position.set(w, 1.25, 2.02);
      schoolGroup.add(win);
    }

    // Yellow Rooftop Water Tank on the left roof corner
    const yellowTank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.75, 16),
      new THREE.MeshStandardMaterial({ color: 0xFBBF24, roughness: 0.4 })
    );
    yellowTank.position.set(-2.7, 3.2, 0.9);
    yellowTank.castShadow = true;
    schoolGroup.add(yellowTank);

    // Concrete Entrance Steps leading down to the road
    const stepsMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.75 });
    const steps = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 1.6), stepsMat);
    steps.position.set(0, 0.2, 2.6);
    schoolGroup.add(steps);

    // Green Metal Railings along the front plinth & steps
    const railMat = new THREE.MeshStandardMaterial({ color: 0x15803D, metalness: 0.7, roughness: 0.3 });
    const handrail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.7, 0.08), railMat);
    handrail.position.set(0, 0.7, 3.3);
    schoolGroup.add(handrail);

    // Shady trees behind and beside school
    const sTreeL = createOrganicTree(1.35, 'banyan');
    sTreeL.position.set(-4.5, 0, -1.0);
    schoolGroup.add(sTreeL);

    const sTreeR = createOrganicTree(1.25, 'neem');
    sTreeR.position.set(4.6, 0, -1.0);
    schoolGroup.add(sTreeR);

    // =========================================================================
    // 8. UPPER RIGHT: DENSE ARECA NUT PLANTATION (Real Photo Style)
    // =========================================================================
    const plantationGroup = new THREE.Group();
    plantationGroup.position.set(10.2, 0.4, -4.8);
    villageGroup.add(plantationGroup);
    landmarkObjectsRef.current['farms'] = plantationGroup;

    // Ringed grey-brown slender trunks
    const arecaTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x64748B,
      roughness: 0.85
    });

    const arecaFrondMat = new THREE.MeshStandardMaterial({
      color: 0x15803D,
      roughness: 0.55,
      side: THREE.DoubleSide
    });

    const rows = 5;
    const cols = 7;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = (c - (cols - 1) / 2) * 1.45 + (Math.random() - 0.5) * 0.25;
        const pz = (r - (rows - 1) / 2) * 1.55 + (Math.random() - 0.5) * 0.25;
        const h = 5.5 + Math.random() * 2.0;

        const palm = new THREE.Group();
        palm.position.set(px, 0, pz);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, h, 8), arecaTrunkMat);
        trunk.position.y = h / 2;
        trunk.castShadow = true;
        registerInteractive(trunk, 'farms');
        palm.add(trunk);

        // Crown of 7 radiating feathery palm fronds
        const crown = new THREE.Group();
        crown.position.y = h;
        for (let f = 0; f < 7; f++) {
          const fAng = (f / 7) * Math.PI * 2 + Math.random() * 0.2;
          const frond = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 2.0), arecaFrondMat);
          frond.rotation.x = Math.PI / 3 + (Math.random() - 0.5) * 0.15;
          frond.rotation.y = fAng;
          frond.position.set(Math.sin(fAng) * 0.45, -0.2, Math.cos(fAng) * 0.45);
          crown.add(frond);
        }
        palm.add(crown);
        plantationGroup.add(palm);
      }
    }

    // =========================================================================
    // 9. RIGHT / CENTER: WHITE SHRINE & ELECTRIC TRANSMISSION PYLON
    // =========================================================================
    const shrineGroup = new THREE.Group();
    shrineGroup.position.set(5.6, 0.4, 1.2);
    villageGroup.add(shrineGroup);
    landmarkObjectsRef.current['temple1'] = shrineGroup;

    // Whitewashed village shrine structure
    const shrineBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.8, 2.4), whiteWallMat);
    shrineBase.position.set(0, 0.9, 0);
    registerInteractive(shrineBase, 'temple1');
    shrineGroup.add(shrineBase);

    // Stepped white vimana tower on the left of the shrine
    const vim1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 1.2), whiteWallMat);
    vim1.position.set(-0.85, 2.15, 0);
    shrineGroup.add(vim1);

    const vim2 = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.95, 4), whiteWallMat);
    vim2.rotation.y = Math.PI / 4;
    vim2.position.set(-0.85, 2.95, 0);
    registerInteractive(vim2, 'temple1');
    shrineGroup.add(vim2);

    // Steel Lattice Transmission Pylon (ವಿದ್ಯುತ್ ಗೋಪುರ)
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.4
    });

    const pylon = new THREE.Group();
    pylon.position.set(1.8, 0, -1.4);
    shrineGroup.add(pylon);

    // 4 Corner Legs
    const pLegGeo = new THREE.CylinderGeometry(0.04, 0.065, 10.0, 6);
    const p1 = new THREE.Mesh(pLegGeo, pylonMat); p1.position.set(-0.48, 5.0, -0.48); pylon.add(p1);
    const p2 = new THREE.Mesh(pLegGeo, pylonMat); p2.position.set(0.48, 5.0, -0.48); pylon.add(p2);
    const p3 = new THREE.Mesh(pLegGeo, pylonMat); p3.position.set(-0.48, 5.0, 0.48); pylon.add(p3);
    const p4 = new THREE.Mesh(pLegGeo, pylonMat); p4.position.set(0.48, 5.0, 0.48); pylon.add(p4);

    // Crossarms & Transmission lines stretching right
    const pArm1 = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 0.12), pylonMat);
    pArm1.position.set(0, 8.6, 0);
    pylon.add(pArm1);

    const pArm2 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, 0.12), pylonMat);
    pArm2.position.set(0, 9.6, 0);
    pylon.add(pArm2);

    // =========================================================================
    // 10. LOWER RIGHT / FOREGROUND: ANGANWADI KENDRA (ಅಂಗನವಾಡಿ ಕೇಂದ್ರ)
    // =========================================================================
    const anganwadiGroup = new THREE.Group();
    anganwadiGroup.position.set(9.8, 0.4, 6.2);
    villageGroup.add(anganwadiGroup);
    landmarkObjectsRef.current['kindergarden'] = anganwadiGroup;

    // Cheerful sky-blue building with mural texture
    const angMat = new THREE.MeshStandardMaterial({
      map: createAnganwadiMuralTexture(),
      roughness: 0.5
    });

    const angBuilding = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.85, 2.8), angMat);
    angBuilding.position.y = 0.92;
    registerInteractive(angBuilding, 'kindergarden');
    anganwadiGroup.add(angBuilding);

    // Blue Sintex-style cylindrical water tank on the flat terrace
    const blueTank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.7, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.4 })
    );
    blueTank.position.set(1.6, 2.2, 0.4);
    blueTank.castShadow = true;
    anganwadiGroup.add(blueTank);

    // Yellow boundary wall with entrance gate along the road
    const yBoundMat = new THREE.MeshStandardMaterial({ color: 0xFDE047, roughness: 0.7 });
    const yWall = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.75, 0.14), yBoundMat);
    yWall.position.set(0, 0.38, 1.7);
    anganwadiGroup.add(yWall);

    // Trees beside anganwadi
    const angTree = createOrganicTree(1.0, 'neem');
    angTree.position.set(-3.2, 0, 0.5);
    anganwadiGroup.add(angTree);

    // =========================================================================
    // 11. CENTRAL GROVE OF GREEN SHADE TREES (Between Road and Landmarks)
    // =========================================================================
    const centralGrovePositions = [
      { x: -1.2, z: -1.5, s: 1.25, t: 'banyan' },
      { x: 1.4, z: 1.4, s: 1.15, t: 'neem' },
      { x: -2.5, z: 3.5, s: 1.1, t: 'banyan' },
      { x: 4.8, z: 4.8, s: 1.05, t: 'neem' }
    ] as const;

    centralGrovePositions.forEach((cg) => {
      const t = createOrganicTree(cg.s, cg.t);
      t.position.set(cg.x, 0.3, cg.z);
      villageGroup.add(t);
    });

    // =========================================================================
    // 12. INTERACTION, DRAGGING & RENDERING LOOP
    // =========================================================================
    const handlePointerDown = (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      dragDistanceRef.current = 0;
      previousMousePosition.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) return;
      const dx = clientX - previousMousePosition.current.x;
      const dy = clientY - previousMousePosition.current.y;
      dragDistanceRef.current += Math.abs(dx) + Math.abs(dy);

      targetRotationYRef.current += dx * 0.007;
      targetRotationXRef.current = Math.max(-0.25, Math.min(0.35, targetRotationXRef.current + dy * 0.004));

      previousMousePosition.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = (clientX: number, clientY: number) => {
      isDraggingRef.current = false;

      // Click detection if not dragged
      if (dragDistanceRef.current < 6) {
        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((clientX - rect.left) / width) * 2 - 1,
          -((clientY - rect.top) / height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const targets = interactiveMeshesRef.current.map((item) => item.mesh);
        const intersects = raycaster.intersectObjects(targets, false);

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object as THREE.Mesh;
          const match = interactiveMeshesRef.current.find((item) => item.mesh === hitMesh);
          if (match && onSelect) {
            onSelect(match.id);
            focusOnLandmark(match.id);
          }
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = (e: MouseEvent) => handlePointerUp(e.clientX, e.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        handlePointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetZoomRef.current = Math.max(18, Math.min(48, targetZoomRef.current + e.deltaY * 0.02));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('wheel', onWheel, { passive: false });

    // --- Render Loop ---
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isAutoRotatingRef.current) {
        targetRotationYRef.current += 0.003;
      }

      // Smooth Lerp
      currentRotationYRef.current += (targetRotationYRef.current - currentRotationYRef.current) * 0.08;
      currentRotationXRef.current += (targetRotationXRef.current - currentRotationXRef.current) * 0.08;
      currentZoomRef.current += (targetZoomRef.current - currentZoomRef.current) * 0.08;

      if (villageGroupRef.current) {
        villageGroupRef.current.rotation.y = currentRotationYRef.current;
        villageGroupRef.current.rotation.x = currentRotationXRef.current;
      }

      camera.position.z = currentZoomRef.current;
      camera.lookAt(0, 1.8, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);

      renderer.dispose();
      scene.clear();
    };
  }, [onSelect, focusOnLandmark]);

  // Adjust Lighting on TimeOfDay change
  useEffect(() => {
    const { sunLight, ambientLight, hemiLight } = lightsRef.current;
    if (!sunLight || !ambientLight || !hemiLight) return;

    if (timeOfDay === 'day') {
      sunLight.color.setHex(0xfffae0);
      sunLight.intensity = 2.7;
      ambientLight.color.setHex(0xfff7ed);
      ambientLight.intensity = 1.05;
      hemiLight.color.setHex(0xbae6fd);
      hemiLight.groundColor.setHex(0xc2410c);
    } else if (timeOfDay === 'sunset') {
      sunLight.color.setHex(0xfb923c);
      sunLight.intensity = 2.2;
      ambientLight.color.setHex(0xfef3c7);
      ambientLight.intensity = 0.85;
      hemiLight.color.setHex(0xf472b6);
      hemiLight.groundColor.setHex(0x9a3412);
    } else if (timeOfDay === 'night') {
      sunLight.color.setHex(0x38bdf8);
      sunLight.intensity = 0.35;
      ambientLight.color.setHex(0x1e293b);
      ambientLight.intensity = 0.55;
      hemiLight.color.setHex(0x0f172a);
      hemiLight.groundColor.setHex(0x020617);
    }
  }, [timeOfDay]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px', userSelect: 'none' }}>
      {/* 3D WebGL Canvas Mount Container with warm morning sky backdrop */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '520px',
          cursor: 'grab',
          background: timeOfDay === 'night'
            ? 'radial-gradient(ellipse at 50% 30%, #0f172a 0%, #020617 100%)'
            : timeOfDay === 'sunset'
            ? 'radial-gradient(ellipse at 50% 30%, #431407 0%, #1e1b4b 100%)'
            : 'radial-gradient(ellipse at 50% 35%, #bae6fd 0%, #e0f2fe 45%, #7dd3fc 100%)'
        }}
      />

      {/* Compact Top-Right Floating Controls (Glassmorphism) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(7, 15, 30, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '4px 8px',
          zIndex: 35
        }}
      >
        {/* Time of Day */}
        <button
          onClick={() => setTimeOfDay(timeOfDay === 'day' ? 'sunset' : timeOfDay === 'sunset' ? 'night' : 'day')}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '14px',
            padding: '5px 10px',
            color: '#FFFFFF',
            fontSize: '0.74rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Toggle Lighting (Day / Sunset / Night)"
        >
          <span>{timeOfDay === 'day' ? '☀️' : timeOfDay === 'sunset' ? '🌅' : '🌙'}</span>
          <span>{timeOfDay === 'day' ? (isKannada ? 'ಹಗಲು' : 'Day') : timeOfDay === 'sunset' ? (isKannada ? 'ಸಂಜೆ' : 'Sunset') : (isKannada ? 'ರಾತ್ರಿ' : 'Night')}</span>
        </button>

        {/* Auto Rotate */}
        <button
          onClick={() => {
            const next = !isAutoRotating;
            setIsAutoRotating(next);
            isAutoRotatingRef.current = next;
          }}
          style={{
            background: isAutoRotating ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)',
            border: isAutoRotating ? '1px solid #8B5CF6' : 'none',
            borderRadius: '14px',
            padding: '5px 9px',
            color: isAutoRotating ? '#C4B5FD' : '#94A3B8',
            fontSize: '0.74rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
          title="Auto Rotate 360°"
        >
          🔄
        </button>

        {/* Reset to Blueprint Reference View */}
        <button
          onClick={resetToMasterReferenceView}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '14px',
            padding: '5px 9px',
            color: '#CBD5E1',
            fontSize: '0.74rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
          title="Reset to Master Reference View"
        >
          🎯
        </button>
      </div>

      {/* Floating Bottom Quick Gesture Hints */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '12px',
          background: 'rgba(7, 15, 30, 0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px',
          padding: '4px 10px',
          fontSize: '0.7rem',
          color: '#CBD5E1',
          zIndex: 35,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>👆 {isKannada ? 'ಎಳೆದು 360° ತಿರುಗಿಸಿ' : 'Drag to rotate 360°'}</span>
        <span>•</span>
        <span>🔍 {isKannada ? 'ಸ್ಕ್ರಾಲ್ ಮಾಡಿ ಜೂಮ್' : 'Scroll to zoom'}</span>
        <span>•</span>
        <span>🏛️ {isKannada ? 'ಕಟ್ಟಡ ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Tap landmark'}</span>
      </div>
    </div>
  );
};
