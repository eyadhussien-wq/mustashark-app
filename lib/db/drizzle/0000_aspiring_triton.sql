CREATE TYPE "public"."account_status" AS ENUM('pending', 'active', 'suspended', 'terminated', 'rejected', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."auth_provider" AS ENUM('local', 'google', 'facebook', 'apple');--> statement-breakpoint
CREATE TYPE "public"."country" AS ENUM('qatar', 'jordan');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('client', 'lawyer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled_by_lawyer', 'cancelled_by_client', 'no_show_lawyer', 'no_show_client', 'disputed', 'refunded_absent');--> statement-breakpoint
CREATE TYPE "public"."booking_type" AS ENUM('video', 'chat', 'phone');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'refunded', 'forfeited', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."due_status" AS ENUM('pending', 'collected', 'waived', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."deletion_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."profile_change_field" AS ENUM('specialization', 'bio', 'hourlyRate');--> statement-breakpoint
CREATE TYPE "public"."profile_change_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."comment_status" AS ENUM('none', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"phone" text,
	"role" "user_role" DEFAULT 'client' NOT NULL,
	"admin_role_id" text,
	"country" "country",
	"auth_provider" "auth_provider" DEFAULT 'local' NOT NULL,
	"provider_id" text,
	"account_status" "account_status" DEFAULT 'active' NOT NULL,
	"status_reason" text,
	"specialization" text,
	"bio" text,
	"hourly_rate" numeric(10, 2),
	"rating" numeric(3, 1),
	"reviews_count" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp,
	"deletion_scheduled_at" timestamp,
	"deletion_rejection_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "office_assistants" (
	"id" text PRIMARY KEY NOT NULL,
	"office_id" text NOT NULL,
	"user_id" text NOT NULL,
	"can_manage_bookings" boolean DEFAULT true NOT NULL,
	"can_view_financials" boolean DEFAULT false NOT NULL,
	"can_cancel_bookings" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offices" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"license_number" text,
	"country" text,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"suspension_reason" text,
	"debt_threshold" numeric(10, 2) DEFAULT '500.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"serial_number" text NOT NULL,
	"client_id" text,
	"lawyer_id" text,
	"office_id" text,
	"subject" text NOT NULL,
	"description" text,
	"scheduled_date" text NOT NULL,
	"scheduled_time" text NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"type" "booking_type" NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"google_meet_link" text,
	"google_event_id" text,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"lawyer_joined_at" timestamp,
	"client_joined_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "platform_dues" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"office_id" text,
	"lawyer_id" text,
	"gross_amount" numeric(10, 2) NOT NULL,
	"commission_rate" numeric(5, 4) DEFAULT '0.15' NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"status" "due_status" DEFAULT 'pending' NOT NULL,
	"collected_at" timestamp,
	"collected_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_dues_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "lawyer_deletion_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"lawyer_id" text NOT NULL,
	"status" "deletion_request_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" text,
	"rejection_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lawyer_profile_change_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"lawyer_id" text NOT NULL,
	"field" "profile_change_field" NOT NULL,
	"old_value" text,
	"new_value" text,
	"status" "profile_change_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"rejection_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lawyer_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"consultation_id" text NOT NULL,
	"client_id" text NOT NULL,
	"lawyer_id" text NOT NULL,
	"stars" integer NOT NULL,
	"comment" text,
	"comment_status" "comment_status" DEFAULT 'none' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "admin_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_permissions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "admin_role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_admin_role_id_admin_roles_id_fk" FOREIGN KEY ("admin_role_id") REFERENCES "public"."admin_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_assistants" ADD CONSTRAINT "office_assistants_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_assistants" ADD CONSTRAINT "office_assistants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offices" ADD CONSTRAINT "offices_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_lawyer_id_users_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_dues" ADD CONSTRAINT "platform_dues_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_dues" ADD CONSTRAINT "platform_dues_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_dues" ADD CONSTRAINT "platform_dues_lawyer_id_users_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_dues" ADD CONSTRAINT "platform_dues_collected_by_users_id_fk" FOREIGN KEY ("collected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_deletion_requests" ADD CONSTRAINT "lawyer_deletion_requests_lawyer_id_users_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_deletion_requests" ADD CONSTRAINT "lawyer_deletion_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_profile_change_requests" ADD CONSTRAINT "lawyer_profile_change_requests_lawyer_id_users_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_profile_change_requests" ADD CONSTRAINT "lawyer_profile_change_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_reviews" ADD CONSTRAINT "lawyer_reviews_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_reviews" ADD CONSTRAINT "lawyer_reviews_lawyer_id_users_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_reviews" ADD CONSTRAINT "lawyer_reviews_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_role_id_admin_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_permission_id_admin_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."admin_permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lawyer_reviews_client_consultation_unique" ON "lawyer_reviews" USING btree ("client_id","consultation_id");