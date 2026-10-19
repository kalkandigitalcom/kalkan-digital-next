import { relations, sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*                                   Enums                                    */
/* -------------------------------------------------------------------------- */

export const adminRole = pgEnum("admin_role", ["owner", "admin"]);

export const customerType = pgEnum("customer_type", [
  "company",
  "individual",
  "villa_owner",
  "hotel",
  "agency",
  "other",
]);
export const customerStatus = pgEnum("customer_status", ["lead", "active", "passive"]);
export const acquisitionSource = pgEnum("acquisition_source", [
  "referral",
  "website",
  "social_media",
  "google",
  "direct",
  "existing_network",
  "other",
]);
export const noteKind = pgEnum("note_kind", ["call", "meeting", "email", "whatsapp", "note"]);

export const serviceType = pgEnum("service_type", [
  "web_design",
  "software",
  "villa_rental_software",
  "hotel_tourism_web",
  "hosting_support",
  "digital_ads",
  "social_media",
  "photo_video",
  "other",
]);

export const projectStatus = pgEnum("project_status", [
  "proposal",
  "planned",
  "in_progress",
  "waiting_client",
  "completed",
  "cancelled",
]);

export const currency = pgEnum("currency", ["TRY", "EUR", "USD", "GBP"]);
export const transactionType = pgEnum("transaction_type", ["income", "expense"]);
/** completed = tahsil edildi / ödendi, pending = bekliyor, cancelled = iptal */
export const transactionStatus = pgEnum("transaction_status", ["completed", "pending", "cancelled"]);
export const paymentMethod = pgEnum("payment_method", [
  "bank_transfer",
  "cash",
  "credit_card",
  "pos",
  "paypal",
  "wise",
  "other",
]);

export const recurringPeriod = pgEnum("recurring_period", ["monthly", "quarterly", "semiannual", "yearly"]);
export const recurringStatus = pgEnum("recurring_status", ["active", "paused", "cancelled"]);

export const quoteStatus = pgEnum("quote_status", [
  "new",
  "contacted",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
]);
export const quoteSource = pgEnum("quote_source", ["manual", "website_form"]);

export const taskPriority = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);
export const taskStatus = pgEnum("task_status", ["todo", "in_progress", "done", "cancelled"]);

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const money = (name: string) => numeric(name, { precision: 14, scale: 2 });
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* -------------------------------------------------------------------------- */
/*                               Auth & system                                */
/* -------------------------------------------------------------------------- */

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: adminRole("role").notNull().default("admin"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("admin_users_email_lower_uq").on(sql`lower(${t.email})`)],
);

/** Session id is the SHA-256 hash of the random token stored in the cookie. */
export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: varchar("user_agent", { length: 400 }),
    createdAt: createdAt(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)],
);

/** Generic fixed-window rate limit log (login attempts, public contact form). */
export const rateLimitEvents = pgTable(
  "rate_limit_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    bucket: varchar("bucket", { length: 40 }).notNull(),
    key: varchar("key", { length: 255 }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("rate_limit_lookup_idx").on(t.bucket, t.key, t.createdAt)],
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id").references(() => adminUsers.id, { onDelete: "set null" }),
    action: varchar("action", { length: 60 }).notNull(),
    entityType: varchar("entity_type", { length: 40 }),
    entityId: varchar("entity_id", { length: 64 }),
    summary: text("summary"),
    details: jsonb("details"),
    ipAddress: varchar("ip_address", { length: 64 }),
    createdAt: createdAt(),
  },
  (t) => [
    index("activity_entity_idx").on(t.entityType, t.entityId),
    index("activity_created_idx").on(t.createdAt),
  ],
);

export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: updatedAt(),
});

/* -------------------------------------------------------------------------- */
/*                                 Customers                                  */
/* -------------------------------------------------------------------------- */

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyName: varchar("company_name", { length: 200 }).notNull(),
    contactName: varchar("contact_name", { length: 150 }),
    phone: varchar("phone", { length: 40 }),
    email: varchar("email", { length: 255 }),
    whatsapp: varchar("whatsapp", { length: 40 }),
    website: varchar("website", { length: 255 }),
    address: text("address"),
    customerType: customerType("customer_type").notNull().default("company"),
    status: customerStatus("status").notNull().default("lead"),
    source: acquisitionSource("source"),
    firstContactDate: date("first_contact_date", { mode: "string" }),
    notes: text("notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("customers_status_idx").on(t.status),
    index("customers_archived_idx").on(t.archivedAt),
    index("customers_company_lower_idx").on(sql`lower(${t.companyName})`),
    index("customers_email_lower_idx").on(sql`lower(${t.email})`),
    index("customers_created_idx").on(t.createdAt),
  ],
);

export const customerNotes = pgTable(
  "customer_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    kind: noteKind("kind").notNull().default("note"),
    content: text("content").notNull(),
    contactDate: date("contact_date", { mode: "string" }).notNull(),
    nextFollowUpDate: date("next_follow_up_date", { mode: "string" }),
    createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("customer_notes_customer_idx").on(t.customerId, t.contactDate)],
);

