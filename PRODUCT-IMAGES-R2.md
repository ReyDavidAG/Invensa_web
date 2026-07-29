# PRODUCT-IMAGES-R2 — Plan de implementación de imágenes de producto

> Plan operativo para terminar el feature de subida de fotos de producto a **Cloudflare R2**, alineado con `CONTEXT.md` y `PLAN.md`. La regla es: **$0 recurrentes**, sin mover el sitio a un dominio propio, sin Auth0 ni servicios de pago.
>
> **Lee CONTEXT.md antes.** Este plan NO redefine invariantes de negocio; las aplica.
>
> **Estado:** borrador listo para ejecutar. Bloques `[ ]` se marcan al terminar.
>
> **Última actualización:** 2026-07-28

---

## 1. Objetivo y resultados verificables

| Resultado | Cómo se verifica |
|---|---|
| El admin puede arrastrar una foto en `/products/new` y `/products/[id]/edit` y verla subida al instante | Devtools: PUT a `*.r2.cloudflarestorage.com` con 200, imagen visible en preview antes de guardar |
| La foto se guarda como `image_url` público en `products` (URL R2) | Devtools + DB: `select image_url from products where id = ...` devuelve la URL |
| La imagen se muestra en `/products/[id]` y en la tabla de `/products` | Render visual sin warnings de Next/Image |
| Nada pasa por Next/Node — el browser sube directo a R2 | Network panel: cero tráfico de binarios por el server de Vercel |
| Costo mensual | **$0** confirmado dentro del free tier de R2 |

### Lo que NO se hace en este plan (para evitar scope creep)

- Sin watermarks, sin crop inteligente, sin compresión server-side. El browser manda la foto tal cual sale de la cámara (limitada por validación client-side a 5 MB y tipos MIME).
- Sin migrar imágenes de otro sistema. No hay imágenes legacy.
- Sin CDN custom. R2.dev ya está en la red de Cloudflare (caché en borde).
- Sin multi-tenant. Una sola tienda, un solo bucket.
- Sin archivos en Supabase Storage. La decisión arquitectónica es: **datos en Supabase, blobs en R2**.

---

## 2. Decisiones de arquitectura (cerradas)

| Capa | Decisión | Por qué |
|---|---|---|
| **Bucket** | `invensa-products` en R2, público en lectura | Una sola tienda, una sola dueña. Sin policies privadas. |
| **URL pública** | Subdominio `https://<bucket-name>.<account-id>.r2.dev` que R2 asigna al activar "Public Development URL" en el dashboard del bucket | Cero DNS, cero config de Cloudflare adicional. **Caveat oficial de Cloudflare:** el subdominio `r2.dev` está marcado como "not recommended for production" porque tiene rate limits y carece de caché en el borde. Para una tienda de barrio con 2 usuarias y tráfico bajo, es aceptable. Si en el futuro se necesita SLA, se migra a dominio custom (ver §9). |
| **Subida** | Presigned PUT URL server-side → el browser hace `PUT` directo a R2 | Vercel tiene límite de 4.5 MB por request en serverless; pasar el archivo por Next nos mata el free tier y desperdicia egress |
| **Validación** | Client-side (tipo MIME + tamaño + dimensiones mínimas) + server-side (en Server Action: verifica que la key subida existe en R2 antes de guardar `image_url`) | Defense in depth. R2 no valida MIME — el que firma el PUT decide qué headers envía, pero al cliente no le conviene mentir porque la URL la guardamos nosotros |
| **CORS** | Configurar en el bucket los orígenes exactos de la app (localhost:3000 + `*.vercel.app`). `AllowedMethods: [PUT, GET, HEAD]`, `ExposeHeaders: [ETag]` | **PUT siempre hace preflight**, así que CORS es obligatorio para que el browser pueda subir. **GET con `<img src>` técnicamente NO requiere CORS** (es "simple request"), pero la configuración anterior cubre ambos casos por si en el futuro se hace `fetch()` a la imagen. |
| **Tokens** | Un API token R2 con scope **Object Read & Write** sobre el bucket `invensa-products`. TTL de las presigned URLs: **5 minutos** | 5 min es suficiente para que el browser suba; más tiempo = ventana de abuso si alguien intercepta la URL firmada |
| **Tamaño máx** | 5 MB por archivo, dimensiones mínimas 320×320 (cliente). R2 soporta hasta 5 TB por objeto pero Vercel/browser se quedan antes | El inventario vende productos físicos pequeños. 5 MB es amplio para fotos decentes de celular |
| **Formatos** | `image/jpeg`, `image/png`, `image/webp`. `image/heic` se re-encoda a JPEG en cliente (el navegador moderno de la hermana lo soporta) | Cobertura universal en navegador |
| **Nombres de archivo** | Generados server-side: `products/{productId-or-temp}/{uuid}.{ext}` | Evita colisiones, previene path traversal, no expone el código del producto en la URL |
| **Organización** | Prefijo por producto cuando ya existe; prefijo `tmp/` para uploads en `/products/new` antes de tener ID | Permite garbage collection posterior |
| **Garbage collection** | Tabla `r2_pending_uploads` (key, expires_at) → cron que borra keys huérfanas >24 h en prefijo `tmp/`. NO se hace en este plan (fase futura) | El free tier aguanta objetos colgados durante meses sin facturar; cuando duela, se automatiza |
| **Thumbnails** | NO. R2 no transforma. Se sirven las originales. `next/image` con `unoptimized` por ahora para evitar el loader de Vercel (que sí cuesta) | Documentado en §6 |

