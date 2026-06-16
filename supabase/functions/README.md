# Supabase Edge Functions — SportMatch Connect

Este directorio contiene las Edge Functions serverless de Supabase.
Cada función se deploya con `supabase functions deploy <nombre>`.

## Inventario

| Función                                                           | Trigger                              | Inputs                            | Outputs                             | Auth         |
| ----------------------------------------------------------------- | ------------------------------------ | --------------------------------- | ----------------------------------- | ------------ |
| [`create-stripe-payment-intent`](./create-stripe-payment-intent/) | HTTP POST                            | `{ amount, currency, bookingId }` | `{ clientSecret, paymentIntentId }` | JWT required |
| [`notify-match`](./notify-match/)                                 | Database webhook (`matches` INSERT)  | Record de `matches`               | `void` (envia push)                 | service_role |
| [`notify-squad-msg`](./notify-squad-msg/)                         | Database webhook (`messages` INSERT) | Record de `messages`              | `void` (envia push)                 | service_role |

## Tabla resumen rapida

| Funcion                        | Tamano | Lenguaje          | Ultima modificacion |
| ------------------------------ | ------ | ----------------- | ------------------- |
| `create-stripe-payment-intent` | 4.2KB  | TypeScript / Deno | 2026-05-27          |
| `notify-match`                 | 2.1KB  | TypeScript / Deno | 2026-05-27          |
| `notify-squad-msg`             | 1.8KB  | TypeScript / Deno | 2026-05-27          |

## Como deployar

```bash
# Una funcion
supabase functions deploy create-stripe-payment-intent

# Todas
supabase functions deploy
```

## Configuracion requerida

Las Edge Functions esperan estas variables de entorno (configuradas en el dashboard de Supabase):

| Variable                    | Descripcion                     | Usada por                      |
| --------------------------- | ------------------------------- | ------------------------------ |
| `STRIPE_SECRET_KEY`         | API key de Stripe (test o live) | `create-stripe-payment-intent` |
| `SUPABASE_URL`              | URL del proyecto Supabase       | todas                          |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin)        | todas (para bypassar RLS)      |

## Invocar desde el cliente

### create-stripe-payment-intent

```typescript
import { supabase } from "@/shared/api/supabase";

const { data, error } = await supabase.functions.invoke("create-stripe-payment-intent", {
  body: {
    amount: 5000, // centavos
    currency: "pen",
    bookingId: "uuid-aqui",
  },
});

if (data?.clientSecret) {
  // Inicializar Stripe Elements con data.clientSecret
}
```

### notify-match / notify-squad-msg (auto-trigger via webhook)

Estas funciones se ejecutan automáticamente cuando se inserta un row en
`matches` o `messages`. No se invocan manualmente.

El trigger se configura en el dashboard de Supabase:

- Database → Webhooks → Create
- Tabla: `public.matches` (o `public.messages`)
- Events: INSERT
- URL: `https://<project>.supabase.co/functions/v1/notify-match`

## Cron jobs planeados

Los siguientes cron jobs aun NO estan implementados pero se planean:

| Job                     | Schedule         | Proposito                                                               |
| ----------------------- | ---------------- | ----------------------------------------------------------------------- |
| `cleanup-deleted-users` | Diario 03:00 UTC | Purga fisica de profiles con `deleted_at < now() - 30 days` (SCRUM-410) |
| `weekly-challenges`     | Lunes 00:00 UTC  | Crea nuevos challenges semanales (SCRUM-228)                            |
| `inactive-users-alert`  | Diario 09:00 UTC | Detecta usuarios sin actividad > 14 dias y envia email (SCRUM-254)      |
| `clean-temp-uploads`    | Cada 6h          | Borra uploads temporales sin referencia (limpieza general)              |

## Como agregar una nueva Edge Function

```bash
# Crear el directorio
mkdir -p supabase/functions/mi-nueva-funcion

# Crear el index.ts
cat > supabase/functions/mi-nueva-funcion/index.ts <<'EOF'
// supabase/functions/mi-nueva-funcion/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  // Validar JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Logica
  const body = await req.json();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
EOF

# Deployar
supabase functions deploy mi-nueva-funcion
```

## Patrones comunes

Todas las funciones siguen este patron:

1. **Validar auth** (JWT o service_role)
2. **Validar input** (zod o manual)
3. **Logica de negocio** (con cliente supabase admin)
4. **Respuesta** (JSON o void)
5. **Error handling** (try/catch con status code apropiado)

Ver [`AUTH_FLOWS.md`](./AUTH_FLOWS.md) para detalles de autenticacion.
Ver [`CRON_JOBS.md`](./CRON_JOBS.md) para el catalogo de jobs planeados.

## Monitoreo

- **Logs**: Dashboard de Supabase → Edge Functions → Logs
- **Errores 5xx**: Se envian automaticamente a Sentry (configurado en el dashboard)
- **Métricas de invocacion**: `pg_stat_statements` + dashboard custom

## Limitaciones

- Timeout: 150 segundos maximo (aumentable via config)
- Payload: 6 MB maximo (request y response)
- Cold start: ~500ms en plan Pro
- Concurrencia: sin limite pero facturada por tiempo de ejecucion