/* -------------------------------------------------------------------------- */
/*                                  Projects                                  */
/* -------------------------------------------------------------------------- */

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 200 }).notNull(),
    projectType: serviceType("project_type").notNull().default("web_design"),
    description: text("description"),
    startDate: date("start_date", { mode: "string" }),
    targetDate: date("target_date", { mode: "string" }),
    deliveredDate: date("delivered_date", { mode: "string" }),
    currency: currency("currency").notNull().default("TRY"),
    quotedAmount: money("quoted_amount"),
    agreedAmount: money("agreed_amount"),
    /** Planned / estimated cost. Actual costs come from linked expense transactions. */
    estimatedCost: money("estimated_cost"),
    status: projectStatus("status").notNull().default("planned"),
    projectUrl: varchar("project_url", { length: 255 }),
    internalNotes: text("internal_notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("projects_customer_idx").on(t.customerId),
    index("projects_status_idx").on(t.status),
    index("projects_archived_idx").on(t.archivedAt),
    check("projects_amounts_non_negative", sql`coalesce(${t.quotedAmount},0) >= 0 AND coalesce(${t.agreedAmount},0) >= 0 AND coalesce(${t.estimatedCost},0) >= 0`),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                  Finance                                   */
/* -------------------------------------------------------------------------- */

export const financialCategories = pgTable(
  "financial_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: transactionType("type").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("financial_categories_type_name_uq").on(t.type, sql`lower(${t.name})`)],
);

export const financialTransactions = pgTable(
  "financial_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: transactionType("type").notNull(),
    description: varchar("description", { length: 300 }).notNull(),
    amount: money("amount").notNull(),
    currency: currency("currency").notNull(),
    /** 1 unit of `currency` expressed in the base currency at transaction time. */
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 6 }),
    exchangeRateSource: varchar("exchange_rate_source", { length: 120 }),
    /** Snapshot of the base currency used when baseAmount was calculated. */
    baseCurrency: currency("base_currency").notNull(),
    /** amount × exchangeRate, rounded to 2 decimals. NULL when the rate is unknown. */
    baseAmount: money("base_amount"),
    /** Document / invoice / accrual date. */
    transactionDate: date("transaction_date", { mode: "string" }).notNull(),
    /** Expected payment date for pending items. */
    dueDate: date("due_date", { mode: "string" }),
    /** Actual cash date. Required when status = completed. Cash reports use this date. */
    settledDate: date("settled_date", { mode: "string" }),
    status: transactionStatus("status").notNull().default("completed"),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "restrict" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => financialCategories.id, { onDelete: "restrict" }),
    paymentMethod: paymentMethod("payment_method"),
    documentNo: varchar("document_no", { length: 80 }),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("ft_type_status_settled_idx").on(t.type, t.status, t.settledDate),
    index("ft_type_status_date_idx").on(t.type, t.status, t.transactionDate),
    index("ft_customer_idx").on(t.customerId),
    index("ft_project_idx").on(t.projectId),
    index("ft_category_idx").on(t.categoryId),
    check("ft_amount_positive", sql`${t.amount} > 0`),
    check("ft_rate_positive", sql`${t.exchangeRate} IS NULL OR ${t.exchangeRate} > 0`),
    check("ft_completed_has_settled_date", sql`${t.status} <> 'completed' OR ${t.settledDate} IS NOT NULL`),
    check(
      "ft_base_rate_consistency",
      sql`(${t.currency} = ${t.baseCurrency} AND ${t.baseAmount} = ${t.amount}) OR (${t.currency} <> ${t.baseCurrency} AND ((${t.exchangeRate} IS NULL AND ${t.baseAmount} IS NULL) OR (${t.exchangeRate} IS NOT NULL AND ${t.baseAmount} IS NOT NULL)))`,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/*                         Recurring services & renewals                       */
/* -------------------------------------------------------------------------- */

export const recurringServices = pgTable(
  "recurring_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => financialCategories.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 200 }).notNull(),
    amount: money("amount").notNull(),
    currency: currency("currency").notNull().default("TRY"),
    period: recurringPeriod("period").notNull().default("yearly"),
    startDate: date("start_date", { mode: "string" }).notNull(),
    nextRenewalDate: date("next_renewal_date", { mode: "string" }).notNull(),
    status: recurringStatus("status").notNull().default("active"),
    autoRenew: boolean("auto_renew").notNull().default(false),
    /** Days after the renewal date the payment is due (son ödeme). */
    paymentTermDays: integer("payment_term_days").notNull().default(0),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("recurring_customer_idx").on(t.customerId),
    index("recurring_next_idx").on(t.status, t.nextRenewalDate),
    check("recurring_amount_positive", sql`${t.amount} > 0`),
    check("recurring_term_range", sql`${t.paymentTermDays} BETWEEN 0 AND 365`),
  ],
);

