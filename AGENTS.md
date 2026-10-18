# Reglas del proyecto Daedalous

Estas reglas son obligatorias para cualquier desarrollador o agente IA que trabaje en el repositorio.

## 1. Coordinación y documentación
- `docs/` es la **fuente de verdad**. Todo cambio funcional actualiza el `.md` correspondiente en el mismo commit.
- Toda decisión técnica relevante se registra en `docs/CHANGELOG.md` (fecha, decisión, motivo).
- Cada paso del asistente (0–16) tiene su sección en `docs/03_MODULOS_TIA942.md`; no se implementa un paso sin especificación.
- Los valores normativos (TIA-942, ASHRAE, NEC/NFPA) **nunca** se escriben en código: viven en la tabla `normative_parameters` y en `packages/normative`.

## 2. Código
- Lenguaje único: **TypeScript estricto** (`"strict": true`) en frontend, backend y motor de cálculo.
- **Archivos ≤ 250 líneas**; **funciones ≤ 40 líneas**; una responsabilidad por función.
- Un módulo = una carpeta autocontenida (`controller`, `service`, `repository`, `dto`, `tests`).
- Funciones de cálculo **puras** (sin I/O) en `packages/calc-engine`, con test unitario obligatorio.
- Validación de datos con **Zod**; los esquemas se comparten entre front y back (`packages/shared`).
- Prohibido `any`, lógica de negocio en componentes React o controladores.
- Nombres de código en inglés; textos de UI en español vía i18n (`es` por defecto).
- Commits: Conventional Commits (`feat(step-04): ...`).

## 3. Diseño gráfico
- Solo la **paleta de 5 colores** definida en `docs/02_SISTEMA_DISENO.md` + neutros de fondo.
- **Tema claro: texto siempre negro (#000000). Tema oscuro: texto siempre blanco (#FFFFFF).**
- Colores solo mediante tokens CSS (`var(--color-primary)`); prohibido hex en componentes.
- Tipografía: Inter (UI) y JetBrains Mono (valores numéricos/técnicos).

## 4. Datos y seguridad
- Los datos primarios del Paso 0 son **inmutables** tras la creación del proyecto.
- Cada guardado genera una **nueva versión**; nunca se sobrescribe una versión.
- Toda acción se valida contra permisos `recurso:acción` (RBAC) en backend.
- Eliminación de proyectos = borrado lógico (`deleted_at`) + auditoría.
