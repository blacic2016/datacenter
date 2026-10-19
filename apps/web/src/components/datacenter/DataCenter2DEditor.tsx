import React, { useState, useRef } from 'react';
import { Plus, RotateCw, Trash2, Move, Server, Thermometer, BatteryCharging, DoorClosed, Zap, Check } from 'lucide-react';
import { DCElement, DCRoomConfig, TILE_SIZE, DCElementType } from './dc-types';

interface DataCenter2DEditorProps {
  room: DCRoomConfig;
  elements: DCElement[];
  onElementsChange: (elements: DCElement[]) => void;
  onRoomChange: (room: DCRoomConfig) => void;
}

export const DataCenter2DEditor: React.FC<DataCenter2DEditorProps> = ({
  room,
  elements,
  onElementsChange,
  onRoomChange,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const scale = 50; // 50 píxeles por metro (cada baldosa de 0.60m mide 30px)
  const roomPixelsW = room.lengthM * scale;
  const roomPixelsH = room.widthM * scale;

  const snap = (val: number, step = TILE_SIZE) => Math.round(val / step) * step;

  const handleAddElement = (type: DCElementType) => {
    const id = `el-${Date.now()}`;
    let newEl: DCElement;

    switch (type) {
      case 'rack': {
        const count = elements.filter((e) => e.type === 'rack').length + 1;
        newEl = {
          id,
          type: 'rack',
          name: `RACK-${String(count).padStart(2, '0')}`,
          x: snap(room.lengthM / 2 - 0.3),
          y: snap(room.widthM / 2 - 0.5),
          width: 0.6,
          depth: 1.0,
          height: 2.0,
          rotation: 0,
          kw: 5.0,
          units: 42,
        };
        break;
      }
      case 'crac': {
        const count = elements.filter((e) => e.type === 'crac').length + 1;
        newEl = {
          id,
          type: 'crac',
          name: `CRAC-${String(count).padStart(2, '0')}`,
          x: 0,
          y: snap(room.widthM / 2 - 0.6),
          width: 1.2,
          depth: 0.8,
          height: 2.2,
          rotation: 90,
          btu: 120000,
        };
        break;
      }
      case 'ups': {
        const count = elements.filter((e) => e.type === 'ups').length + 1;
        newEl = {
          id,
          type: 'ups',
          name: `UPS-${String(count).padStart(2, '0')}`,
          x: snap(room.lengthM - 1.2),
          y: snap(room.widthM - 1.2),
          width: 0.8,
          depth: 0.9,
          height: 2.0,
          rotation: 0,
          kva: 60,
        };
        break;
      }
      case 'door': {
        newEl = {
          id,
          type: 'door',
          name: 'Puerta Principal',
          x: snap(room.lengthM / 2 - 0.5),
          y: 0,
          width: 1.0,
          depth: 0.2,
          height: 2.13,
          rotation: 0,
        };
        break;
      }
      case 'pdu': {
        const count = elements.filter((e) => e.type === 'pdu').length + 1;
        newEl = {
          id,
          type: 'pdu',
          name: `PDU-${String(count).padStart(2, '0')}`,
          x: snap(room.lengthM - 1.2),
          y: 0.6,
          width: 0.6,
          depth: 0.6,
          height: 2.0,
          rotation: 0,
        };
        break;
      }
    }

    onElementsChange([...elements, newEl]);
    setSelectedId(id);
  };

  const handleRotate = (id: string) => {
    onElementsChange(
      elements.map((el) => {
        if (el.id !== id) return el;
        const nextRot = ((el.rotation + 90) % 360) as 0 | 90 | 180 | 270;
        return { ...el, rotation: nextRot };
      })
    );
  };

  const handleDelete = (id: string) => {
    onElementsChange(elements.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    setDraggingId(id);
    const target = elements.find((el) => el.id === id);
    if (!target) return;

    const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect();
    if (!svgRect) return;

    const mouseX = (e.clientX - svgRect.left) / scale;
    const mouseY = (e.clientY - svgRect.top) / scale;
    setDragOffset({ x: mouseX - target.x, y: mouseY - target.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingId) return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = (e.clientX - svgRect.left) / scale;
    const mouseY = (e.clientY - svgRect.top) / scale;

    const rawX = mouseX - dragOffset.x;
    const rawY = mouseY - dragOffset.y;

    const target = elements.find((el) => el.id === draggingId);
    if (!target) return;

    const w = target.rotation === 90 || target.rotation === 270 ? target.depth : target.width;
    const h = target.rotation === 90 || target.rotation === 270 ? target.width : target.depth;

    const clampedX = Math.max(0, Math.min(room.lengthM - w, rawX));
    const clampedY = Math.max(0, Math.min(room.widthM - h, rawY));

    const snappedX = snap(clampedX);
    const snappedY = snap(clampedY);

    onElementsChange(
      elements.map((el) => (el.id === draggingId ? { ...el, x: snappedX, y: snappedY } : el))
    );
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  // Generar baldosas de 0.60m
  const tileCols = Math.floor(room.lengthM / TILE_SIZE);
  const tileRows = Math.floor(room.widthM / TILE_SIZE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Barra de herramientas para colocar elementos a voluntad */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--surface-alt)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)' }}>Colocar en Plano:</span>
          <button className="btn btn-primary btn-sm" onClick={() => handleAddElement('rack')}>
            <Server size={14} /> + Rack 42U
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleAddElement('crac')}>
            <Thermometer size={14} color="var(--color-info)" /> + Aire CRAC
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleAddElement('ups')}>
            <BatteryCharging size={14} color="var(--color-warning)" /> + UPS
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleAddElement('door')}>
            <DoorClosed size={14} /> + Puerta
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleAddElement('pdu')}>
            <Zap size={14} color="var(--color-primary)" /> + Tablero PDU
          </button>
        </div>

        {/* Acciones sobre elemento seleccionado */}
        {selectedElement && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600' }} className="badge badge-info">
              {selectedElement.name} ({selectedElement.rotation}°)
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleRotate(selectedElement.id)}
              title="Rotar 90 grados"
            >
              <RotateCw size={14} /> Rotar
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleDelete(selectedElement.id)}
              title="Eliminar elemento"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Área del Plano 2D interactivo con grilla */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedElement ? '1fr 260px' : '1fr',
        gap: '16px',
        alignItems: 'start',
      }}>
        <div style={{
          overflow: 'auto',
          padding: '24px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '440px',
        }}>
          <svg
            width={roomPixelsW + 40}
            height={roomPixelsH + 40}
            viewBox={`-20 -20 ${roomPixelsW + 40} ${roomPixelsH + 40}`}
            style={{ cursor: draggingId ? 'grabbing' : 'default', userSelect: 'none' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={() => setSelectedId(null)}
          >
            <defs>
              {/* Patrón de baldosa 0.60m */}
              <pattern
                id="tilePattern"
                width={TILE_SIZE * scale}
                height={TILE_SIZE * scale}
                patternUnits="userSpaceOnUse"
              >
                <rect width={TILE_SIZE * scale} height={TILE_SIZE * scale} fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="0.8" />
                <circle cx={TILE_SIZE * scale} cy={TILE_SIZE * scale} r="1.5" fill="var(--color-primary)" opacity="0.4" />
              </pattern>
            </defs>

            {/* Suelo de la sala con baldosas TIA-942 */}
            <rect
              x="0"
              y="0"
              width={roomPixelsW}
              height={roomPixelsH}
              fill="url(#tilePattern)"
              stroke="var(--color-primary)"
              strokeWidth="3"
              rx="4"
            />

            {/* Cotas dimensionales */}
            <text x={roomPixelsW / 2} y="-6" fill="var(--text-muted)" fontSize="11" textAnchor="middle" fontWeight="600">
              Largo: {room.lengthM.toFixed(2)} m ({tileCols} baldosas de 0.60 m)
            </text>
            <text
              x="-6"
              y={roomPixelsH / 2}
              fill="var(--text-muted)"
              fontSize="11"
              textAnchor="middle"
              transform={`rotate(-90 -6 ${roomPixelsH / 2})`}
              fontWeight="600"
            >
              Ancho: {room.widthM.toFixed(2)} m ({tileRows} baldosas de 0.60 m)
            </text>

            {/* Elementos colocados en la sala */}
            {elements.map((el) => {
              const isSel = el.id === selectedId;
              const elW = (el.rotation === 90 || el.rotation === 270 ? el.depth : el.width) * scale;
              const elH = (el.rotation === 90 || el.rotation === 270 ? el.width : el.depth) * scale;
              const posX = el.x * scale;
              const posY = el.y * scale;

              // Color según tipo
              let fill = '#3E5C76';
              let badgeColor = '#FFF';
              if (el.type === 'crac') fill = '#5E8C6A';
              if (el.type === 'ups') fill = '#B8963E';
              if (el.type === 'door') fill = '#A6564B';
              if (el.type === 'pdu') fill = '#6B7280';

              return (
                <g
                  key={el.id}
                  transform={`translate(${posX}, ${posY})`}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                  style={{ cursor: 'grab' }}
                >
                  {/* Resplandor de selección */}
                  {isSel && (
                    <rect
                      x="-4"
                      y="-4"
                      width={elW + 8}
                      height={elH + 8}
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      rx="4"
                    />
                  )}

                  {/* Cuerpo del elemento */}
                  <rect
                    width={elW}
                    height={elH}
                    fill={fill}
                    stroke={isSel ? '#FFF' : '#222'}
                    strokeWidth="1.5"
                    rx="3"
                    opacity={el.type === 'door' ? 0.85 : 0.95}
                  />

                  {/* Indicador de frente y pasillo para Racks */}
                  {el.type === 'rack' && (
                    <>
                      {/* Línea frontal azul (Pasillo frío) */}
                      <rect x="0" y="0" width={elW} height="4" fill="#0ea5e9" title="Frente (Pasillo Frío)" />
                      {/* Línea posterior roja (Pasillo caliente) */}
                      <rect x="0" y={elH - 4} width={elW} height="4" fill="#ef4444" title="Dorso (Pasillo Caliente)" />
                    </>
                  )}

                  {/* Rejilla para Aires CRAC */}
                  {el.type === 'crac' && (
                    <line x1="4" y1={elH / 2} x2={elW - 4} y2={elH / 2} stroke="#FFF" strokeWidth="2" strokeDasharray="3 3" />
                  )}

                  {/* Etiqueta de texto */}
                  <text
                    x={elW / 2}
                    y={elH / 2 + 4}
                    fill={badgeColor}
                    fontSize="10"
                    fontWeight="700"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {el.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Panel lateral de propiedades del elemento seleccionado */}
        {selectedElement && (
          <div className="card" style={{ padding: '16px', background: 'var(--surface-alt)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              Propiedades: {selectedElement.name}
            </h4>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Nombre Identificador</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '12px' }}
                value={selectedElement.name}
                onChange={(e) => {
                  const val = e.target.value;
                  onElementsChange(elements.map((el) => (el.id === selectedElement.id ? { ...el, name: val } : el)));
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Pos X (m)</label>
                <input
                  type="number"
                  step={TILE_SIZE}
                  className="form-input"
                  style={{ fontSize: '12px' }}
                  value={selectedElement.x}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onElementsChange(elements.map((el) => (el.id === selectedElement.id ? { ...el, x: val } : el)));
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Pos Y (m)</label>
                <input
                  type="number"
                  step={TILE_SIZE}
                  className="form-input"
                  style={{ fontSize: '12px' }}
                  value={selectedElement.y}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onElementsChange(elements.map((el) => (el.id === selectedElement.id ? { ...el, y: val } : el)));
                  }}
                />
              </div>
            </div>

            {selectedElement.type === 'rack' && (
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Carga IT (kW)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  style={{ fontSize: '12px' }}
                  value={selectedElement.kw ?? 5.0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onElementsChange(elements.map((el) => (el.id === selectedElement.id ? { ...el, kw: val } : el)));
                  }}
                />
              </div>
            )}

            {selectedElement.type === 'ups' && (
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Capacidad UPS (kVA)</label>
                <input
                  type="number"
                  step="10"
                  className="form-input"
                  style={{ fontSize: '12px' }}
                  value={selectedElement.kva ?? 60}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onElementsChange(elements.map((el) => (el.id === selectedElement.id ? { ...el, kva: val } : el)));
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => handleRotate(selectedElement.id)}
              >
                <RotateCw size={12} /> Rotar 90°
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(selectedElement.id)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda de simbología 2D */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', background: '#3E5C76', borderRadius: '2px' }} /> Rack 42U (Borde azul: Pasillo Frío / Rojo: Caliente)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', background: '#5E8C6A', borderRadius: '2px' }} /> Aire Acondicionado CRAC
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', background: '#B8963E', borderRadius: '2px' }} /> Sistema UPS y Baterías
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', background: '#A6564B', borderRadius: '2px' }} /> Puerta de Acceso
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', background: '#6B7280', borderRadius: '2px' }} /> Tablero PDU
        </span>
      </div>
    </div>
  );
};
