import type { CalcNode } from '../types';
import { num, str } from '../read';

export interface RoomResult {
  lengthM: number;
  widthM: number;
  areaM2: number;
  clearHeightM: number;
  hasRaisedFloor: boolean;
  raisedFloorM: number;
  tileM: number;
  tiles: number;
}

export const roomNode: CalcNode<RoomResult> = {
  id: 'room',
  inputs: [],
  compute(data) {
    const lengthM = num(data, 'step-02', 'lengthM', 0);
    const widthM = num(data, 'step-02', 'widthM', 0);
    const hasRaisedFloor = str(data, 'step-02', 'raisedFloor', 'Sí') === 'Sí';
    const tileM = num(data, 'step-02', 'tileSizeM', 0.6);
    const areaM2 = lengthM * widthM;
    return {
      lengthM,
      widthM,
      areaM2,
      clearHeightM: num(data, 'step-02', 'clearHeightM', 0),
      hasRaisedFloor,
      raisedFloorM: hasRaisedFloor ? num(data, 'step-02', 'raisedFloorHeightM', 0.3) : 0,
      tileM,
      tiles: tileM > 0 ? Math.floor(lengthM / tileM) * Math.floor(widthM / tileM) : 0,
    };
  },
};
