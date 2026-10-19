export type DCElementType = 'rack' | 'crac' | 'ups' | 'door' | 'pdu';

export interface DCElement {
  id: string;
  type: DCElementType;
  name: string;
  x: number; // Posición X en metros (alineada a baldosa 0.60m)
  y: number; // Posición Y en metros (alineada a baldosa 0.60m)
  width: number; // Ancho en metros
  depth: number; // Profundidad en metros
  height: number; // Altura en metros
  rotation: 0 | 90 | 180 | 270; // Grados
  kw?: number;
  btu?: number;
  kva?: number;
  units?: number;
  notes?: string;
}

export interface DCRoomConfig {
  lengthM: number; // Largo de sala en metros
  widthM: number; // Ancho de sala en metros
  heightM: number; // Altura de losa a losa en metros (ej. 3.6m)
  raisedFloorHeightM: number; // Altura de piso técnico (ej. 0.30m)
  name: string;
}

export const TILE_SIZE = 0.6; // 60cm norma ANSI/TIA-942
