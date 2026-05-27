-- Supabase Row Level Security (RLS) Policies para SportMatch Connect

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 1. USERS
-- Los perfiles son públicos (para poder ver avatares en matchmaking y mapa)
CREATE POLICY "Profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
-- Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. MATCHES
-- Los partidos son públicos
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
-- Solo los usuarios logueados pueden crear partidos
CREATE POLICY "Authenticated users can create matches" ON public.matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Solo los dueños (o participantes en el futuro) pueden editar/borrar
CREATE POLICY "Owners can update their matches" ON public.matches FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Owners can delete their matches" ON public.matches FOR DELETE USING (auth.uid() = creator_id);

-- 3. COURTS
-- Las canchas son públicas pero solo las puede editar el admin
CREATE POLICY "Courts are viewable by everyone" ON public.courts FOR SELECT USING (true);
-- (Opcional) Restringir INSERT/UPDATE/DELETE a rol admin
-- CREATE POLICY "Admins can modify courts" ON public.courts FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 4. TRANSACTIONS (FitCoins)
-- ALTA SEGURIDAD: Los usuarios SOLO pueden ver sus propias transacciones
CREATE POLICY "Users can only see their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
-- IMPORTANTE: Bloquear INSERT desde el cliente para evitar fraude. 
-- Los INSERTS deberían hacerse SÓLO a través de Supabase Edge Functions con Service Role.
-- Si queremos permitir inserts directos para la PoC:
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
