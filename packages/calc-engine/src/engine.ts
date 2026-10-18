import type { Diagnostic } from '@daedalous/shared';
import { SEVERITY_PENALTY } from '@daedalous/shared';
import type { CalcNode, EngineOutput, LimitRule, NodeResults, ProjectData } from './types';
import type { NormativeParams } from './params';
import { mergeParams } from './params';
import { roomNode } from './nodes/room';
import { itLoadNode } from './nodes/it-load';
import { growthNode, thermalNode } from './nodes/growth';
import { coolingNode, upsNode } from './nodes/capacity';
import { electricalNode } from './nodes/electrical';
import { heightNode, lightingNode, spaceNode } from './nodes/space';
import { RULES } from './rules/limits';

export class CalcEngine {
  private readonly nodes: Map<string, CalcNode> = new Map();
  private readonly rules: LimitRule[] = [];
  private readonly order: string[] = [];

  constructor(rules: LimitRule[] = RULES) {
    this.rules = rules;
    this.registerNodes([
      roomNode,
      itLoadNode,
      growthNode,
      thermalNode,
      coolingNode,
      upsNode,
      electricalNode,
      spaceNode,
      heightNode,
      lightingNode,
    ]);
    this.order = this.topologicalSort();
  }

  private registerNodes(nodes: CalcNode[]) {
    for (const n of nodes) {
      this.nodes.set(n.id, n);
    }
  }

  private topologicalSort(): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];

    const visit = (id: string) => {
      if (temp.has(id)) throw new Error(`Ciclo detectado en DAG de cálculo en nodo: ${id}`);
      if (visited.has(id)) return;
      temp.add(id);

      const node = this.nodes.get(id);
      if (node) {
        for (const input of node.inputs) {
          visit(input);
        }
      }

      temp.delete(id);
      visited.add(id);
      order.push(id);
    };

    for (const id of this.nodes.keys()) {
      if (!visited.has(id)) visit(id);
    }

    return order;
  }

  public run(data: ProjectData, customParams: Partial<NormativeParams> = {}): EngineOutput {
    const params = mergeParams(customParams);
    const results: NodeResults = {};

    // 1. Ejecutar nodos en orden topológico puro
    for (const id of this.order) {
      const node = this.nodes.get(id);
      if (node) {
        results[id] = node.compute(data, results, params);
      }
    }

    // 2. Evaluar reglas de límites normativos
    const diagnostics: Diagnostic[] = [];
    for (const rule of this.rules) {
      const checkResult = rule.check(results, data, params);
      if (checkResult) {
        diagnostics.push({
          ruleId: rule.id,
          stepKey: rule.stepKey,
          ref: rule.ref,
          severity: checkResult.severity,
          message: checkResult.message,
        });
      }
    }

    // 3. Calcular compliance score por paso (100 - penalizaciones, mín 0)
    const compliance: Record<string, number | null> = {};
    for (let i = 0; i <= 16; i++) {
      const stepKey = `step-${String(i).padStart(2, '0')}`;
      if (!data[stepKey] || Object.keys(data[stepKey] || {}).length === 0) {
        compliance[stepKey] = null; // Aún sin datos
        continue;
      }
      const stepDiags = diagnostics.filter((d) => d.stepKey === stepKey);
      let score = 100;
      for (const d of stepDiags) {
        score -= SEVERITY_PENALTY[d.severity] ?? 0;
      }
      compliance[stepKey] = Math.max(0, score);
    }

    return { results, diagnostics, compliance };
  }
}

export const defaultEngine = new CalcEngine();