/** One row per billed period. The unique constraint makes double billing impossible. */
export const recurringOccurrences = pgTable(
  "recurring_occurrences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recurringServiceId: uuid("recurring_service_id")
      .notNull()
      .references(() => recurringServices.id, { onDelete: "restrict" }),
    periodStart: date("period_start", { mode: "string" }).notNull(),
    periodEnd: date("period_end", { mode: "string" }).notNull(),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => financialTransactions.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("recurring_occ_service_period_uq").on(t.recurringServiceId, t.periodStart),
    uniqueIndex("recurring_occ_transaction_uq").on(t.transactionId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                               Quotes / leads                                */
/* -------------------------------------------------------------------------- */

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    companyName: varchar("company_name", { length: 200 }).notNull(),
    contactName: varchar("contact_name", { length: 150 }),
    phone: varchar("phone", { length: 40 }),
    email: varchar("email", { length: 255 }),
    requestedService: serviceType("requested_service"),
    title: varchar("title", { length: 200 }),
    estimatedAmount: money("estimated_amount"),
    currency: currency("currency").notNull().default("TRY"),
    quoteDate: date("quote_date", { mode: "string" }),
    nextFollowUpDate: date("next_follow_up_date", { mode: "string" }),
    status: quoteStatus("status").notNull().default("new"),
    source: quoteSource("source").notNull().default("manual"),
    lostReason: text("lost_reason"),
    message: text("message"),
    notes: text("notes"),
    convertedProjectId: uuid("converted_project_id").references(() => projects.id, { onDelete: "set null" }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("quotes_status_idx").on(t.status),
    index("quotes_follow_up_idx").on(t.nextFollowUpDate),
    index("quotes_customer_idx").on(t.customerId),
  ],
);

export const quoteItems = pgTable(
  "quote_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    description: varchar("description", { length: 300 }).notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
    unitPrice: money("unit_price").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index("quote_items_quote_idx").on(t.quoteId),
    check("quote_items_qty_positive", sql`${t.quantity} > 0`),
    check("quote_items_price_non_negative", sql`${t.unitPrice} >= 0`),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                   Tasks                                    */
/* -------------------------------------------------------------------------- */

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    remindAt: timestamp("remind_at", { withTimezone: true }),
    priority: taskPriority("priority").notNull().default("medium"),
    status: taskStatus("status").notNull().default("todo"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("tasks_status_due_idx").on(t.status, t.dueAt),
    index("tasks_customer_idx").on(t.customerId),
    index("tasks_project_idx").on(t.projectId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                       Public portfolio (showcase items)                     */
/* -------------------------------------------------------------------------- */

export const portfolioItems = pgTable(
  "portfolio_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    clientName: varchar("client_name", { length: 200 }),
    category: serviceType("category").notNull().default("web_design"),
    summary: varchar("summary", { length: 400 }),
    description: text("description"),
    imagePath: varchar("image_path", { length: 400 }),
    liveUrl: varchar("live_url", { length: 255 }),
    year: integer("year"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    isPublished: boolean("is_published").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("portfolio_slug_uq").on(t.slug),
    index("portfolio_published_idx").on(t.isPublished, t.sortOrder),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                 Relations                                  */
/* -------------------------------------------------------------------------- */

export const customersRelations = relations(customers, ({ many }) => ({
  projects: many(projects),
  transactions: many(financialTransactions),
  notes: many(customerNotes),
  recurringServices: many(recurringServices),
  quotes: many(quotes),
  tasks: many(tasks),
}));

export const customerNotesRelations = relations(customerNotes, ({ one }) => ({
  customer: one(customers, { fields: [customerNotes.customerId], references: [customers.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  customer: one(customers, { fields: [projects.customerId], references: [customers.id] }),
  transactions: many(financialTransactions),
  tasks: many(tasks),
}));

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  customer: one(customers, { fields: [financialTransactions.customerId], references: [customers.id] }),
  project: one(projects, { fields: [financialTransactions.projectId], references: [projects.id] }),
  category: one(financialCategories, {
    fields: [financialTransactions.categoryId],
    references: [financialCategories.id],
  }),
}));

export const recurringServicesRelations = relations(recurringServices, ({ one, many }) => ({
  customer: one(customers, { fields: [recurringServices.customerId], references: [customers.id] }),
  project: one(projects, { fields: [recurringServices.projectId], references: [projects.id] }),
  category: one(financialCategories, {
    fields: [recurringServices.categoryId],
    references: [financialCategories.id],
  }),
  occurrences: many(recurringOccurrences),
}));

export const recurringOccurrencesRelations = relations(recurringOccurrences, ({ one }) => ({
  service: one(recurringServices, {
    fields: [recurringOccurrences.recurringServiceId],
    references: [recurringServices.id],
  }),
  transaction: one(financialTransactions, {
    fields: [recurringOccurrences.transactionId],
    references: [financialTransactions.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  customer: one(customers, { fields: [quotes.customerId], references: [customers.id] }),
  items: many(quoteItems),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, { fields: [quoteItems.quoteId], references: [quotes.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  customer: one(customers, { fields: [tasks.customerId], references: [customers.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
}));

export type Currency = (typeof currency.enumValues)[number];
export type TransactionType = (typeof transactionType.enumValues)[number];
export type TransactionStatus = (typeof transactionStatus.enumValues)[number];
export type RecurringPeriod = (typeof recurringPeriod.enumValues)[number];
