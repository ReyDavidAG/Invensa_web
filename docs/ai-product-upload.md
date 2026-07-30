# PROPUESTAS — IA para carga inicial de productos

> Feature nueva. Resolver el dolor de subir 100+ productos uno por uno.
>
> **Skills aplicadas:** /ponytail (no empezar sin saber cuál resuelve mejor el dolor) + /hallmark (IA honesta, no magia, sister siempre puede editar).

---

## 1. El dolor concreto

**Hoy:** sister abre `/products/new` y llena 7+ campos (SKU, nombre, categoría, unidad, precio compra, precio venta, foto, umbral) por producto. ~3-5 min por producto. 100 productos = 5-8 horas de un día entero.

**Lo que queremos:** bajar ese tiempo sin sacrificar calidad de los datos ni romper el flujo actual.

---

## 2. Tres opciones con tradeoffs reales

### Opción A — Asistente IA dentro del formulario (RECOMENDADA para V1)

**Qué es:** una caja en `/products/new` (y `/products/[id]/edit`) donde sister escribe una descripción libre del producto en español. La IA devuelve sugerencias para los campos más pesados (nombre, categoría, unidad). Sister acepta o corrige campo por campo. SKU y precios los llena ella siempre.

**Flujo:**
1. Click en la caja "Describe el producto"
2. Escribe: `Detergente Fab Ultra 1L para ropa, presentación botella`
3. Click "Sugerir con IA"
4. Aparece preview con sugerencias: nombre "Fab Ultra 1L", categoría "Limpieza", unidad "Litro"
5. Cada campo tiene check "Usar" / descartar. Sister edita si está mal
6. Llena SKU + precios (no toca precios — margen es decisión de la tienda)
7. Click "Guardar"

**IA usado:** MiniMax M3 (text-only, ya configurado en `.env.local`). Costo ~$0.001 por producto. 100 productos = $0.10.

**Tiempo por producto:** ~1 min (vs 3-5 min). 100 productos = ~1.5 horas.

**Riesgo:** bajo. Sister puede editar cada campo. Si la IA se equivoca, sister corrige.

**Complejidad de implementación:** baja. Un Server Action nuevo, un componente pequeño, integración con el form existente. No toca el resto del sistema.

**Honestidad Hallmark:**
- IA devuelve `confidence` numérico. Si es bajo, la UI muestra "No estoy seguro" en lugar de inventar.
- Sister ve cada sugerencia como propuesta, no como verdad.
- No auto-llena precios. La tienda decide su margen, no la IA.
- Categorías y unidades se sugieren de las EXISTENTES en la base de datos (no se inventan nuevas).

---

### Opción B — Importar CSV o pegar lista tabulada (V2)

**Qué es:** nueva página `/products/import` donde sister pega filas desde Excel/Sheets o sube un archivo CSV. Sistema valida, muestra preview con errores, deja importar las filas válidas.

**Flujo:**
1. Sister arma una tabla en Excel/Sheets con columnas: SKU, nombre, categoría, unidad, precio compra, precio venta, stock, umbral
2. Pega en un textarea O sube el .csv
3. Sistema parsea, valida cada fila (SKU único, categoría existe, precios numéricos)
4. Preview: tabla con checkboxes por fila. Filas con error marcadas en rojo con tooltip
5. Sister corrige las que pueda, marca las válidas
6. Click "Importar N productos"
7. Resultado: cuántas creadas, cuántas saltadas, link al listado

**IA usado:** ninguno en V1. (Podría agregarse después: pegar texto libre de WhatsApp/correo → IA estructura en columnas.)

**Costo:** $0.

**Tiempo por producto:** ~0.3 min si la tabla ya está armada. 100 productos = ~30 min.

**Riesgo:** medio. Datos mal formateados bloquean la importación. Categoría mal escrita crea duplicados. Hay que validar bien y dar mensajes claros.

**Complejidad:** media. CSV parser (`papaparse` o built-in), tabla de preview interactiva, manejo de errores por fila, endpoint de bulk insert con transacciones.

**Honestidad Hallmark:** preview obligatorio antes de insertar. No se crea nada hasta que sister confirme.

---

### Opción C — Foto + sugerencia IA (V3 o skip)

**Qué es:** botón "Crear con foto" en `/products` que abre modal con cámara/dropzone. Foto + pista opcional → IA devuelve nombre y categoría. Sister revisa y completa el resto. La imagen subida sirve como foto del producto.

**Flujo:**
1. Click "Crear con foto" → modal con dropzone + textarea de pista opcional
2. Sister toma foto o selecciona. Escribe pista: "Botella de Fab Ultra 1L"
3. Click "Analizar"
4. IA devuelve: nombre "Fab Ultra 1L", categoría "Limpieza" (y quizás descripción corta)
5. Modal se cierra con los campos pre-llenados en el form normal
6. Sister completa SKU, precios, ajuste de foto si quiere otra
7. Guarda

**IA usado:** visión (text+image). MiniMax M3 — por verificar si soporta visión en su API actual. Si no, fallback a solo texto con pista escrita.

**Costo:** ~$0.01 por foto (modelos de visión son más caros que texto). 100 fotos = $1.

**Tiempo por producto:** ~1 min.

**Riesgo:** alto. Productos genéricos (botellas sin etiqueta clara), fotos borrosas, packaging similar entre marcas → IA se confunde. Necesita UI de revisión robusta.

**Complejidad:** media-alta. Verificar capacidad de visión del modelo, diseñar UX de revisión y override, manejo de fotos.

**Honestidad Hallmark:** la foto no es "magia". Si la IA no reconoce, sister debe tipear igual. La pista textual siempre está disponible como fallback.

