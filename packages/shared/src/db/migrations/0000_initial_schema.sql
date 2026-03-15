CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(255) NOT NULL UNIQUE,
  "hashed_password" varchar(255) NOT NULL,
  "subscription_tier" varchar(20) NOT NULL DEFAULT 'free',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "broker_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "broker_type" varchar(20) NOT NULL DEFAULT 'KIS',
  "encrypted_api_key" text NOT NULL,
  "encrypted_api_secret" text NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "last_verified_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "broker_connections_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "strategies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "strategy_type" varchar(50) NOT NULL,
  "parameters" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "is_active" boolean NOT NULL DEFAULT false,
  "mode" varchar(10) NOT NULL DEFAULT 'paper',
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "strategies_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "trades" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "strategy_id" uuid,
  "symbol" varchar(20) NOT NULL,
  "side" varchar(10) NOT NULL,
  "quantity" integer NOT NULL,
  "price" numeric(15, 2) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "is_paper" boolean NOT NULL DEFAULT true,
  "executed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "trades_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "trades_strategy_id_strategies_id_fk"
    FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id")
);

CREATE TABLE IF NOT EXISTS "trade_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "trade_id" uuid,
  "event_type" varchar(50) NOT NULL,
  "details" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "trade_logs_trade_id_trades_id_fk"
    FOREIGN KEY ("trade_id") REFERENCES "trades"("id")
);
