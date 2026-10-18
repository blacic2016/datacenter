# 06 · Plan de implementación

Cada fase termina con: código + tests + documentación actualizada + demo.

| Fase | Alcance | Criterio de aceptación |
|---|---|---|
| **F0 Fundaciones** | Monorepo pnpm/Turborepo, Docker (Postgres, Redis, MinIO), CI lint/test, `packages/ui` con tokens y temas claro/oscuro | `pnpm dev` levanta todo; cambio de tema respeta texto negro/blanco |
| **F1 Acceso** | Login, usuarios, roles, permisos, guards RBAC, auditoría | CRUD de usuarios/roles; acceso denegado según permisos |
| **F2 Proyectos** | Inicio con descripción + menú derecho; listado de proyectos; Paso 0; códigos únicos; versiones; copiar/deshabilitar/eliminar | Paso 0 inmutable verificado por test; cada guardado crea versión |
| **F3 Framework del asistente** | `StepDefinition`, stepper, guardado parcial, pop-up en vivo, `calc-engine` (DAG + reglas), parámetros normativos | Cambio en dato → pop-up actualizado < 300 ms; pasos dependientes marcados |
| **F4 Levantamiento + IA** | Paso 1, fotos, Plantilla Datacenter editable, worker IA con explicación por ítem, aprobación | Checklist autocompletado con explicación y aprobación ítem a ítem |
| **F5 Obra civil y espacio** | Pasos 2 y 3, catálogo de equipos, inventario por rack, escenarios 25/50 % | Agregar rack recalcula kW/BTU/m² y dispara límites |
| **F6 Eléctrico y clima** | Pasos 4, 5, 6, 7, 8 (unifilares generados, A/B, conductores, UPS) | Reglas PWR/COOL/UPS/HGT con tests |
| **F7 Sistemas especiales** | Pasos 9, 10, 11, 12 (exportación Zabbix) | Diagramas de ubicación y export Zabbix válidos |
| **F8 Comercial** | Paso 13 precios/BOM, Paso 14 PDF | PDF completo generado desde la versión |
| **F9 2D/3D** | Paso 15 editor 2D Konva + 3D r3f sincronizados | Mover/agregar rack en 2D → 3D y cálculos actualizados |
| **F10 Cierre e historial** | Paso 16, pantalla de historial con gráfico de cumplimiento | Timeline + score por paso + marcadores de incumplimiento |
| **F11 Endurecimiento** | Rendimiento, seguridad (OWASP), backups, e2e | Suite e2e verde, respaldo/restauración probados |

## Orden de prioridad
F0 → F1 → F2 → F3 son la base: sin el framework del asistente y el motor de cálculo, ningún paso se construye. A partir de F5 los pasos pueden desarrollarse en paralelo por equipo, ya que cada uno es un módulo semi-independiente que solo se comunica vía `ProjectContext` y el `calc-engine`.
