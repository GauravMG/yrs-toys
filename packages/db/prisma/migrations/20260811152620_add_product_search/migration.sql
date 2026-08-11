-- Prisma's `Unsupported("tsvector")` type only creates a plain nullable
-- column in the initial migration (see 20260811152506_init). This migration
-- replaces it with a real generated, indexed full-text-search column.
-- Prisma cannot express STORED generated columns natively, so this is
-- hand-written raw SQL.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "Product" DROP COLUMN "searchVector";

ALTER TABLE "Product" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("shortDescription", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("description", '')), 'C')
  ) STORED;

CREATE INDEX product_search_idx ON "Product" USING GIN ("searchVector");
CREATE INDEX product_name_trgm_idx ON "Product" USING GIN ("name" gin_trgm_ops);
