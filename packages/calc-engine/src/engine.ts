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
import { evaluateStepRequirements } from './rules/step-completion';

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

    // 3. Calcular compliance score por paso y progreso global del diseño
    const compliance: Record<string, number | null> = {};
    const missingRequirements: Record<string, string[]> = {};
    let totalScoreSum = 0;
    let completedStepsCount = 0;

    for (let i = 0; i <= 16; i++) {
      const stepKey = `step-${String(i).padStart(2, '0')}`;
      const stepData = (data[stepKey] as Record<string, any>) || {};

      if (!data[stepKey] || Object.keys(stepData).length === 0) {
        compliance[stepKey] = 0;
        const evalReqs = evaluateStepRequirements(stepKey, {}, data);
        missingRequirements[stepKey] = evalReqs.missing;
        continue;
      }

      // Evaluar requisitos de completitud específicos de la fase
      const evalReqs = evaluateStepRequirements(stepKey, stepData, data);
      missingRequirements[stepKey] = evalReqs.missing;

      // Penalizaciones normativas TIA-942
      const stepDiags = diagnostics.filter((d) => d.stepKey === stepKey);
      let penalty = 0;
      for (const d of stepDiags) {
        penalty += SEVERITY_PENALTY[d.severity] ?? 0;
      }

      // El score es la completitud de requisitos menos las penalizaciones normativas
      const finalScore = Math.max(0, evalReqs.score - penalty);
      compliance[stepKey] = finalScore;
      totalScoreSum += finalScore;

      if (finalScore === 100) {
        completedStepsCount++;
      }
    }

    const globalProgress = Math.round(totalScoreSum / 17);

    return {
      results,
      diagnostics,
      compliance,
      globalProgress,
      completedStepsCount,
      missingRequirements,
    };
  }
}

export const defaultEngine = new CalcEngine();
