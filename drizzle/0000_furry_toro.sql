CREATE TABLE "channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "post_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"content" text NOT NULL,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post_replies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_promoted" boolean DEFAULT false NOT NULL,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"display_name" text DEFAULT 'User' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_auth_user_id_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stock_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stock_id" uuid NOT NULL,
	"tag" text NOT NULL,
	CONSTRAINT "stock_tags_stock_id_tag_unique" UNIQUE("stock_id","tag")
);
--> statement-breakpoint
ALTER TABLE "stock_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'inbox' NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"group" text,
	"source_post_ids" text DEFAULT '[]' NOT NULL,
	"source_channel_id" uuid,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_replies" ADD CONSTRAINT "post_replies_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_replies" ADD CONSTRAINT "post_replies_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_tags" ADD CONSTRAINT "stock_tags_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_source_channel_id_channels_id_fk" FOREIGN KEY ("source_channel_id") REFERENCES "public"."channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "channels_select" ON "channels" AS PERMISSIVE FOR SELECT TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "channels"."author_id"));--> statement-breakpoint
CREATE POLICY "channels_insert" ON "channels" AS PERMISSIVE FOR INSERT TO public WITH CHECK (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "channels"."author_id"));--> statement-breakpoint
CREATE POLICY "channels_update" ON "channels" AS PERMISSIVE FOR UPDATE TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "channels"."author_id"));--> statement-breakpoint
CREATE POLICY "channels_delete" ON "channels" AS PERMISSIVE FOR DELETE TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "channels"."author_id"));--> statement-breakpoint
CREATE POLICY "post_replies_select" ON "post_replies" AS PERMISSIVE FOR SELECT TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "post_replies"."author_id"));--> statement-breakpoint
CREATE POLICY "post_replies_insert" ON "post_replies" AS PERMISSIVE FOR INSERT TO public WITH CHECK (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "post_replies"."author_id"));--> statement-breakpoint
CREATE POLICY "post_replies_update" ON "post_replies" AS PERMISSIVE FOR UPDATE TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "post_replies"."author_id"));--> statement-breakpoint
CREATE POLICY "post_replies_delete" ON "post_replies" AS PERMISSIVE FOR DELETE TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "post_replies"."author_id"));--> statement-breakpoint
CREATE POLICY "posts_select" ON "posts" AS PERMISSIVE FOR SELECT TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "posts"."author_id"));--> statement-breakpoint
CREATE POLICY "posts_insert" ON "posts" AS PERMISSIVE FOR INSERT TO public WITH CHECK (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "posts"."author_id"));--> statement-breakpoint
CREATE POLICY "posts_update" ON "posts" AS PERMISSIVE FOR UPDATE TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "posts"."author_id"));--> statement-breakpoint
CREATE POLICY "posts_delete" ON "posts" AS PERMISSIVE FOR DELETE TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "posts"."author_id"));--> statement-breakpoint
CREATE POLICY "profiles_select" ON "profiles" AS PERMISSIVE FOR SELECT TO public USING (auth.uid() = "profiles"."auth_user_id");--> statement-breakpoint
CREATE POLICY "profiles_insert" ON "profiles" AS PERMISSIVE FOR INSERT TO public WITH CHECK (auth.uid() = "profiles"."auth_user_id");--> statement-breakpoint
CREATE POLICY "profiles_update" ON "profiles" AS PERMISSIVE FOR UPDATE TO public USING (auth.uid() = "profiles"."auth_user_id");--> statement-breakpoint
CREATE POLICY "stock_tags_select" ON "stock_tags" AS PERMISSIVE FOR SELECT TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = (SELECT author_id FROM stocks WHERE id = "stock_tags"."stock_id")));--> statement-breakpoint
CREATE POLICY "stock_tags_insert" ON "stock_tags" AS PERMISSIVE FOR INSERT TO public WITH CHECK (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = (SELECT author_id FROM stocks WHERE id = "stock_tags"."stock_id")));--> statement-breakpoint
CREATE POLICY "stock_tags_update" ON "stock_tags" AS PERMISSIVE FOR UPDATE TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = (SELECT author_id FROM stocks WHERE id = "stock_tags"."stock_id")));--> statement-breakpoint
CREATE POLICY "stock_tags_delete" ON "stock_tags" AS PERMISSIVE FOR DELETE TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = (SELECT author_id FROM stocks WHERE id = "stock_tags"."stock_id")));--> statement-breakpoint
CREATE POLICY "stocks_select" ON "stocks" AS PERMISSIVE FOR SELECT TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "stocks"."author_id"));--> statement-breakpoint
CREATE POLICY "stocks_insert" ON "stocks" AS PERMISSIVE FOR INSERT TO public WITH CHECK (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "stocks"."author_id"));--> statement-breakpoint
CREATE POLICY "stocks_update" ON "stocks" AS PERMISSIVE FOR UPDATE TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "stocks"."author_id"));--> statement-breakpoint
CREATE POLICY "stocks_delete" ON "stocks" AS PERMISSIVE FOR DELETE TO public USING (auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = "stocks"."author_id"));