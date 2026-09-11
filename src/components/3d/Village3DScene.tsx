import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';

export type LandmarkId =
  | 'panchayat'
  | 'temple'
  | 'school'
  | 'farms'
  | 'temple1'
  | 'kindergarden'
  | 'water'
  | 'sports'
  | 'clinic';

export interface Village3DSceneProps {
  selectedId?: string;
  onSelect?: (id: LandmarkId) => void;
  isKannada?: boolean;
}

type TimeOfDay = 'day' | 'sunset' | 'night';

export const Village3DScene: React.FC<Village3DSceneProps> = ({
  selectedId = 'panchayat',
  onSelect,
  isKannada = true
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
  const rotationGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationYRef = useRef(0);
  const targetZoomRef = useRef(26);
  const currentZoomRef = useRef(26);
  const isAutoRotatingRef = useRef(true);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('sunset');
  const [hoveredLandmark, setHoveredLandmark] = useState<LandmarkId | null>(null);

  const landmarkObjectsRef = useRef<{ [key in LandmarkId]?: THREE.Group }>({});
  const interactiveMeshesRef = useRef<{ mesh: THREE.Mesh; id: LandmarkId }[]>([]);
  const lightsRef = useRef<{
    sunLight?: THREE.DirectionalLight;
    ambientLight?: THREE.AmbientLight;
    hemiLight?: THREE.HemisphereLight;
    pointLights?: THREE.PointLight[];
  }>({});

  const [screenCoords, setScreenCoords] = useState<{
    [key in LandmarkId]?: { x: number; y: number; visible: boolean };
  }>({});

  // Map any incoming location ID to landmark ID
  const activeLandmarkId: LandmarkId = useMemo(() => {
    const raw = (selectedId || '').toLowerCase();
    if (raw.includes('kalle') || raw.includes('temple1') || raw.includes('sports') || raw.includes('ground')) return 'temple1';
    if (raw.includes('anganwadi') || raw.includes('kindergarden') || raw.includes('clinic') || raw.includes('health') || raw.includes('children')) return 'kindergarden';
    if (raw.includes('anjaneya') || raw.includes('temple') || raw.includes('ranganatha')) return 'temple';
    if (raw.includes('panchayat') || raw.includes('hall') || raw.includes('community') || raw.includes('shop')) return 'panchayat';
    if (raw.includes('school') || raw.includes('primary')) return 'school';
    if (raw.includes('water') || raw.includes('ro') || raw.includes('tank')) return 'water';
    if (raw.includes('farm') || raw.includes('crop') || raw.includes('agriculture') || raw.includes('areca') || raw.includes('coconut')) return 'farms';
    return 'panchayat';
  }, [selectedId]);

  const landmarkDetails: {
    id: LandmarkId;
    label_en: string;
    label_kn: string;
    sub_en: string;
    sub_kn: string;
    icon: string;
    color: string;
  }[] = [
    {
      id: 'panchayat',
      label_en: 'Muttagondi Community Hall',
      label_kn: 'ಮುತ್ತಾಗೊಂದಿ ಸಮುದಾಯ ಭವನ',
      sub_en: 'Shops',
      sub_kn: 'ಅಂಗಡಿಗಳು',
      icon: '🏛️',
      color: '#10B981'
    },
    {
      id: 'temple',
      label_en: 'Sri ANJANEYA SWAMY Temple',
      label_kn: 'ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ದೇವಾಲಯ',
      sub_en: 'Temple',
      sub_kn: 'ದೇವಾಲಯ',
      icon: '🛕',
      color: '#F59E0B'
    },
    {
      id: 'school',
      label_en: 'Govt Primary School',
      label_kn: 'ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ ಮುತ್ತಾಗೊಂದಿ',
      sub_en: 'School',
      sub_kn: 'ತರಗತಿ ಕೊಠಡಿ & ಆವರಣ',
      icon: '🏫',
      color: '#3B82F6'
    },
    {
      id: 'farms',
      label_en: 'Arecanut & Coconut Farms',
      label_kn: 'ಅಡಿಕೆ ಮತ್ತು ತೆಂಗಿನ ತೋಟ',
      sub_en: 'Farms',
      sub_kn: 'ಕೃಷಿ ಭೂಮಿ',
      icon: '🌾',
      color: '#84CC16'
    },
    {
      id: 'temple1',
      label_en: 'Kalle Devar Gudi',
      label_kn: 'ಕಲ್ಲೇ ದೇವರ ಗುಡಿ',
      sub_en: 'Temple',
      sub_kn: 'ದೇವಾಲಯ',
      icon: '🛕',
      color: '#8B5CF6'
    },
    {
      id: 'kindergarden',
      label_en: 'Anganwadi Kendra Muttagondi',
      label_kn: 'ಅಂಗನವಾಡಿ ಕೇಂದ್ರ ಮುತ್ತಾಗೊಂದಿ',
      sub_en: 'Children',
      sub_kn: 'ಮಕ್ಕಳು',
      icon: '👶',
      color: '#FFB3D9'
    },
    {
      id: 'water',
      label_en: 'Pure Water RO Plant',
      label_kn: 'ಶುದ್ಧ ಕುಡಿಯುವ ನೀರು',
      sub_en: 'RO Filtration Hub',
      sub_kn: 'ನೀರಿನ ಟ್ಯಾಂಕ್',
      icon: '💧',
      color: '#06B6D4'
    }
  ];

  // Rotate smoothly to targeted landmark
  const rotateToLandmark = useCallback((id: LandmarkId) => {
    const angleMap: Record<LandmarkId, number> = {
      panchayat: 0,
      temple: -Math.PI * 0.45,
      school: -Math.PI * 0.85,
      temple1: Math.PI,
      sports: Math.PI,
      farms: Math.PI * 0.5,
      kindergarden: Math.PI * 0.22,
      clinic: Math.PI * 0.22,
      water: Math.PI * 0.82
    };

    if (angleMap[id] !== undefined) {
      const current = targetRotationYRef.current;
      const target = angleMap[id];
      const diff = ((target - (current % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      targetRotationYRef.current = current + diff;
    }
  }, []);

  // Sync external selectedId prop to 3D rotation
  useEffect(() => {
    rotateToLandmark(activeLandmarkId);
  }, [activeLandmarkId, rotateToLandmark]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    interactiveMeshesRef.current = [];
    landmarkObjectsRef.current = {};

    const width = container.clientWidth;
    const height = container.clientHeight || 460;

    // --- Scene & Fog ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1222);
    scene.fog = new THREE.FogExp2(0x0a1222, 0.024);

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 150);
    camera.position.set(0, 18, currentZoomRef.current);
    camera.lookAt(0, 0, 0);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.75);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.6);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    sunLight.position.set(16, 26, 16);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -16;
    sunLight.shadow.camera.right = 16;
    sunLight.shadow.camera.top = 16;
    sunLight.shadow.camera.bottom = -16;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const pointLights: THREE.PointLight[] = [];

    lightsRef.current = {
      sunLight,
      ambientLight,
      hemiLight,
      pointLights
    };

    // --- Main Village Group ---
    const villageGroup = new THREE.Group();
    scene.add(villageGroup);
    rotationGroupRef.current = villageGroup;

    // --- High-Quality Materials ---
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.85,
      metalness: 0.05
    });

    const grassBorderMat = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.9
    });

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.75
    });

    const darkBasaltMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.95
    });

    const wallWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.65
    });

    const wallOchreMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.7
    });

    const roofRedMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.5,
      metalness: 0.1
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.3,
      metalness: 0.85
    });

    const saffronMat = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      roughness: 0.6
    });

    const kannadaYellowMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.5
    });

    const kannadaRedMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.5
    });

    const woodTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x713f12,
      roughness: 0.9
    });

    const leavesMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.7
    });

    const arecaTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.85
    });

    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.95
    });

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.45,
      transparent: true,
      opacity: 0.88
    });

    const pitchMat = new THREE.MeshStandardMaterial({
      color: 0xa16207,
      roughness: 0.9
    });

    const cyanMat = new THREE.MeshStandardMaterial({
      color: 0x0891b2,
      roughness: 0.4
    });

    // Register mesh for raycasting
    const registerInteractive = (mesh: THREE.Mesh, id: LandmarkId) => {
      mesh.userData = { landmarkId: id };
      interactiveMeshesRef.current.push({ mesh, id });
    };

    // --- 1. Village Island Base ---
    const islandGeo = new THREE.CylinderGeometry(12.5, 13.5, 1.4, 48);
    const islandMesh = new THREE.Mesh(islandGeo, grassMat);
    islandMesh.position.y = -0.7;
    islandMesh.receiveShadow = true;
    villageGroup.add(islandMesh);

    // Stepped sub-island shelf
    const shelfGeo = new THREE.CylinderGeometry(13.6, 14.2, 0.8, 48);
    const shelfMesh = new THREE.Mesh(shelfGeo, grassBorderMat);
    shelfMesh.position.y = -1.6;
    shelfMesh.receiveShadow = true;
    villageGroup.add(shelfMesh);

    // Deep geological foundation
    const foundationGeo = new THREE.CylinderGeometry(14.2, 14.8, 1.8, 48);
    const foundationMesh = new THREE.Mesh(foundationGeo, darkBasaltMat);
    foundationMesh.position.y = -2.8;
    foundationMesh.receiveShadow = true;
    villageGroup.add(foundationMesh);

    // --- 2. Central Village Katte (ಗ್ರಾಮದ ಕಟ್ಟೆ & ಆಲದ ಮರ) ---
    const katteGroup = new THREE.Group();
    villageGroup.add(katteGroup);

    const katteBase = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 0.35, 32), stoneMat);
    katteBase.position.y = 0.18;
    katteBase.receiveShadow = true;
    katteGroup.add(katteBase);

    const katteInner = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.4, 32), wallOchreMat);
    katteInner.position.y = 0.22;
    katteInner.receiveShadow = true;
    katteGroup.add(katteInner);

    // Sacred Banyan Tree (ಆಲದ ಮರ) in Center
    const banyanTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 2.4, 12), woodTrunkMat);
    banyanTrunk.position.set(0, 1.2, 0);
    banyanTrunk.castShadow = true;
    katteGroup.add(banyanTrunk);

    // Tree canopy layers
    const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6), leavesMat);
    canopy1.position.set(0, 2.6, 0);
    canopy1.castShadow = true;
    katteGroup.add(canopy1);

    const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2), new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 }));
    canopy2.position.set(0.6, 3.1, 0.4);
    canopy2.castShadow = true;
    katteGroup.add(canopy2);

    const canopy3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 }));
    canopy3.position.set(-0.5, 3.0, -0.5);
    canopy3.castShadow = true;
    katteGroup.add(canopy3);

    // Katte warm center lamp
    const katteLight = new THREE.PointLight(0xf59e0b, 1.2, 8);
    katteLight.position.set(0, 2, 0);
    katteGroup.add(katteLight);
    pointLights.push(katteLight);

    // --- Cobblestone Pathways connecting all sectors ---
    const addPath = (x1: number, z1: number, x2: number, z2: number, w: number = 1.1) => {
      const length = Math.hypot(x2 - x1, z2 - z1);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const pathGeo = new THREE.PlaneGeometry(w, length);
      const pathMesh = new THREE.Mesh(pathGeo, stoneMat);
      pathMesh.rotation.x = -Math.PI / 2;
      pathMesh.rotation.z = -angle;
      pathMesh.position.set((x1 + x2) / 2, 0.04, (z1 + z2) / 2);
      pathMesh.receiveShadow = true;
      villageGroup.add(pathMesh);
    };

    addPath(0, 0, 0, -7.2); // North to Panchayat
    addPath(0, 0, 7.2, -1.2); // East to Temple
    addPath(0, 0, 6.2, 5.2); // South-East to School
    addPath(0, 0, 0, 7.5); // South to Sports Ground
    addPath(0, 0, -7.5, 0.5); // West to Farms
    addPath(0, 0, -5.2, -5.5); // North-West to Clinic
    addPath(0, 0, -5.5, 5.5); // South-West to RO Water Plant

    // =========================================================================
    // 🏛️ LANDMARK 1: MUTTAGUNDI GRAMA PANCHAYAT OFFICE (North: 0, 0, -7.5)
    // =========================================================================
    const panchayatGroup = new THREE.Group();
    panchayatGroup.position.set(0, 0, -7.5);
    villageGroup.add(panchayatGroup);
    landmarkObjectsRef.current['panchayat'] = panchayatGroup;

    // Plinth
    const pPlinth = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.35, 3.2), stoneMat);
    pPlinth.position.y = 0.18;
    pPlinth.receiveShadow = true;
    panchayatGroup.add(pPlinth);
    registerInteractive(pPlinth, 'panchayat');

    // Main Administrative Hall
    const pHall = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.9, 2.8), wallWhiteMat);
    pHall.position.y = 1.15;
    pHall.castShadow = true;
    pHall.receiveShadow = true;
    panchayatGroup.add(pHall);
    registerInteractive(pHall, 'panchayat');

    // Pillars in front portico
    for (let px of [-1.5, -0.5, 0.5, 1.5]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.7, 8), wallWhiteMat);
      pillar.position.set(px, 1.05, 1.5);
      pillar.castShadow = true;
      panchayatGroup.add(pillar);
    }

    // Porch Overhang
    const pPorch = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 1.2), roofRedMat);
    pPorch.position.set(0, 1.95, 1.5);
    pPorch.castShadow = true;
    panchayatGroup.add(pPorch);

    // Red Mangalore Tiled Roof
    const pRoof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.3, 4), roofRedMat);
    pRoof.position.y = 2.65;
    pRoof.rotation.y = Math.PI / 4;
    pRoof.castShadow = true;
    panchayatGroup.add(pRoof);
    registerInteractive(pRoof, 'panchayat');

    // Flagpole
    const pPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8), stoneMat);
    pPole.position.set(1.8, 1.6, 1.7);
    panchayatGroup.add(pPole);

    // Official Karnataka State Flag (ಕನ್ನಡ ಧ್ವಜ: Red Top, Yellow Bottom)
    const flagRed = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.03), kannadaRedMat);
    flagRed.position.set(2.15, 2.95, 1.7);
    panchayatGroup.add(flagRed);

    const flagYellow = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.03), kannadaYellowMat);
    flagYellow.position.set(2.15, 2.73, 1.7);
    panchayatGroup.add(flagYellow);

    // =========================================================================
    // 🛕 LANDMARK 2: SRI RANGANATHA SWAMY TEMPLE (East: 7.2, 0, -1.2)
    // =========================================================================
    const templeGroup = new THREE.Group();
    templeGroup.position.set(7.2, 0, -1.2);
    villageGroup.add(templeGroup);
    landmarkObjectsRef.current['temple'] = templeGroup;

    // Stone Mandapa Courtyard
    const tCourtyard = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.35, 4.2), stoneMat);
    tCourtyard.position.y = 0.18;
    tCourtyard.receiveShadow = true;
    templeGroup.add(tCourtyard);
    registerInteractive(tCourtyard, 'temple');

    // Sanctum Body
    const tBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 3.2), wallOchreMat);
    tBody.position.y = 1.0;
    tBody.castShadow = true;
    templeGroup.add(tBody);
    registerInteractive(tBody, 'temple');

    // Stepped Dravidian Gopuram
    const tGopura1 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.85, 2.5), roofRedMat);
    tGopura1.position.y = 2.1;
    tGopura1.castShadow = true;
    templeGroup.add(tGopura1);
    registerInteractive(tGopura1, 'temple');

    const tGopura2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.85, 1.8), roofRedMat);
    tGopura2.position.y = 2.85;
    tGopura2.castShadow = true;
    templeGroup.add(tGopura2);

    const tGopura3 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.2), roofRedMat);
    tGopura3.position.y = 3.5;
    tGopura3.castShadow = true;
    templeGroup.add(tGopura3);

    // Golden Kalashas (ಕಳಶ)
    const tKalasha = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.85, 10), goldMat);
    tKalasha.position.y = 4.25;
    templeGroup.add(tKalasha);

    // Saffron Dhwaja (ಭಗವಾ ಧ್ವಜ)
    const tFlagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.8, 8), stoneMat);
    tFlagPole.position.set(0, 1.9, 2.2);
    templeGroup.add(tFlagPole);

    const tFlag = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, 3), saffronMat);
    tFlag.rotation.z = -Math.PI / 2;
    tFlag.position.set(0.3, 3.4, 2.2);
    templeGroup.add(tFlag);

    // Glowing Temple Diya (ದೀಪದ ಕಂಬ & ಬೆಳಕು)
    const templeLight = new THREE.PointLight(0xf59e0b, 1.6, 6);
    templeLight.position.set(0, 1.5, 1.8);
    templeGroup.add(templeLight);
    pointLights.push(templeLight);

    // =========================================================================
    // 🏫 LANDMARK 3: GOVT HIGHER PRIMARY SCHOOL (South-East: 6.2, 0, 5.2)
    // =========================================================================
    const schoolGroup = new THREE.Group();
    schoolGroup.position.set(6.2, 0, 5.2);
    villageGroup.add(schoolGroup);
    landmarkObjectsRef.current['school'] = schoolGroup;

    // School base
    const sBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 3.0), stoneMat);
    sBase.position.y = 0.15;
    sBase.receiveShadow = true;
    schoolGroup.add(sBase);
    registerInteractive(sBase, 'school');

    // School Building (L-Shape style)
    const sBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.5, 2.4), wallWhiteMat);
    sBody.position.y = 0.95;
    sBody.castShadow = true;
    schoolGroup.add(sBody);
    registerInteractive(sBody, 'school');

    // Blue roof
    const sRoof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 2.7), cyanMat);
    sRoof.position.y = 1.8;
    sRoof.castShadow = true;
    schoolGroup.add(sRoof);
    registerInteractive(sRoof, 'school');

    // School playground swing set
    const swingBar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), woodTrunkMat);
    swingBar.position.set(-1.6, 1.1, 0.6);
    schoolGroup.add(swingBar);

    // School flagpole with Indian Tricolor
    const sPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 8), stoneMat);
    sPole.position.set(1.4, 1.3, 1.5);
    schoolGroup.add(sPole);

    const sFlag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.02), saffronMat);
    sFlag.position.set(1.65, 2.3, 1.5);
    schoolGroup.add(sFlag);

    // =========================================================================
    // 🌾 LANDMARK 4: ARECANUT & PADDY FARMS (West: -7.5, 0, 0.5)
    // =========================================================================
    const farmGroup = new THREE.Group();
    farmGroup.position.set(-7.5, 0, 0.5);
    villageGroup.add(farmGroup);
    landmarkObjectsRef.current['farms'] = farmGroup;

    // Rich dark soil bed
    const soilBed = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 4.8), soilMat);
    soilBed.position.y = 0.12;
    soilBed.receiveShadow = true;
    farmGroup.add(soilBed);
    registerInteractive(soilBed, 'farms');

    // Irrigation Water Canal (ಕಾಲುವೆ)
    const canal = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.28, 4.8), waterMat);
    canal.position.set(0, 0.14, 0);
    farmGroup.add(canal);

    // Arecanut Palms (ಅಡಿಕೆ ಮರಗಳು - slender tall trunks with fruit bunches)
    const arecaPositions = [
      [-1.6, -1.6], [-1.6, 0], [-1.6, 1.6],
      [1.6, -1.6], [1.6, 0], [1.6, 1.6]
    ];

    arecaPositions.forEach(([ax, az]) => {
      const aTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.2, 8), arecaTrunkMat);
      aTrunk.position.set(ax, 1.6, az);
      aTrunk.castShadow = true;
      farmGroup.add(aTrunk);

      // Clustered Arecanut Fronds
      const aCrown = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.1, 6), leavesMat);
      aCrown.position.set(ax, 3.4, az);
      aCrown.castShadow = true;
      farmGroup.add(aCrown);

      // Yellow-orange Arecanut Bunch (ಅಡಿಕೆ ಗೊನೆ)
      const aBunch = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), goldMat);
      aBunch.position.set(ax + 0.12, 2.9, az + 0.1);
      farmGroup.add(aBunch);
    });

    // Paddy Crop seedlings in rows
    const cropMat = new THREE.MeshStandardMaterial({ color: 0xa3e635, roughness: 0.7 });
    for (let r = -1.2; r <= 1.2; r += 0.6) {
      for (let c = -1.8; c <= 1.8; c += 0.6) {
        if (Math.abs(r) < 0.4) continue;
        const crop = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.45, 4), cropMat);
        crop.position.set(r, 0.35, c);
        crop.rotation.z = (Math.random() - 0.5) * 0.2;
        farmGroup.add(crop);
      }
    }

    // =========================================================================
    // 🛕 LANDMARK 5: KALLE DEVAR GUDI (South: 0, 0, 7.5)
    // =========================================================================
    const temple1Group = new THREE.Group();
    temple1Group.position.set(0, 0, 7.5);
    villageGroup.add(temple1Group);
    landmarkObjectsRef.current['temple1'] = temple1Group;
    landmarkObjectsRef.current['sports'] = temple1Group;

    // Stone Plinth (ಜಗುಲಿ)
    const t1Base = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 3.6), stoneMat);
    t1Base.position.y = 0.17;
    t1Base.receiveShadow = true;
    temple1Group.add(t1Base);
    registerInteractive(t1Base, 'temple1');

    // Sacred Garbhagriha / Sanctum Walls
    const t1Body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 2.6), wallWhiteMat);
    t1Body.position.y = 1.25;
    t1Body.castShadow = true;
    temple1Group.add(t1Body);
    registerInteractive(t1Body, 'temple1');

    // Stepped Shikhara (ಗೋಪುರ)
    const t1Roof1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 2.2), stoneMat);
    t1Roof1.position.y = 2.35;
    temple1Group.add(t1Roof1);

    const t1Roof2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.6), stoneMat);
    t1Roof2.position.y = 2.75;
    temple1Group.add(t1Roof2);

    const t1Roof3 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.8, 4), stoneMat);
    t1Roof3.position.y = 3.35;
    t1Roof3.rotation.y = Math.PI * 0.25;
    temple1Group.add(t1Roof3);

    // Golden Kalasha on top
    const t1Kalash = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.14, 0.4, 8), goldMat);
    t1Kalash.position.y = 3.95;
    temple1Group.add(t1Kalash);

    // Deepa Stambha (ದೀಪಸ್ತಂಭ - sacred stone pillar in front)
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.4, 8), stoneMat);
    pillar.position.set(0, 1.2, 2.6);
    temple1Group.add(pillar);

    const pillarLight = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), goldMat);
    pillarLight.position.set(0, 2.5, 2.6);
    temple1Group.add(pillarLight);

    // =========================================================================
    // 👶 LANDMARK 6: ANGANWADI KENDRA MUTTAGONDI (North-West: -5.2, 0, -5.5)
    // =========================================================================
    const kindergardenGroup = new THREE.Group();
    kindergardenGroup.position.set(-5.2, 0, -5.5);
    villageGroup.add(kindergardenGroup);
    landmarkObjectsRef.current['kindergarden'] = kindergardenGroup;
    landmarkObjectsRef.current['clinic'] = kindergardenGroup;

    const kBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.25, 3.0), stoneMat);
    kBase.position.y = 0.12;
    kindergardenGroup.add(kBase);
    registerInteractive(kBase, 'kindergarden');

    // Friendly colored Anganwadi building
    const kBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 2.6), wallWhiteMat);
    kBody.position.y = 0.95;
    kBody.castShadow = true;
    kindergardenGroup.add(kBody);
    registerInteractive(kBody, 'kindergarden');

    // Cheerful Anganwadi roof
    const kRoof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.25, 2.9), roofRedMat);
    kRoof.position.y = 1.85;
    kindergardenGroup.add(kRoof);

    // Playful Children entrance arches & flowers
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.05), woodTrunkMat);
    door.position.set(0, 0.7, 1.32);
    kindergardenGroup.add(door);

    // Little garden flowers in front
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xff69b4, roughness: 0.5 });
    for (let fx of [-1.2, -0.6, 0.6, 1.2]) {
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), flowerMat);
      flower.position.set(fx, 0.3, 1.8);
      kindergardenGroup.add(flower);
    }

    // =========================================================================
    // 💧 LANDMARK 7: PURE DRINKING WATER RO PLANT (South-West: -5.5, 0, 5.5)
    // =========================================================================
    const waterGroup = new THREE.Group();
    waterGroup.position.set(-5.5, 0, 5.5);
    villageGroup.add(waterGroup);
    landmarkObjectsRef.current['water'] = waterGroup;

    const wBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 2.4), stoneMat);
    wBase.position.y = 0.12;
    waterGroup.add(wBase);
    registerInteractive(wBase, 'water');

    const wBooth = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.8), wallWhiteMat);
    wBooth.position.y = 0.85;
    wBooth.castShadow = true;
    waterGroup.add(wBooth);
    registerInteractive(wBooth, 'water');

    // Blue Overhead Storage Tank
    const wTank = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.9, 16), waterMat);
    wTank.position.set(0, 1.85, 0);
    wTank.castShadow = true;
    waterGroup.add(wTank);

    // --- Extra Village Coconut Palms ---
    const palmLocations = [
      [4.2, 1.8], [-3.8, 2.4], [3.2, -4.5], [-2.8, -3.2], [7.5, 2.2], [-7.8, -4.2]
    ];
    palmLocations.forEach(([px, pz]) => {
      const pTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.6, 6), woodTrunkMat);
      pTrunk.position.set(px, 1.3, pz);
      pTrunk.rotation.z = (Math.random() - 0.5) * 0.15;
      villageGroup.add(pTrunk);

      const pCrown = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.2, 5), leavesMat);
      pCrown.position.set(px, 2.7, pz);
      villageGroup.add(pCrown);
    });

    // --- Floating Village Fireflies / Golden Atmosphere Dust ---
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 22;
      particlePositions[i + 1] = Math.random() * 8 + 0.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 22;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    villageGroup.add(particles);

    // --- Interactive Mouse Raycasting & Drag Controls ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getPointerCoords = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: -((clientY - rect.top) / rect.height) * 2 + 1
      };
    };

    const handlePointerDown = (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      dragDistanceRef.current = 0;
      previousMousePosition.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      const { x, y } = getPointerCoords(clientX, clientY);
      mouse.x = x;
      mouse.y = y;

      if (isDraggingRef.current && rotationGroupRef.current) {
        const deltaX = clientX - previousMousePosition.current.x;
        dragDistanceRef.current += Math.abs(deltaX);
        targetRotationYRef.current += deltaX * 0.007;
        previousMousePosition.current = { x: clientX, y: clientY };
        isAutoRotatingRef.current = false;
        setIsAutoRotating(false);
      } else {
        // Hover raycasting
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(
          interactiveMeshesRef.current.map((item) => item.mesh)
        );
        if (intersects.length > 0) {
          const hitId = (intersects[0].object.userData.landmarkId as LandmarkId) || null;
          setHoveredLandmark(hitId);
          container.style.cursor = 'pointer';
        } else {
          setHoveredLandmark(null);
          container.style.cursor = 'grab';
        }
      }
    };

    const handlePointerUp = (clientX: number, clientY: number) => {
      if (isDraggingRef.current) {
        // If minimal drag distance, treat as a tap/click on 3D building
        if (dragDistanceRef.current < 6) {
          const { x, y } = getPointerCoords(clientX, clientY);
          mouse.x = x;
          mouse.y = y;
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(
            interactiveMeshesRef.current.map((item) => item.mesh)
          );
          if (intersects.length > 0) {
            const hitId = intersects[0].object.userData.landmarkId as LandmarkId;
            if (hitId) {
              rotateToLandmark(hitId);
              if (onSelect) onSelect(hitId);
            }
          }
        }
      }
      isDraggingRef.current = false;
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

    // Zoom on wheel
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetZoomRef.current = Math.min(36, Math.max(16, targetZoomRef.current + e.deltaY * 0.015));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Idle Rotation
      if (isAutoRotatingRef.current && !isDraggingRef.current) {
        targetRotationYRef.current += 0.0018;
      }

      // Smooth Camera & Island Interpolation (Lerp)
      if (rotationGroupRef.current) {
        rotationGroupRef.current.rotation.y +=
          (targetRotationYRef.current - rotationGroupRef.current.rotation.y) * 0.08;
      }

      // Smooth Zoom
      currentZoomRef.current += (targetZoomRef.current - currentZoomRef.current) * 0.1;
      camera.position.z = currentZoomRef.current;
      camera.position.y = (currentZoomRef.current / 26) * 18;
      camera.lookAt(0, 0, 0);

      // Flickering Temple & Katte Oil Lamps
      pointLights.forEach((light, idx) => {
        light.intensity = 1.3 + Math.sin(elapsedTime * 8 + idx * 2.5) * 0.35;
      });

      // Floating Particle Breeze
      const posArray = particleGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        posArray[i] += Math.sin(elapsedTime * 2.2 + i) * 0.008;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Project 3D landmark coordinates to 2D screen pins
      const updatedCoords: { [key in LandmarkId]?: { x: number; y: number; visible: boolean } } = {};
      const landmarksList: LandmarkId[] = ['panchayat', 'temple', 'school', 'farms', 'temple1', 'kindergarden', 'water'];

      landmarksList.forEach((id) => {
        const obj = landmarkObjectsRef.current[id];
        if (obj) {
          const worldPos = new THREE.Vector3();
          obj.getWorldPosition(worldPos);
          worldPos.y += 3.2; // Badge height above structure

          const screenPos = worldPos.clone().project(camera);
          const isBehind = screenPos.z > 1;

          const x = (screenPos.x * 0.5 + 0.5) * container.clientWidth;
          const y = (-(screenPos.y * 0.5) + 0.5) * (container.clientHeight || 460);

          updatedCoords[id] = {
            x,
            y,
            visible: !isBehind && x > 25 && x < container.clientWidth - 25 && y > 25 && y < container.clientHeight - 25
          };
        }
      });

      setScreenCoords(updatedCoords);
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onSelect, rotateToLandmark]);

  // Adjust lights and atmosphere based on timeOfDay state
  useEffect(() => {
    const lights = lightsRef.current;
    if (!lights.sunLight || !lights.ambientLight || !lights.hemiLight) return;

    if (timeOfDay === 'day') {
      lights.sunLight.color.setHex(0xffffff);
      lights.sunLight.intensity = 1.9;
      lights.sunLight.position.set(16, 28, 16);
      lights.ambientLight.color.setHex(0xf8fafc);
      lights.ambientLight.intensity = 0.9;
      lights.hemiLight.color.setHex(0xbae6fd);
      lights.hemiLight.groundColor.setHex(0x15803d);
    } else if (timeOfDay === 'sunset') {
      lights.sunLight.color.setHex(0xf59e0b);
      lights.sunLight.intensity = 2.2;
      lights.sunLight.position.set(20, 14, 18);
      lights.ambientLight.color.setHex(0xfed7aa);
      lights.ambientLight.intensity = 0.65;
      lights.hemiLight.color.setHex(0xfb923c);
      lights.hemiLight.groundColor.setHex(0x1e1b4b);
    } else if (timeOfDay === 'night') {
      lights.sunLight.color.setHex(0x60a5fa);
      lights.sunLight.intensity = 0.55;
      lights.sunLight.position.set(8, 20, -14);
      lights.ambientLight.color.setHex(0x1e293b);
      lights.ambientLight.intensity = 0.45;
      lights.hemiLight.color.setHex(0x38bdf8);
      lights.hemiLight.groundColor.setHex(0x020617);
    }
  }, [timeOfDay]);

  // Handlers for controls
  const handleZoomIn = () => {
    targetZoomRef.current = Math.max(16, targetZoomRef.current - 4);
  };

  const handleZoomOut = () => {
    targetZoomRef.current = Math.min(36, targetZoomRef.current + 4);
  };

  const handleToggleAutoRotate = () => {
    const next = !isAutoRotating;
    setIsAutoRotating(next);
    isAutoRotatingRef.current = next;
  };

  const handleResetCamera = () => {
    targetRotationYRef.current = 0;
    targetZoomRef.current = 26;
  };

  const backgroundGradient = useMemo(() => {
    if (timeOfDay === 'day') {
      return 'radial-gradient(circle at 50% 30%, #1e3a8a 0%, #0c1938 60%, #050b14 100%)';
    }
    if (timeOfDay === 'sunset') {
      return 'radial-gradient(circle at 50% 30%, #431407 0%, #1c1917 50%, #050b14 100%)';
    }
    return 'radial-gradient(circle at 50% 30%, #030712 0%, #020617 60%, #000000 100%)';
  }, [timeOfDay]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '24px',
        overflow: 'hidden',
        background: backgroundGradient,
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        border: '1px solid rgba(255,255,255,0.12)',
        transition: 'background 0.8s ease'
      }}
    >
      {/* 3D Canvas Mount */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '470px',
          cursor: 'grab',
          touchAction: 'none'
        }}
      />

      {/* Floating 2D Pins over 3D coordinates */}
      {landmarkDetails.map((lm) => {
        const coords = screenCoords[lm.id];
        if (!coords || !coords.visible) return null;
        const isSelected = activeLandmarkId === lm.id;
        const isHovered = hoveredLandmark === lm.id;

        return (
          <button
            key={lm.id}
            onClick={() => {
              rotateToLandmark(lm.id);
              if (onSelect) onSelect(lm.id);
            }}
            style={{
              position: 'absolute',
              left: `${coords.x}px`,
              top: `${coords.y}px`,
              transform: `translate(-50%, -100%) scale(${isSelected ? 1.08 : isHovered ? 1.04 : 0.95})`,
              zIndex: isSelected ? 20 : 10,
              background: isSelected
                ? lm.color
                : 'rgba(15, 23, 42, 0.88)',
              color: isSelected ? '#FFFFFF' : '#E2E8F0',
              border: `2px solid ${isSelected ? '#FFFFFF' : lm.color}`,
              borderRadius: '22px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: isSelected
                ? `0 0 24px ${lm.color}, 0 6px 18px rgba(0,0,0,0.6)`
                : '0 4px 14px rgba(0,0,0,0.5)',
              transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap',
              pointerEvents: 'auto'
            }}
          >
            <span style={{ fontSize: '1.05rem' }}>{lm.icon}</span>
            <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
              <div>{isKannada ? lm.label_kn : lm.label_en}</div>
              <div
                style={{
                  fontSize: '0.66rem',
                  opacity: 0.85,
                  fontWeight: 600
                }}
              >
                {isKannada ? lm.sub_kn : lm.sub_en}
              </div>
            </div>
          </button>
        );
      })}

      {/* Top Left Title & Instructions Badge */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(10, 18, 36, 0.82)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: '16px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          zIndex: 15
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>🌐</span>
        <div>
          <strong style={{ fontSize: '0.86rem', color: '#FFFFFF', display: 'block' }}>
            {isKannada ? 'ಮುತ್ತಗುಂಡಿ 3D ಗ್ರಾಮ ಮಾದರಿ' : 'Muttagundi 3D Village Model'}
          </strong>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
            {isKannada ? 'ತಿರುಗಿಸಲು ಎಳೆಯಿರಿ • ಕಟ್ಟಡವನ್ನು ಮುಟ್ಟಿ' : 'Drag to rotate • Tap building to inspect'}
          </span>
        </div>
      </div>

      {/* Top Right Controls Toolbar (Day/Sunset/Night + Camera) */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 15
        }}
      >
        {/* Time of Day Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(10, 18, 36, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '18px',
            padding: '3px'
          }}
        >
          <button
            onClick={() => setTimeOfDay('day')}
            title="Day Mode"
            style={{
              background: timeOfDay === 'day' ? '#3B82F6' : 'transparent',
              border: 'none',
              borderRadius: '14px',
              padding: '5px 10px',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            ☀️
          </button>
          <button
            onClick={() => setTimeOfDay('sunset')}
            title="Golden Hour / Sunset Mode"
            style={{
              background: timeOfDay === 'sunset' ? '#F59E0B' : 'transparent',
              border: 'none',
              borderRadius: '14px',
              padding: '5px 10px',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            🌅
          </button>
          <button
            onClick={() => setTimeOfDay('night')}
            title="Night Mode"
            style={{
              background: timeOfDay === 'night' ? '#6366F1' : 'transparent',
              border: 'none',
              borderRadius: '14px',
              padding: '5px 10px',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            🌙
          </button>
        </div>

        {/* Camera Quick Action Buttons */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(10, 18, 36, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '18px',
            padding: '3px',
            gap: '2px'
          }}
        >
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '12px',
              width: '30px',
              height: '30px',
              color: '#FFFFFF',
              fontSize: '1rem',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '12px',
              width: '30px',
              height: '30px',
              color: '#FFFFFF',
              fontSize: '1rem',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            −
          </button>
          <button
            onClick={handleToggleAutoRotate}
            title={isAutoRotating ? 'Pause Rotation' : 'Auto Rotate'}
            style={{
              background: isAutoRotating ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
              border: 'none',
              borderRadius: '12px',
              width: '30px',
              height: '30px',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            {isAutoRotating ? '⏸' : '▶'}
          </button>
          <button
            onClick={handleResetCamera}
            title="Reset View"
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '12px',
              width: '30px',
              height: '30px',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            🎯
          </button>
        </div>
      </div>

      {/* Quick 1-Tap Landmark Selector Carousel at Bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          background: 'rgba(8, 15, 28, 0.88)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: '32px',
          padding: '6px 8px',
          maxWidth: '94%',
          overflowX: 'auto',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          zIndex: 15
        }}
      >
        {landmarkDetails.map((lm) => {
          const isSelected = activeLandmarkId === lm.id;
          return (
            <button
              key={lm.id}
              onClick={() => {
                rotateToLandmark(lm.id);
                if (onSelect) onSelect(lm.id);
              }}
              style={{
                background: isSelected ? lm.color : 'transparent',
                color: isSelected ? '#FFFFFF' : '#CBD5E1',
                border: 'none',
                borderRadius: '26px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap',
                boxShadow: isSelected ? `0 2px 10px ${lm.color}88` : 'none'
              }}
            >
              <span>{lm.icon}</span>
              <span>{isKannada ? lm.label_kn : lm.label_en}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
