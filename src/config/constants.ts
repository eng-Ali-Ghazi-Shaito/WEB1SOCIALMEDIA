// Matches users.email VARCHAR(254): nothing stored is longer, so longer input can never match.
export const IDENTIFIER_MAX_LENGTH = 254;

// Bounds the untrusted input handed to Argon2.
export const PASSWORD_MAX_LENGTH = 128;

export const FEED_PAGE_SIZE = 10;
export const CONVERSATION_PAGE_SIZE = 20;

export const JSON_BODY_MAX_BYTES = 10 * 1024;
export const POST_LIKE_CHANGE_LIMIT = 120;
export const POST_LIKE_WINDOW_MINUTES = 60;
