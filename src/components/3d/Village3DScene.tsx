import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type LandmarkId = 'panchayat' | 'temple' | 'farms' | 'sports' | 'clinic';

interface Village3DSceneProps {
  selectedId: LandmarkId;
  onSelect: (id: LandmarkId) => void;
  isKannada: boolean;
}

export const Village3DScene: React.FC<Village3DSceneProps> = ({
  selectedId,
  onSelect,
  isKannada
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotationGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationYRef = useRef(0);
  const landmarkObjectsRef = useRef<{ [key in LandmarkId]?: THREE.Object3D }>({});
  const [screenCoords, setScreenCoords] = useState<{
    [key in LandmarkId]?: { x: number; y: number; visible: boolean };
  }>({});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- Scene Setup ---
    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1526);
    scene.fog = new THREE.FogExp2(0x0a1526, 0.035);

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 16, 24);
    camera.lookAt(0, 0, 0);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    sunLight.position.set(12, 22, 14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    scene.add(sunLight);

    // Accent village evening glow
    const warmPoint = new THREE.PointLight(0xf59e0b, 1.5, 20);
    warmPoint.position.set(0, 3, 0);
    scene.add(warmPoint);

    // Main rotating village group
    const villageGroup = new THREE.Group();
    scene.add(villageGroup);
    rotationGroupRef.current = villageGroup;

    // --- Materials ---
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
    const stonePathMat = new THREE.MeshLambertMaterial({ color: 0x78716c });
    const wallWhiteMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const roofRedMat = new THREE.MeshLambertMaterial({ color: 0xb91c1c });
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x854d0e });
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const farmSoilMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
    const cropGreenMat = new THREE.MeshLambertMaterial({ color: 0x84cc16 });
    const pitchMat = new THREE.MeshLambertMaterial({ color: 0xa16207 });

    // --- Village Base Island ---
    const islandGeo = new THREE.CylinderGeometry(11, 12, 1.2, 32);
    const islandMesh = new THREE.Mesh(islandGeo, grassMat);
    islandMesh.position.y = -0.6;
    islandMesh.receiveShadow = true;
    villageGroup.add(islandMesh);

    // Base Rim
    const rimGeo = new THREE.CylinderGeometry(12, 12.5, 0.8, 32);
    const rimMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = -1.5;
    villageGroup.add(rimMesh);

    // Central circular plaza (Village Katte)
    const plazaGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.1, 24);
    const plazaMesh = new THREE.Mesh(plazaGeo, stonePathMat);
    plazaMesh.position.y = 0.05;
    villageGroup.add(plazaMesh);

    // Paths connecting center to buildings
    const createPath = (x1: number, z1: number, x2: number, z2: number) => {
      const length = Math.hypot(x2 - x1, z2 - z1);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const pathGeo = new THREE.PlaneGeometry(1.2, length);
      const pathMesh = new THREE.Mesh(pathGeo, stonePathMat);
      pathMesh.rotation.x = -Math.PI / 2;
      pathMesh.rotation.z = -angle;
      pathMesh.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
      villageGroup.add(pathMesh);
    };

    createPath(0, 0, 0, -6); // North to Panchayat
    createPath(0, 0, 6.5, 0); // East to Temple
    createPath(0, 0, -6.5, 0); // West to Farm
    createPath(0, 0, 0, 6); // South to Sports
    createPath(0, 0, -5, -4.5); // NW to Clinic

    // Central Banyan Tree on Katte
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 2, 8);
    const trunk = new THREE.Mesh(trunkGeo, woodMat);
    trunk.position.set(0, 1, 0);
    villageGroup.add(trunk);

    const foliage1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3), new THREE.MeshLambertMaterial({ color: 0x166534 }));
    foliage1.position.set(0, 2.4, 0);
    villageGroup.add(foliage1);

    // --- Landmark 1: Panchayat Bhavan (North: 0, 0, -6.5) ---
    const panchayatGroup = new THREE.Group();
    panchayatGroup.position.set(0, 0, -6.5);
    villageGroup.add(panchayatGroup);
    landmarkObjectsRef.current['panchayat'] = panchayatGroup;

    // Building body
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 2.4), wallWhiteMat);
    pBody.position.y = 0.9;
    pBody.castShadow = true;
    pBody.receiveShadow = true;
    panchayatGroup.add(pBody);

    // Roof
    const pRoof = new THREE.Mesh(new THREE.ConeGeometry(3, 1.2, 4), roofRedMat);
    pRoof.position.y = 2.4;
    pRoof.rotation.y = Math.PI / 4;
    pRoof.castShadow = true;
    panchayatGroup.add(pRoof);

    // Flag pole & Flag
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8), stonePathMat);
    pole.position.set(1.5, 1.4, 1.4);
    panchayatGroup.add(pole);

    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.05), goldMat);
    flag.position.set(1.8, 2.5, 1.4);
    panchayatGroup.add(flag);

    // --- Landmark 2: Ancient Village Temple (East: 6.5, 0, 0) ---
    const templeGroup = new THREE.Group();
    templeGroup.position.set(6.5, 0, 0);
    villageGroup.add(templeGroup);
    landmarkObjectsRef.current['temple'] = templeGroup;

    // Temple Base
    const tBase = new THREE.Mesh(new THREE.BoxGeometry(3, 1.4, 3), wallWhiteMat);
    tBase.position.y = 0.7;
    tBase.castShadow = true;
    templeGroup.add(tBase);

    // Stepped Shikhara (Gopura)
    const tTower1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 2.2), roofRedMat);
    tTower1.position.y = 1.8;
    templeGroup.add(tTower1);

    const tTower2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.5), roofRedMat);
    tTower2.position.y = 2.6;
    templeGroup.add(tTower2);

    // Golden Kalasha
    const kalasha = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 8), goldMat);
    kalasha.position.y = 3.3;
    templeGroup.add(kalasha);

    // Temple Diya / Lamp glow
    const diyaLight = new THREE.PointLight(0xf59e0b, 1.8, 4);
    diyaLight.position.set(0, 1.2, 1.6);
    templeGroup.add(diyaLight);

    // --- Landmark 3: Farm & Crops (West: -6.5, 0, 0) ---
    const farmGroup = new THREE.Group();
    farmGroup.position.set(-6.5, 0, 0);
    villageGroup.add(farmGroup);
    landmarkObjectsRef.current['farms'] = farmGroup;

    // Soil beds
    const soilBed = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 3.6), farmSoilMat);
    soilBed.position.y = 0.1;
    farmGroup.add(soilBed);

    // Water channel
    const canal = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 3.6), waterMat);
    canal.position.set(0, 0.1, 0);
    farmGroup.add(canal);

    // Crops rows
    for (let r = -1.3; r <= 1.3; r += 0.6) {
      if (Math.abs(r) < 0.4) continue;
      for (let c = -1.4; c <= 1.4; c += 0.5) {
        const crop = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 5), cropGreenMat);
        crop.position.set(r, 0.4, c);
        crop.rotation.z = (Math.random() - 0.5) * 0.2;
        farmGroup.add(crop);
      }
    }

    // Small windmill / water pump
    const pumpBase = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.8, 8), stonePathMat);
    pumpBase.position.set(1.4, 0.9, 1.4);
    farmGroup.add(pumpBase);

    // --- Landmark 4: Sports Ground (South: 0, 0, 6.5) ---
    const sportsGroup = new THREE.Group();
    sportsGroup.position.set(0, 0, 6.5);
    villageGroup.add(sportsGroup);
    landmarkObjectsRef.current['sports'] = sportsGroup;

    // Cricket Pitch
    const pitch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 3.2), pitchMat);
    pitch.position.y = 0.03;
    sportsGroup.add(pitch);

    // Pitch markings (stumps)
    const stump1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), wallWhiteMat);
    stump1.position.set(0, 0.25, -1.4);
    sportsGroup.add(stump1);

    const stump2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), wallWhiteMat);
    stump2.position.set(0, 0.25, 1.4);
    sportsGroup.add(stump2);

    // Mini spectator pavilion
    const pavilion = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1, 1), wallWhiteMat);
    pavilion.position.set(0, 0.5, -2.2);
    sportsGroup.add(pavilion);

    const pavilionRoof = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 1.4), roofRedMat);
    pavilionRoof.position.set(0, 1.1, -2.2);
    sportsGroup.add(pavilionRoof);

    // --- Landmark 5: Village Health Clinic (North-West: -4.8, 0, -4.5) ---
    const clinicGroup = new THREE.Group();
    clinicGroup.position.set(-4.8, 0, -4.5);
    villageGroup.add(clinicGroup);
    landmarkObjectsRef.current['clinic'] = clinicGroup;

    const cBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 2.2), wallWhiteMat);
    cBody.position.y = 0.8;
    cBody.castShadow = true;
    clinicGroup.add(cBody);

    const cRoof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 2.4), new THREE.MeshLambertMaterial({ color: 0x0284c7 }));
    cRoof.position.y = 1.7;
    clinicGroup.add(cRoof);

    // Medical Red Plus Cross
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.75, 0.05), roofRedMat);
    crossV.position.set(0, 1.1, 1.12);
    clinicGroup.add(crossV);

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.25, 0.05), roofRedMat);
    crossH.position.set(0, 1.1, 1.12);
    clinicGroup.add(crossH);

    // --- Palm Trees around the village ---
    const treePositions = [
      [3.5, 3.5], [-3.5, 3.5], [4.5, -4], [-2.5, -7], [8, -3], [-8, 2.5]
    ];
    treePositions.forEach(([tx, tz]) => {
      const pTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.2, 6), woodMat);
      pTrunk.position.set(tx, 1.1, tz);
      pTrunk.rotation.z = (Math.random() - 0.5) * 0.15;
      villageGroup.add(pTrunk);

      const pLeaves = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.2, 5), new THREE.MeshLambertMaterial({ color: 0x15803d }));
      pLeaves.position.set(tx, 2.4, tz);
      villageGroup.add(pLeaves);
    });

    // --- Floating Ambient Particles (Fireflies / Spirit of the Village) ---
    const particleCount = 40;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 20;
      particlePositions[i + 1] = Math.random() * 8 + 0.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 20;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.25,
      transparent: true,
      opacity: 0.8
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    villageGroup.add(particles);

    // --- Interaction / Drag Controls ---
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !rotationGroupRef.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      targetRotationYRef.current += deltaX * 0.008;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !rotationGroupRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      targetRotationYRef.current += deltaX * 0.009;
      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow idle rotation when not dragging
      if (!isDraggingRef.current) {
        targetRotationYRef.current += 0.002;
      }

      if (rotationGroupRef.current) {
        // Smooth lerp rotation
        rotationGroupRef.current.rotation.y += (targetRotationYRef.current - rotationGroupRef.current.rotation.y) * 0.08;
      }

      // Gentle floating animation on particles
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        positions[i] += Math.sin(elapsedTime * 2 + i) * 0.006;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Project 3D landmark coordinates to 2D screen positions for floating pins
      const updatedCoords: { [key in LandmarkId]?: { x: number; y: number; visible: boolean } } = {};
      const landmarks: LandmarkId[] = ['panchayat', 'temple', 'farms', 'sports', 'clinic'];

      landmarks.forEach((id) => {
        const obj = landmarkObjectsRef.current[id];
        if (obj) {
          const worldPos = new THREE.Vector3();
          obj.getWorldPosition(worldPos);
          worldPos.y += 2.8; // Pin height above building

          const screenPos = worldPos.clone().project(camera);
          const isBehind = screenPos.z > 1;

          const x = (screenPos.x * 0.5 + 0.5) * container.clientWidth;
          const y = (-(screenPos.y * 0.5) + 0.5) * (container.clientHeight || 420);

          updatedCoords[id] = {
            x,
            y,
            visible: !isBehind && x > 20 && x < container.clientWidth - 20 && y > 20 && y < container.clientHeight - 20
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
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // When selectedId changes from outside, smoothly align rotation to that landmark
  useEffect(() => {
    const angleMap: Record<LandmarkId, number> = {
      panchayat: 0,
      temple: -Math.PI / 2,
      sports: Math.PI,
      farms: Math.PI / 2,
      clinic: Math.PI / 4
    };

    if (angleMap[selectedId] !== undefined) {
      // Find nearest equivalent angle to avoid spinning full circles
      const current = targetRotationYRef.current;
      const target = angleMap[selectedId];
      const diff = (target - (current % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      targetRotationYRef.current = current + diff;
    }
  }, [selectedId]);

  const landmarkDetails = [
    { id: 'panchayat', label_en: 'Panchayat', label_kn: 'ಗ್ರಾಮ ಪಂಚಾಯತ್', icon: '🏛️', color: '#10B981' },
    { id: 'temple', label_en: 'Temple', label_kn: 'ದೇವಸ್ಥಾನ', icon: '🛕', color: '#F59E0B' },
    { id: 'farms', label_en: 'Farms', label_kn: 'ಕೃಷಿ ಭೂಮಿ', icon: '🌾', color: '#84CC16' },
    { id: 'sports', label_en: 'Sports Ground', label_kn: 'ಕ್ರೀಡಾಂಗಣ', icon: '🏏', color: '#8B5CF6' },
    { id: 'clinic', label_en: 'Health Clinic', label_kn: 'ಆರೋಗ್ಯ ಕೇಂದ್ರ', icon: '🏥', color: '#EF4444' }
  ];

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '24px', overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%, #0c1c38 0%, #050b14 100%)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* 3D Canvas Mount */}
      <div
        ref={mountRef}
        style={{ width: '100%', height: '440px', cursor: 'grab', touchAction: 'none' }}
      />

      {/* Floating 2D Pins over 3D coordinates */}
      {landmarkDetails.map((lm) => {
        const coords = screenCoords[lm.id as LandmarkId];
        if (!coords || !coords.visible) return null;
        const isSelected = selectedId === lm.id;

        return (
          <button
            key={lm.id}
            onClick={() => onSelect(lm.id as LandmarkId)}
            style={{
              position: 'absolute',
              left: `${coords.x}px`,
              top: `${coords.y}px`,
              transform: 'translate(-50%, -100%)',
              zIndex: 10,
              background: isSelected ? lm.color : 'rgba(15, 23, 42, 0.85)',
              color: isSelected ? '#FFFFFF' : '#E2E8F0',
              border: `2px solid ${isSelected ? '#FFFFFF' : lm.color}`,
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: isSelected
                ? `0 0 20px ${lm.color}, 0 4px 12px rgba(0,0,0,0.5)`
                : '0 4px 12px rgba(0,0,0,0.5)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap',
              pointerEvents: 'auto'
            }}
          >
            <span>{lm.icon}</span>
            <span>{isKannada ? lm.label_kn : lm.label_en}</span>
          </button>
        );
      })}

      {/* 3D Scene Controls Overlay & Hint */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '6px 12px',
          color: 'var(--text-muted)',
          fontSize: '0.74rem',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <span>🔄</span>
        <span>{isKannada ? 'ತಿರುಗಿಸಲು ಎಳೆಯಿರಿ / ಕಟ್ಟಡವನ್ನು ಮುಟ್ಟಿ' : 'Drag to rotate 3D village / Tap building'}</span>
      </div>

      {/* Quick 1-Tap Landmark Selector Strip at Bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          background: 'rgba(10, 18, 32, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '30px',
          padding: '6px',
          maxWidth: '92%',
          overflowX: 'auto',
          zIndex: 12
        }}
      >
        {landmarkDetails.map((lm) => {
          const isSelected = selectedId === lm.id;
          return (
            <button
              key={lm.id}
              onClick={() => onSelect(lm.id as LandmarkId)}
              style={{
                background: isSelected ? lm.color : 'transparent',
                color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '24px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
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
