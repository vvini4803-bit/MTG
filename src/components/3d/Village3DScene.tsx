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
// 1. PROCEDURAL CANVASES: 100% FAITHFUL TO THE 5 REAL REFERENCE PHOTOGRAPHS
// ============================================================================

/**
 * Reference 5 — Sri Anjaneya Swamy Temple Facade Texture
 * Preserves:
 * - Coursed grey ashlar granite stone blocks on lower wall
 * - Scalloped green mango leaf festoons with pink lotus pendants (torana)
 * - Stepped pink & yellow lotus petal moulding (padma eaves)
 * - Vibrant turquoise blue parapet with yellow medallions & relief rosettes
 * - Arched deity niches enclosing Lord Hanuman in blue with golden halo
 */
function createAnjaneyaTempleFacadeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Ashlar Stone Block Masonry (Lower 55% of the wall)
  const stoneTop = 230;
  const stoneHeight = canvas.height - stoneTop;

  // Base stone tone
  ctx.fillStyle = '#64748B';
  ctx.fillRect(0, stoneTop, canvas.width, stoneHeight);

  // Individual coursed stone blocks with bevel and mortar lines
  const rows = 8;
  const rowH = stoneHeight / rows;
  const blockW = 64;

  for (let r = 0; r < rows; r++) {
    const y = stoneTop + r * rowH;
    const isShifted = r % 2 === 1;
    const startX = isShifted ? -blockW / 2 : 0;

    for (let x = startX; x < canvas.width + blockW; x += blockW) {
      // Subtle stone tone variation
      const shade = 105 + Math.floor(Math.sin(x * 0.05 + r) * 18 + Math.cos(r * 3) * 12);
      ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 6})`;
      ctx.fillRect(x + 2, y + 2, blockW - 4, rowH - 4);

      // Fine chiseled granite texture noise
      for (let dot = 0; dot < 35; dot++) {
        const dx = x + 2 + Math.random() * (blockW - 4);
        const dy = y + 2 + Math.random() * (rowH - 4);
        const g = shade + (Math.random() - 0.5) * 40;
        ctx.fillStyle = `rgb(${g}, ${g}, ${g})`;
        ctx.fillRect(dx, dy, 1.5, 1.5);
      }

      // Stone block highlight (top/left) & shadow (bottom/right)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, blockW - 4, rowH - 4);

      // Dark mortar joint
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, blockW, rowH);
    }
  }

  // Plinth moulding line
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, canvas.height - 18, canvas.width, 18);

  // 2. Hanging Festoons / Torana Garlands (Green mango leaves & pink lotus pendants)
  const toranaY = 210;
  ctx.fillStyle = '#166534';
  const festoonCount = 24;
  const festoonW = canvas.width / festoonCount;

  for (let i = 0; i < festoonCount; i++) {
    const fx = i * festoonW;
    ctx.beginPath();
    ctx.moveTo(fx, toranaY);
    ctx.quadraticCurveTo(fx + festoonW / 2, toranaY + 22, fx + festoonW, toranaY);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#22C55E';
    ctx.stroke();

    // Pink flower pendant at bottom of each loop
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.arc(fx + festoonW / 2, toranaY + 23, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(fx + festoonW / 2, toranaY + 23, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Eaves Padma Moulding (Stepped Lotus petals in pink, yellow & green)
  // Green base band
  ctx.fillStyle = '#15803D';
  ctx.fillRect(0, 185, canvas.width, 15);

  // Pink lotus petals
  ctx.fillStyle = '#F472B6';
  ctx.fillRect(0, 160, canvas.width, 25);
  for (let px = 0; px < canvas.width; px += 20) {
    ctx.fillStyle = '#FDF2F8';
    ctx.beginPath();
    ctx.moveTo(px, 185);
    ctx.lineTo(px + 10, 160);
    ctx.lineTo(px + 20, 185);
    ctx.closePath();
    ctx.fill();
  }

  // Golden yellow cornice
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(0, 142, canvas.width, 18);
  ctx.fillStyle = '#EAB308';
  ctx.fillRect(0, 156, canvas.width, 4);

  // 4. Parapet Band (Turquoise blue with yellow relief medallions)
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(0, 60, canvas.width, 82);

  // Rosettes / medallions
  for (let rx = 32; rx < canvas.width; rx += 64) {
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(rx, 101, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.arc(rx, 101, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Arched Deity Niches (with Lord Hanuman & deities)
  const drawNiche = (cx: number, cy: number, w: number, h: number) => {
    // Golden ornate arch
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy - h / 4, w / 2, Math.PI, 0);
    ctx.lineTo(cx + w / 2, cy + h / 2);
    ctx.lineTo(cx - w / 2, cy + h / 2);
    ctx.closePath();
    ctx.stroke();

    // Deep blue niche background
    ctx.fillStyle = '#0369A1';
    ctx.fill();

    // Deity figure inside (Divine blue Lord Hanuman with golden halo & crown)
    // Golden halo
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(cx, cy - h / 4 + 4, 18, 0, Math.PI * 2);
    ctx.fill();

    // Blue divine figure
    ctx.fillStyle = '#38BDF8';
    // Head & Crown
    ctx.beginPath();
    ctx.arc(cx, cy - h / 4 + 4, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F59E0B'; // Crown (Kireeta)
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - h / 4 - 4);
    ctx.lineTo(cx, cy - h / 4 - 18);
    ctx.lineTo(cx + 7, cy - h / 4 - 4);
    ctx.closePath();
    ctx.fill();

    // Torso & Saffron garland
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(cx - 9, cy - h / 4 + 16, 18, 28);
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.arc(cx, cy - h / 4 + 26, 12, 0, Math.PI);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#F97316';
    ctx.stroke();

    // Golden mace (Gada)
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(cx + 10, cy - h / 4 + 10, 4, 30);
    ctx.beginPath();
    ctx.arc(cx + 12, cy - h / 4 + 10, 7, 0, Math.PI * 2);
    ctx.fill();
  };

  drawNiche(256, 95, 75, 95);
  drawNiche(768, 95, 75, 95);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/**
 * Reference 1 — Megalithic Dolmen Rustic Stone Shrine
 * Texture with stacked basalt, laterite and sandstone rocks
 */
function createStoneShrineTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base earthy tone
  ctx.fillStyle = '#57534E';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Irregular stacked stone slabs
  const stoneLayers = 14;
  const layerH = canvas.height / stoneLayers;

  for (let l = 0; l < stoneLayers; l++) {
    const y = l * layerH;
    let x = 0;
    while (x < canvas.width) {
      const w = 45 + Math.random() * 65;
      const palette = [
        '#374151', // Charcoal Basalt
        '#4B5563', // Grey Basalt
        '#7C2D12', // Reddish Laterite
        '#9A3412', // Warm Earth Laterite
        '#78716C', // Sandstone
        '#A8A29E', // Weathered Granite
        '#52525B'  // Dark slate
      ];
      ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
      ctx.fillRect(x + 1.5, y + 1.5, w - 3, layerH - 3);

      // Fine chiseled texture
      for (let k = 0; k < 25; k++) {
        const nx = x + Math.random() * w;
        const ny = y + Math.random() * layerH;
        ctx.fillStyle = Math.random() > 0.5 ? '#1C1917' : '#D6D3D1';
        ctx.fillRect(nx, ny, 1.5, 1.5);
      }

      // Dark crevice mortar lines
      ctx.strokeStyle = '#1C1917';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, layerH);

      x += w;
    }
  }

  // Green climbing vine tendrils over the stone
  ctx.strokeStyle = '#22C55E';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let v = 0; v < 16; v++) {
    let vx = Math.random() * canvas.width;
    let vy = Math.random() * canvas.height * 0.4;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    for (let seg = 0; seg < 5; seg++) {
      vx += (Math.random() - 0.5) * 35;
      vy += 15 + Math.random() * 20;
      ctx.lineTo(vx, vy);
    }
    ctx.stroke();

    // Leaf buds
    ctx.fillStyle = '#4ADE80';
    ctx.beginPath();
    ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

/**
 * Reference 1 — Inner Sanctum Deity Idol
 * Preserves the vermilion-smeared sacred stone murti & marigold flowers from the photo
 */
function createStoneShrineSanctumTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep shadowy dark rock chamber
  ctx.fillStyle = '#1C1917';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Radial cave shadow
  const grad = ctx.createRadialGradient(256, 320, 20, 256, 320, 240);
  grad.addColorStop(0, 'rgba(41, 37, 36, 0.9)');
  grad.addColorStop(1, '#0C0A09');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Central Carved Stone Idol (Murti)
  const cx = 256;
  const cy = 290;

  // Dark stone niche backdrop
  ctx.fillStyle = '#44403C';
  ctx.beginPath();
  ctx.arc(cx, cy - 60, 70, Math.PI, 0);
  ctx.lineTo(cx + 70, cy + 90);
  ctx.lineTo(cx - 70, cy + 90);
  ctx.closePath();
  ctx.fill();

  // Sacred stone deity idol smeared with bright vermilion (sindoor / kumkuma)
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(cx, cy - 40, 42, 0, Math.PI * 2);
  ctx.fill();

  // Orange vermilion paste highlights
  ctx.fillStyle = '#EA580C';
  ctx.beginPath();
  ctx.arc(cx, cy - 40, 28, 0, Math.PI * 2);
  ctx.fill();

  // Deity crown & sacred tilak
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(cx - 5, cy - 80, 10, 22);
  ctx.fillRect(cx - 15, cy - 45, 30, 8);

  // Heap of fresh yellow and orange marigold flower offerings at the base
  for (let f = 0; f < 38; f++) {
    const fx = cx - 75 + Math.random() * 150;
    const fy = cy + 50 + Math.random() * 45;
    const r = 5.5 + Math.random() * 5.5;
    ctx.fillStyle = f % 2 === 0 ? '#FBBF24' : '#F97316';
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(fx, fy, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/**
 * Reference 2 — Government Lower Primary School Signage Banner
 * Preserves Karnataka Flag circular emblem & exact Kannada text from photo:
 * "ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ ಮುತ್ಥಾಗೊಂದಿ"
 */
function createSchoolBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Warm cream/ivory background matching photograph
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Royal blue borders
  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(0, 0, canvas.width, 14);
  ctx.fillRect(0, canvas.height - 14, canvas.width, 14);

  // Karnataka State Flag Circular Emblem on Left (Red top half, Yellow bottom half)
  const cx = 110;
  const cy = 128;
  const r = 76;

  // Outer dark blue boundary ring
  ctx.fillStyle = '#1E3A8A';
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.fill();

  // Flag circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  // Top half: Crimson Red
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(cx - r, cy - r, r * 2, r);
  // Bottom half: Turmeric Yellow
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(cx - r, cy, r * 2, r);

  // Flagpole silhouette inside circle
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy + 45);
  ctx.lineTo(cx - 30, cy - 45);
  ctx.stroke();

  // Fluttering flag shape
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy - 45);
  ctx.lineTo(cx + 25, cy - 35);
  ctx.lineTo(cx - 30, cy - 25);
  ctx.fill();
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy - 25);
  ctx.lineTo(cx + 25, cy - 15);
  ctx.lineTo(cx - 30, cy - 5);
  ctx.fill();
  ctx.restore();

  // Bold Navy Blue Kannada Title
  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'bold 50px "Noto Sans Kannada", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ', 225, 95);

  // Black subtext matching photograph ("ಮುತ್ಥಾಗೊಂದಿ • ಧಾವಲದುರ್ಗ ಘಾ...")
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 36px "Noto Sans Kannada", "Segoe UI", sans-serif';
  ctx.fillText('ಮುತ್ಥಾಗೊಂದಿ.   ಧಾವಲದುರ್ಗ ಘಾ...', 230, 168);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/**
 * Reference 2 — School Facade Murals & Blue Doors
 * Preserves yellow exterior, blue doors & windows, painted murals under veranda
 */
function createSchoolFacadeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Mustard yellow stucco base
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Lower darker plinth
  ctx.fillStyle = '#CA8A04';
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

  // Royal blue double door on left
  const doorX = 110;
  const doorY = 160;
  const doorW = 160;
  const doorH = 310;
  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(doorX, doorY, doorW, doorH);
  ctx.strokeStyle = '#1E3A8A';
  ctx.lineWidth = 6;
  ctx.strokeRect(doorX, doorY, doorW, doorH);

  // Door panels
  ctx.fillStyle = '#2563EB';
  ctx.fillRect(doorX + 12, doorY + 16, doorW / 2 - 18, 120);
  ctx.fillRect(doorX + doorW / 2 + 6, doorY + 16, doorW / 2 - 18, 120);
  ctx.fillRect(doorX + 12, doorY + 155, doorW / 2 - 18, 130);
  ctx.fillRect(doorX + doorW / 2 + 6, doorY + 155, doorW / 2 - 18, 130);

  // Brass handle & lock
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.arc(doorX + doorW / 2 - 8, doorY + 160, 6, 0, Math.PI * 2);
  ctx.fill();

  // Wall Artwork 1: Deity painting under veranda (Mother Goddess with red aura)
  const mural1X = 340;
  const mural1Y = 200;
  const mural1W = 140;
  const mural1H = 200;
  ctx.fillStyle = '#991B1B';
  ctx.fillRect(mural1X, mural1Y, mural1W, mural1H);
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(mural1X + mural1W / 2, mural1Y + 70, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(mural1X + mural1W / 2, mural1Y + 70, 26, 0, Math.PI * 2);
  ctx.fill();

  // Wall Artwork 2: Scenic Mountain Landscape Mural
  const mural2X = 530;
  const mural2Y = 220;
  const mural2W = 160;
  const mural2H = 180;
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(mural2X, mural2Y, mural2W, mural2H);
  ctx.fillStyle = '#15803D';
  ctx.beginPath();
  ctx.moveTo(mural2X, mural2Y + mural2H);
  ctx.lineTo(mural2X + 50, mural2Y + 70);
  ctx.lineTo(mural2X + 110, mural2Y + mural2H);
  ctx.fill();
  ctx.fillStyle = '#166534';
  ctx.beginPath();
  ctx.moveTo(mural2X + 70, mural2Y + mural2H);
  ctx.lineTo(mural2X + 130, mural2Y + 90);
  ctx.lineTo(mural2X + mural2W, mural2Y + mural2H);
  ctx.fill();

  // Wall Artwork 3: School Timetable Blackboard Slate
  const mural3X = 740;
  const mural3Y = 200;
  const mural3W = 160;
  const mural3H = 200;
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(mural3X, mural3Y, mural3W, mural3H);
  ctx.strokeStyle = '#92400E';
  ctx.lineWidth = 6;
  ctx.strokeRect(mural3X, mural3Y, mural3W, mural3H);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 16px "Noto Sans Kannada", sans-serif';
  ctx.fillText('ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿ', mural3X + 18, mural3Y + 34);
  for (let l = 0; l < 5; l++) {
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mural3X + 15, mural3Y + 55 + l * 26);
    ctx.lineTo(mural3X + mural3W - 15, mural3Y + 55 + l * 26);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

/**
 * Reference 3 — Sri Kalleshwara Swamy Temple Whitewashed Texture
 * Preserves rustic lime-wash texture, weathered patina & turquoise doorway
 */
function createKalleshwaraTempleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Weathered ivory/whitewashed lime plaster
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle vertical lime-wash streaks and age stains
  for (let x = 0; x < canvas.width; x += 6) {
    const s = Math.sin(x * 0.08) * 12 + Math.cos(x * 0.03) * 8;
    ctx.fillStyle = `rgba(226, 232, 240, ${0.45 + s * 0.02})`;
    ctx.fillRect(x, 0, 6, canvas.height);
  }

  // Aged earthy patina near ground (splash-back from red rural soil)
  const dirtGrad = ctx.createLinearGradient(0, canvas.height - 110, 0, canvas.height);
  dirtGrad.addColorStop(0, 'rgba(161, 98, 7, 0.0)');
  dirtGrad.addColorStop(0.6, 'rgba(161, 98, 7, 0.35)');
  dirtGrad.addColorStop(1, 'rgba(120, 53, 15, 0.65)');
  ctx.fillStyle = dirtGrad;
  ctx.fillRect(0, canvas.height - 110, canvas.width, 110);

  // Fine stress fissures / cracks
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
  ctx.lineWidth = 1.2;
  const cracks = [
    { x: 180, y: 40, len: 140 },
    { x: 420, y: 70, len: 190 },
    { x: 780, y: 50, len: 160 }
  ];
  cracks.forEach((c) => {
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    let cx = c.x;
    for (let seg = 0; seg < 6; seg++) {
      cx += (Math.random() - 0.5) * 18;
      ctx.lineTo(cx, c.y + (seg + 1) * (c.len / 6));
    }
    ctx.stroke();
  });

  // Turquoise / Sky-Blue Entrance Doorway on Right side (Matching photograph)
  const dX = 720;
  const dY = 160;
  const dW = 130;
  const dH = 310;

  // White moulded stone frame
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(dX - 14, dY - 14, dW + 28, dH + 14);
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 3;
  ctx.strokeRect(dX - 14, dY - 14, dW + 28, dH + 14);

  // Brilliant turquoise blue recessed entrance door
  ctx.fillStyle = '#06B6D4';
  ctx.fillRect(dX, dY, dW, dH);
  ctx.strokeStyle = '#0891B2';
  ctx.lineWidth = 4;
  ctx.strokeRect(dX, dY, dW, dH);

  // Door vertical slit
  ctx.strokeStyle = '#0E7490';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(dX + dW / 2, dY);
  ctx.lineTo(dX + dW / 2, dY + dH);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

/**
 * Reference 4 — Anganwadi Kendra Mural Wall Art
 * Preserves sky-blue facade, clouds, mango, apple/pomegranate, cucumber, Kannada signboard
 */
function createAnganwadiMuralTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Cheerful sky-blue background matching photograph
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft white clouds in sky
  const drawCloud = (cx: number, cy: number, r: number) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.7, cy - r * 0.2, r * 0.8, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.7, cy - r * 0.2, r * 0.75, 0, Math.PI * 2);
    ctx.arc(cx + r * 1.3, cy + r * 0.1, r * 0.65, 0, Math.PI * 2);
    ctx.fill();
  };

  drawCloud(160, 90, 32);
  drawCloud(420, 80, 28);
  drawCloud(820, 100, 34);

  // Educational Wall Fruit Murals (from photo):
  // 1. Golden Ripe Mango with Leaf
  const mangoX = 180;
  const mangoY = 165;
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.ellipse(mangoX, mangoY, 34, 46, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.ellipse(mangoX + 6, mangoY + 4, 22, 34, 0.25, 0, Math.PI * 2);
  ctx.fill();
  // Green stem & leaf
  ctx.fillStyle = '#16A34A';
  ctx.beginPath();
  ctx.ellipse(mangoX - 12, mangoY - 45, 14, 7, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // 2. Central White Kannada Signboard
  const boardX = 360;
  const boardY = 135;
  const boardW = 310;
  const boardH = 95;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(boardX, boardY, boardW, boardH);
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 4;
  ctx.strokeRect(boardX, boardY, boardW, boardH);

  ctx.fillStyle = '#0369A1';
  ctx.font = 'bold 28px "Noto Sans Kannada", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ಅಂಗನವಾಡಿ ಕೇಂದ್ರ', boardX + boardW / 2, boardY + 36);
  ctx.font = 'bold 22px "Noto Sans Kannada", sans-serif';
  ctx.fillStyle = '#DC2626';
  ctx.fillText('ಮುತ್ಥಾಗೊಂದಿ', boardX + boardW / 2, boardY + 68);

  // 3. Red Pomegranate / Apple
  const appleX = 740;
  const appleY = 165;
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(appleX, appleY, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.arc(appleX - 8, appleY - 8, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#15803D';
  ctx.beginPath();
  ctx.ellipse(appleX + 6, appleY - 38, 14, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // 4. Green Cucumber / Gourd
  const cucX = 890;
  const cucY = 165;
  ctx.fillStyle = '#16A34A';
  ctx.beginPath();
  ctx.ellipse(cucX, cucY, 44, 20, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#86EFAC';
  for (let s = -28; s <= 28; s += 14) {
    ctx.beginPath();
    ctx.arc(cucX + s, cucY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Brown wooden entrance doors & shuttered windows
  const drawDoor = (dx: number, dy: number, dw: number, dh: number) => {
    ctx.fillStyle = '#78350F';
    ctx.fillRect(dx, dy, dw, dh);
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 4;
    ctx.strokeRect(dx, dy, dw, dh);
    ctx.fillStyle = '#92400E';
    ctx.fillRect(dx + 6, dy + 8, dw / 2 - 9, dh - 16);
    ctx.fillRect(dx + dw / 2 + 3, dy + 8, dw / 2 - 9, dh - 16);
  };

  drawDoor(240, 270, 110, 200);
  drawDoor(440, 270, 110, 200);
  drawDoor(680, 270, 110, 200);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

/** Asphalt Texture for curved road */
function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2B2F38';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
  skyGrad.addColorStop(0.0, '#38BDF8');
  skyGrad.addColorStop(0.4, '#7DD3FC');
  skyGrad.addColorStop(0.7, '#BAE6FD');
  skyGrad.addColorStop(1.0, '#FEF08A');
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

  // 4. Flock of Birds in V-Formation near the Sun
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
  const [showLabels, setShowLabels] = useState(false);

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
    if (raw.includes('anjaneya')) return 'temple';
    if (raw.includes('kalle') || raw.includes('temple1') || raw.includes('pylon')) return 'temple1';
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
    const createOrganicTree = (scale = 1.0, type: 'banyan' | 'neem' | 'palm' = 'banyan'): THREE.Group => {
      const tree = new THREE.Group();
      if (type === 'palm') {
        // Curved coconut palm
        const trunkH = 4.2 * scale;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.22 * scale, trunkH, 8), barkBrownMat);
        trunk.position.y = trunkH / 2;
        trunk.rotation.z = (Math.random() - 0.5) * 0.25;
        trunk.castShadow = true;
        tree.add(trunk);

        const crown = new THREE.Group();
        crown.position.set(0, trunkH, 0);
        for (let f = 0; f < 8; f++) {
          const frond = new THREE.Mesh(new THREE.PlaneGeometry(0.8 * scale, 2.4 * scale), foliageGreen2);
          const ang = (f / 8) * Math.PI * 2;
          frond.rotation.x = Math.PI / 3;
          frond.rotation.y = ang;
          crown.add(frond);
        }
        tree.add(crown);
        return tree;
      }

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
    // 3. DIORAMA BASE & TOPOGRAPHY (Karnataka Rural Earth & Knolls)
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

    // Upper Center Tiered Terrace for School
    const hallTerrace = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.8, 6.2), redSoilMat);
    hallTerrace.position.set(0.5, 0.4, -7.2);
    hallTerrace.receiveShadow = true;
    terrainGroup.add(hallTerrace);

    // Upper Right Plantation Flat Agricultural Earth Bed with Furrows
    const plantationSoil = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.35, 10.5), redSoilMat);
    plantationSoil.position.set(10.2, 0.25, -4.8);
    plantationSoil.receiveShadow = true;
    terrainGroup.add(plantationSoil);

    // Foreground Lush Shrub Knoll
    const frontKnoll = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.4, 24), lushGrassMat);
    frontKnoll.position.set(0, 0.6, 6.2);
    frontKnoll.receiveShadow = true;
    terrainGroup.add(frontKnoll);

    // Clustered boulders & flowering bushes
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

    // Soft clouds framing the base perimeter
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
    // 4. CENTRAL CURVING VILLAGE ROAD NETWORK (Matches Reference)
    // =========================================================================
    const roadGroup = new THREE.Group();
    villageGroup.add(roadGroup);

    const mainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-14.5, 0.32, 9.5),
      new THREE.Vector3(-6.5, 0.32, 7.2),
      new THREE.Vector3(-2.8, 0.32, 4.5),
      new THREE.Vector3(0.0, 0.32, 2.0),
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

    // White dashed centerlines
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
    // 5. REFERENCE 5 — SRI ANJANEYA SWAMY TEMPLE (Colorful Dravidian Gopuram)
    // =========================================================================
    const templeGroup = new THREE.Group();
    templeGroup.position.set(-7.0, 0.4, 2.2);
    villageGroup.add(templeGroup);
    landmarkObjectsRef.current['temple'] = templeGroup;

    // Courtyard Plinth
    const tCourtyard = new THREE.Mesh(
      new THREE.BoxGeometry(8.2, 0.4, 9.4),
      new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.85 })
    );
    tCourtyard.position.set(0, 0.2, 0);
    tCourtyard.receiveShadow = true;
    templeGroup.add(tCourtyard);

    // Main Temple Structure with Ashlar Stone & Torana Garlands Facade Texture
    const templeFacadeMat = new THREE.MeshStandardMaterial({
      map: createAnjaneyaTempleFacadeTexture(),
      roughness: 0.75
    });

    const mainSanctum = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.4, 4.8), templeFacadeMat);
    mainSanctum.position.set(0, 1.9, -0.6);
    registerInteractive(mainSanctum, 'temple');
    templeGroup.add(mainSanctum);

    // Eaves / Overhang Roof Padma moulding
    const eavesMesh = new THREE.Mesh(
      new THREE.BoxGeometry(6.9, 0.35, 5.3),
      new THREE.MeshStandardMaterial({ color: 0xF472B6, roughness: 0.5 })
    );
    eavesMesh.position.set(0, 3.75, -0.6);
    templeGroup.add(eavesMesh);

    // --- Multi-Tiered Colorful Dravidian Gopuram Tower (Left Roof Section) ---
    const gopura = new THREE.Group();
    gopura.position.set(-1.8, 3.9, -0.6);
    templeGroup.add(gopura);

    // Gopuram Tier 1 (Yellow & Pink with Deity Niches)
    const gTier1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 2.6), templeYellowMat);
    gTier1.position.y = 0.55;
    registerInteractive(gTier1, 'temple');
    gopura.add(gTier1);

    // Gopuram Tier 2 (Turquoise Blue with arched niches)
    const gTier2 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 2.1), templeBlueMat);
    gTier2.position.y = 1.55;
    registerInteractive(gTier2, 'temple');
    gopura.add(gTier2);

    // Gopuram Tier 3 (Coral Pink with decorative cornices)
    const gTier3 = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.85, 1.65), templePinkMat);
    gTier3.position.y = 2.45;
    registerInteractive(gTier3, 'temple');
    gopura.add(gTier3);

    // Rounded Dome Cap & 3 Golden Kalasha Finials
    const domeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.95, 0.65, 16), templeGoldMat);
    domeCap.position.y = 3.2;
    gopura.add(domeCap);

    for (let k = -0.32; k <= 0.32; k += 0.32) {
      const kalasha = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 12), templeGoldMat);
      kalasha.position.set(k, 3.8, 0);
      gopura.add(kalasha);
    }

    // Right-side Golden Kirtimukha Deity Niche (Matching reference photograph)
    const rightNiche = new THREE.Group();
    rightNiche.position.set(1.6, 3.9, -0.6);
    templeGroup.add(rightNiche);

    const rBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 1.8), templeBlueMat);
    rBase.position.y = 0.45;
    rightNiche.add(rBase);

    const rArch = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 0.65, 12), templeGoldMat);
    rArch.position.y = 1.2;
    rightNiche.add(rArch);

    const rKalasha = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 10), templeGoldMat);
    rKalasha.position.set(0, 1.75, 0);
    rightNiche.add(rKalasha);

    // --- Courtyard Features Directly from Photograph ---
    // 1. Two Tall Blue/Yellow-Striped Poles in Front Courtyard
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1E3A8A, roughness: 0.4 });
    const yellowStripeMat = new THREE.MeshStandardMaterial({ color: 0xFACC15 });

    [-1.2, 1.2].forEach((px) => {
      const poleGroup = new THREE.Group();
      poleGroup.position.set(px, 0.2, 3.2);

      const pLower = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 12), poleMat);
      pLower.position.y = 0.8;
      poleGroup.add(pLower);

      const pStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 12), yellowStripeMat);
      pStripe.position.y = 1.85;
      poleGroup.add(pStripe);

      const pUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 12), poleMat);
      pUpper.position.y = 3.2;
      poleGroup.add(pUpper);

      templeGroup.add(poleGroup);
    });

    // 2. Bamboo Festival Canopy Pavilion with Yellow/Orange Triangular Flags
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xFACC15, side: THREE.DoubleSide });
    const canopyBunting = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 1.6, 4, 1, true),
      canopyMat
    );
    canopyBunting.position.set(2.4, 2.8, 2.2);
    canopyBunting.rotation.y = Math.PI / 4;
    templeGroup.add(canopyBunting);

    // 3. Tall Flagpole Fluttering Saffron Hanuman Flag (Dhwaja)
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 6.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
    );
    flagPole.position.set(2.6, 3.3, 1.5);
    templeGroup.add(flagPole);

    const fShape = new THREE.Shape();
    fShape.moveTo(0, 0);
    fShape.lineTo(1.4, 0.5);
    fShape.lineTo(0, 1.0);
    fShape.closePath();
    const flagMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(fShape),
      new THREE.MeshStandardMaterial({ color: 0xF97316, side: THREE.DoubleSide })
    );
    flagMesh.position.set(2.6, 5.4, 1.5);
    flagMesh.rotation.y = 0.3;
    templeGroup.add(flagMesh);

    // 4. Carved Granite Deepastambha (Stone Pillar in Courtyard)
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x78716C, roughness: 0.95 });
    const deepaPillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.8, 0.45), pillarMat);
    deepaPillar.position.set(2.2, 2.1, 3.4);
    deepaPillar.castShadow = true;
    templeGroup.add(deepaPillar);

    // Surrounding Shady Trees around the temple
    const templeTrees = [
      { x: -4.8, z: -3.0, t: 'palm' },
      { x: -5.2, z: 1.5, t: 'banyan' },
      { x: -4.5, z: 4.8, t: 'neem' },
      { x: 4.6, z: -2.5, t: 'palm' },
      { x: 4.8, z: 3.2, t: 'banyan' }
    ] as const;
    templeTrees.forEach((pos) => {
      const tr = createOrganicTree(1.15, pos.t);
      tr.position.set(pos.x, 0, pos.z);
      templeGroup.add(tr);
    });

    // =========================================================================
    // 6. REFERENCE 1 — SRI LAKSHMI THIMMAPPA SWAMY TEMPLE / RUSTIC STONE SHRINE
    // =========================================================================
    const stoneGroup = new THREE.Group();
    stoneGroup.position.set(-9.2, 1.4, -5.8);
    villageGroup.add(stoneGroup);
    landmarkObjectsRef.current['shrine'] = stoneGroup;

    const stoneTexMat = new THREE.MeshStandardMaterial({
      map: createStoneShrineTexture(),
      roughness: 0.96
    });

    // Two Thick Standing Vertical Megalith Jambs
    const stoneJambL = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.4, 1.2), stoneTexMat);
    stoneJambL.position.set(-1.4, 1.2, 0.2);
    registerInteractive(stoneJambL, 'shrine');
    stoneGroup.add(stoneJambL);

    const stoneJambR = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.4, 1.2), stoneTexMat);
    stoneJambR.position.set(1.4, 1.2, 0.2);
    registerInteractive(stoneJambR, 'shrine');
    stoneGroup.add(stoneJambR);

    // Massive Rough-Hewn Horizontal Stone Lintel Slab across the jambs
    const stoneLintel = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.85, 2.2), stoneTexMat);
    stoneLintel.position.set(0, 2.7, 0.3);
    registerInteractive(stoneLintel, 'shrine');
    stoneGroup.add(stoneLintel);

    // Chamber Side Walls & Stacked Rock Layers
    const sideWallL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.3, 2.8), stoneTexMat);
    sideWallL.position.set(-1.5, 1.15, -1.2);
    stoneGroup.add(sideWallL);

    const sideWallR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.3, 2.8), stoneTexMat);
    sideWallR.position.set(1.5, 1.15, -1.2);
    stoneGroup.add(sideWallR);

    // Rear chamber back wall
    const rearWall = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.4, 1.2), stoneTexMat);
    rearWall.position.set(0, 1.2, -2.4);
    registerInteractive(rearWall, 'shrine');
    stoneGroup.add(rearWall);

    // Heavy Flat Stone Roof Slab
    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.75, 3.8), stoneTexMat);
    roofSlab.position.set(0, 2.9, -1.0);
    registerInteractive(roofSlab, 'shrine');
    stoneGroup.add(roofSlab);

    // Deep Shadowed Inner Sanctum with Vermilion-Smeared Deity Murti & Marigolds
    const sanctumBackdropMat = new THREE.MeshStandardMaterial({
      map: createStoneShrineSanctumTexture(),
      roughness: 0.9
    });
    const innerDeity = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.0), sanctumBackdropMat);
    innerDeity.position.set(0, 1.2, -1.7);
    stoneGroup.add(innerDeity);

    // Boulders & stacked irregular rocks forming the rustic cave structure
    for (let r = 0; r < 28; r++) {
      const rMesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.42 + Math.random() * 0.48, 0),
        stoneTexMat
      );
      rMesh.position.set(
        (Math.random() - 0.5) * 4.6,
        0.3 + Math.random() * 2.5,
        (Math.random() - 0.5) * 3.8
      );
      rMesh.scale.set(1.2, 0.75, 1.1);
      rMesh.castShadow = true;
      registerInteractive(rMesh, 'shrine');
      stoneGroup.add(rMesh);
    }

    // Lush Green Climbing Vines & Foliage Spilling Over the Roof Slabs (from photo)
    for (let v = 0; v < 14; v++) {
      const vineClump = new THREE.Mesh(
        new THREE.SphereGeometry(0.45 + Math.random() * 0.35, 7, 7),
        foliageGreen3
      );
      vineClump.position.set(
        (Math.random() - 0.5) * 3.6,
        3.3 + Math.random() * 0.4,
        -0.8 + (Math.random() - 0.5) * 2.2
      );
      vineClump.scale.set(1.2, 0.65, 1.2);
      stoneGroup.add(vineClump);
    }

    // =========================================================================
    // 7. REFERENCE 2 — GOVERNMENT LOWER PRIMARY SCHOOL MUTTAGUNDI
    // =========================================================================
    const schoolGroup = new THREE.Group();
    schoolGroup.position.set(0.5, 0.4, -7.2);
    villageGroup.add(schoolGroup);
    landmarkObjectsRef.current['school'] = schoolGroup;
    landmarkObjectsRef.current['panchayat'] = schoolGroup;

    // School Building with Murals & Blue Doors
    const schoolFacadeMat = new THREE.MeshStandardMaterial({
      map: createSchoolFacadeTexture(),
      roughness: 0.65
    });

    const schoolBuilding = new THREE.Mesh(new THREE.BoxGeometry(7.4, 2.8, 4.2), schoolFacadeMat);
    schoolBuilding.position.y = 1.4;
    registerInteractive(schoolBuilding, 'school');
    schoolGroup.add(schoolBuilding);

    // Signage Banner across top: "ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ ಮುತ್ಥಾಗೊಂದಿ" + Karnataka Flag
    const schoolBannerMat = new THREE.MeshStandardMaterial({
      map: createSchoolBannerTexture(),
      roughness: 0.4
    });
    const schoolBanner = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.95, 0.1), schoolBannerMat);
    schoolBanner.position.set(0, 2.8, 2.15);
    registerInteractive(schoolBanner, 'school');
    schoolGroup.add(schoolBanner);

    // Veranda Pillars Painted in the Indian Tricolor (Saffron top, White mid, Green base)
    const saffronMat = new THREE.MeshStandardMaterial({ color: 0xF97316 });
    const whitePillarMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const greenPillarMat = new THREE.MeshStandardMaterial({ color: 0x16A34A });

    const pillarX = [-2.6, 0.0, 2.6];
    pillarX.forEach((px) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(px, 0, 2.3);

      const pGreen = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 12), greenPillarMat);
      pGreen.position.y = 0.4;
      pGroup.add(pGreen);

      const pWhite = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 12), whitePillarMat);
      pWhite.position.y = 1.2;
      pGroup.add(pWhite);

      const pSaffron = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 12), saffronMat);
      pSaffron.position.y = 2.0;
      pGroup.add(pSaffron);

      schoolGroup.add(pGroup);
    });

    // Yellow Rooftop Plastic Sintex Water Tank on Left Corner (from photo)
    const yellowTank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.44, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0xFBBF24, roughness: 0.35 })
    );
    yellowTank.position.set(-2.8, 3.25, 1.0);
    yellowTank.castShadow = true;
    schoolGroup.add(yellowTank);

    // Tank lid
    const tankLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.46, 0.15, 16),
      new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 })
    );
    tankLid.position.set(-2.8, 3.7, 1.0);
    schoolGroup.add(tankLid);

    // Front Concrete Entrance Ramp & Steps
    const steps = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.38, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.75 })
    );
    steps.position.set(0, 0.19, 2.8);
    schoolGroup.add(steps);

    // Blue Metal Safety Railings with Triangular Truss Pattern (from photo)
    const railMat = new THREE.MeshStandardMaterial({ color: 0x2563EB, metalness: 0.6, roughness: 0.3 });
    const railing = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.65, 0.08), railMat);
    railing.position.set(0, 0.7, 3.6);
    schoolGroup.add(railing);

    // Weathered White Compound Wall in Foreground
    const compWall = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.75, 0.22),
      new THREE.MeshStandardMaterial({ color: 0xF1F5F9, roughness: 0.85 })
    );
    compWall.position.set(0, 0.38, 4.4);
    schoolGroup.add(compWall);

    // Shady Neem Trees framing the school
    const sTreeL = createOrganicTree(1.35, 'banyan');
    sTreeL.position.set(-4.8, 0, -0.8);
    schoolGroup.add(sTreeL);

    const sTreeR = createOrganicTree(1.25, 'neem');
    sTreeR.position.set(4.8, 0, -0.8);
    schoolGroup.add(sTreeR);

    // =========================================================================
    // 8. UPPER RIGHT: DENSE ARECA NUT & COCONUT PLANTATION
    // =========================================================================
    const plantationGroup = new THREE.Group();
    plantationGroup.position.set(10.2, 0.4, -4.8);
    villageGroup.add(plantationGroup);
    landmarkObjectsRef.current['farms'] = plantationGroup;

    const arecaTrunkMat = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.85 });
    const arecaFrondMat = new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.55, side: THREE.DoubleSide });

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
    // 9. REFERENCE 3 — SRI KALLESHWARA SWAMY TEMPLE & TRANSMISSION PYLON
    // =========================================================================
    const shrineGroup = new THREE.Group();
    shrineGroup.position.set(5.6, 0.4, 1.2);
    villageGroup.add(shrineGroup);
    landmarkObjectsRef.current['temple1'] = shrineGroup;

    // Whitewashed rustic rectangular temple with turquoise door
    const kalleshwaraMat = new THREE.MeshStandardMaterial({
      map: createKalleshwaraTempleTexture(),
      roughness: 0.8
    });

    const shrineBase = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.1, 2.6), kalleshwaraMat);
    shrineBase.position.set(0, 1.05, 0);
    registerInteractive(shrineBase, 'temple1');
    shrineGroup.add(shrineBase);

    // Stepped Stone Pyramidal Shikhara (Kadamba/Nagara vimana) on rear left roof
    const vim1 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 1.3), weatheredGraniteMat);
    vim1.position.set(-1.1, 2.45, 0);
    shrineGroup.add(vim1);

    const vim2 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.0, 4), weatheredGraniteMat);
    vim2.rotation.y = Math.PI / 4;
    vim2.position.set(-1.1, 3.35, 0);
    registerInteractive(vim2, 'temple1');
    shrineGroup.add(vim2);

    const vimKalasha = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 8), templeGoldMat);
    vimKalasha.position.set(-1.1, 3.95, 0);
    shrineGroup.add(vimKalasha);

    // High-Voltage Steel Lattice Transmission Pylon (ವಿದ್ಯುತ್ ಗೋಪುರ) from photo
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.4
    });

    const pylon = new THREE.Group();
    pylon.position.set(2.4, 0, -2.2);
    shrineGroup.add(pylon);

    // 4 Corner Legs
    const pLegGeo = new THREE.CylinderGeometry(0.04, 0.07, 10.5, 6);
    const p1 = new THREE.Mesh(pLegGeo, pylonMat); p1.position.set(-0.52, 5.25, -0.52); pylon.add(p1);
    const p2 = new THREE.Mesh(pLegGeo, pylonMat); p2.position.set(0.52, 5.25, -0.52); pylon.add(p2);
    const p3 = new THREE.Mesh(pLegGeo, pylonMat); p3.position.set(-0.52, 5.25, 0.52); pylon.add(p3);
    const p4 = new THREE.Mesh(pLegGeo, pylonMat); p4.position.set(0.52, 5.25, 0.52); pylon.add(p4);

    // Crossarms & Transmission Lines
    const pArm1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 0.12), pylonMat);
    pArm1.position.set(0, 8.8, 0);
    pylon.add(pArm1);

    const pArm2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.12), pylonMat);
    pArm2.position.set(0, 9.8, 0);
    pylon.add(pArm2);

    // Coconut Palms in Background
    const kTree1 = createOrganicTree(1.2, 'palm');
    kTree1.position.set(-3.2, 0, -2.4);
    shrineGroup.add(kTree1);

    const kTree2 = createOrganicTree(1.1, 'palm');
    kTree2.position.set(-1.8, 0, -3.2);
    shrineGroup.add(kTree2);

    // =========================================================================
    // 10. REFERENCE 4 — ANGANWADI KENDRA (Educational Murals & Sintex Tank)
    // =========================================================================
    const anganwadiGroup = new THREE.Group();
    anganwadiGroup.position.set(9.8, 0.4, 6.2);
    villageGroup.add(anganwadiGroup);
    landmarkObjectsRef.current['kindergarden'] = anganwadiGroup;

    // Cheerful sky-blue preschool building with educational murals
    const angMat = new THREE.MeshStandardMaterial({
      map: createAnganwadiMuralTexture(),
      roughness: 0.55
    });

    const angBuilding = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.95, 2.9), angMat);
    angBuilding.position.y = 0.98;
    registerInteractive(angBuilding, 'kindergarden');
    anganwadiGroup.add(angBuilding);

    // Rooftop Blue Cylindrical Sintex Water Tank in Center (from photo)
    const blueTank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.72, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.35 })
    );
    blueTank.position.set(0.0, 2.3, 0.2);
    blueTank.castShadow = true;
    anganwadiGroup.add(blueTank);

    const blueTankLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.4, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.6 })
    );
    blueTankLid.position.set(0.0, 2.7, 0.2);
    anganwadiGroup.add(blueTankLid);

    // Low Beige / Cream Compound Wall with aged patina & entrance gap
    const yBoundMat = new THREE.MeshStandardMaterial({ color: 0xFDE68A, roughness: 0.75 });
    const yWallL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.16), yBoundMat);
    yWallL.position.set(-1.6, 0.4, 1.8);
    anganwadiGroup.add(yWallL);

    const yWallR = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 0.16), yBoundMat);
    yWallR.position.set(1.8, 0.4, 1.8);
    anganwadiGroup.add(yWallR);

    // Utility Pole with Ceramic Insulators & Overhead Wire
    const poleMat2 = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.9 });
    const utilPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.8, 8), poleMat2);
    utilPole.position.set(3.4, 2.4, 1.8);
    anganwadiGroup.add(utilPole);

    // Surrounding Trees
    const angTree = createOrganicTree(1.1, 'neem');
    angTree.position.set(-3.4, 0, 0.5);
    anganwadiGroup.add(angTree);

    // =========================================================================
    // 11. CENTRAL GROVE OF GREEN SHADE TREES
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

    // Render Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isAutoRotatingRef.current) {
        targetRotationYRef.current += 0.003;
      }

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

  // Landmark names mapping for clean minimal labels
  const landmarkLabelsMap: { [key in LandmarkId]: { en: string; kn: string; icon: string } } = {
    temple: { en: 'Sri Anjaneya Swamy Temple', kn: 'ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ದೇವಾಲಯ', icon: '🛕' },
    shrine: { en: 'Sri Lakshmi Thimmappa Swamy Temple', kn: 'ಶ್ರೀ ಲಕ್ಷ್ಮಿ ತಿಮ್ಮಪ್ಪ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ', icon: '🛕' },
    school: { en: 'Government Lower Primary School', kn: 'ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ', icon: '🏫' },
    panchayat: { en: 'Government Lower Primary School', kn: 'ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ', icon: '🏫' },
    farms: { en: 'Areca Nut & Coconut Plantation', kn: 'ಅಡಿಕೆ & ತೆಂಗಿನ ತೋಟ', icon: '🌴' },
    temple1: { en: 'Sri Kalleshwara Swamy Temple', kn: 'ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಾಲಯ', icon: '🛕' },
    kindergarden: { en: 'Anganwadi Kendra', kn: 'ಅಂಗನವಾಡಿ ಕೇಂದ್ರ', icon: '👶' },
    water: { en: 'Village Water Reservoir', kn: 'ಗ್ರಾಮದ ನೀರಿನ ಕೆರೆ', icon: '💧' }
  };

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

      {/* Clean Minimal Landmark Label Badge (Shows when landmark selected or labels enabled) */}
      {(showLabels || activeLandmarkId) && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(7, 15, 30, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '16px',
            padding: '6px 14px',
            zIndex: 35,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>
            {landmarkLabelsMap[activeLandmarkId]?.icon || '🏛️'}
          </span>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#FFFFFF' }}>
              {isKannada
                ? landmarkLabelsMap[activeLandmarkId]?.kn
                : landmarkLabelsMap[activeLandmarkId]?.en}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#FBBF24', fontWeight: 700 }}>
              {isKannada ? 'ನೈಜ 3D ಕಟ್ಟಡ ಮಾದರಿ' : 'Real 3D Landmark Model'}
            </div>
          </div>
        </div>
      )}

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
        {/* Toggle Labels */}
        <button
          onClick={() => setShowLabels(!showLabels)}
          style={{
            background: showLabels ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.08)',
            border: showLabels ? '1px solid #F59E0B' : 'none',
            borderRadius: '14px',
            padding: '5px 9px',
            color: showLabels ? '#FDE047' : '#94A3B8',
            fontSize: '0.74rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Toggle Landmark Labels"
        >
          <span>🏷️</span>
          <span>{isKannada ? 'ಹೆಸರು' : 'Labels'}</span>
        </button>

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