### Por qué NO usamos Supabase Storage

Supabase cobra bandwidth (egress) más allá del free tier (1 GB/mes). Si la hermana sube 200 fotos de 2 MB y las sirve 5,000 veces/mes, Supabase empieza a cobrar. R2 tiene **0 egress permanente**, lo que significa que aunque las imágenes se sirvan 100,000 veces al mes, el costo es $0.

### Por qué NO subimos vía Server Action

Vercel Hobby tiene límite de body de 4.5 MB en funciones serverless (esto puede cambiar, pero la realidad hoy). Forzar a las Server Actions de Next a recibir un `File` rompe ese límite, además de consumir tiempo de CPU de la función. Subir directo a R2 bypasea ambos problemas.

---

## 3. Variables de entorno nuevas

Añadir al `.env.local.example` y a `.env.local` (documentado en §8):

```bash
# ---- Cloudflare R2 (imágenes de productos) -------------------------
# 1) Crear cuenta en https://cloudflare.com (free tier)
# 2) R2 > Create bucket (nombre: invensa-products) — activar Public Access
# 3) R2 > Manage R2 API Tokens > Create API token
#    - Permissions: Object Read & Write
#    - Bucket: invensa-products
#    - TTL: indefinite (la rotación es manual cada 90 días)
# 4) Account ID en Cloudflare dashboard > R2 > Account ID

# URL pública que R2 asigna al bucket (la copia el dashboard al activar "Public Development URL")
# Ejemplo: https://invensa-products.abc123def456.r2.dev
NEXT_PUBLIC_R2_PUBLIC_URL="https://<bucket-name>.<account-id>.r2.dev"

# PRIVADO — credenciales S3-compatibles para generar presigned URLs
R2_ACCOUNT_ID="<cloudflare-account-id>"
R2_ACCESS_KEY_ID="<r2-access-key-id>"
R2_SECRET_ACCESS_KEY="<r2-secret-access-key>"
R2_BUCKET="invensa-products"
R2_REGION="auto"   # R2 no usa regiones reales; "auto" es el convention
```

**Validación Zod ya existe** en `src/lib/env.ts`. Las variables R2_* están marcadas como `optionalString` (no rompen el arranque si están vacías, pero las acciones R2 lanzarán un error claro al usarse). Esto se mantiene: si las variables no están configuradas, la subida sigue deshabilitada con el placeholder actual.

### Configuración adicional en Vercel

Las mismas 6 variables (5 server-only + 1 `NEXT_PUBLIC_`) se cargan en Production, Preview y Development. Vercel ya las cifra en reposo. RLS y la service-role key son admin-only en Supabase, los tokens de R2 son scoped a un solo bucket — si se filtran, el blast radius es un bucket de imágenes de productos.

