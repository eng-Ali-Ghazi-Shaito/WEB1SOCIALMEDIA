-- Hand-written: Prisma's schema language cannot express CHECK constraints.
-- The app validates these rules too, but only the database covers every write path
-- (concurrent requests, raw SQL, future scripts).

-- A self-follow would inflate counts and notify a user about themselves.
ALTER TABLE "follows"
  ADD CONSTRAINT "follows_not_self_check"
  CHECK ("follower_id" <> "following_id");

-- Fixed order makes (A,B) and (B,A) the same row, so one_conversation_per_pair really
-- allows one conversation per pair. Strict < also blocks a chat with yourself.
ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_ordered_pair_check"
  CHECK ("user_a_id" < "user_b_id");

-- A LIKE without a post cannot be displayed; a FOLLOW with a post has no meaning.
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_type_post_check"
  CHECK (("type" = 'LIKE' AND "post_id" IS NOT NULL) OR ("type" = 'FOLLOW' AND "post_id" IS NULL));

-- Users are never notified about their own actions, such as liking their own post.
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_not_self_check"
  CHECK ("recipient_id" <> "actor_id");

-- Unique indexes are case-sensitive: without this, Ali and ali would be two accounts.
ALTER TABLE "users"
  ADD CONSTRAINT "users_lowercase_check"
  CHECK ("email" = lower("email") AND "username" = lower("username"));

-- Login detects email vs username by "@", so a username must never contain one.
-- First regex: allowed characters and length. Second: no leading, trailing or double period.
ALTER TABLE "users"
  ADD CONSTRAINT "users_username_format_check"
  CHECK ("username" ~ '^[a-z0-9._]{1,30}$' AND "username" !~ '^\.|\.$|\.\.');

-- A blank name would render as an empty profile header and be unfindable in search.
ALTER TABLE "users"
  ADD CONSTRAINT "users_full_name_not_blank_check"
  CHECK (char_length(btrim("full_name")) > 0);

-- "No caption" has one representation, NULL, so reads never need to handle blank strings.
ALTER TABLE "posts"
  ADD CONSTRAINT "posts_caption_not_blank_check"
  CHECK ("caption" IS NULL OR char_length(btrim("caption")) > 0);

-- A blank message would show as an empty chat bubble and still move the conversation up.
ALTER TABLE "messages"
  ADD CONSTRAINT "messages_body_not_blank_check"
  CHECK (char_length(btrim("body")) > 0);

-- Backstop for the 5-attempt limit: a bug in the atomic increment fails loudly here
-- instead of allowing unlimited guesses at a 6-digit code.
ALTER TABLE "auth_codes"
  ADD CONSTRAINT "auth_codes_attempts_range_check"
  CHECK ("attempts" BETWEEN 0 AND 5);

-- posts.image_key UNIQUE is not repeated here: docs/schema.dbml marks it unique, so @unique
-- created posts_image_key_key in the init migration. It stops two posts sharing one stored
-- file, where deleting one post would destroy the other's image.

-- Partial: only unused codes compete, so used codes stay as history. Two concurrent
-- requests cannot leave two valid codes for the same purpose.
CREATE UNIQUE INDEX "auth_codes_one_active_per_purpose"
  ON "auth_codes" ("user_id", "purpose")
  WHERE "used_at" IS NULL;

-- Partial: post_id is NULL for FOLLOW, and NULLs never conflict in a normal unique index,
-- so unfollow/refollow could otherwise create duplicates. Also the upsert target.
CREATE UNIQUE INDEX "notifications_one_follow"
  ON "notifications" ("recipient_id", "actor_id")
  WHERE "type" = 'FOLLOW';

-- Partial: one notification per actor per post, however often the like is toggled.
CREATE UNIQUE INDEX "notifications_one_like"
  ON "notifications" ("recipient_id", "actor_id", "post_id")
  WHERE "type" = 'LIKE';

-- Search uses substring matching (ILIKE '%ali%'), which a B-tree index cannot serve.
-- pg_trgm indexes 3-letter fragments so it does not scan every user. The extension is created
-- here, not by hand, because the shadow database needs it too.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "users_username_trgm_idx"
  ON "users" USING GIN ("username" gin_trgm_ops);

CREATE INDEX "users_full_name_trgm_idx"
  ON "users" USING GIN ("full_name" gin_trgm_ops);

-- Partial: the unread badge only needs unread rows, so the index stays small as read
-- notifications pile up.
CREATE INDEX "notifications_unread_idx"
  ON "notifications" ("recipient_id")
  WHERE "read_at" IS NULL;
