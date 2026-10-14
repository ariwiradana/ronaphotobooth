import {
  pgTable, pgEnum, serial, text, integer, timestamp, date, boolean, varchar, jsonb
} from "drizzle-orm/pg-core";

export const bookingStatus = pgEnum("booking_status", [
  "inquiry", "quoted", "confirmed", "completed", "cancelled"
]);
export const paymentStatus = pgEnum("payment_status", [
  "unpaid", "partial", "paid", "refunded"
]);
export const partnerPaymentType = pgEnum("partner_payment_type", [
  "asset_purchase", "operational_expense", "capital_contribution", "partner_loan"
]);
export const reimbursementStatus = pgEnum("reimbursement_status", [
  "pending", "approved", "partially_paid", "paid", "rejected"
]);
export const transactionDirection = pgEnum("transaction_direction", ["in", "out"]);
export const paymentMethod = pgEnum("payment_method", [
  "cash", "bank_transfer", "e_wallet", "other"
]);

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  priceIdr: integer("price_idr").notNull(),
  active: boolean("active").notNull().default(true),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  referenceCode: varchar("reference_code", { length: 30 }).notNull().unique(),
  clientName: varchar("client_name", { length: 160 }).notNull(),
  clientPhone: varchar("client_phone", { length: 40 }),
  clientEmail: varchar("client_email", { length: 255 }),
  eventName: varchar("event_name", { length: 180 }),
  eventDate: date("event_date").notNull(),
  startTime: varchar("start_time", { length: 10 }),
  endTime: varchar("end_time", { length: 10 }),
  venue: text("venue"),
  packageId: integer("package_id").references(() => packages.id),
  packageNameSnapshot: varchar("package_name_snapshot", { length: 120 }).notNull(),
  totalIdr: integer("total_idr").notNull(),
  discountIdr: integer("discount_idr").notNull().default(0),
  status: bookingStatus("status").notNull().default("inquiry"),
  paymentStatus: paymentStatus("payment_status").notNull().default("unpaid"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookingPayments = pgTable("booking_payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  amountIdr: integer("amount_idr").notNull(),
  method: paymentMethod("method").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  reference: varchar("reference", { length: 120 }),
  notes: text("notes"),
});

export const cashAccounts = pgTable("cash_accounts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  openingBalanceIdr: integer("opening_balance_idr").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const cashTransactions = pgTable("cash_transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => cashAccounts.id),
  direction: transactionDirection("direction").notNull(),
  amountIdr: integer("amount_idr").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  transactionDate: date("transaction_date").notNull(),
  method: paymentMethod("method").notNull(),
  bookingPaymentId: integer("booking_payment_id").references(() => bookingPayments.id),
  reimbursementId: integer("reimbursement_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  assetCode: varchar("asset_code", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  purchaseDate: date("purchase_date").notNull(),
  purchasePriceIdr: integer("purchase_price_idr").notNull(),
  condition: varchar("condition", { length: 60 }).notNull().default("good"),
  location: varchar("location", { length: 180 }),
  serialNumber: varchar("serial_number", { length: 120 }),
  paidByPartnerId: integer("paid_by_partner_id").references(() => partners.id),
  reimbursementId: integer("reimbursement_id"),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  amountIdr: integer("amount_idr").notNull(),
  paidFromAccountId: integer("paid_from_account_id").references(() => cashAccounts.id),
  paidByPartnerId: integer("paid_by_partner_id").references(() => partners.id),
  reimbursementRequired: boolean("reimbursement_required").notNull().default(false),
  reimbursementId: integer("reimbursement_id"),
  assetId: integer("asset_id").references(() => assets.id),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reimbursements = pgTable("reimbursements", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull().references(() => partners.id),
  expenseId: integer("expense_id").references(() => expenses.id),
  assetId: integer("asset_id").references(() => assets.id),
  description: text("description").notNull(),
  requestedIdr: integer("requested_idr").notNull(),
  paidIdr: integer("paid_idr").notNull().default(0),
  status: reimbursementStatus("status").notNull().default("pending"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  notes: text("notes"),
});

export const otherIncome = pgTable("other_income", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  amountIdr: integer("amount_idr").notNull(),
  receivedIntoAccountId: integer("received_into_account_id").references(() => cashAccounts.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


// Each partner has an individual login. Both accounts intentionally share the same role.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 40 }).notNull().default("partner"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


// Shared workspace payload stored in PostgreSQL so both partner accounts use the same data.
export const workspaceState = pgTable("workspace_state", {
  id: integer("id").primaryKey().default(1),
  payload: jsonb("payload").notNull(),
  updatedByUserId: integer("updated_by_user_id").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
