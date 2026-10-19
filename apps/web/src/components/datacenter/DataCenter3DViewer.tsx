import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera, Eye, Layers, Maximize2, RotateCcw, Download } from 'lucide-react';
import { DCElement, DCRoomConfig } from './dc-types';

interface DataCenter3DViewerProps {
  room: DCRoomConfig;
  elements: DCElement[];
}

export const DataCenter3DViewer: React.FC<DataCenter3DViewerProps> = ({ room, elements }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [showCeilingTrays, setShowCeilingTrays] = useState(true);
  const [transparentWalls, setTransparentWalls] = useState(true);
  const [showPedestals, setShowPedestals] = useState(true);

  // Generador de textura procedimental para racks (puerta perforada en nido de abeja con LEDs)
  const createRackTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Fondo gris oscuro grafito
    ctx.fillStyle = '#1c1f24';
    ctx.fillRect(0, 0, 512, 1024);

    // Marco exterior
    ctx.strokeStyle = '#2b313a';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 492, 1004);

    // Servidores internos y perforaciones
    const unitHeight = 1024 / 42;
    for (let u = 0; u < 42; u++) {
      const y = u * unitHeight;
      ctx.fillStyle = u % 3 === 0 ? '#111418' : '#181b20';
      ctx.fillRect(20, y + 2, 472, unitHeight - 4);

      // LEDs frontales
      ctx.fillStyle = u % 4 === 0 ? '#10b981' : u % 6 === 0 ? '#38bdf8' : '#22c55e';
      ctx.fillRect(30, y + unitHeight / 2 - 2, 6, 4);
      ctx.fillRect(42, y + unitHeight / 2 - 2, 4, 4);

      // Rejilla perforada sutil
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let rx = 70; rx < 460; rx += 14) {
        ctx.beginPath();
        ctx.arc(rx, y + unitHeight / 2, 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    return new THREE.CanvasTexture(canvas);
  };

  // Generador de textura para baldosas de piso técnico
  const createFloorTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(0, 0, 256, 256);

    // Juntas de sellado oscuras
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 252);

    // Textura punteada vinílica
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillRect(x, y, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(room.lengthM / 0.6, room.widthM / 0.6);
    return tex;
  };

  // Generador de textura para UPS (panel con pantalla LCD)
  const createUpsTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#262a33';
    ctx.fillRect(0, 0, 512, 512);

    // Pantalla LCD azul
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(60, 60, 392, 140);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('UPS ONLINE 60 kVA', 80, 110);
    ctx.font = '22px sans-serif';
    ctx.fillText('OUTPUT: 220V - 100% OK', 80, 150);

    // Rejilla de ventilación inferior
    ctx.fillStyle = '#111827';
    ctx.fillRect(60, 240, 392, 220);
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 3;
    for (let y = 260; y < 440; y += 18) {
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(430, y);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  };

  // Generador de textura para Aires CRAC
  const createCracTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 512, 512);

    // Rejilla central de soplado/retorno
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 40, 432, 432);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    for (let y = 60; y < 450; y += 16) {
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(460, y);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 500;

    // Escena, Cámara y Renderizador
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Fondo azul pizarra técnico
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(room.lengthM * 1.4, room.heightM * 1.8, room.widthM * 1.6);
    camera.lookAt(room.lengthM / 2, room.raisedFloorHeightM + 1.0, room.widthM / 2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Iluminación ambiental y focos
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(room.lengthM * 1.2, 10, room.widthM * 1.2);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // 1. Losa de Concreto Base (Nivel 0.00 m)
    const slabGeo = new THREE.BoxGeometry(room.lengthM, 0.1, room.widthM);
    const slabMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.set(room.lengthM / 2, -0.05, room.widthM / 2);
    slab.receiveShadow = true;
    scene.add(slab);

    // 2. Pedestales Metálicos de Piso Técnico (Si activado)
    if (showPedestals) {
      const pedestalGroup = new THREE.Group();
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
      const pedGeo = new THREE.CylinderGeometry(0.02, 0.03, room.raisedFloorHeightM, 8);

      for (let x = 0; x <= room.lengthM; x += 0.6) {
        for (let z = 0; z <= room.widthM; z += 0.6) {
          const ped = new THREE.Mesh(pedGeo, pedMat);
          ped.position.set(x, room.raisedFloorHeightM / 2, z);
          pedestalGroup.add(ped);
        }
      }
      scene.add(pedestalGroup);
    }

    // 3. Piso Técnico Elevado con baldosas 0.60m
    const floorGeo = new THREE.BoxGeometry(room.lengthM, 0.04, room.widthM);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createFloorTexture(),
      roughness: 0.6,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(room.lengthM / 2, room.raisedFloorHeightM, room.widthM / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    // 4. Paredes Perimetrales de la Sala
    const wallHeight = room.heightM - room.raisedFloorHeightM;
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      transparent: transparentWalls,
      opacity: transparentWalls ? 0.25 : 0.9,
      side: THREE.DoubleSide,
      roughness: 0.8,
    });

    // Muros perimetrales (trasero e izquierdo sólidos, frontal y derecho transparentes/abiertos)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(room.lengthM, wallHeight, 0.1), wallMat);
    backWall.position.set(room.lengthM / 2, room.raisedFloorHeightM + wallHeight / 2, 0);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallHeight, room.widthM), wallMat);
    leftWall.position.set(0, room.raisedFloorHeightM + wallHeight / 2, room.widthM / 2);
    scene.add(leftWall);

    // 5. Elementos del Data Center (Racks, Aires, UPS, Puertas)
    const rackTexture = createRackTexture();
    const cracTexture = createCracTexture();
    const upsTexture = createUpsTexture();

    elements.forEach((el) => {
      const isRotated = el.rotation === 90 || el.rotation === 270;
      const w = isRotated ? el.depth : el.width;
      const d = isRotated ? el.width : el.depth;
      const h = el.height || 2.0;

      const posX = el.x + w / 2;
      const posY = room.raisedFloorHeightM + h / 2;
      const posZ = el.y + d / 2;

      let mesh: THREE.Mesh;

      if (el.type === 'rack') {
        const rackGeo = new THREE.BoxGeometry(w, h, d);
        // Materiales por cara: frente con textura de servidores, laterales oscuros
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5, metalness: 0.5 });
        const frontMat = new THREE.MeshStandardMaterial({ map: rackTexture, roughness: 0.4, metalness: 0.6 });
        const materials = [darkMat, darkMat, darkMat, darkMat, frontMat, frontMat];

        mesh = new THREE.Mesh(rackGeo, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      } else if (el.type === 'crac') {
        const cracGeo = new THREE.BoxGeometry(w, h, d);
        const cracMat = new THREE.MeshStandardMaterial({ map: cracTexture, roughness: 0.4 });
        mesh = new THREE.Mesh(cracGeo, cracMat);
        mesh.castShadow = true;
      } else if (el.type === 'ups') {
        const upsGeo = new THREE.BoxGeometry(w, h, d);
        const upsMat = new THREE.MeshStandardMaterial({ map: upsTexture, roughness: 0.3 });
        mesh = new THREE.Mesh(upsGeo, upsMat);
        mesh.castShadow = true;
      } else if (el.type === 'door') {
        const doorGeo = new THREE.BoxGeometry(w, h, 0.1);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x78716c, metalness: 0.7, roughness: 0.3 });
        mesh = new THREE.Mesh(doorGeo, doorMat);
      } else {
        const pduGeo = new THREE.BoxGeometry(w, h, d);
        const pduMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4 });
        mesh = new THREE.Mesh(pduGeo, pduMat);
        mesh.castShadow = true;
      }

      mesh.position.set(posX, posY, posZ);
      scene.add(mesh);
    });

    // 6. Bandejas Aéreas de Fibra y Cobre (Si activado)
    if (showCeilingTrays) {
      const trayY = room.raisedFloorHeightM + 2.3;
      // Bandeja amarilla de fibra óptica
      const fiberGeo = new THREE.BoxGeometry(room.lengthM * 0.8, 0.05, 0.2);
      const fiberMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3 });
      const fiberTray = new THREE.Mesh(fiberGeo, fiberMat);
      fiberTray.position.set(room.lengthM / 2, trayY, room.widthM / 2 - 0.2);
      scene.add(fiberTray);

      // Bandeja metálica de cable de cobre
      const copperGeo = new THREE.BoxGeometry(room.lengthM * 0.8, 0.05, 0.3);
      const copperMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2, wireframe: true });
      const copperTray = new THREE.Mesh(copperGeo, copperMat);
      copperTray.position.set(room.lengthM / 2, trayY + 0.1, room.widthM / 2 + 0.2);
      scene.add(copperTray);

      // Varillas roscadas de soporte al techo
      const hangerMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.9 });
      for (let hx = 1; hx < room.lengthM; hx += 1.8) {
        const hangerGeo = new THREE.CylinderGeometry(0.01, 0.01, room.heightM - trayY, 6);
        const hanger = new THREE.Mesh(hangerGeo, hangerMat);
        hanger.position.set(hx, trayY + (room.heightM - trayY) / 2, room.widthM / 2);
        scene.add(hanger);
      }
    }

    // Controles orbitales interactivos con ratón
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let theta = Math.PI / 4;
    let phi = Math.PI / 4;
    let radius = Math.sqrt(room.lengthM ** 2 + room.widthM ** 2) * 1.5;

    const updateCameraPos = () => {
      const centerX = room.lengthM / 2;
      const centerY = room.raisedFloorHeightM + 1.0;
      const centerZ = room.widthM / 2;

      camera.position.x = centerX + radius * Math.sin(phi) * Math.cos(theta);
      camera.position.y = centerY + radius * Math.cos(phi);
      camera.position.z = centerZ + radius * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(centerX, centerY, centerZ);
      renderer.render(scene, camera);
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      theta -= deltaX * 0.008;
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi - deltaY * 0.008));
      updateCameraPos();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(3, Math.min(30, radius + e.deltaY * 0.01));
      updateCameraPos();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    updateCameraPos();

    return () => {
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [room, elements, showCeilingTrays, transparentWalls, showPedestals]);

  const handleSetView = (view: 'iso' | 'top' | 'front') => {
    if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;
    const camera = cameraRef.current;
    const centerX = room.lengthM / 2;
    const centerY = room.raisedFloorHeightM + 1.0;
    const centerZ = room.widthM / 2;

    if (view === 'top') {
      camera.position.set(centerX, room.heightM * 3.5, centerZ + 0.01);
    } else if (view === 'front') {
      camera.position.set(centerX, centerY, room.widthM * 2.8);
    } else {
      camera.position.set(room.lengthM * 1.4, room.heightM * 1.8, room.widthM * 1.6);
    }

    camera.lookAt(centerX, centerY, centerZ);
    rendererRef.current.render(sceneRef.current, camera);
  };

  const handleCapturePng = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `datacenter-3d-render-${Date.now()}.png`;
    a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Barra de controles 3D */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'var(--surface-alt)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700' }}>Cámaras 3D:</span>
          <button className="btn btn-secondary btn-sm" onClick={() => handleSetView('iso')}>
            <RotateCcw size={12} /> Orbital 45°
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleSetView('top')}>
            <Eye size={12} /> Planta Cenital
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleSetView('front')}>
            <Camera size={12} /> Frontal
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={transparentWalls}
              onChange={(e) => setTransparentWalls(e.target.checked)}
            />
            Muros Rayos-X
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showCeilingTrays}
              onChange={(e) => setShowCeilingTrays(e.target.checked)}
            />
            Bandejas Portacables
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showPedestals}
              onChange={(e) => setShowPedestals(e.target.checked)}
            />
            Pedestales Piso Técnico
          </label>

          <button className="btn btn-primary btn-sm" onClick={handleCapturePng} title="Descargar imagen HD">
            <Download size={12} /> Render PNG
          </button>
        </div>
      </div>

      {/* Contenedor del Canvas Three.js */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '520px',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: '#0f172a',
          position: 'relative',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          cursor: 'grab',
        }}
      />

      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Arrastre con el mouse para rotar la cámara orbital • Rueda del mouse para acercar/alejar zoom • Dimensiones reales TIA-942
      </div>
    </div>
  );
};
