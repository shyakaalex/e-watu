CREATE TABLE "talent_pools" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "talent_pools_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "talent_pool_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "tags" TEXT[],
    "source" TEXT,
    "notes" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "talent_pool_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "talent_pool_profiles_pool_id_candidate_id_key" ON "talent_pool_profiles"("pool_id", "candidate_id");
CREATE INDEX "talent_pools_tenant_id_idx" ON "talent_pools"("tenant_id");
CREATE INDEX "talent_pool_profiles_tenant_id_idx" ON "talent_pool_profiles"("tenant_id");
CREATE INDEX "saved_searches_tenant_id_idx" ON "saved_searches"("tenant_id");

ALTER TABLE "talent_pool_profiles" ADD CONSTRAINT "talent_pool_profiles_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "talent_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
