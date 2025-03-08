/*
  # Add Slug Column to Organizations Table

  1. Changes
    - Add `slug` column to organizations table
      - Type: text
      - Not null
      - Unique constraint
    - Add index on slug column for performance

  2. Purpose
    - Enable friendly URLs for organizations
    - Ensure unique organization identifiers
    - Optimize lookups by slug
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.organizations 
      ADD COLUMN slug text NOT NULL;

    ALTER TABLE public.organizations 
      ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);

    CREATE INDEX idx_organizations_slug 
      ON public.organizations(slug);
  END IF;
END $$;