---

## 4. Componentes nuevos a crear

```
src/
├── lib/
│   ├── r2/
│   │   ├── client.ts                  # S3Client + helpers (server-only)
│   │   ├── presign.ts                 # buildPutObjectUrl({ key, contentType, contentLength })
│   │   ├── keys.ts                    # buildProductKey(productId, filename) → string determinístico
│   │   └── verify.ts                  # HeadObject → confirma que el objeto existe tras upload
│   └── schemas/
│       └── upload.ts                  # zod: presignRequestSchema (key, contentType, contentLength, productId?)
├── app/
│   ├── actions/
│   │   └── storage.ts                 # requestUploadAction, finalizeUploadAction
│   └── api/
│       └── health/
│           └── route.ts               # (existente; no se toca)
└── components/
    └── form/
        └── product-image-dropzone.tsx # client component: drag/drop + preview + presigned upload
```

### Estructura de cada pieza

#### `src/lib/r2/client.ts` (server-only)

Singleton que crea `S3Client` con `region: 'auto'` y `endpoint: https://<accountId>.r2.cloudflarestorage.com`. Cacheado para evitar reconstruir el cliente en cada request. Usa `import "server-only"` para que un bundle del cliente que lo importe por accidente falle el build.

```ts
import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import { getServerEnv } from "@/lib/env";

let cached: S3Client | null = null;

export function getR2Client(): S3Client {
  if (cached) return cached;
  const env = getServerEnv();
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error(
      "[r2/client] R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set.",
    );
  }
  cached = new S3Client({
    region: env.R2_REGION,
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
  return cached;
}
```

#### `src/lib/r2/presign.ts`

```ts
import "server-only";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client } from "./client";
import { getServerEnv } from "@/lib/env";

export type PresignInput = {
  key: string;
  contentType: string;
  contentLength: number; // bytes
};

export async function buildPutObjectUrl(input: PresignInput): Promise<{
  url: string;
  publicUrl: string;
  expiresIn: number;
}> {
  const env = getServerEnv();
  const cmd = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });
  const url = await getSignedUrl(getR2Client(), cmd, { expiresIn: 300 }); // 5 min
  return {
    url,
    publicUrl: `${env.NEXT_PUBLIC_R2_PUBLIC_URL}/${input.key}`,
    expiresIn: 300,
  };
}
```

> **Nota sobre `ContentLength`:** firmarlo en la presigned URL hace que R2 rechace el PUT si el cliente envía un body de otro tamaño. Es un "anti-tampering" barato. Si por alguna razón R2 se queja del header (versiones viejas), se quita y se queda la validación client-side.

#### `src/lib/r2/keys.ts`

```ts
import { randomUUID } from "node:crypto";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

export function buildProductKey(opts: {
  productId?: string;        // undefined ⇒ prefijo tmp/
  filename: string;          // ej. "photo.jpg"
}): string {
  const ext = opts.filename.split(".").pop()?.toLowerCase() ?? "jpg";
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error(`Extensión no soportada: ${ext}`);
  }
  const folder = opts.productId ?? `tmp/${new Date().toISOString().slice(0, 10)}`;
  return `products/${folder}/${randomUUID()}.${ext}`;
}

export function publicUrlFor(key: string, publicBase: string): string {
  return `${publicBase.replace(/\/$/, "")}/${key}`;
}
```

> El prefijo `tmp/YYYY-MM-DD/` agrupa los uploads huérfanos del día. La cron de GC del futuro los barrerá.

#### `src/lib/r2/verify.ts`

```ts
import "server-only";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client } from "./client";
import { getServerEnv } from "@/lib/env";

export async function objectExists(key: string): Promise<boolean> {
  const env = getServerEnv();
  try {
    await getR2Client().send(
      new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: key }),
    );
    return true;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "$metadata" in err) {
      const meta = (err as { $metadata?: { httpStatusCode?: number } })
        .$metadata;
      if (meta?.httpStatusCode === 404) return false;
    }
    throw err;
  }
}
```

#### `src/lib/schemas/upload.ts`

