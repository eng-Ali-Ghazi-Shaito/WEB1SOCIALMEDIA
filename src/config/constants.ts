// Matches users.email VARCHAR(254): nothing stored is longer, so longer input can never match.
export const IDENTIFIER_MAX_LENGTH = 254;

// Bounds the untrusted input handed to Argon2.
export const PASSWORD_MAX_LENGTH = 128;
