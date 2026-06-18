-- Permite mostrar y editar una descripción detallada de cada sede.
alter table public.courts
  add column if not exists description text;