```ts
import { z } from "zod";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const presignRequestSchema = z.object({
  contentType: z.string().refine((m) => ALLOWED_MIME.has(m), "Tipo no soportado"),
  contentLength: z.coerce.number().int().positive().max(MAX_BYTES, "Máx 5 MB"),
  filename: z.string().min(1).max(120),
  productId: z.string().uuid().optional(), // omitido en /new, presente en /edit
});

export type PresignRequest = z.infer<typeof presignRequestSchema>;
```

#### `src/app/actions/storage.ts`

```ts
"use server";
import { requireAdmin } from "@/app/actions/_guards";   // helper compartido
import { presignRequestSchema } from "@/lib/schemas/upload";
import { buildProductKey, publicUrlFor } from "@/lib/r2/keys";
import { buildPutObjectUrl } from "@/lib/r2/presign";
import { getServerEnv } from "@/lib/env";

export type PresignActionResult =
  | { ok: true; uploadUrl: string; publicUrl: string; key: string; expiresIn: number }
  | { ok: false; error: string };

export async function requestProductImageUploadAction(
  _state: unknown,
  formData: FormData,
): Promise<PresignActionResult> {
  const auth = await requireAdmin();
  if ("ok" in auth) return auth;

  const parsed = presignRequestSchema.safeParse({
    contentType: formData.get("contentType"),
    contentLength: formData.get("contentLength"),
    filename: formData.get("filename"),
    productId: formData.get("productId") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const env = getServerEnv();
  if (!env.NEXT_PUBLIC_R2_PUBLIC_URL) {
    return { ok: false, error: "R2 no está configurado en este entorno." };
  }

  const key = buildProductKey({
    productId: parsed.data.productId,
    filename: parsed.data.filename,
  });

  const presigned = await buildPutObjectUrl({
    key,
    contentType: parsed.data.contentType,
    contentLength: parsed.data.contentLength,
  });

  return {
    ok: true,
    uploadUrl: presigned.url,
    publicUrl: publicUrlFor(key, env.NEXT_PUBLIC_R2_PUBLIC_URL),
    key,
    expiresIn: presigned.expiresIn,
  };
}
```

> `_guards.ts` (helper nuevo, archivo chico): hoy `requireAdmin` está duplicado en `actions/products.ts` y `actions/customers.ts`. Esta fase lo extrae a `src/app/actions/_guards.ts` para reuso. Es un refactor de 5 líneas que reduce duplicación. **NO** toca lógica de productos existentes.

#### `src/components/form/product-image-dropzone.tsx`

Client component que:

1. Recibe `defaultUrl?: string` (URL ya subida, en edit) y `productId?: string` (en edit; ausente en new).
2. Tiene `accept="image/jpeg,image/png,image/webp"` y `capture="environment"` (móvil abre cámara trasera).
3. Validación client-side al seleccionar archivo:
   - `file.type` en lista permitida
   - `file.size <= 5 MB`
   - Lee `Image()` para validar dimensiones ≥ 320×320
4. Llama a `requestProductImageUploadAction` vía `useActionState` para obtener `{ uploadUrl, publicUrl, key }`.
5. `fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type }})`.
6. Progress: usa `XMLHttpRequest` con `upload.onprogress` para mostrar % (más friendly que `fetch` sin progress).
7. Al terminar OK, expone el `publicUrl` al padre via `onUploaded(url, key)`.
8. Reemplaza el placeholder actual de la card de imagen. Si ya había imagen, muestra preview con botón "Reemplazar" y "Quitar".

> El componente NO guarda en la BD. El form de productos (que ya existe) sigue siendo el dueño del submit. La diferencia: en lugar de pegar una URL en el input, ahora el campo `imageUrl` se rellena solo cuando el dropzone completa OK.

---

## 5. Cambios en archivos existentes (mínimos)

