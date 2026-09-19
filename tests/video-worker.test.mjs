import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import worker from '../src/server/video-worker.js';

const video = await readFile(new URL('../public/art/workshop-idle.mp4', import.meta.url));
const url = 'https://example.test/art/workshop-idle.mp4';
const etag = '"approved-video"';
const calls = [];
const env = { ASSETS: { async fetch(request) {
  calls.push(request);
  if (request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers: { ETag: etag } });
  return new Response(request.method === 'HEAD' ? null : video, { headers: {
    'Content-Type': 'video/mp4', 'Content-Length': String(video.length), ETag: etag, 'Cache-Control': 'public, max-age=0, must-revalidate',
  } });
} } };
const get = (headers = {}, method = 'GET') => worker.fetch(new Request(url, { method, headers }), env);

test('full GET and HEAD preserve the approved video and entity headers', async () => {
  const response = await get();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
  assert.equal(response.headers.get('ETag'), etag);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), video);
  const head = await get({ Range: 'bytes=0-1' }, 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('Content-Length'), String(video.length));
  assert.equal((await head.arrayBuffer()).byteLength, 0);
});

for (const [range, start, end] of [
  ['bytes=0-1', 0, 1],
  ['bytes=3749-', 3749, video.length - 1],
  ['bytes=-50', video.length - 50, video.length - 1],
  ['bytes=20-999999999999999999999999', 20, video.length - 1],
  ['bytes=-999999999999999999999999', 0, video.length - 1],
]) {
  test(`serves exactly the requested bytes: ${range}`, async () => {
    const response = await get({ Range: range });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), `bytes ${start}-${end}/${video.length}`);
    assert.equal(response.headers.get('Content-Length'), String(end - start + 1));
    assert.equal(response.headers.get('Content-Type'), 'video/mp4');
    assert.equal(response.headers.get('ETag'), etag);
    assert.equal(calls.at(-1).headers.has('Range'), false);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), video.subarray(start, end + 1));
  });
}

test('unsatisfiable ranges return 416 with the entity length and no body', async () => {
  for (const range of [`bytes=${video.length}-`, 'bytes=-0', 'bytes=20-10', 'bytes=999999999999999999999999-']) {
    const response = await get({ Range: range });
    assert.equal(response.status, 416);
    assert.equal(response.headers.get('Content-Range'), `bytes */${video.length}`);
    assert.equal((await response.arrayBuffer()).byteLength, 0);
  }
});

test('malformed, unknown and multiple ranges safely receive the full entity', async () => {
  for (const range of ['bytes=-', 'bytes=a-b', 'items=0-1', 'bytes=0-1,3-4']) {
    const response = await get({ Range: range });
    assert.equal(response.status, 200);
    assert.equal(response.headers.has('Content-Range'), false);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), video);
  }
});

test('If-Range requires a matching strong ETag and leaves conditional requests intact', async () => {
  const matching = await get({ Range: 'bytes=0-1', 'If-Range': etag });
  assert.equal(matching.status, 206);
  assert.equal(calls.at(-1).headers.has('If-Range'), false);
  for (const validator of ['"old-version"', `W/${etag}`, 'Fri, 18 Sep 2026 00:00:00 GMT']) {
    const response = await get({ Range: 'bytes=0-1', 'If-Range': validator });
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), video);
  }
  assert.equal((await get({ Range: 'bytes=0-1', 'If-None-Match': etag })).status, 304);
});

test('non-video routes, non-GET methods and asset errors are delegated unchanged', async () => {
  const upstream = new Response('asset response', { status: 404 });
  const binding = { ASSETS: { fetch: async () => upstream } };
  assert.equal(await worker.fetch(new Request('https://example.test/deep-link'), binding), upstream);
  assert.equal(await worker.fetch(new Request(url, { method: 'POST' }), binding), upstream);
  assert.equal(await worker.fetch(new Request(url), binding), upstream);
});

test('non-video, encoded or oversized assets retain the streaming fallback', async () => {
  for (const headers of [{}, { 'Content-Length': '1048577' }, { 'Content-Length': '2', 'Content-Encoding': 'gzip' }]) {
    const upstream = new Response('ok', { headers });
    const response = await worker.fetch(new Request(url, { headers: { Range: 'bytes=0-1' } }), { ASSETS: { fetch: async () => upstream } });
    assert.equal(response, upstream);
    assert.equal(upstream.bodyUsed, false);
  }
});

test('the asset binding may omit Content-Length while still serving the video', async () => {
  const response = await worker.fetch(new Request(url, { headers: { Range: 'bytes=3749-' } }), {
    ASSETS: { fetch: async () => new Response(video, { headers: { 'Content-Type': 'video/mp4' } }) },
  });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('Content-Range'), `bytes 3749-${video.length - 1}/${video.length}`);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), video.subarray(3749));
});

test('truncated or oversized bodies cannot be returned as valid partial video', async () => {
  for (const declaredSize of [1, 10]) {
    const response = await worker.fetch(new Request(url, { headers: { Range: 'bytes=0-0' } }), {
      ASSETS: { fetch: async () => new Response('abc', { headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(declaredSize) } }) },
    });
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  const oversized = await worker.fetch(new Request(url, { headers: { Range: 'bytes=0-1' } }), {
    ASSETS: { fetch: async () => new Response(new Uint8Array(1048577), { headers: { 'Content-Type': 'video/mp4' } }) },
  });
  assert.equal(oversized.status, 502);
});
