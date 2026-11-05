export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_CAPTION_LENGTH = 2200;
export const MAX_MESSAGE_LENGTH = 1000;

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isValidDemoUsername(username: string) {
  return /^(?!.*\.\.)[a-z0-9_](?:[a-z0-9._]{0,28}[a-z0-9_])?$/.test(username);
}

export function isValidPasswordLength(password: string) {
  return password.length >= 8 && password.length <= 128;
}

export function characterCount(value: string) {
  return [...value].length;
}

export function isAcceptedImage(file: Pick<Blob, "type" | "size">) {
  return ACCEPTED_IMAGE_TYPES.has(file.type) && file.size <= MAX_IMAGE_BYTES;
}