| Archivo | Cambio | Riesgo |
|---|---|---|
| `src/app/(app)/products/new/products-form.tsx` | Reemplazar el bloque del placeholder visual por `<ProductImageDropzone onUploaded={(url) => setValue("imageUrl", url, { shouldValidate: true })} />`. Mantiene el campo `imageUrl` oculto (se sincroniza desde el dropzone). El URL field queda visible solo como fallback de admin que ya tiene una URL pública | Bajo — el form sigue aceptando submit con `imageUrl=""` |
| `src/app/(app)/products/[id]/edit/products-edit-form.tsx` | Mismo cambio. `defaultUrl` viene del `defaults.imageUrl` | Bajo |
| `src/app/(app)/products/[id]/page.tsx` | Reemplazar `<img src={product.image_url}>` por `<img>` con `loading="lazy"` + `decoding="async"` (Next `<Image>` con `unoptimized` para no usar el loader de Vercel) | Bajo — solo añade atributos |
| `src/app/(app)/products/page.tsx` | Si la lista muestra thumbnails, mismo cambio (verificar primero; si no los muestra, no se toca) | Muy bajo |
| `src/app/actions/_guards.ts` | NUEVO archivo, extrae `requireAdmin()` que está duplicado en products/customers | Bajo — refactor sin cambio de comportamiento |
| `package.json` | Añadir `@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner` (deps exactas a fijar tras validar versiones) | Bajo — libs estándar AWS |
| `pnpm-lock.yaml` | Regenerado por `pnpm install` | — |
| `.env.local.example` | Marcar las 6 vars R2 como "configurar antes de producción" en lugar de "futuro" | Trivial |

> **NO** se toca: `next.config.ts` (no requiere remote patterns porque las imágenes vienen de `*.r2.dev` que es HTTPS público, y usamos `unoptimized`). `lib/env.ts` ya tiene los campos. `supabase/migrations/*` no se tocan (la URL vive solo en `products.image_url`).

---

## 6. `next/image` vs `<img>` plano

Por defecto, `next/image` con el loader de Vercel (Vercel Image Optimization) sí incurre en costo (incluido en el free tier hasta cierto límite, pero más estricto que el de R2). Para evitar sorpresas:

**Opción A (recomendada en este plan):** Usar `<img>` plano con `loading="lazy"` y `decoding="async"` en todos los sitios donde se muestra `products.image_url`. Documentar en `design.md` la regla: "imágenes de productos = `<img>` plano, nunca `next/image`".

**Opción B (si se quiere `next/image`):** Configurar `images.unoptimized: true` en `next.config.ts`. Aplica a TODAS las imágenes del sitio (futuros logos, avatares). Se prefiere A por simplicidad — solo afecta a imágenes de producto, y la performance ya es buena sirviendo desde la red de Cloudflare.

Decisión: **Opción A**. Es una sola decisión que se aplica en 1-3 archivos. Sin config global, sin side effects.

---

## 7. Flujo end-to-end (cómo se ven las cosas)

### Subir imagen en `/products/new`

```
1. Usuario arrastra "foto.jpg" (2.4 MB, 1024×1024)
2. product-image-dropzone valida: tipo OK, tamaño OK, dimensiones OK
3. Llama a requestProductImageUploadAction → { uploadUrl, publicUrl, key }
4. XMLHttpRequest PUT a uploadUrl con progress visible
5. Al recibir 200, dropzone llama onUploaded(publicUrl) → setValue("imageUrl", publicUrl)
6. Usuario completa el resto del form (SKU, nombre, etc.) y da "Guardar"
7. createProductAction guarda el producto con image_url = publicUrl
8. revalidatePath("/products") → el usuario navega a /products/<id>
9. La imagen ya está en <img src={image_url}> — cacheada en R2
```

### Reemplazar imagen en `/products/[id]/edit`

Mismo flujo. El `key` generado incluye el `productId` para sobreescribir orden: `products/{productId}/{uuid}.{ext}`. La imagen vieja **no se borra automáticamente** en esta fase (se documenta en §9 como follow-up; el costo es despreciable).

### Eliminar imagen

NO implementado en este plan. La hermana puede dejar la imagen vieja si archiva el producto. Si se quiere borrar el objeto de R2 cuando se elimina la URL del producto, es una fase futura (Server Action que llama `DeleteObjectCommand`).

### Subida fallida

