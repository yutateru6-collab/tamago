const VIDEO_PATH = '/art/workshop-idle.mp4';
// The approved clip is 393,516 bytes. Larger assets keep the streaming fallback.
const MAX_VIDEO_BYTES = 1024 * 1024;

/** @param {string | null} range @param {number} size */
function parseRange(range, size) {
  const match = range && /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  return start >= size || start > end ? 'unsatisfiable' : { start, end };
}

/** Read only the approved video, with a hard bound even when the binding omits
 * Content-Length. Never buffer general static assets.
 * @param {ReadableStream<Uint8Array>} body @param {number | null} expectedSize
 */
async function readVideo(body, expectedSize) {
  const reader = body.getReader();
  const bytes = new Uint8Array(expectedSize ?? MAX_VIDEO_BYTES);
  let offset = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (offset + value.byteLength > bytes.length) throw new Error('Unexpected video length');
      bytes.set(value, offset);
      offset += value.byteLength;
    }
    if (!offset || (expectedSize !== null && offset !== expectedSize)) throw new Error('Incomplete video');
    return bytes.slice(0, offset);
  } finally {
    await reader.cancel();
  }
}

/** @satisfies {ExportedHandler<Env>} */
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== VIDEO_PATH || !['GET', 'HEAD'].includes(request.method)) {
      return env.ASSETS.fetch(request);
    }

    // Static Assets currently ignores Range. Always obtain the complete entity
    // through the binding, then answer this one small video's single-byte range.
    const upstreamHeaders = new Headers(request.headers);
    upstreamHeaders.delete('Range');
    upstreamHeaders.delete('If-Range');
    const response = await env.ASSETS.fetch(new Request(request, { headers: upstreamHeaders }));
    if (response.status !== 200) return response;

    const length = response.headers.get('Content-Length');
    const expectedSize = length === null ? null : Number(length);
    if ((expectedSize !== null && (!Number.isSafeInteger(expectedSize) || expectedSize <= 0 || expectedSize > MAX_VIDEO_BYTES)) ||
        response.headers.has('Content-Encoding') || response.headers.get('Content-Type')?.split(';')[0] !== 'video/mp4') {
      return response;
    }
    const headers = new Headers(response.headers);
    headers.set('Accept-Ranges', 'bytes');
    if (request.method === 'HEAD') return new Response(null, { status: 200, headers });

    const ifRange = request.headers.get('If-Range');
    // Only a matching strong entity tag permits a partial response. Other
    // validators safely receive the complete entity, never stale partial data.
    if (ifRange && (ifRange.startsWith('W/') || ifRange !== headers.get('ETag'))) {
      return new Response(response.body, { status: 200, headers });
    }
    const requestedRange = request.headers.get('Range');
    // Ignore malformed/multiple ranges without consuming the full stream.
    if (!requestedRange || !/^bytes=(?:\d+-\d*|-\d+)$/i.test(requestedRange.trim()) || !response.body) {
      return new Response(response.body, { status: 200, headers });
    }

    try {
      const bytes = await readVideo(response.body, expectedSize);
      const size = bytes.length;
      const range = parseRange(requestedRange, size);
      if (!range) return new Response(bytes, { status: 200, headers });
      if (range === 'unsatisfiable') {
        headers.set('Content-Range', `bytes */${size}`);
        headers.set('Content-Length', '0');
        return new Response(null, { status: 416, headers });
      }
      headers.set('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
      headers.set('Content-Length', String(range.end - range.start + 1));
      return new Response(bytes.slice(range.start, range.end + 1), { status: 206, headers });
    } catch {
      console.error(JSON.stringify({ event: 'video_range_read_failed', path: VIDEO_PATH }));
      return new Response('Video temporarily unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }
  },
};
