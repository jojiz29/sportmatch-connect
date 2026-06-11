-- Endurece quién puede resolver cada transición del desafío.
-- Esta migración complementa player_challenges porque la política inicial
-- permitía actualizar a cualquiera de los dos participantes.

drop policy if exists "challenge_participants_update" on public.player_challenges;

drop policy if exists "challenge_challenger_cancel" on public.player_challenges;
create policy "challenge_challenger_cancel"
on public.player_challenges for update
to authenticated
using (auth.uid() = challenger_id and status = 'pending')
with check (auth.uid() = challenger_id and status = 'cancelled');

drop policy if exists "challenge_receiver_resolve" on public.player_challenges;
create policy "challenge_receiver_resolve"
on public.player_challenges for update
to authenticated
using (auth.uid() = challenged_id and status = 'pending')
with check (auth.uid() = challenged_id and status in ('accepted', 'rejected'));