- Si el archivo excede 5 MB → toast "La imagen pesa más de 5 MB".
- Si el PUT falla (red, R2 caído, token expirado) → toast "No pudimos subir la imagen. Intenta de nuevo." El campo `imageUrl` queda vacío; el form permite guardar sin imagen.
- Si el usuario cierra la pestaña a media subida → el objeto queda huérfano en `tmp/`. Aceptable en este plan.

---

## 8. Plan de ejecución (orden de implementación)

Cada paso es verificable independientemente. Marcar `[x]` al terminar.

### Fase A — Setup R2 (manual, en dashboard)

- [ ] **A1.** Crear cuenta Cloudflare (si no existe).
- [ ] **A2.** Crear bucket `invensa-products` (region: `auto`; default encryption ON).
- [ ] **A3.** En bucket settings → **Public Development URL** → clic en **Enable**. Anotar la URL resultante con el formato `https://invensa-products.<account-id>.r2.dev`.
- [ ] **A4.** En **CORS Policy** del bucket, añadir:
  ```json
  [{
    "AllowedOrigins": ["http://localhost:3000", "https://invensa-web.vercel.app"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }]
  ```
  Actualizar `AllowedOrigins` cuando se sume preview deploys (`https://*-invensa-web.vercel.app` o usar `https://*.vercel.app`).
- [ ] **A5.** Crear API Token: scope `Object Read & Write`, bucket `invensa-products`, sin expiración.
- [ ] **A6.** Copiar `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `NEXT_PUBLIC_R2_PUBLIC_URL` a `.env.local`.
- [ ] **A7.** Verificar manualmente con `curl` desde local:
  ```bash
  # generar presigned URL (mental) → PUT de un .jpg de prueba → HEAD → ver 200
  ```
  No se hace un script en repo; se verifica una vez en local.

### Fase B — Deps + helpers (código)

- [ ] **B1.** `pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
- [ ] **B2.** Crear `src/lib/r2/client.ts`.
- [ ] **B3.** Crear `src/lib/r2/keys.ts`.
- [ ] **B4.** Crear `src/lib/r2/presign.ts`.
- [ ] **B5.** Crear `src/lib/r2/verify.ts`.
- [ ] **B6.** Crear `src/lib/schemas/upload.ts`.

### Fase C — Server Action + refactor de guard

- [ ] **C1.** Crear `src/app/actions/_guards.ts` (extrae `requireAdmin` de `products.ts` y `customers.ts`).
- [ ] **C2.** Reemplazar la implementación inline en `products.ts` y `customers.ts` por import del helper. Verificar que `pnpm exec tsc --noEmit` sigue limpio.
- [ ] **C3.** Crear `src/app/actions/storage.ts` con `requestProductImageUploadAction`.

### Fase D — Componente UI

- [ ] **D1.** Crear `src/components/form/product-image-dropzone.tsx`.
- [ ] **D2.** Integrar en `src/app/(app)/products/new/products-form.tsx` (reemplazar el bloque placeholder).
- [ ] **D3.** Integrar en `src/app/(app)/products/[id]/edit/products-edit-form.tsx` (reemplazar el bloque placeholder).
- [ ] **D4.** En `src/app/(app)/products/[id]/page.tsx`, añadir `loading="lazy"` y `decoding="async"` al `<img>`.

### Fase E — Verificación end-to-end

- [ ] **E1.** `pnpm dev`. Crear un producto nuevo con foto. Verificar en Devtools:
  - Network: 1 PUT a `*.r2.cloudflarestorage.com` con 200.
  - Network: el POST al Server Action de `createProduct` NO contiene el binario (solo el `imageUrl`).
- [ ] **E2.** Verificar en Supabase Studio: `select image_url from products where id = '<id>'` → la URL de R2.
- [ ] **E3.** Navegar a `/products/<id>` → la imagen carga. Verificar que `<img>` no tiene 404.
- [ ] **E4.** Probar reemplazos: editar el mismo producto, subir otra foto. Verificar que el `key` cambia (es un uuid nuevo), la URL cambia, la imagen anterior queda "huérfana" en R2 (aceptable).
- [ ] **E5.** Probar rechazo de archivos > 5 MB → toast aparece, no se llama al server.
- [ ] **E6.** Probar sin conexión a internet → PUT falla, toast aparece, form permite guardar sin imagen.
- [ ] **E7.** `pnpm exec tsc --noEmit && pnpm lint && pnpm format`.
- [ ] **E8.** `pnpm build` debe pasar (imports `server-only` respetados).

