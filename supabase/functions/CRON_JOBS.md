# Edge Functions — Cron Jobs planeados

SportMatch Connect tiene 3 cron jobs planeados para mantener la plataforma
sana. Todos se ejecutan como Supabase Edge Functions invocadas por
`pg_cron` (o el dashboard de Supabase Schedules).

## 1. cleanup-deleted-users (SCRUM-410)

- **Frecuencia**: Diaria, 03:00 UTC
- **Proposito**: Purga fisica de profiles con `deleted_at < now() - 30 days`
- **Estado**: Pendiente (SCRUM-410 ya implemento la funcion SQL `cleanup_old_deleted_users()`)
- **Plan**: Crear la Edge Function que llama a `cleanup_old_deleted_users(30)`

```typescript
// supabase/functions/cleanup-deleted-users/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase.rpc("cleanup_old_deleted_users", {
    p_max_age_days: 30,
  });

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ ok: true, purged: data?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

Configuracion del cron en Supabase Dashboard:

```sql
-- En SQL editor (requiere extension pg_cron)
SELECT cron.schedule(
  'cleanup-deleted-users',
  '0 3 * * *',  -- 03:00 UTC diario
  $$
  SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/cleanup-deleted-users',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    )
  );
  $$
);
```

## 2. weekly-challenges (SCRUM-228)

- **Frecuencia**: Semanal, lunes 00:00 UTC
- **Proposito**: Crear nuevos challenges semanales para usuarios
- **Estado**: Pendiente (SCRUM-228)

```typescript
// supabase/functions/weekly-challenges/index.ts
serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  // Challenges de la semana
  const challenges = [
    { type: "play_matches", target: 3, reward_xp: 200, reward_fc: 50 },
    { type: "win_matches", target: 2, reward_xp: 300, reward_fc: 100 },
    { type: "invite_friends", target: 1, reward_xp: 100, reward_fc: 30 },
  ];

  const { data, error } = await supabase.from("weekly_challenges").insert(
    challenges.map((c) => ({
      ...c,
      starts_at: weekStart.toISOString(),
      ends_at: weekEnd.toISOString(),
    })),
  );

  return new Response(JSON.stringify({ ok: !error, count: data?.length ?? 0 }));
});
```

## 3. inactive-users-alert (SCRUM-254)

- **Frecuencia**: Diaria, 09:00 UTC
- **Proposito**: Detecta usuarios sin actividad > 14 dias y envia email con FitCoins bonus
- **Estado**: Pendiente (SCRUM-254)

```typescript
// supabase/functions/inactive-users-alert/index.ts
serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Usuarios inactivos
  const { data: users, error } = await supabase.rpc("get_inactive_users", {
    p_days_threshold: 14,
  });

  if (error || !users) {
    return new Response(JSON.stringify({ ok: false, error: error?.message }), {
      status: 500,
    });
  }

  // Enviar email a cada uno (via Resend)
  for (const user of users) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "SportMatch <no-reply@sportmatch.app>",
        to: user.email,
        subject: "Te extranamos en SportMatch",
        html: `<h1>Hola ${user.name}!</h1>
<p>Llevas 14 dias sin jugar. Te regalamos 50 FitCoins para que vuelvas.</p>
<a href="https://sportmatch.app">Volver a SportMatch</a>`,
      }),
    });
  }

  return new Response(JSON.stringify({ ok: true, sent: users.length }));
});
```

## Configuracion de cron jobs

Todos los cron jobs usan la extension `pg_cron` (incluida en Supabase Pro).
Se configuran desde el SQL editor del dashboard:

```sql
-- Activar extension (solo una vez)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Listar cron jobs
SELECT * FROM cron.job;

-- Eliminar un cron job
SELECT cron.unschedule('nombre-job');
```

## Monitoreo

- **Dashboard**: Supabase → Database → Cron Jobs
- **Logs**: Edge Functions → Logs (filtrar por nombre de funcion)
- **Errores**: Se envian a Sentry automaticamente

## Costes

- Cada ejecucion de Edge Function: ~100-500ms
- Cron job diario: ~30 ejecuciones/mes = ~15 segundos/mes de compute
- Plan Pro incluye 500K invocaciones/mes, muy por encima del uso planeado
