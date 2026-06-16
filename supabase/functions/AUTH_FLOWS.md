# Edge Functions — Flujos de Autenticacion

## Modelo de seguridad

Las Edge Functions de SportMatch usan 2 modos de autenticacion:

### 1. JWT de usuario (user-invoked)

Usado cuando la funcion es invocada desde el frontend con la sesion del usuario.
La funcion valida que el JWT sea valido antes de procesar el request.

```typescript
// supabase/functions/create-stripe-payment-intent/index.ts
serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const jwt = authHeader.replace("Bearer ", "");

  // Crear cliente con JWT del usuario
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  );

  // Obtener usuario actual
  const { data: { user }, error } = await supabaseUser.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Logica con RLS aplicado (solo ve sus propios datos)
  // ...
});
```

### 2. Webhook con service_role (system-invoked)

Usado cuando la funcion se activa automaticamente por un trigger de base de datos
(webhook de Supabase). Estas funciones no reciben JWT, sino que se autentican
implicitamente porque Supabase les pasa el service_role_key en el header.

```typescript
// supabase/functions/notify-match/index.ts
serve(async (req: Request) => {
  // Verificar que viene de Supabase (header apikey)
  const apikey = req.headers.get("apikey");
  if (apikey !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    return new Response("Forbidden", { status: 403 });
  }

  // Crear cliente admin (bypassa RLS)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // El body es el record nuevo de la tabla
  const newMatch = await req.json();

  // Logica con permisos admin
  // ...
});
```

## Diagrama de decision

```
¿Quien invoca la funcion?
|
+---> Usuario desde frontend
|     |
|     +---> Usar JWT del usuario (anon key + Bearer)
|     +---> RLS se aplica normalmente
|
+---> Trigger de Supabase (webhook)
      |
      +--> Usar service_role (admin)
      +---> Bypassa RLS
```

## Variables de entorno necesarias

| Funcion | SUPABASE_URL | SUPABASE_ANON_KEY | SUPABASE_SERVICE_ROLE_KEY | Otras |
|---|---|---|---|---|
| `create-stripe-payment-intent` | ✓ | ✓ | opcional | `STRIPE_SECRET_KEY` |
| `notify-match` | ✓ | | ✓ | |
| `notify-squad-msg` | ✓ | | ✓ | |

## Troubleshooting

### Error 401 en funcion invocada desde frontend

1. Verificar que el JWT no este expirado (Supabase Auth los renueva auto)
2. Verificar que el header Authorization se envia correctamente
3. Verificar que la funcion se desplego con la version correcta

### Error 403 en webhook

1. Verificar que el webhook tenga la URL correcta
2. Verificar que el header apikey se envie (Supabase lo hace auto)
3. Verificar que la variable SUPABASE_SERVICE_ROLE_KEY este configurada

## Anti-patrones

❌ **NO** hardcodear secrets en el codigo (usar `Deno.env.get`)
❌ **NO** confiar en el body sin validar (siempre validar inputs)
❌ **NO** exponer informacion sensible en los logs
❌ **NO** usar el cliente admin para queries de usuario (rompe RLS)
❌ **NO** hacer fetches a APIs externas sin timeout

## Referencias

- [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy runtime](https://deno.com/deploy)
- [Auth pattern guide](https://supabase.com/docs/guides/functions/auth)
