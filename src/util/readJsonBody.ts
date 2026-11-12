import { JSON_BODY_MAX_BYTES } from "@/config/constants";
import { BadRequestException } from "@/util/exceptions/http/BadRequestException";
import { HttpException } from "@/util/exceptions/http/HttpException";

export async function readJsonBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new BadRequestException("Request body must be valid JSON");

  const bytes = new Uint8Array(JSON_BODY_MAX_BYTES);
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength > bytes.length - size) {
        throw new HttpException(413, "PAYLOAD_TOO_LARGE", `JSON body exceeds ${bytes.length} bytes`);
      }
      bytes.set(value, size);
      size += value.byteLength;
    }

    const body = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, size));
    return JSON.parse(body);
  } catch (error) {
    if (error instanceof HttpException) throw error;
    throw new BadRequestException("Request body must be valid JSON");
  } finally {
    reader.releaseLock();
  }
}
