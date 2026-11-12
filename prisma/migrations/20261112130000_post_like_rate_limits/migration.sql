CREATE TABLE "post_like_rate_limits" (
    "user_id" UUID NOT NULL,
    "change_times" TIMESTAMPTZ(3)[] NOT NULL,
    CONSTRAINT "post_like_rate_limits_pkey" PRIMARY KEY ("user_id"),
    CONSTRAINT "post_like_rate_limits_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
