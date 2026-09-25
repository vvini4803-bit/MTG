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
  | 'clinic'
  | 'shrine';

export interface Village3DSceneProps {
  selectedId?: string;
  onSelect?: (id: LandmarkId) => void;
  isKannada?: boolean;
  isAnimeMode?: boolean;
  onToggleAnimeMode?: (val: boolean) => void;
  onOpenAnimeShowcase?: (id: LandmarkId) => void;
}

type TimeOfDay = 'day' | 'sunset' | 'night';

export const Village3DScene: React.FC<Village3DSceneProps> = ({
  selectedId = 'panchayat',
  onSelect,
  isKannada = true,
  isAnimeMode: controlledAnimeMode,
  onToggleAnimeMode,
  onOpenAnimeShowcase
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

  // Anime 3D Visual Mode (Default ON for gorgeous visuals)
  const [internalAnimeMode, setInternalAnimeMode] = useState(true);
  const isAnimeMode = controlledAnimeMode !== undefined ? controlledAnimeMode : internalAnimeMode;
  const isAnimeModeRef = useRef(isAnimeMode);

  useEffect(() => {
    isAnimeModeRef.current = isAnimeMode;
  }, [isAnimeMode]);

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
    if (raw.includes('thimmappa') || raw.includes('lakshmi') || raw.includes('shrine') || raw.includes('stone') || raw.includes('huchharaya') || raw.includes('ancient')) return 'shrine';
    if (raw.includes('kalle') || raw.includes('temple1') || raw.includes('sports') || raw.includes('ground')) return 'temple1';
    if (raw.includes('anganwadi') || raw.includes('kindergarden') || raw.includes('clinic') || raw.includes('health') || raw.includes('children')) return 'kindergarden';
    if (raw.includes('anjaneya') || raw.includes('temple') || raw.includes('ranganatha')) return 'temple';
    if (raw.includes('panchayat') || raw.includes('hall') || raw.includes('community') || raw.includes('shop')) return 'panchayat';
    if (raw.includes('school') || raw.includes('primary')) return 'school';
    if (raw.includes('water') || raw.includes('ro') || raw.includes('tank')) return 'water';
    if (raw.includes('farm') || raw.includes('crop') || raw.includes('agriculture') || raw.includes('areca') || raw.includes('coconut')) return 'farms';
    return 'panchayat';
  }, [selectedId]);

  const activeLandmarkIdRef = useRef<LandmarkId>(activeLandmarkId);
  const hoveredLandmarkRef = useRef<LandmarkId | null>(hoveredLandmark);

  useEffect(() => {
    activeLandmarkIdRef.current = activeLandmarkId;
  }, [activeLandmarkId]);

  useEffect(() => {
    hoveredLandmarkRef.current = hoveredLandmark;
  }, [hoveredLandmark]);

  const landmarkDetails: {
    id: LandmarkId;
    label_en: string;
    label_kn: string;
    sub_en: string;
    sub_kn: string;
    icon: string;
    color: string;
    map_url?: string;
    anime_image?: string;
  }[] = [
    {
      id: 'panchayat',
      label_en: 'Muttagondi Community Hall',
      label_kn: 'ಮುತ್ತಾಗೊಂದಿ ಸಮುದಾಯ ಭವನ',
      sub_en: 'Shops & Center',
      sub_kn: 'ಅಂಗಡಿಗಳು & ಕೇಂದ್ರ',
      icon: '🏛️',
      color: '#10B981',
      map_url: 'https://maps.app.goo.gl/sAMg2991XNuzLqNt6?g_st=ac'
    },
    {
      id: 'temple',
      label_en: 'Sri Anjaneya Swamy Temple',
      label_kn: 'ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ದೇವಾಲಯ',
      sub_en: 'Gopuram Tower',
      sub_kn: 'ವರ್ಣರಂಜಿತ ಗೋಪುರ',
      icon: '🛕',
      color: '#F59E0B',
      map_url: 'https://maps.app.goo.gl/njPyjtKZy3bfkx4s8?g_st=ac',
      anime_image: '/anime/temple_gopuram.jpg'
    },
    {
      id: 'school',
      label_en: 'Govt Lower Primary School',
      label_kn: 'ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ',
      sub_en: 'School & Playground',
      sub_kn: 'ಶಾಲಾ ಆವರಣ & ಧ್ವಜ',
      icon: '🏫',
      color: '#3B82F6',
      map_url: 'https://maps.app.goo.gl/fcnALXpVzfTrZ3UG6?g_st=aw',
      anime_image: '/anime/school.jpg'
    },
    {
      id: 'shrine',
      label_en: 'Sri Lakshmi Thimmappa Temple',
      label_kn: 'ಶ್ರೀ ಲಕ್ಷ್ಮಿ ತಿಮ್ಮಪ್ಪ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ',
      sub_en: 'Revered Sacred Shrine',
      sub_kn: 'ಪವಿತ್ರ ದೇವಸ್ಥಾನ',
      icon: '🛕',
      color: '#059669',
      map_url: 'https://maps.app.goo.gl/aekVSfTPkpzUh2hj9?g_st=aw',
      anime_image: '/anime/stone_shrine.jpg'
    },
    {
      id: 'temple1',
      label_en: 'Sri Kalleshwara Swamy Gudi',
      label_kn: 'ಕಲ್ಲೇ ದೇವರ ಗುಡಿ (ಕಲ್ಲೇಶ್ವರ)',
      sub_en: 'Tower & Lake Shrine',
      sub_kn: 'ವಿದ್ಯುತ್ ಗೋಪುರ & ಕೆರೆ',
      icon: '🛕',
      color: '#8B5CF6',
      map_url: 'https://maps.app.goo.gl/6P79MeqguXf8jnMm6?g_st=ac',
      anime_image: '/anime/kalleshwara.jpg'
    },
    {
      id: 'kindergarden',
      label_en: 'Anganwadi Kendra Muttagondi',
      label_kn: 'ಅಂಗನವಾಡಿ ಕೇಂದ್ರ ಮುತ್ತಾಗೊಂದಿ',
      sub_en: 'Children Education',
      sub_kn: 'ಮಕ್ಕಳ ಕೇಂದ್ರ',
      icon: '👶',
      color: '#EC4899',
      map_url: 'https://maps.app.goo.gl/macDiSpwTv3XUxNfA?g_st=ac',
      anime_image: '/anime/anganwadi.jpg'
    },
    {
      id: 'farms',
      label_en: 'Arecanut & Coconut Farms',
      label_kn: 'ಅಡಿಕೆ ಮತ್ತು ತೆಂಗಿನ ತೋಟ',
      sub_en: 'Lush Farmlands',
      sub_kn: 'ಕೃಷಿ ಭೂಮಿ & ಕಾಲುವೆ',
      icon: '🌴',
      color: '#84CC16'
    },
    {
      id: 'water',
      label_en: 'Pure Water RO Plant',
      label_kn: 'ಶುದ್ಧ ಕುಡಿಯುವ ನೀರಿನ ಘಟಕ',
      sub_en: '24/7 RO Filtration',
      sub_kn: 'ನೀರಿನ ಟ್ಯಾಂಕ್',
      icon: '💧',
      color: '#06B6D4'
    }
  ];

  // Rotate smoothly to targeted landmark
  const rotateToLandmark = useCallback((id: LandmarkId) => {
    const angleMap: Record<LandmarkId, number> = {
      panchayat: 0,
      shrine: -Math.PI * 0.22,
      temple: -Math.PI * 0.45,
      school: -Math.PI * 0.85,
      temple1: Math.PI,
      sports: Math.PI,
      water: Math.PI * 0.82,
      farms: Math.PI * 0.5,
      kindergarden: Math.PI * 0.22,
      clinic: Math.PI * 0.22
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
    const height = container.clientHeight || 470;

    // --- Scene & Fog ---
    const scene = new THREE.Scene();
    scene.background = null; // Controlled by CSS container gradient

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
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xfff5eb, 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.7);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.8);
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

    // --- High-Quality Stylized Materials ---
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.65,
      metalness: 0.05
    });

    const grassBorderMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.8
    });

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.7
    });

    const darkBasaltMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.95
    });

    const wallWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.55
    });

    const wallOchreMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      roughness: 0.6
    });

    const roofRedMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.45,
      metalness: 0.1
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.9
    });

    const saffronMat = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      roughness: 0.5
    });

    const royalBlueMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.4
    });

    const skyBlueMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.5
    });

    const kannadaYellowMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.45
    });

    const kannadaRedMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.45
    });

    const woodTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x713f12,
      roughness: 0.85
    });

    const leavesMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.6
    });

    const arecaTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.8
    });

    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.95
    });

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.6,
      transparent: true,
      opacity: 0.9
    });

    const cyanMat = new THREE.MeshStandardMaterial({
      color: 0x0891b2,
      roughness: 0.35
    });

    const ancientRockMat = new THREE.MeshStandardMaterial({
      color: 0x57534e,
      roughness: 0.95
    });

    const mossyRockMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c0f,
      roughness: 0.85
    });

    // Register mesh for raycasting
    const registerInteractive = (mesh: THREE.Mesh, id: LandmarkId) => {
      mesh.userData = { landmarkId: id };
      interactiveMeshesRef.current.push({ mesh, id });
    };

    // =========================================================================
    // 🌐 3D ANIME BILLBOARDS / FLOATING HOLOGRAPHIC CARDS
    // =========================================================================
    const textureLoader = new THREE.TextureLoader();
    const animeTextureMap: Partial<Record<LandmarkId, THREE.Texture>> = {
      temple: textureLoader.load('/anime/temple_gopuram.jpg'),
      temple1: textureLoader.load('/anime/kalleshwara.jpg'),
      school: textureLoader.load('/anime/school.jpg'),
      kindergarden: textureLoader.load('/anime/anganwadi.jpg'),
      shrine: textureLoader.load('/anime/stone_shrine.jpg')
    };

    Object.values(animeTextureMap).forEach((tex) => {
      if (tex) tex.colorSpace = THREE.SRGBColorSpace;
    });

    const billboardGroups: { group: THREE.Group; id: LandmarkId; baseY: number }[] = [];

    const createAnimeBillboard = (id: LandmarkId, parentGroup: THREE.Group, yOffset: number) => {
      const tex = animeTextureMap[id];
      if (!tex) return;

      const cardGroup = new THREE.Group();
      cardGroup.position.set(0, yOffset, 0);

      // Outer glowing rim border
      const frameGeo = new THREE.PlaneGeometry(2.5, 1.45);
      const frameMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        side: THREE.DoubleSide
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      cardGroup.add(frameMesh);

      // Inner Anime Illustration Texture Plane
      const planeGeo = new THREE.PlaneGeometry(2.36, 1.32);
      const planeMat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide
      });
      const planeMesh = new THREE.Mesh(planeGeo, planeMat);
      planeMesh.position.z = 0.01;
      planeMesh.userData = { landmarkId: id, isBillboard: true };
      cardGroup.add(planeMesh);

      // Top glowing pill tag: "✨ ANIME 3D"
      const tagGeo = new THREE.PlaneGeometry(1.2, 0.22);
      const tagMat = new THREE.MeshBasicMaterial({
        color: 0xec4899,
        side: THREE.DoubleSide
      });
      const tagMesh = new THREE.Mesh(tagGeo, tagMat);
      tagMesh.position.set(0, 0.72, 0.02);
      cardGroup.add(tagMesh);

      parentGroup.add(cardGroup);
      registerInteractive(planeMesh, id);
      billboardGroups.push({ group: cardGroup, id, baseY: yOffset });
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

    // Deep foundation
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

    const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2), new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 }));
    canopy2.position.set(0.6, 3.1, 0.4);
    canopy2.castShadow = true;
    katteGroup.add(canopy2);

    const canopy3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 }));
    canopy3.position.set(-0.5, 3.0, -0.5);
    canopy3.castShadow = true;
    katteGroup.add(canopy3);

    // Katte warm center lamp
    const katteLight = new THREE.PointLight(0xf59e0b, 1.3, 8);
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

    addPath(0, 0, 0, -7.5); // North to Panchayat
    addPath(0, 0, 5.2, -5.5); // North-East to Ancient Stone Shrine
    addPath(0, 0, 7.2, -1.2); // East to Temple Gopuram
    addPath(0, 0, 6.2, 5.2); // South-East to School
    addPath(0, 0, 0, 7.5); // South to Kalleshwara Swamy
    addPath(0, 0, -5.5, 5.5); // South-West to RO Water Plant
    addPath(0, 0, -7.5, 0.5); // West to Farms
    addPath(0, 0, -5.2, -5.5); // North-West to Anganwadi

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
    // 🛕 LANDMARK 2: SRI ANJANEYA SWAMY TEMPLE / COLORFUL GOPURAM (East: 7.2, 0, -1.2)
    // =========================================================================
    const templeGroup = new THREE.Group();
    templeGroup.position.set(7.2, 0, -1.2);
    villageGroup.add(templeGroup);
    landmarkObjectsRef.current['temple'] = templeGroup;

    // Stone Mandapa Courtyard
    const tCourtyard = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.35, 4.4), stoneMat);
    tCourtyard.position.y = 0.18;
    tCourtyard.receiveShadow = true;
    templeGroup.add(tCourtyard);
    registerInteractive(tCourtyard, 'temple');

    // Royal Blue Sanctum Base (as in user's photo)
    const tBody = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.7, 3.4), royalBlueMat);
    tBody.position.y = 1.05;
    tBody.castShadow = true;
    templeGroup.add(tBody);
    registerInteractive(tBody, 'temple');

    // Dravidian Tier 1 (Gold ornamental band)
    const tTier1 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.8, 2.8), goldMat);
    tTier1.position.y = 2.25;
    tTier1.castShadow = true;
    templeGroup.add(tTier1);
    registerInteractive(tTier1, 'temple');

    // Dravidian Tier 2 (Sky blue & vermillion)
    const tTier2 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 2.1), skyBlueMat);
    tTier2.position.y = 3.0;
    tTier2.castShadow = true;
    templeGroup.add(tTier2);

    // Dravidian Tier 3 (Saffron red top)
    const tTier3 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.4), saffronMat);
    tTier3.position.y = 3.7;
    tTier3.castShadow = true;
    templeGroup.add(tTier3);

    // 5 Shimmering Golden Kalashas (ಕಳಶ) on peak
    for (let kx of [-0.4, -0.2, 0, 0.2, 0.4]) {
      const kalash = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 8), goldMat);
      kalash.position.set(kx, 4.35, 0);
      templeGroup.add(kalash);
    }

    // Saffron Dhwaja (ಭಗವಾ ಧ್ವಜ)
    const tFlagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 8), goldMat);
    tFlagPole.position.set(0, 2.1, 2.3);
    templeGroup.add(tFlagPole);

    const tFlag = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.75, 3), saffronMat);
    tFlag.rotation.z = -Math.PI / 2;
    tFlag.position.set(0.35, 3.8, 2.3);
    templeGroup.add(tFlag);

    // Temple Diya Light
    const templeLight = new THREE.PointLight(0xf59e0b, 1.8, 7);
    templeLight.position.set(0, 1.8, 2.0);
    templeGroup.add(templeLight);
    pointLights.push(templeLight);

    // Floating Anime Billboard above Gopuram
    createAnimeBillboard('temple', templeGroup, 5.6);

    // =========================================================================
    // 🛕 LANDMARK 3: SRI LAKSHMI THIMMAPPA SWAMY TEMPLE (North-East: 5.2, 0, -5.5)
    // =========================================================================
    const shrineGroup = new THREE.Group();
    shrineGroup.position.set(5.2, 0, -5.5);
    villageGroup.add(shrineGroup);
    landmarkObjectsRef.current['shrine'] = shrineGroup;

    // Natural stone bedrock base
    const sBedrock = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.8, 0.35, 12), ancientRockMat);
    sBedrock.position.y = 0.18;
    sBedrock.receiveShadow = true;
    shrineGroup.add(sBedrock);
    registerInteractive(sBedrock, 'shrine');

    // Megalithic stacked stone slab cavern walls
    const sWallL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 2.2), ancientRockMat);
    sWallL.position.set(-1.0, 0.95, 0);
    sWallL.castShadow = true;
    shrineGroup.add(sWallL);

    const sWallR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 2.2), ancientRockMat);
    sWallR.position.set(1.0, 0.95, 0);
    sWallR.castShadow = true;
    shrineGroup.add(sWallR);

    const sWallB = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.6), ancientRockMat);
    sWallB.position.set(0, 0.95, -0.9);
    sWallB.castShadow = true;
    shrineGroup.add(sWallB);

    // Giant flat stone roof slab with moss
    const sRoofSlab = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.45, 2.6), ancientRockMat);
    sRoofSlab.position.set(0, 1.88, 0);
    sRoofSlab.rotation.z = 0.04;
    sRoofSlab.castShadow = true;
    shrineGroup.add(sRoofSlab);
    registerInteractive(sRoofSlab, 'shrine');

    const sMoss = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 2.3), mossyRockMat);
    sMoss.position.set(0, 2.12, 0);
    shrineGroup.add(sMoss);

    // Glowing ancient deity idol inside sacred cavern
    const sIdol = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.85, 10), goldMat);
    sIdol.position.set(0, 0.8, -0.4);
    shrineGroup.add(sIdol);

    const shrineLight = new THREE.PointLight(0x10b981, 1.5, 5);
    shrineLight.position.set(0, 1.1, 0);
    shrineGroup.add(shrineLight);
    pointLights.push(shrineLight);

    // Floating Anime Billboard above Sri Lakshmi Thimmappa Swamy Temple
    createAnimeBillboard('shrine', shrineGroup, 3.6);

    // =========================================================================
    // 🏫 LANDMARK 4: GOVT LOWER PRIMARY SCHOOL (South-East: 6.2, 0, 5.2)
    // =========================================================================
    const schoolGroup = new THREE.Group();
    schoolGroup.position.set(6.2, 0, 5.2);
    villageGroup.add(schoolGroup);
    landmarkObjectsRef.current['school'] = schoolGroup;

    // School base
    const sBase = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.3, 3.2), stoneMat);
    sBase.position.y = 0.15;
    sBase.receiveShadow = true;
    schoolGroup.add(sBase);
    registerInteractive(sBase, 'school');

    // Warm Yellow School Facade (matching reference photo)
    const sBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.6, 2.6), wallOchreMat);
    sBody.position.y = 1.0;
    sBody.castShadow = true;
    schoolGroup.add(sBody);
    registerInteractive(sBody, 'school');

    // Blue Entrance Doors
    const sDoor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.05), skyBlueMat);
    sDoor.position.set(-0.8, 0.75, 1.32);
    schoolGroup.add(sDoor);

    // Veranda Pillars
    for (let sx of [-1.4, -0.4, 0.6, 1.4]) {
      const pCol = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8), wallWhiteMat);
      pCol.position.set(sx, 0.95, 1.4);
      schoolGroup.add(pCol);
    }

    // Flat roof with parapet
    const sRoof = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.25, 2.9), roofRedMat);
    sRoof.position.y = 1.88;
    sRoof.castShadow = true;
    schoolGroup.add(sRoof);
    registerInteractive(sRoof, 'school');

    // School Flagpole with Karnataka Flag (matching reference photo)
    const sPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.0, 8), stoneMat);
    sPole.position.set(1.6, 1.5, 1.6);
    schoolGroup.add(sPole);

    const sFlagR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.02), kannadaRedMat);
    sFlagR.position.set(1.9, 2.8, 1.6);
    schoolGroup.add(sFlagR);

    const sFlagY = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.02), kannadaYellowMat);
    sFlagY.position.set(1.9, 2.62, 1.6);
    schoolGroup.add(sFlagY);

    // Courtyard tree providing shade
    const sTree = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9), leavesMat);
    sTree.position.set(-1.8, 2.0, 1.8);
    schoolGroup.add(sTree);

    // Floating Anime Billboard above School
    createAnimeBillboard('school', schoolGroup, 3.8);

    // =========================================================================
    // 🛕 LANDMARK 5: SRI KALLESHWARA SWAMY GUDI & POWER TOWER (South: 0, 0, 7.5)
    // =========================================================================
    const temple1Group = new THREE.Group();
    temple1Group.position.set(0, 0, 7.5);
    villageGroup.add(temple1Group);
    landmarkObjectsRef.current['temple1'] = temple1Group;
    landmarkObjectsRef.current['sports'] = temple1Group;

    // Stone Plinth
    const t1Base = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.35, 3.6), stoneMat);
    t1Base.position.y = 0.17;
    t1Base.receiveShadow = true;
    temple1Group.add(t1Base);
    registerInteractive(t1Base, 'temple1');

    // Ancient Whitewashed Stone Sanctum (from reference photo)
    const t1Body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.9, 2.8), wallWhiteMat);
    t1Body.position.y = 1.3;
    t1Body.castShadow = true;
    temple1Group.add(t1Body);
    registerInteractive(t1Body, 'temple1');

    // Stepped Shikhara
    const t1Roof1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 2.2), stoneMat);
    t1Roof1.position.y = 2.45;
    temple1Group.add(t1Roof1);

    const t1Roof2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.6), stoneMat);
    t1Roof2.position.y = 2.85;
    temple1Group.add(t1Roof2);

    const t1Roof3 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.8, 4), stoneMat);
    t1Roof3.position.y = 3.4;
    t1Roof3.rotation.y = Math.PI * 0.25;
    temple1Group.add(t1Roof3);

    // Golden Kalasha
    const t1Kalash = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.14, 0.4, 8), goldMat);
    t1Kalash.position.y = 3.98;
    temple1Group.add(t1Kalash);

    // Reflective water pool in front (matching anime artwork)
    const pondGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.1, 24);
    const pondMesh = new THREE.Mesh(pondGeo, waterMat);
    pondMesh.position.set(-1.4, 0.08, 1.8);
    temple1Group.add(pondMesh);

    // ELECTRIC TRANSMISSION TOWER (Iconic landmark from the user's photo!)
    const towerGroup = new THREE.Group();
    towerGroup.position.set(1.9, 0, -1.4);
    temple1Group.add(towerGroup);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25
    });

    const towerH = 6.8;
    const baseW = 0.9;
    const topW = 0.28;
    const legCoords = [
      [-baseW, -baseW, -topW, -topW],
      [baseW, -baseW, topW, -topW],
      [baseW, baseW, topW, topW],
      [-baseW, baseW, -topW, topW]
    ];

    legCoords.forEach(([bx, bz, tx, tz]) => {
      const legGeo = new THREE.CylinderGeometry(0.03, 0.04, towerH, 6);
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.set((bx + tx) / 2, towerH / 2, (bz + tz) / 2);
      leg.rotation.z = Math.atan2(bx - tx, towerH);
      leg.rotation.x = Math.atan2(tz - bz, towerH);
      towerGroup.add(leg);
    });

    // Horizontal bracing levels
    for (let lvl = 1; lvl <= 4; lvl++) {
      const ly = (lvl / 4.5) * towerH;
      const lw = baseW + (topW - baseW) * (ly / towerH);
      const rMesh = new THREE.Mesh(new THREE.BoxGeometry(lw * 2, 0.035, lw * 2), metalMat);
      rMesh.position.y = ly;
      towerGroup.add(rMesh);
    }

    // Top Crossarms for Powerlines
    const arm1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.1), metalMat);
    arm1.position.set(0, towerH * 0.82, 0);
    towerGroup.add(arm1);

    const arm2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 0.1), metalMat);
    arm2.position.set(0, towerH * 0.92, 0);
    towerGroup.add(arm2);

    const towerPeak = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 4), metalMat);
    towerPeak.position.set(0, towerH + 0.35, 0);
    towerGroup.add(towerPeak);

    // Floating Anime Billboard above Kalleshwara Swamy
    createAnimeBillboard('temple1', temple1Group, 5.0);

    // =========================================================================
    // 👶 LANDMARK 6: ANGANWADI KENDRA MUTTAGONDI (North-West: -5.2, 0, -5.5)
    // =========================================================================
    const kindergardenGroup = new THREE.Group();
    kindergardenGroup.position.set(-5.2, 0, -5.5);
    villageGroup.add(kindergardenGroup);
    landmarkObjectsRef.current['kindergarden'] = kindergardenGroup;
    landmarkObjectsRef.current['clinic'] = kindergardenGroup;

    const kBase = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.25, 3.2), stoneMat);
    kBase.position.y = 0.12;
    kindergardenGroup.add(kBase);
    registerInteractive(kBase, 'kindergarden');

    // Friendly Blue painted building (from user photo)
    const kBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 2.6), skyBlueMat);
    kBody.position.y = 0.95;
    kBody.castShadow = true;
    kindergardenGroup.add(kBody);
    registerInteractive(kBody, 'kindergarden');

    // Yellow compound boundary wall (as in user's photo)
    const kWallL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 2.6), wallOchreMat);
    kWallL.position.set(-1.8, 0.65, 0);
    kindergardenGroup.add(kWallL);

    const kWallF = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 0.2), wallOchreMat);
    kWallF.position.set(0.6, 0.65, 1.4);
    kindergardenGroup.add(kWallF);

    // Roof
    const kRoof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.22, 2.9), cyanMat);
    kRoof.position.y = 1.85;
    kindergardenGroup.add(kRoof);

    // Playful flower pots in front
    const flowerPinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5 });
    for (let fx of [-0.9, -0.3, 0.3, 0.9]) {
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), flowerPinkMat);
      flower.position.set(fx, 0.25, 1.7);
      kindergardenGroup.add(flower);
    }

    // Floating Anime Billboard above Anganwadi
    createAnimeBillboard('kindergarden', kindergardenGroup, 3.8);

    // =========================================================================
    // 🌾 LANDMARK 7: ARECANUT & COCONUT FARMS (West: -7.5, 0, 0.5)
    // =========================================================================
    const farmGroup = new THREE.Group();
    farmGroup.position.set(-7.5, 0, 0.5);
    villageGroup.add(farmGroup);
    landmarkObjectsRef.current['farms'] = farmGroup;

    // Dark fertile soil bed
    const soilBed = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 4.8), soilMat);
    soilBed.position.y = 0.12;
    soilBed.receiveShadow = true;
    farmGroup.add(soilBed);
    registerInteractive(soilBed, 'farms');

    // Irrigation Water Canal (ಕಾಲುವೆ)
    const canal = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.28, 4.8), waterMat);
    canal.position.set(0, 0.14, 0);
    farmGroup.add(canal);

    // Arecanut Palms
    const arecaPositions = [
      [-1.6, -1.6], [-1.6, 0], [-1.6, 1.6],
      [1.6, -1.6], [1.6, 0], [1.6, 1.6]
    ];

    arecaPositions.forEach(([ax, az]) => {
      const aTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.2, 8), arecaTrunkMat);
      aTrunk.position.set(ax, 1.6, az);
      aTrunk.castShadow = true;
      farmGroup.add(aTrunk);

      const aCrown = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.1, 6), leavesMat);
      aCrown.position.set(ax, 3.4, az);
      aCrown.castShadow = true;
      farmGroup.add(aCrown);

      const aBunch = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), goldMat);
      aBunch.position.set(ax + 0.12, 2.9, az + 0.1);
      farmGroup.add(aBunch);
    });

    // =========================================================================
    // 💧 LANDMARK 8: PURE DRINKING WATER RO PLANT (South-West: -5.5, 0, 5.5)
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

    // --- Floating Anime Sakura & Golden Sunlight Particles ---
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 24;
      particlePositions[i + 1] = Math.random() * 9 + 0.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 24;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.38,
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
        if (dragDistanceRef.current < 6) {
          const { x, y } = getPointerCoords(clientX, clientY);
          mouse.x = x;
          mouse.y = y;
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(
            interactiveMeshesRef.current.map((item) => item.mesh)
          );
          if (intersects.length > 0) {
            const hitObj = intersects[0].object;
            const hitId = hitObj.userData.landmarkId as LandmarkId;
            if (hitId) {
              rotateToLandmark(hitId);
              if (onSelect) onSelect(hitId);

              // If tapped on an anime billboard or showcase, trigger callback
              if (hitObj.userData.isBillboard && onOpenAnimeShowcase) {
                onOpenAnimeShowcase(hitId);
              }
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

    // Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 470;
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
        posArray[i] += Math.sin(elapsedTime * 2.2 + i) * 0.01;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Update 3D Anime Holographic Billboards
      billboardGroups.forEach(({ group, id, baseY }, idx) => {
        group.visible = isAnimeModeRef.current;
        if (group.visible) {
          // Floating wave
          group.position.y = baseY + Math.sin(elapsedTime * 2.2 + idx * 1.3) * 0.14;
          // Smoothly face the camera
          group.quaternion.copy(camera.quaternion);

          const isSelected = activeLandmarkIdRef.current === id;
          const isHovered = hoveredLandmarkRef.current === id;
          const targetScale = isSelected ? 1.18 : isHovered ? 1.08 : 0.96;
          group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
        }
      });

      // Project 3D landmark coordinates to 2D screen pins
      const updatedCoords: { [key in LandmarkId]?: { x: number; y: number; visible: boolean } } = {};
      const landmarksList: LandmarkId[] = [
        'panchayat',
        'temple',
        'school',
        'farms',
        'temple1',
        'kindergarden',
        'water',
        'shrine'
      ];

      landmarksList.forEach((id) => {
        const obj = landmarkObjectsRef.current[id];
        if (obj) {
          const worldPos = new THREE.Vector3();
          obj.getWorldPosition(worldPos);
          worldPos.y += isAnimeModeRef.current ? 4.8 : 3.2; // Extra height if billboard is above

          const screenPos = worldPos.clone().project(camera);
          const isBehind = screenPos.z > 1;

          const x = (screenPos.x * 0.5 + 0.5) * container.clientWidth;
          const y = (-(screenPos.y * 0.5) + 0.5) * (container.clientHeight || 470);

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
  }, [onSelect, rotateToLandmark, onOpenAnimeShowcase]);

  // Adjust lights and atmosphere based on timeOfDay state
  useEffect(() => {
    const lights = lightsRef.current;
    if (!lights.sunLight || !lights.ambientLight || !lights.hemiLight) return;

    if (timeOfDay === 'day') {
      lights.sunLight.color.setHex(0xffffff);
      lights.sunLight.intensity = isAnimeMode ? 2.2 : 1.9;
      lights.sunLight.position.set(16, 28, 16);
      lights.ambientLight.color.setHex(0xf8fafc);
      lights.ambientLight.intensity = 0.95;
      lights.hemiLight.color.setHex(0xbae6fd);
      lights.hemiLight.groundColor.setHex(0x15803d);
    } else if (timeOfDay === 'sunset') {
      lights.sunLight.color.setHex(0xf59e0b);
      lights.sunLight.intensity = isAnimeMode ? 2.5 : 2.2;
      lights.sunLight.position.set(20, 14, 18);
      lights.ambientLight.color.setHex(0xfed7aa);
      lights.ambientLight.intensity = 0.75;
      lights.hemiLight.color.setHex(0xfb923c);
      lights.hemiLight.groundColor.setHex(0x1e1b4b);
    } else if (timeOfDay === 'night') {
      lights.sunLight.color.setHex(0x60a5fa);
      lights.sunLight.intensity = 0.65;
      lights.sunLight.position.set(8, 20, -14);
      lights.ambientLight.color.setHex(0x1e293b);
      lights.ambientLight.intensity = 0.5;
      lights.hemiLight.color.setHex(0x38bdf8);
      lights.hemiLight.groundColor.setHex(0x020617);
    }
  }, [timeOfDay, isAnimeMode]);

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

  const toggleAnimeMode = () => {
    const next = !isAnimeMode;
    setInternalAnimeMode(next);
    if (onToggleAnimeMode) onToggleAnimeMode(next);
  };

  // Aesthetic Anime Sky Gradient Backgrounds
  const backgroundGradient = useMemo(() => {
    if (isAnimeMode) {
      if (timeOfDay === 'day') {
        return 'radial-gradient(circle at 50% 25%, #0284c7 0%, #0369a1 40%, #082f49 85%, #020617 100%)';
      }
      if (timeOfDay === 'sunset') {
        return 'radial-gradient(circle at 60% 30%, #ea580c 0%, #9a3412 35%, #431407 70%, #0c0a09 100%)';
      }
      return 'radial-gradient(circle at 50% 25%, #4f46e5 0%, #312e81 40%, #0f172a 80%, #020617 100%)';
    }

    if (timeOfDay === 'day') {
      return 'radial-gradient(circle at 50% 30%, #1e3a8a 0%, #0c1938 60%, #050b14 100%)';
    }
    if (timeOfDay === 'sunset') {
      return 'radial-gradient(circle at 50% 30%, #431407 0%, #1c1917 50%, #050b14 100%)';
    }
    return 'radial-gradient(circle at 50% 30%, #030712 0%, #020617 60%, #000000 100%)';
  }, [timeOfDay, isAnimeMode]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '24px',
        overflow: 'hidden',
        background: backgroundGradient,
        boxShadow: isAnimeMode
          ? '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(245, 158, 11, 0.15)'
          : '0 25px 60px rgba(0,0,0,0.7)',
        border: isAnimeMode ? '1px solid rgba(251, 191, 36, 0.35)' : '1px solid rgba(255,255,255,0.12)',
        transition: 'background 0.8s ease, border 0.4s ease'
      }}
    >
      {/* 3D Canvas Mount */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '480px',
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
                : 'rgba(15, 23, 42, 0.9)',
              color: isSelected ? '#FFFFFF' : '#E2E8F0',
              border: `2px solid ${isSelected ? '#FFFFFF' : lm.color}`,
              borderRadius: '22px',
              padding: '5px 12px',
              fontSize: '0.78rem',
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
                  fontSize: '0.64rem',
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
          background: 'rgba(10, 18, 36, 0.88)',
          backdropFilter: 'blur(16px)',
          border: isAnimeMode ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(255,255,255,0.14)',
          borderRadius: '16px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          zIndex: 15
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>{isAnimeMode ? '✨' : '🌐'}</span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <strong style={{ fontSize: '0.86rem', color: '#FFFFFF' }}>
              {isKannada ? 'ಮುತ್ತಾಗೊಂದಿ 3D ಗ್ರಾಮ ಮಾದರಿ' : 'Muttagundi 3D Village Model'}
            </strong>
            {isAnimeMode && (
              <span
                style={{
                  background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.62rem',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  letterSpacing: '0.5px'
                }}
              >
                ANIME 3D
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
            {isKannada ? 'ತಿರುಗಿಸಲು ಎಳೆಯಿರಿ • ಕಟ್ಟಡವನ್ನು ಮುಟ್ಟಿ' : 'Drag to rotate • Tap building to inspect'}
          </span>
        </div>
      </div>

      {/* Top Right Controls Toolbar (Anime Mode + Time of Day + Camera) */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 15,
          flexWrap: 'wrap',
          justifyContent: 'flex-end'
        }}
      >
        {/* ✨ Anime Mode Toggle Button */}
        <button
          onClick={toggleAnimeMode}
          title="Toggle Anime 3D Visual Mode"
          style={{
            background: isAnimeMode
              ? 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)'
              : 'rgba(10, 18, 36, 0.85)',
            color: '#FFFFFF',
            border: isAnimeMode ? '1px solid #F472B6' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '6px 12px',
            fontSize: '0.76rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            boxShadow: isAnimeMode ? '0 0 16px rgba(236, 72, 153, 0.5)' : 'none',
            transition: 'all 0.25s ease'
          }}
        >
          <span>✨</span>
          <span>{isAnimeMode ? (isKannada ? 'ಅನಿಮೆ: ಆನ್' : 'Anime: ON') : (isKannada ? 'ಅನಿಮೆ ಮೋಡ್' : 'Anime Mode')}</span>
        </button>

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
              width: '28px',
              height: '28px',
              color: '#FFFFFF',
              fontSize: '0.95rem',
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
              width: '28px',
              height: '28px',
              color: '#FFFFFF',
              fontSize: '0.95rem',
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
              width: '28px',
              height: '28px',
              color: '#FFFFFF',
              fontSize: '0.72rem',
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
              width: '28px',
              height: '28px',
              color: '#FFFFFF',
              fontSize: '0.8rem',
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
              {lm.anime_image && isAnimeMode && (
                <span style={{ fontSize: '0.68rem', opacity: 0.9 }}>✨</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