---

## 3. Comparación directa

| | A: Asistente texto | B: CSV/paste | C: Foto |
|---|---|---|---|
| Costo total (100 prods) | $0.10 | $0 | $1 |
| Tiempo por producto | 1 min | 0.3 min (si tiene tabla) | 1 min |
| Tiempo total 100 prods | 1.5 h | 30 min (con tabla) | 1.5 h |
| Dificultad para sister | Baja (escribe texto libre) | Media (prepara tabla) | Baja (foto) |
| Riesgo de error de IA | Bajo (siempre editable) | N/A (sin IA) | Alto |
| Necesita verificación previa | No (text-only) | No (CSV parser) | Sí (soporte visión) |
| Complejidad dev | Baja | Media | Media-alta |
| Reutiliza trabajo existente | Sí (form actual) | No (nueva página) | Parcial |

---

## 4. Recomendación

**V1: Opción A — Asistente IA en el formulario.** Resuelve el 80% del dolor con el 20% del esfuerzo.

Razones:
1. **El form ya existe.** No agregamos página nueva, solo una caja adentro. Riesgo bajo, integración mínima.
2. **Sister sigue en control.** Cada sugerencia es revisable. No es "magia que se equivoca sola".
3. **Bajo costo.** $0.10 por 100 productos. Probable que el costo de la API sea menor que el costo de la hermana tecleando 30 segundos extras por producto.
4. **Cumple Hallmark.** IA propone, sister dispone. La IA nunca inventa datos (devuelve `confidence`, devuelve strings vacíos si no sabe).
5. **Sirve también para editar.** Misma caja en `/products/[id]/edit` — sister puede describir "cambié el empaque" y la IA sugiere el nombre nuevo.

**V2: Opción B — Importar CSV**, después de validar que V1 funciona. Para sister o cualquier admin que ya tenga la lista armada en Excel/Sheets. Útil para migración desde otro sistema.

**V3 o skip: Opción C — Foto**. Solo si MiniMax M3 soporta visión y queremos validar resultados con productos reales. Riesgo de alucinar es alto. Si la foto no agrega valor claro, skip.

---

## 5. Plan de implementación de V1 (Opción A) si se aprueba

Orden:

1. **Endpoint server action** `src/app/actions/ai-product.ts`:
   - Recibe descripción libre en español
   - Llama a MiniMax con prompt diseñado (nombre, categoría sugerida de las existentes, unidad sugerida de las existentes, confidence)
   - Devuelve JSON estructurado
   - Cachea resultados por hash de descripción (1 semana) para no pagar dos veces

2. **Componente cliente** `src/components/product-ai-assistant.tsx`:
   - Textarea + botón "Sugerir con IA"
   - Estado: idle / loading / result / error
   - Preview de campos con switch "Usar" por campo
   - Click en un campo lo copia al input del form padre (callback)

3. **Integración en `products-form.tsx`** (y `products-edit-form.tsx`):
   - Colapsable arriba del form con título "Describe el producto y la IA sugiere los campos"
   - Hook `useFormContext` (ya existe)
   - Botones "Aplicar nombre", "Aplicar categoría", "Aplicar unidad" que setean el valor del form

4. **Prompt engineering**:
   - Devuelve SOLO los 4 campos (name, categoryName, unitName, confidence)
   - Categorías y unidades vienen de la base de datos (las sisters ya crearon algunas), no se inventan
   - Si no hay match con existentes, devuelve string vacío y confidence bajo
   - Temperatura 0.3 (conservador, no creativo)

5. **UX copy** (todo en español):
   - "Describe el producto en una frase"
   - "Sugerir con IA"
   - "Aplicar nombre" / "Categoría sugerida: Limpieza" / "No estoy seguro"

6. **Seguridad**:
   - Rate limit: max 30 sugerencias/min por usuario
   - API key solo server-side (Server Action), nunca al cliente
   - Descripción max 500 chars (evitar abuso)
   - Log de uso (cuánto costó, cuántos productos)

7. **Telemetría mínima** (V1.1):
   - Cuántas sugerencias se pidieron
   - Cuántas se aceptaron vs rechazaron
   - Latencia promedio

Tiempo estimado: 1 sesión de implementación.

---

## 6. Lo que NO se hace (out of scope V1)

- IA para ventas (sugerencias de upsell). Diferente feature, diferente momento.
- IA para clientes (autocompletar datos desde nombre). No es dolor.
- IA para reportes (análisis automático). Los reportes ya son explícitos.
- Auto-tag de productos con IA. Categorización visual, etc.

---

## 7. Riesgos a vigilar

- **Costo real**: $0.001 por sugerencia es estimación. Verificar con un test antes de prometer.
- **Latencia**: llamadas a MiniMax pueden tardar 1-3s. UX debe manejar loading state.
- **Idioma**: MiniMax está en chino por defecto. Prompt tiene que estar en chino o español — verificar qué entiende mejor.
- **Categorías nuevas**: si la IA sugiere una categoría que no existe, no se crea automáticamente. Se sugiere y sister decide si la crea primero o usa otra.
- **Alucinaciones de precio**: IA no toca precios. Sister siempre los llena. Esto es regla dura del prompt.

---

## Pregunta para vos

**¿Cuál implementamos primero?**

1. **A — Asistente IA en el form** (mi recomendación, V1, ~1 sesión)
2. **B — Importar CSV** (V2, ~2 sesiones)
3. **C — Foto + IA** (V3, depende de soporte visión, riesgo alto)
4. **Las tres** en orden A → B → C, commiteando cada una por separado

Si querés algo distinto o tenés más contexto (ej: sister ya tiene una lista armada de productos), contame y ajusto la propuesta.