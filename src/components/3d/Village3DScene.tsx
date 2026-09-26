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
  | 'water'
  | 'sign';

export interface Village3DSceneProps {
  selectedId?: string;
  onSelect?: (id: LandmarkId) => void;
  isKannada?: boolean;
  isAnimeMode?: boolean;
  onToggleAnimeMode?: (val: boolean) => void;
  onOpenAnimeShowcase?: (id: LandmarkId) => void;
}

type TimeOfDay = 'day' | 'sunset' | 'night';

// Helper: Procedural Canvas Textures for crisp authentic village details
function createKannadaSchoolBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Background cream/yellow
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Blue decorative top & bottom borders
  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(0, 0, canvas.width, 18);
  ctx.fillRect(0, canvas.height - 18, canvas.width, 18);

  // Karnataka Flag Circular Emblem on Left
  const cx = 110;
  const cy = 128;
  const r = 80;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#DC2626'; // Red upper half
  ctx.fillRect(cx - r, cy - r, r * 2, r);
  ctx.fillStyle = '#FBBF24'; // Yellow lower half
  ctx.fillRect(cx - r, cy, r * 2, r);
  ctx.restore();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Kannada Bold Signage: ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ ಮುತ್ಸಾಗೊಂದಿ
  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'bold 54px "Noto Sans Kannada", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ', 230, 95);

  ctx.fillStyle = '#B91C1C';
  ctx.font = 'bold 36px "Noto Sans Kannada", "Segoe UI", sans-serif';
  ctx.fillText('ಮುತ್ತಾಗೊಂದಿ • ಹೊಸದುರ್ಗ ತಾಲೂಕು', 234, 165);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

function createMtgSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  // Rustic wood plank background
  ctx.fillStyle = '#78350F';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#92400E';
  ctx.fillRect(8, 8, canvas.width - 16, canvas.height - 16);

  // Grain lines
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 3;
  for (let y = 20; y < canvas.height; y += 22) {
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(canvas.width - 10, y);
    ctx.stroke();
  }

  // Border nails
  ctx.fillStyle = '#D97706';
  ctx.beginPath();
  ctx.arc(20, 20, 6, 0, Math.PI * 2);
  ctx.arc(canvas.width - 20, 20, 6, 0, Math.PI * 2);
  ctx.arc(20, canvas.height - 20, 6, 0, Math.PI * 2);
  ctx.arc(canvas.width - 20, canvas.height - 20, 6, 0, Math.PI * 2);
  ctx.fill();

  // Text: 📍 Muttagundi, India
  ctx.fillStyle = '#FEF3C7';
  ctx.font = 'bold 44px "Outfit", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📍 Muttagundi, India', canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

function createAnganwadiMuralTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Sky blue base
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Lower yellow plinth
  ctx.fillStyle = '#FDE047';
  ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

  // Cheerful painted sun & hills
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(80, 70, 45, 0, Math.PI * 2);
  ctx.fill();

  // Green hills
  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.arc(160, 240, 100, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(320, 240, 120, Math.PI, 0);
  ctx.fill();

  // Kannada text: ಅಂಗನವಾಡಿ ಕೇಂದ್ರ
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 36px "Noto Sans Kannada", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ಅಂಗನವಾಡಿ ಕೇಂದ್ರ', canvas.width / 2, 60);
  ctx.font = 'bold 24px "Noto Sans Kannada", sans-serif';
  ctx.fillText('ಮುತ್ತಾಗೊಂದಿ', canvas.width / 2, 100);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark matte asphalt
  ctx.fillStyle = '#262A33';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Fine road grain
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const gray = 40 + Math.random() * 35;
    ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export const Village3DScene: React.FC<Village3DSceneProps> = ({
  selectedId = 'temple',
  onSelect,
  isKannada = true,
  isAnimeMode: controlledAnimeMode = true,
  onToggleAnimeMode,
  onOpenAnimeShowcase
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
  const villageGroupRef = useRef<THREE.Group | null>(null);

  // Rotation & camera target angles
  const targetRotationYRef = useRef(0);
  const currentRotationYRef = useRef(0);
  const targetRotationXRef = useRef(0.08); // Slight vertical tilt
  const currentRotationXRef = useRef(0.08);

  const targetZoomRef = useRef(32);
  const currentZoomRef = useRef(32);
  const isAutoRotatingRef = useRef(false); // Default false for steady cinematic composure
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [showLabels, setShowLabels] = useState(true);

  const landmarkObjectsRef = useRef<{ [key in LandmarkId]?: THREE.Object3D }>({});
  const interactiveMeshesRef = useRef<{ mesh: THREE.Mesh; id: LandmarkId }[]>([]);
  const lightsRef = useRef<{
    sunLight?: THREE.DirectionalLight;
    ambientLight?: THREE.AmbientLight;
    hemiLight?: THREE.HemisphereLight;
    templeLights?: THREE.PointLight[];
  }>({});

  const [screenCoords, setScreenCoords] = useState<{
    [key in LandmarkId]?: { x: number; y: number; visible: boolean };
  }>({});

  // Map any incoming location ID to landmark ID
  const activeLandmarkId: LandmarkId = useMemo(() => {
    const raw = (selectedId || '').toLowerCase();
    if (raw.includes('thimmappa') || raw.includes('stone') || raw.includes('shrine') || raw.includes('huchharaya')) return 'shrine';
    if (raw.includes('kalle') || raw.includes('temple1')) return 'temple'; // Map main temple
    if (raw.includes('anganwadi') || raw.includes('kindergarden')) return 'kindergarden';
    if (raw.includes('school') || raw.includes('hall') || raw.includes('panchayat')) return 'school';
    if (raw.includes('farm') || raw.includes('areca') || raw.includes('coconut')) return 'farms';
    if (raw.includes('water')) return 'water';
    if (raw.includes('sign')) return 'sign';
    return 'temple';
  }, [selectedId]);

  // Positions corresponding exactly to the Reference Image layout
  const landmarkPositions: Record<LandmarkId, { x: number; y: number; z: number }> = useMemo(() => ({
    shrine: { x: -8.8, y: 5.5, z: -4.5 },       // UPPER LEFT (Old Stone Structure)
    school: { x: 0.2, y: 5.2, z: -5.0 },        // UPPER CENTER (Village Community Hall / School)
    farms: { x: 9.2, y: 5.8, z: -3.8 },         // UPPER RIGHT (Areca Nut Plantation)
    temple: { x: -6.4, y: 4.2, z: 2.2 },        // LOWER LEFT / CENTER (Sri Kalleshwara Temple)
    temple1: { x: 5.5, y: 3.8, z: 1.5 },        // LOWER RIGHT (Shrine & Electric Tower)
    kindergarden: { x: 8.8, y: 2.2, z: 5.8 },   // LOWER RIGHT FOREGROUND (Anganwadi)
    panchayat: { x: 0.2, y: 5.2, z: -5.0 },     // Linked to Community Hall
    water: { x: 3.2, y: 3.5, z: -1.0 },
    sign: { x: 0.0, y: 2.2, z: 7.2 }            // FOREGROUND CENTER (MTG VILLAGE sign)
  }), []);

  // Smoothly focus camera/rotation toward targeted landmark
  const focusOnLandmark = useCallback((id: LandmarkId) => {
    // Keep orientation near reference view while tilting smoothly
    if (id === 'shrine') {
      targetRotationYRef.current = 0.25;
      targetZoomRef.current = 26;
    } else if (id === 'school') {
      targetRotationYRef.current = 0.0;
      targetZoomRef.current = 25;
    } else if (id === 'farms') {
      targetRotationYRef.current = -0.32;
      targetZoomRef.current = 26;
    } else if (id === 'temple') {
      targetRotationYRef.current = 0.18;
      targetZoomRef.current = 24;
    } else if (id === 'temple1' || id === 'kindergarden') {
      targetRotationYRef.current = -0.22;
      targetZoomRef.current = 25;
    } else {
      targetRotationYRef.current = 0.0;
      targetZoomRef.current = 32;
    }
  }, []);

  const resetView = () => {
    targetRotationYRef.current = 0.0;
    targetRotationXRef.current = 0.08;
    targetZoomRef.current = 32;
  };

  useEffect(() => {
    focusOnLandmark(activeLandmarkId);
  }, [activeLandmarkId, focusOnLandmark]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    interactiveMeshesRef.current = [];
    landmarkObjectsRef.current = {};

    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xe2f1ff, 0.012);

    // --- Isometric-style Perspective Camera ---
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.5, 180);
    // Elevated 3D isometric angle matching the reference photo
    camera.position.set(0, 22, currentZoomRef.current);
    camera.lookAt(0, 2.5, 0);

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

    // --- Lighting ---
    // Warm natural sun matching the morning golden sun in reference
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.95);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0xd97706, 0.7);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    sunLight.position.set(-18, 32, 22);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 80;
    sunLight.shadow.camera.left = -22;
    sunLight.shadow.camera.right = 22;
    sunLight.shadow.camera.top = 22;
    sunLight.shadow.camera.bottom = -22;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    const templeLights: THREE.PointLight[] = [];

    lightsRef.current = {
      sunLight,
      ambientLight,
      hemiLight,
      templeLights
    };

    // --- Main Village Diorama Master Group ---
    const villageGroup = new THREE.Group();
    scene.add(villageGroup);
    villageGroupRef.current = villageGroup;

    // --- Shared High-Quality Materials ---
    const asphaltTex = createAsphaltTexture();
    const asphaltMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.85,
      metalness: 0.1
    });

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x228B22, // Forest Green
      roughness: 0.75,
      metalness: 0.05
    });

    const redSoilMat = new THREE.MeshStandardMaterial({
      color: 0x9A3412, // Rich red Karnataka soil
      roughness: 0.9,
      metalness: 0.02
    });

    const weatheredStoneMat = new THREE.MeshStandardMaterial({
      color: 0x78716C,
      roughness: 0.9,
      metalness: 0.05
    });

    const templeGoldMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      roughness: 0.3,
      metalness: 0.85
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

    const whitePlasterMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.6,
      metalness: 0.02
    });

    // Helper: Register clickable landmark mesh
    const registerInteractive = (mesh: THREE.Mesh, id: LandmarkId) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      interactiveMeshesRef.current.push({ mesh, id });
    };

    // =========================================================================
    // 1. DIORAMA BASE & SCULPTED TERRAIN (Miniature Aerial Model)
    // =========================================================================
    const terrainGroup = new THREE.Group();
    villageGroup.add(terrainGroup);

    // Sculpted Green & Red Soil Base Slab
    const baseGeo = new THREE.CylinderGeometry(18.5, 19.5, 2.5, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x451A03, // Dark rich earth underbelly
      roughness: 0.95
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.25;
    baseMesh.receiveShadow = true;
    terrainGroup.add(baseMesh);

    // Lush Green Grass Top Surface
    const topGrassGeo = new THREE.CylinderGeometry(18.4, 18.5, 0.4, 48);
    const topGrassMesh = new THREE.Mesh(topGrassGeo, grassMat);
    topGrassMesh.position.y = 0.1;
    topGrassMesh.receiveShadow = true;
    terrainGroup.add(topGrassMesh);

    // Elevated mounds (Upper Left for Stone Structure, Upper Right for plantation, Center Front for MTG sign)
    const stoneHillGeo = new THREE.ConeGeometry(5.5, 2.6, 24);
    const stoneHill = new THREE.Mesh(stoneHillGeo, redSoilMat);
    stoneHill.position.set(-8.8, 1.2, -4.5);
    stoneHill.receiveShadow = true;
    terrainGroup.add(stoneHill);

    const signKnollGeo = new THREE.ConeGeometry(3.6, 1.4, 20);
    const signKnoll = new THREE.Mesh(signKnollGeo, grassMat);
    signKnoll.position.set(0, 0.6, 6.8);
    signKnoll.receiveShadow = true;
    terrainGroup.add(signKnoll);

    // Plantation Red Earth Terrace (Upper Right)
    const plantationEarthGeo = new THREE.BoxGeometry(10.5, 0.35, 9.5);
    const plantationEarth = new THREE.Mesh(plantationEarthGeo, redSoilMat);
    plantationEarth.position.set(8.5, 0.3, -4.0);
    plantationEarth.rotation.y = 0.05;
    plantationEarth.receiveShadow = true;
    terrainGroup.add(plantationEarth);

    // Soft clouds floating around the base perimeter of the diorama
    const cloudsGroup = new THREE.Group();
    villageGroup.add(cloudsGroup);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1.0,
      transparent: true,
      opacity: 0.82
    });

    for (let c = 0; c < 16; c++) {
      const angle = (c / 16) * Math.PI * 2;
      const dist = 18.8 + Math.random() * 2.2;
      const puffGeo = new THREE.SphereGeometry(2.2 + Math.random() * 1.6, 8, 8);
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        Math.cos(angle) * dist,
        -0.8 + Math.sin(c * 2) * 0.4,
        Math.sin(angle) * dist
      );
      puff.scale.set(1.4, 0.6, 1.0);
      cloudsGroup.add(puff);
    }

    // =========================================================================
    // 2. CENTRAL CURVING ROAD NETWORK WITH DASHED WHITE LANES
    // =========================================================================
    const roadGroup = new THREE.Group();
    villageGroup.add(roadGroup);

    // Main road curve sweeping through the village (as in reference image)
    const roadPoints = [
      new THREE.Vector3(-14, 0.32, 10),
      new THREE.Vector3(-6, 0.32, 7.5),
      new THREE.Vector3(-2.8, 0.32, 4.8),   // Sweeps past front sign
      new THREE.Vector3(0, 0.32, 2.2),      // Central road junction
      new THREE.Vector3(2.5, 0.32, 0.0),    // Ascending past community hall
      new THREE.Vector3(1.2, 0.32, -3.2),
      new THREE.Vector3(-3.5, 0.32, -4.2),  // Toward school and stone structure
      new THREE.Vector3(-12, 0.32, -5.5)
    ];

    const roadCurve = new THREE.CatmullRomCurve3(roadPoints);
    const roadGeo = new THREE.TubeGeometry(roadCurve, 64, 1.4, 6, false);
    const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
    roadMesh.scale.set(1, 0.08, 1); // Flatten into a ribbon
    roadMesh.position.y = 0.32;
    roadMesh.receiveShadow = true;
    roadGroup.add(roadMesh);

    // Fork branching to right towards Anganwadi and Plantation
    const forkPoints = [
      new THREE.Vector3(0, 0.32, 2.2),
      new THREE.Vector3(4.2, 0.32, 3.8),
      new THREE.Vector3(8.5, 0.32, 7.2),
      new THREE.Vector3(14, 0.32, 9.5)
    ];
    const forkCurve = new THREE.CatmullRomCurve3(forkPoints);
    const forkGeo = new THREE.TubeGeometry(forkCurve, 32, 1.3, 6, false);
    const forkMesh = new THREE.Mesh(forkGeo, asphaltMat);
    forkMesh.scale.set(1, 0.08, 1);
    forkMesh.position.y = 0.32;
    forkMesh.receiveShadow = true;
    roadGroup.add(forkMesh);

    // Dashed Lane Centerlines along the Road
    const dashCurvePoints = roadCurve.getPoints(40);
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
    // 3. FOREGROUND CENTER: MTG VILLAGE 3D SCULPTED SIGN
    // =========================================================================
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 1.2, 6.8);
    villageGroup.add(signGroup);
    landmarkObjectsRef.current['sign'] = signGroup;

    // Rock base mound with boulders
    const boulderMat = new THREE.MeshStandardMaterial({ color: 0x57534E, roughness: 0.9 });
    for (let b = 0; b < 9; b++) {
      const bGeo = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.4, 0);
      const boulder = new THREE.Mesh(bGeo, boulderMat);
      boulder.position.set(
        (Math.random() - 0.5) * 3.4,
        0.2 + Math.random() * 0.3,
        (Math.random() - 0.5) * 1.8
      );
      boulder.castShadow = true;
      signGroup.add(boulder);
    }

    // Large 3D stylized letters: "MTG"
    const mtgMat = new THREE.MeshStandardMaterial({
      color: 0x16A34A, // Lush vibrant green with leaf feel
      roughness: 0.35,
      metalness: 0.15
    });

    const letterM = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.35), mtgMat);
    letterM.position.set(-1.1, 1.6, 0);
    registerInteractive(letterM, 'sign');
    signGroup.add(letterM);

    const letterT = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.35), mtgMat);
    letterT.position.set(0, 1.6, 0);
    registerInteractive(letterT, 'sign');
    signGroup.add(letterT);

    const letterG = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.35), mtgMat);
    letterG.position.set(1.1, 1.6, 0);
    registerInteractive(letterG, 'sign');
    signGroup.add(letterG);

    // 3D Block Letters: "VILLAGE" beneath MTG
    const villageTextMat = new THREE.MeshStandardMaterial({
      color: 0xFEF3C7, // Warm ivory/cream
      roughness: 0.4,
      metalness: 0.05
    });
    const villageBar = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.5, 0.28), villageTextMat);
    villageBar.position.set(0, 0.85, 0.08);
    registerInteractive(villageBar, 'sign');
    signGroup.add(villageBar);

    // Wooden plank underneath: 📍 Muttagundi, India
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: createMtgSignTexture(),
      roughness: 0.7
    });
    const plaqueMesh = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 0.1), plaqueMat);
    plaqueMesh.position.set(0, 0.35, 0.18);
    registerInteractive(plaqueMesh, 'sign');
    signGroup.add(plaqueMesh);

    // =========================================================================
    // 4. LOWER LEFT / CENTER: SRI KALLESHWARA SWAMY TEMPLE COMPLEX
    // =========================================================================
    const templeGroup = new THREE.Group();
    templeGroup.position.set(-6.4, 0.4, 2.2);
    villageGroup.add(templeGroup);
    landmarkObjectsRef.current['temple'] = templeGroup;

    // Temple Plinth / Raised Courtyard
    const courtyardGeo = new THREE.BoxGeometry(7.2, 0.4, 8.5);
    const courtyardMesh = new THREE.Mesh(courtyardGeo, new THREE.MeshStandardMaterial({ color: 0xFDE68A, roughness: 0.8 }));
    courtyardMesh.position.set(0, 0.2, 0);
    courtyardMesh.receiveShadow = true;
    templeGroup.add(courtyardMesh);

    // Perimeter Compound Wall with Arches and Colorful Accents
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xFEF08A, roughness: 0.7 });
    const wallTrimMat = new THREE.MeshStandardMaterial({ color: 0xDC2626 });

    // Compound Wall Sections
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.4, 0.3), wallMat);
    backWall.position.set(0, 1.0, -4.1);
    backWall.castShadow = true;
    templeGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 8.2), wallMat);
    leftWall.position.set(-3.45, 1.0, 0);
    leftWall.castShadow = true;
    templeGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 8.2), wallMat);
    rightWall.position.set(3.45, 1.0, 0);
    rightWall.castShadow = true;
    templeGroup.add(rightWall);

    // Colorful Decorative Arches on the Outer Wall (Pink & Turquoise arches)
    for (let a = -3; a <= 3; a += 1.2) {
      const archMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16, 1, false, 0, Math.PI), templePinkMat);
      archMesh.rotation.z = Math.PI;
      archMesh.rotation.y = Math.PI / 2;
      archMesh.position.set(-3.5, 1.7, a);
      templeGroup.add(archMesh);
    }

    // --- Magnificent Multi-Tiered Dravidian Temple Gopuram ---
    const gopuraGroup = new THREE.Group();
    gopuraGroup.position.set(-1.6, 0.4, -1.8);
    templeGroup.add(gopuraGroup);

    // Base Tier (Level 1)
    const gopuraBase = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.6, 3.0), templeYellowMat);
    gopuraBase.position.y = 0.8;
    registerInteractive(gopuraBase, 'temple');
    gopuraGroup.add(gopuraBase);

    // Tier 2 (Turquoise with niches)
    const tier2 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.4, 2.5), templeBlueMat);
    tier2.position.y = 2.3;
    registerInteractive(tier2, 'temple');
    gopuraGroup.add(tier2);

    // Tier 3 (Pink with cornices)
    const tier3 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 2.0), templePinkMat);
    tier3.position.y = 3.6;
    registerInteractive(tier3, 'temple');
    gopuraGroup.add(tier3);

    // Tier 4 (Orange/Red)
    const tier4 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.5), new THREE.MeshStandardMaterial({ color: 0xEA580C }));
    tier4.position.y = 4.7;
    registerInteractive(tier4, 'temple');
    gopuraGroup.add(tier4);

    // Golden Sikhara Dome & Kalashas on top
    const domeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.1, 0.8, 16), templeGoldMat);
    domeMesh.position.y = 5.6;
    gopuraGroup.add(domeMesh);

    // 3 Golden Kalasha Finials
    for (let k = -0.4; k <= 0.4; k += 0.4) {
      const kalasha = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.7, 12), templeGoldMat);
      kalasha.position.set(k, 6.25, 0);
      gopuraGroup.add(kalasha);
    }

    // Temple Courtyard Pillared Hall (Mantapa)
    const mantapaRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 4.2), wallMat);
    mantapaRoof.position.set(1.2, 1.8, 0.5);
    mantapaRoof.castShadow = true;
    registerInteractive(mantapaRoof, 'temple');
    templeGroup.add(mantapaRoof);

    // Columns for Mantapa
    for (let cx = -0.4; cx <= 2.8; cx += 1.6) {
      for (let cz = -1.2; cz <= 2.2; cz += 1.6) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8), wallTrimMat);
        pillar.position.set(cx, 0.9, cz);
        templeGroup.add(pillar);
      }
    }

    // Sacred Saffron / Orange Flags fluttering on tall poles
    const flagMat = new THREE.MeshStandardMaterial({ color: 0xF97316, roughness: 0.5, side: THREE.DoubleSide });
    for (let f = 0; f < 3; f++) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 6), new THREE.MeshStandardMaterial({ color: 0x78716C }));
      pole.position.set(-0.2 + f * 1.2, 2.1, 2.8);
      templeGroup.add(pole);

      // Triangular Flag
      const flagShape = new THREE.Shape();
      flagShape.moveTo(0, 0);
      flagShape.lineTo(0.9, 0.35);
      flagShape.lineTo(0, 0.7);
      flagShape.closePath();
      const flagMesh = new THREE.Mesh(new THREE.ShapeGeometry(flagShape), flagMat);
      flagMesh.position.set(-0.2 + f * 1.2, 3.5, 2.8);
      flagMesh.rotation.y = 0.2;
      templeGroup.add(flagMesh);
    }

    // Temple entrance archway with golden bell
    const entranceArch = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.4), templeYellowMat);
    entranceArch.position.set(1.2, 1.2, 4.1);
    templeGroup.add(entranceArch);

    // Shady trees around the temple
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.8 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.9 });
    for (let t = 0; t < 5; t++) {
      const tree = new THREE.Group();
      tree.position.set(-4.2 + (t % 2) * 8.4, 0, -2.5 + t * 2.2);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 2.5, 8), trunkMat);
      trunk.position.y = 1.25;
      tree.add(trunk);
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), treeMat);
      foliage.position.y = 2.8;
      foliage.castShadow = true;
      tree.add(foliage);
      templeGroup.add(tree);
    }

    // =========================================================================
    // 5. UPPER LEFT: OLD STONE STRUCTURE (Ancient Granite Megalithic Shrine)
    // =========================================================================
    const stoneStructureGroup = new THREE.Group();
    stoneStructureGroup.position.set(-8.8, 1.4, -4.5);
    villageGroup.add(stoneStructureGroup);
    landmarkObjectsRef.current['shrine'] = stoneStructureGroup;

    // Stacked irregular granite boulders & weathered megalithic slabs
    // Left stone pillars
    const stoneCol1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.4, 1.2), weatheredStoneMat);
    stoneCol1.position.set(-1.3, 1.2, 0);
    registerInteractive(stoneCol1, 'shrine');
    stoneStructureGroup.add(stoneCol1);

    // Right stone pillar
    const stoneCol2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 1.1), weatheredStoneMat);
    stoneCol2.position.set(1.3, 1.2, 0);
    registerInteractive(stoneCol2, 'shrine');
    stoneStructureGroup.add(stoneCol2);

    // Back stone wall
    const stoneBack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 1.2), weatheredStoneMat);
    stoneBack.position.set(0, 1.2, -1.0);
    registerInteractive(stoneBack, 'shrine');
    stoneStructureGroup.add(stoneBack);

    // Massive Weathered Stone Lintel (Roof slab)
    const stoneRoof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.8, 3.2), weatheredStoneMat);
    stoneRoof.position.set(0, 2.7, -0.4);
    registerInteractive(stoneRoof, 'shrine');
    stoneStructureGroup.add(stoneRoof);

    // Mound of natural weathered rocks and dry grass piled around
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x57534E, roughness: 0.95 });
    for (let r = 0; r < 18; r++) {
      const rockMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.5, 0), rockMat);
      rockMesh.position.set(
        (Math.random() - 0.5) * 4.6,
        0.3 + Math.random() * 2.2,
        (Math.random() - 0.5) * 3.8
      );
      rockMesh.scale.set(1.2, 0.7, 1.1);
      rockMesh.castShadow = true;
      registerInteractive(rockMesh, 'shrine');
      stoneStructureGroup.add(rockMesh);
    }

    // Wild shrubs growing on top of stone roof
    const wildShrub = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), new THREE.MeshStandardMaterial({ color: 0x4D7C0F, roughness: 0.9 }));
    wildShrub.position.set(-0.6, 3.3, -0.3);
    stoneStructureGroup.add(wildShrub);

    // =========================================================================
    // 6. UPPER CENTER: VILLAGE COMMUNITY HALL / GOVT PRIMARY SCHOOL
    // =========================================================================
    const schoolGroup = new THREE.Group();
    schoolGroup.position.set(0.2, 0.4, -5.0);
    villageGroup.add(schoolGroup);
    landmarkObjectsRef.current['school'] = schoolGroup;
    landmarkObjectsRef.current['panchayat'] = schoolGroup;

    // School Building (Yellow/Cream stucco with blue doors matching real photo)
    const schoolWallMat = new THREE.MeshStandardMaterial({ color: 0xFEF08A, roughness: 0.6 });
    const schoolBase = new THREE.Mesh(new THREE.BoxGeometry(6.8, 2.6, 3.8), schoolWallMat);
    schoolBase.position.y = 1.3;
    registerInteractive(schoolBase, 'school');
    schoolGroup.add(schoolBase);

    // Kannada Signboard Banner across top: "ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ ಮುತ್ಸಾಗೊಂದಿ"
    const bannerTex = createKannadaSchoolBannerTexture();
    const bannerMat = new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.4 });
    const bannerMesh = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.9, 0.1), bannerMat);
    bannerMesh.position.set(0, 2.55, 1.95);
    registerInteractive(bannerMesh, 'school');
    schoolGroup.add(bannerMesh);

    // Blue Metal Doors & Windows on front facade
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1E40AF, roughness: 0.4 });
    const door1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.7, 0.12), doorMat);
    door1.position.set(-1.8, 0.85, 1.92);
    schoolGroup.add(door1);

    const door2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.7, 0.12), doorMat);
    door2.position.set(1.8, 0.85, 1.92);
    schoolGroup.add(door2);

    // Windows
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x60A5FA, roughness: 0.2 });
    for (let w = -0.8; w <= 0.8; w += 0.8) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.12), windowMat);
      win.position.set(w, 1.2, 1.92);
      schoolGroup.add(win);
    }

    // Yellow Rooftop Water Tank (Sintex-style on the left roof corner as in reference)
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xFBBF24, roughness: 0.4 });
    const waterTank = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.7, 16), tankMat);
    waterTank.position.set(-2.5, 3.0, 0.8);
    waterTank.castShadow = true;
    schoolGroup.add(waterTank);

    // Entrance concrete steps and green railings leading up
    const stepsMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.7 });
    const steps = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, 1.2), stepsMat);
    steps.position.set(0, 0.18, 2.4);
    schoolGroup.add(steps);

    // Green metal railing
    const railMat = new THREE.MeshStandardMaterial({ color: 0x15803D, metalness: 0.7, roughness: 0.3 });
    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.6, 0.08), railMat);
    rail.position.set(0, 0.6, 2.9);
    schoolGroup.add(rail);

    // Trees beside school
    const schoolTree = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), treeMat);
    schoolTree.position.set(-4.2, 3.2, -0.5);
    schoolGroup.add(schoolTree);

    // =========================================================================
    // 7. UPPER RIGHT: DENSE ARECA NUT PLANTATION (Real Photo Style)
    // =========================================================================
    const plantationGroup = new THREE.Group();
    plantationGroup.position.set(8.5, 0.4, -4.0);
    villageGroup.add(plantationGroup);
    landmarkObjectsRef.current['farms'] = plantationGroup;

    // Multi-row grid of authentic tall, slender areca palms (Areca catechu)
    const arecaTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x64748B, // Ringed slate grey-brown bark
      roughness: 0.85
    });

    const arecaFrondMat = new THREE.MeshStandardMaterial({
      color: 0x15803D, // Lush dark emerald green
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    const rows = 5;
    const cols = 6;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const posX = (c - (cols - 1) / 2) * 1.4 + (Math.random() - 0.5) * 0.2;
        const posZ = (r - (rows - 1) / 2) * 1.5 + (Math.random() - 0.5) * 0.2;
        const treeHeight = 5.2 + Math.random() * 1.6;

        const palmTree = new THREE.Group();
        palmTree.position.set(posX, 0, posZ);

        // Slender ringed trunk
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.12, treeHeight, 8),
          arecaTrunkMat
        );
        trunk.position.y = treeHeight / 2;
        trunk.castShadow = true;
        registerInteractive(trunk, 'farms');
        palmTree.add(trunk);

        // Radiating feathery palm fronds crown
        const crownGroup = new THREE.Group();
        crownGroup.position.y = treeHeight;
        for (let f = 0; f < 7; f++) {
          const fAngle = (f / 7) * Math.PI * 2 + Math.random() * 0.2;
          const frondMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.7, 1.8),
            arecaFrondMat
          );
          frondMesh.rotation.x = Math.PI / 3 + (Math.random() - 0.5) * 0.2;
          frondMesh.rotation.y = fAngle;
          frondMesh.position.set(Math.sin(fAngle) * 0.4, -0.2, Math.cos(fAngle) * 0.4);
          crownGroup.add(frondMesh);
        }
        palmTree.add(crownGroup);
        plantationGroup.add(palmTree);
      }
    }

    // =========================================================================
    // 8. LOWER RIGHT: SRI KALLESHWARA SWAMY TEMPLE (Muttagundi Shrine) & ELECTRIC TOWER
    // =========================================================================
    const shrineGroup = new THREE.Group();
    shrineGroup.position.set(5.5, 0.4, 1.5);
    villageGroup.add(shrineGroup);
    landmarkObjectsRef.current['temple1'] = shrineGroup;

    // Whitewashed village shrine structure
    const shrineBuilding = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 2.2), whitePlasterMat);
    shrineBuilding.position.set(0, 0.9, 0);
    registerInteractive(shrineBuilding, 'temple1');
    shrineGroup.add(shrineBuilding);

    // Stepped white vimana tower on the left side of the shrine (as in photo)
    const vimana1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.2), whitePlasterMat);
    vimana1.position.set(-0.8, 2.15, 0);
    shrineGroup.add(vimana1);
    const vimana2 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 4), whitePlasterMat);
    vimana2.rotation.y = Math.PI / 4;
    vimana2.position.set(-0.8, 2.85, 0);
    registerInteractive(vimana2, 'temple1');
    shrineGroup.add(vimana2);

    // Realistic High-Voltage Steel Lattice Transmission Pylon (ವಿದ್ಯುತ್ ಗೋಪುರ)
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Galvanized dark steel
      metalness: 0.85,
      roughness: 0.4
    });

    const pylonGroup = new THREE.Group();
    pylonGroup.position.set(1.6, 0, -1.2);
    shrineGroup.add(pylonGroup);

    // 4 Main corner legs tapering upward
    const legGeo = new THREE.CylinderGeometry(0.04, 0.06, 9.5, 6);
    const leg1 = new THREE.Mesh(legGeo, pylonMat);
    leg1.position.set(-0.45, 4.75, -0.45);
    pylonGroup.add(leg1);
    const leg2 = new THREE.Mesh(legGeo, pylonMat);
    leg2.position.set(0.45, 4.75, -0.45);
    pylonGroup.add(leg2);
    const leg3 = new THREE.Mesh(legGeo, pylonMat);
    leg3.position.set(-0.45, 4.75, 0.45);
    pylonGroup.add(leg3);
    const leg4 = new THREE.Mesh(legGeo, pylonMat);
    leg4.position.set(0.45, 4.75, 0.45);
    pylonGroup.add(leg4);

    // Crossarms at the top
    const crossarm1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 0.1), pylonMat);
    crossarm1.position.set(0, 8.2, 0);
    pylonGroup.add(crossarm1);

    const crossarm2 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 0.1), pylonMat);
    crossarm2.position.set(0, 9.2, 0);
    pylonGroup.add(crossarm2);

    // =========================================================================
    // 9. LOWER RIGHT / FOREGROUND: ANGANWADI CENTER (ಅಂಗನವಾಡಿ ಕೇಂದ್ರ ಮುತ್ತಾಗೊಂದಿ)
    // =========================================================================
    const anganwadiGroup = new THREE.Group();
    anganwadiGroup.position.set(8.8, 0.4, 5.8);
    villageGroup.add(anganwadiGroup);
    landmarkObjectsRef.current['kindergarden'] = anganwadiGroup;

    // Sky-blue painted rectangular building with mural texture
    const muralTex = createAnganwadiMuralTexture();
    const anganwadiMat = new THREE.MeshStandardMaterial({
      map: muralTex,
      roughness: 0.5
    });

    const anganwadiMesh = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.8, 2.6), anganwadiMat);
    anganwadiMesh.position.y = 0.9;
    registerInteractive(anganwadiMesh, 'kindergarden');
    anganwadiGroup.add(anganwadiMesh);

    // Blue Sintex-style cylindrical water tank on the roof
    const blueTankMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.4 });
    const roofTank = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.65, 16), blueTankMat);
    roofTank.position.set(1.4, 2.15, 0.4);
    roofTank.castShadow = true;
    anganwadiGroup.add(roofTank);

    // Yellow boundary wall with entrance
    const boundaryMat = new THREE.MeshStandardMaterial({ color: 0xFDE047, roughness: 0.7 });
    const bWall1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.7, 0.12), boundaryMat);
    bWall1.position.set(0, 0.35, 1.6);
    anganwadiGroup.add(bWall1);

    // Trees beside anganwadi
    const angTree = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 1), treeMat);
    angTree.position.set(-2.8, 1.8, 0.4);
    anganwadiGroup.add(angTree);

    // =========================================================================
    // 10. INTERACTION, DRAGGING & ANIMATION LOOP
    // =========================================================================
    const handlePointerDown = (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      dragDistanceRef.current = 0;
      previousMousePosition.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) return;
      const deltaX = clientX - previousMousePosition.current.x;
      const deltaY = clientY - previousMousePosition.current.y;
      dragDistanceRef.current += Math.abs(deltaX) + Math.abs(deltaY);

      targetRotationYRef.current += deltaX * 0.007;
      targetRotationXRef.current = Math.max(-0.25, Math.min(0.35, targetRotationXRef.current + deltaY * 0.004));

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
      targetZoomRef.current = Math.max(18, Math.min(46, targetZoomRef.current + e.deltaY * 0.02));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('wheel', onWheel, { passive: false });

    // --- Animation Render Loop ---
    let animationFrameId: number;
    const tempVec = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto rotation if enabled
      if (isAutoRotatingRef.current) {
        targetRotationYRef.current += 0.003;
      }

      // Smooth interpolation (Lerp)
      currentRotationYRef.current += (targetRotationYRef.current - currentRotationYRef.current) * 0.08;
      currentRotationXRef.current += (targetRotationXRef.current - currentRotationXRef.current) * 0.08;
      currentZoomRef.current += (targetZoomRef.current - currentZoomRef.current) * 0.08;

      if (villageGroupRef.current) {
        villageGroupRef.current.rotation.y = currentRotationYRef.current;
        villageGroupRef.current.rotation.x = currentRotationXRef.current;
      }

      camera.position.z = currentZoomRef.current;
      camera.lookAt(0, 2.5, 0);

      renderer.render(scene, camera);

      // Calculate 2D Screen Coordinates for Floating Labels
      const coords: { [key in LandmarkId]?: { x: number; y: number; visible: boolean } } = {};
      const halfWidth = width / 2;
      const halfHeight = height / 2;

      (Object.keys(landmarkPositions) as LandmarkId[]).forEach((id) => {
        const pos = landmarkPositions[id];
        tempVec.set(pos.x, pos.y, pos.z);

        if (villageGroupRef.current) {
          tempVec.applyEuler(villageGroupRef.current.rotation);
        }

        tempVec.project(camera);

        const x = (tempVec.x * halfWidth) + halfWidth;
        const y = -(tempVec.y * halfHeight) + halfHeight;
        const visible = tempVec.z < 1.0;

        coords[id] = { x, y, visible };
      });

      setScreenCoords(coords);
    };

    animate();

    // Clean up
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
  }, [landmarkPositions, onSelect, focusOnLandmark]);

  // Adjust Lighting on TimeOfDay change
  useEffect(() => {
    const { sunLight, ambientLight, hemiLight } = lightsRef.current;
    if (!sunLight || !ambientLight || !hemiLight) return;

    if (timeOfDay === 'day') {
      sunLight.color.setHex(0xfffbeb);
      sunLight.intensity = 2.2;
      ambientLight.color.setHex(0xfff7ed);
      ambientLight.intensity = 0.95;
      hemiLight.color.setHex(0xbae6fd);
      hemiLight.groundColor.setHex(0xd97706);
    } else if (timeOfDay === 'sunset') {
      sunLight.color.setHex(0xfb923c); // Warm amber golden-hour
      sunLight.intensity = 1.9;
      ambientLight.color.setHex(0xfef3c7);
      ambientLight.intensity = 0.8;
      hemiLight.color.setHex(0xf472b6);
      hemiLight.groundColor.setHex(0x9a3412);
    } else if (timeOfDay === 'night') {
      sunLight.color.setHex(0x38bdf8);
      sunLight.intensity = 0.35;
      ambientLight.color.setHex(0x1e293b);
      ambientLight.intensity = 0.5;
      hemiLight.color.setHex(0x0f172a);
      hemiLight.groundColor.setHex(0x020617);
    }
  }, [timeOfDay]);

  // Floating Labels definitions matching the Reference Image exactly
  const labelsToRender: { id: LandmarkId; text_en: string; text_kn: string; sub?: string }[] = [
    {
      id: 'shrine',
      text_en: 'Old Stone Structure',
      text_kn: 'ಶ್ರೀ ಲಕ್ಷ್ಮಿ ತಿಮ್ಮಪ್ಪ (ಹಳೆಯ ಕಲ್ಲಿನ ಗುಡಿ)',
      sub: 'Ancient Granite Cave Shrine'
    },
    {
      id: 'school',
      text_en: 'Village Community Hall',
      text_kn: 'ಸರ್ಕಾರಿ ಶಾಲೆ & ಸಮುದಾಯ ಭವನ',
      sub: 'Govt Higher Primary School'
    },
    {
      id: 'farms',
      text_en: 'Areca Nut Plantation',
      text_kn: 'ಅಡಿಕೆ ತೋಟ',
      sub: 'Arecanut & Coconut Palms'
    },
    {
      id: 'temple',
      text_en: 'Sri Kalleshwara Swamy Temple',
      text_kn: 'ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಾಲಯ',
      sub: 'Main Dravidian Gopuram'
    },
    {
      id: 'temple1',
      text_en: 'SRI KALLESHWARA SWAMY TEMPLE\n(Muttagundi)',
      text_kn: 'ಕಲ್ಲೇ ದೇವರ ಗುಡಿ (ವಿದ್ಯುತ್ ಗೋಪುರ)',
      sub: 'Village Shrine & Pylon'
    },
    {
      id: 'kindergarden',
      text_en: 'ಅಂಗನವಾಡಿ ಕೇಂದ್ರ ಮುತ್ತಾಗೊಂದಿ',
      text_kn: 'ಅಂಗನವಾಡಿ ಕೇಂದ್ರ ಮುತ್ತಾಗೊಂದಿ',
      sub: 'Anganwadi Preschool Center'
    }
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px', userSelect: 'none' }}>
      {/* 3D WebGL Canvas Mount Container */}
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

      {/* Floating 3D Labels matching the Reference Image Capsules */}
      {showLabels && labelsToRender.map((label) => {
        const coord = screenCoords[label.id];
        if (!coord || !coord.visible) return null;
        const isSelected = activeLandmarkId === label.id;

        return (
          <div
            key={label.id}
            onClick={() => {
              if (onSelect) onSelect(label.id);
              focusOnLandmark(label.id);
            }}
            style={{
              position: 'absolute',
              left: `${coord.x}px`,
              top: `${coord.y}px`,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              zIndex: isSelected ? 30 : 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* Elegant Capsule Label matching Reference Image */}
            <div
              style={{
                background: isSelected ? 'rgba(23, 17, 10, 0.94)' : 'rgba(28, 25, 23, 0.88)',
                backdropFilter: 'blur(8px)',
                border: isSelected ? '1.5px solid #F59E0B' : '1px solid rgba(254, 243, 199, 0.5)',
                boxShadow: isSelected
                  ? '0 6px 18px rgba(0,0,0,0.6), 0 0 14px rgba(245, 158, 11, 0.5)'
                  : '0 4px 14px rgba(0,0,0,0.45)',
                borderRadius: '16px',
                padding: '5px 12px',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 800,
                textAlign: 'center',
                whiteSpace: 'pre-line',
                lineHeight: 1.25,
                transition: 'all 0.2s ease',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <span>{isKannada ? label.text_kn : label.text_en}</span>
            </div>

            {/* Thin vertical pointer line */}
            <div
              style={{
                width: '1.5px',
                height: '18px',
                background: isSelected ? '#F59E0B' : 'rgba(255, 255, 255, 0.65)',
                boxShadow: '0 0 4px rgba(0,0,0,0.5)'
              }}
            />

            {/* Location dot at building base */}
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isSelected ? '#F59E0B' : '#FFFFFF',
                boxShadow: '0 0 6px rgba(0,0,0,0.8)'
              }}
            />
          </div>
        );
      })}

      {/* Floating Compact Controls Toolbar (Glassmorphism) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(7, 15, 30, 0.82)',
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

        {/* Toggle Labels */}
        <button
          onClick={() => setShowLabels(!showLabels)}
          style={{
            background: showLabels ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            border: showLabels ? '1px solid #10B981' : 'none',
            borderRadius: '14px',
            padding: '5px 9px',
            color: showLabels ? '#34D399' : '#94A3B8',
            fontSize: '0.74rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
          title="Toggle Landmark Labels"
        >
          🏷️
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

        {/* Reset View */}
        <button
          onClick={resetView}
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
          title="Reset Camera View"
        >
          🎯
        </button>
      </div>

      {/* Floating Bottom Quick Zoom & Drag Hints */}
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
      </div>
    </div>
  );
};
