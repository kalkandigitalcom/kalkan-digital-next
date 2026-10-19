CREATE TYPE "public"."acquisition_source" AS ENUM('referral', 'website', 'social_media', 'google', 'direct', 'existing_network', 'other');--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('owner', 'admin');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('TRY', 'EUR', 'USD', 'GBP');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('lead', 'active', 'passive');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('company', 'individual', 'villa_owner', 'hotel', 'agency', 'other');--> statement-breakpoint
CREATE TYPE "public"."note_kind" AS ENUM('call', 'meeting', 'email', 'whatsapp', 'note');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank_transfer', 'cash', 'credit_card', 'pos', 'paypal', 'wise', 'other');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('proposal', 'planned', 'in_progress', 'waiting_client', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."quote_source" AS ENUM('manual', 'website_form');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('new', 'contacted', 'proposal_sent', 'negotiation', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."recurring_period" AS ENUM('monthly', 'quarterly', 'semiannual', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."recurring_status" AS ENUM('active', 'paused', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('web_design', 'software', 'villa_rental_software', 'hotel_tourism_web', 'hosting_support', 'digital_ads', 'social_media', 'photo_video', 'other');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('completed', 'pending', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"action" varchar(60) NOT NULL,
	"entity_type" varchar(40),
	"entity_id" varchar(64),
	"summary" text,
	"details" jsonb,
	"ip_address" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(120) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "admin_role" DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"password_changed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"kind" "note_kind" DEFAULT 'note' NOT NULL,
	"content" text NOT NULL,
	"contact_date" date NOT NULL,
	"next_follow_up_date" date,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"contact_name" varchar(150),
	"phone" varchar(40),
	"email" varchar(255),
	"whatsapp" varchar(40),
	"website" varchar(255),
	"address" text,
	"customer_type" "customer_type" DEFAULT 'company' NOT NULL,
	"status" "customer_status" DEFAULT 'lead' NOT NULL,
	"source" "acquisition_source",
	"first_contact_date" date,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "transaction_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "transaction_type" NOT NULL,
	"description" varchar(300) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" "currency" NOT NULL,
	"exchange_rate" numeric(18, 6),
	"exchange_rate_source" varchar(120),
	"base_currency" "currency" NOT NULL,
	"base_amount" numeric(14, 2),
	"transaction_date" date NOT NULL,
	"due_date" date,
	"settled_date" date,
	"status" "transaction_status" DEFAULT 'completed' NOT NULL,
	"customer_id" uuid,
	"project_id" uuid,
	"category_id" uuid NOT NULL,
	"payment_method" "payment_method",
	"document_no" varchar(80),
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ft_amount_positive" CHECK ("financial_transactions"."amount" > 0),
	CONSTRAINT "ft_rate_positive" CHECK ("financial_transactions"."exchange_rate" IS NULL OR "financial_transactions"."exchange_rate" > 0),
	CONSTRAINT "ft_completed_has_settled_date" CHECK ("financial_transactions"."status" <> 'completed' OR "financial_transactions"."settled_date" IS NOT NULL),
	CONSTRAINT "ft_base_rate_consistency" CHECK (("financial_transactions"."currency" = "financial_transactions"."base_currency" AND "financial_transactions"."base_amount" = "financial_transactions"."amount") OR ("financial_transactions"."currency" <> "financial_transactions"."base_currency" AND (("financial_transactions"."exchange_rate" IS NULL AND "financial_transactions"."base_amount" IS NULL) OR ("financial_transactions"."exchange_rate" IS NOT NULL AND "financial_transactions"."base_amount" IS NOT NULL))))
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"title" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"client_name" varchar(200),
	"category" "service_type" DEFAULT 'web_design' NOT NULL,
	"summary" varchar(400),
	"description" text,
	"image_path" varchar(400),
	"live_url" varchar(255),
	"year" integer,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"name" varchar(200) NOT NULL,
	"project_type" "service_type" DEFAULT 'web_design' NOT NULL,
	"description" text,
	"start_date" date,
	"target_date" date,
	"delivered_date" date,
	"currency" "currency" DEFAULT 'TRY' NOT NULL,
	"quoted_amount" numeric(14, 2),
	"agreed_amount" numeric(14, 2),
	"estimated_cost" numeric(14, 2),
	"status" "project_status" DEFAULT 'planned' NOT NULL,
	"project_url" varchar(255),
	"internal_notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_amounts_non_negative" CHECK (coalesce("projects"."quoted_amount",0) >= 0 AND coalesce("projects"."agreed_amount",0) >= 0 AND coalesce("projects"."estimated_cost",0) >= 0)
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"description" varchar(300) NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quote_items_qty_positive" CHECK ("quote_items"."quantity" > 0),
	CONSTRAINT "quote_items_price_non_negative" CHECK ("quote_items"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"company_name" varchar(200) NOT NULL,
	"contact_name" varchar(150),
	"phone" varchar(40),
	"email" varchar(255),
	"requested_service" "service_type",
	"title" varchar(200),
	"estimated_amount" numeric(14, 2),
	"currency" "currency" DEFAULT 'TRY' NOT NULL,
	"quote_date" date,
	"next_follow_up_date" date,
	"status" "quote_status" DEFAULT 'new' NOT NULL,
	"source" "quote_source" DEFAULT 'manual' NOT NULL,
	"lost_reason" text,
	"message" text,
	"notes" text,
	"converted_project_id" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"bucket" varchar(40) NOT NULL,
	"key" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recurring_service_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"transaction_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"project_id" uuid,
	"category_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" "currency" DEFAULT 'TRY' NOT NULL,
	"period" "recurring_period" DEFAULT 'yearly' NOT NULL,
	"start_date" date NOT NULL,
	"next_renewal_date" date NOT NULL,
	"status" "recurring_status" DEFAULT 'active' NOT NULL,
	"auto_renew" boolean DEFAULT false NOT NULL,
	"payment_term_days" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_amount_positive" CHECK ("recurring_services"."amount" > 0),
	CONSTRAINT "recurring_term_range" CHECK ("recurring_services"."payment_term_days" BETWEEN 0 AND 365)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" varchar(64),
	"user_agent" varchar(400),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"customer_id" uuid,
	"project_id" uuid,
	"due_at" timestamp with time zone,
	"remind_at" timestamp with time zone,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_category_id_financial_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."financial_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_converted_project_id_projects_id_fk" FOREIGN KEY ("converted_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_occurrences" ADD CONSTRAINT "recurring_occurrences_recurring_service_id_recurring_services_id_fk" FOREIGN KEY ("recurring_service_id") REFERENCES "public"."recurring_services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_occurrences" ADD CONSTRAINT "recurring_occurrences_transaction_id_financial_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."financial_transactions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_services" ADD CONSTRAINT "recurring_services_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_services" ADD CONSTRAINT "recurring_services_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_services" ADD CONSTRAINT "recurring_services_category_id_financial_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."financial_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_entity_idx" ON "activity_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "activity_created_idx" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_lower_uq" ON "admin_users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "customer_notes_customer_idx" ON "customer_notes" USING btree ("customer_id","contact_date");--> statement-breakpoint
CREATE INDEX "customers_status_idx" ON "customers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "customers_archived_idx" ON "customers" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "customers_company_lower_idx" ON "customers" USING btree (lower("company_name"));--> statement-breakpoint
CREATE INDEX "customers_email_lower_idx" ON "customers" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "customers_created_idx" ON "customers" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "financial_categories_type_name_uq" ON "financial_categories" USING btree ("type",lower("name"));--> statement-breakpoint
CREATE INDEX "ft_type_status_settled_idx" ON "financial_transactions" USING btree ("type","status","settled_date");--> statement-breakpoint
CREATE INDEX "ft_type_status_date_idx" ON "financial_transactions" USING btree ("type","status","transaction_date");--> statement-breakpoint
CREATE INDEX "ft_customer_idx" ON "financial_transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "ft_project_idx" ON "financial_transactions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "ft_category_idx" ON "financial_transactions" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_slug_uq" ON "portfolio_items" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "portfolio_published_idx" ON "portfolio_items" USING btree ("is_published","sort_order");--> statement-breakpoint
CREATE INDEX "projects_customer_idx" ON "projects" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_archived_idx" ON "projects" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "quote_items_quote_idx" ON "quote_items" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "quotes_status_idx" ON "quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quotes_follow_up_idx" ON "quotes" USING btree ("next_follow_up_date");--> statement-breakpoint
CREATE INDEX "quotes_customer_idx" ON "quotes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "rate_limit_lookup_idx" ON "rate_limit_events" USING btree ("bucket","key","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_occ_service_period_uq" ON "recurring_occurrences" USING btree ("recurring_service_id","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_occ_transaction_uq" ON "recurring_occurrences" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "recurring_customer_idx" ON "recurring_services" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "recurring_next_idx" ON "recurring_services" USING btree ("status","next_renewal_date");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "tasks_status_due_idx" ON "tasks" USING btree ("status","due_at");--> statement-breakpoint
CREATE INDEX "tasks_customer_idx" ON "tasks" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "tasks_project_idx" ON "tasks" USING btree ("project_id");