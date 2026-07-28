-- =============================================================================
-- seed.sql — initial lookup data
-- =============================================================================
-- Categories and units seeded once. Idempotent: safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
insert into public.categories (code, name, sort_order) values
  ('limpieza', 'Limpieza', 1),
  ('refacciones', 'Refacciones', 2)
on conflict (code) do update
  set name = excluded.name,
      sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Units of measure
-- ---------------------------------------------------------------------------
insert into public.units (code, name) values
  ('PZA', 'Pieza'),
  ('L', 'Litro'),
  ('ML', 'Mililitro'),
  ('KG', 'Kilogramo'),
  ('G', 'Gramo'),
  ('M', 'Metro'),
  ('CM', 'Centímetro'),
  ('PAR', 'Par'),
  ('JGO', 'Juego'),
  ('CAJA', 'Caja'),
  ('PAQ', 'Paquete')
on conflict (code) do update
  set name = excluded.name;
