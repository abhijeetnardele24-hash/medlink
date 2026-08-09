ALTER TABLE "messages" ADD COLUMN "idempotency_key" varchar(255);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "messages_updated_at_idx" ON "messages" USING btree ("updated_at");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_idempotency_key_unique" UNIQUE("idempotency_key");