### Fase F — Deploy

- [ ] **F1.** Cargar las 6 variables R2 en Vercel (Production, Preview, Development).
- [ ] **F2.** Añadir los dominios de Vercel a la CORS policy del bucket:
  - `https://invensa-web.vercel.app`
  - `https://*.vercel.app` (cubre preview deploys)
- [ ] **F3.** Push a `main`. Esperar deploy.
- [ ] **F4.** Crear un producto desde producción. Verificar el mismo flujo que E1-E3.
- [ ] **F5.** Compartir el link con la hermana para que pruebe desde su celular.

---

## 9. Riesgos y follow-ups (NO se implementan en este plan)

| Riesgo / Follow-up | Cuándo se aborda | Mitigación mientras tanto |
|---|---|---|
| Objetos huérfanos en `tmp/` | Cuando el bucket supere 1 GB o cuando moleste | El free tier aguanta años; documentar en `design.md` |
| Borrar imagen vieja al reemplazar | Si la hermana se queja de desorden | Fase futura: Server Action `deleteObject(key)` + cron |
| Borrar imagen al archivar producto | Idem | Idem |
| Token R2 con permisos demasiado amplios | Si se filtra | Rotación trimestral manual desde Cloudflare; documentar en `CONTEXT.md` |
| Bucket privado + URLs firmadas para servir | Si en el futuro se quieren imágenes "internas" (ej. reportes) | NO procede ahora — todo el catálogo es público |
| Transformaciones (resize, webp automático) | Si el celular de la hermana sube fotos de 8 MB | Fijar `maxLength` en cliente a 5 MB y `accept="image/*"` con `capture` |
| Dominio custom para branding | Si la hermana quiere `cdn.invensa.app` | El SDK S3 sube siempre al endpoint `https://<account-id>.r2.cloudflarestorage.com`, no al dominio público. Si se cambia `NEXT_PUBLIC_R2_PUBLIC_URL` a un custom domain, **los uploads NO se rompen** porque siguen yendo al endpoint interno. El cambio solo afecta el `publicUrl` que se guarda en `products.image_url`. Plan: añadir var `R2_PUBLIC_URL` cuando se necesite; el código actual lo lee con `env.NEXT_PUBLIC_R2_PUBLIC_URL` y la sustitución es trivial. |
| Multi-tienda | Si se abre 2da tienda | Ese día: buckets separados por tienda (`invensa-tienda-1`, etc.) y prefix por tienda |
| Cloudflare Images | Si se necesita resize on-the-fly | Migración: añade un Worker entre R2 y el cliente; sigue siendo gratis hasta 100k transforms/mes |

---

## 10. Coste esperado

| Concepto | Free tier | Uso estimado |
|---|---|---|
| Storage | 10 GB/mes | ~2 GB (200 productos × 2 MB/foto) |
| Class A ops (PUT, POST, LIST) | 1M/mes | < 5,000/mes (200 productos editados 25 veces al año) |
| Class B ops (GET, HEAD) | 10M/mes | < 500,000/mes (consultas del admin + página detalle de cada producto) |
| **Egress** | **0** | ilimitado |

Resultado: **$0/mes sostenible**. La arquitectura escala gratis hasta cientos de miles de imágenes. Si se llega a ese volumen, ya hay tienda y hay dinero para Cloudflare Images o un bucket dedicado.

---

## 11. Resumen para la hermana

Cuando esto esté listo, le explico a ella (y a su mamá si preguntan):

> "Las fotos de los productos se suben a un servicio de Cloudflare que se llama R2. Tú arrastras la foto, se guarda sola en internet con un link que dura para siempre, y no nos cuesta ni un peso al mes aunque mil personas vean las fotos. Si un día cambias de opinión sobre una foto, la puedes reemplazar o quitar sin que se rompa nada."

Lo que ella NO necesita saber: tokens S3, presigned URLs, CORS, hashes de bucket, subdominios `r2.dev`. Eso es problema nuestro.