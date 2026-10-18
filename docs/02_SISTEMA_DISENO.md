# 02 · Sistema de diseño

## 1. Paleta (5 colores, tonos sobrios)

| Token | Nombre | Hex | Uso |
|---|---|---|---|
| `--color-primary` | Azul acero | `#3E5C76` | Acciones, enlaces, selección, menú activo |
| `--color-secondary` | Gris pizarra | `#6B7280` | Bordes, iconos, elementos secundarios |
| `--color-success` | Verde salvia | `#5E8C6A` | Cumple / validado |
| `--color-warning` | Ocre suave | `#B8963E` | Advertencia / límite cercano |
| `--color-danger` | Terracota | `#A6564B` | Error / límite excedido / bloqueante |

> Prohibido introducir colores adicionales. Las variaciones (hover, fondo de alerta) se obtienen con opacidad (`color-mix`) de estos 5.

## 2. Temas

| Token | Claro | Oscuro |
|---|---|---|
| `--bg` | `#F5F6F8` | `#16181D` |
| `--surface` | `#FFFFFF` | `#1F2228` |
| `--border` | `#D9DCE1` | `#2E323A` |
| `--text` | **`#000000`** | **`#FFFFFF`** |
| `--text-muted` | `#000000` al 65 % | `#FFFFFF` al 65 % |

Regla: **claro → texto negro; oscuro → texto blanco**, sin excepciones (incluye tablas, gráficos y PDF en modo claro).

```css
:root[data-theme="light"] { --bg:#F5F6F8; --surface:#FFFFFF; --text:#000000; }
:root[data-theme="dark"]  { --bg:#16181D; --surface:#1F2228; --text:#FFFFFF; }
```

## 3. Tipografía
- UI: **Inter** 400/500/600. Escala: 12 · 14 · 16 · 20 · 24 · 32 px.
- Datos técnicos (kW, BTU, U): **JetBrains Mono**.

## 4. Componentes y patrones
- **Layout**: header + contenido + **menú lateral derecho desplegable** (colapsable, iconos + texto).
- **Asistente**: stepper vertical (17 pasos) con estado por color: pendiente (pizarra), en progreso (azul), observaciones (ocre), validado (verde), bloqueado (terracota).
- **Pop-up vista en vivo**: panel flotante redimensionable, se actualiza con *debounce* de 300 ms.
- **Alertas de límite**: chip con color semántico + referencia normativa (`TIA-942 §x`).
- Micro-animaciones: transiciones 150–200 ms, sin efectos llamativos.
- Accesibilidad: contraste mínimo WCAG AA, foco visible, IDs únicos en elementos interactivos.

## 5. Planos 2D/3D
Mismos tokens: racks (primario), equipos de clima (secundario), zonas de alerta (ocre/terracota), pasillo frío/caliente con primario/terracota al 20 % de opacidad.
