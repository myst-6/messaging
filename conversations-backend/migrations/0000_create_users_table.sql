CREATE TABLE IF NOT EXISTS "users" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"username" text NOT NULL UNIQUE,
	"hashed_password" text NOT NULL,
	"salt" text NOT NULL,
	"created_at" integer NOT NULL DEFAULT (unixepoch()),
	"updated_at" integer NOT NULL DEFAULT (unixepoch())
); 