import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const REMOTE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-8b8bb9be/state`;
type RemoteState = Record<string, unknown>;

let cachedState: RemoteState | null = null;
let loading: Promise<RemoteState> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

// Last ETag returned by the server for the shared document. Sent back as
// If-None-Match so an unchanged poll gets a bodyless 304, avoiding a full
// re-download of the world document every 8 seconds.
let stateETag: string | null = null;

// Every API call requests a "fresh" read, so without coalescing the initial
// load and the 8s notification poll spray overlapping GETs that abort each
// other mid-response ("connection closed" / broken-pipe EPIPE in the edge
// function). Reuse a recent fresh result within this window instead.
const FRESH_TTL_MS = 2000;
let lastFreshAt = 0;
let freshLoading: Promise<RemoteState> | null = null;

async function request(method: "GET" | "PUT", body?: RemoteState): Promise<RemoteState> {
 // Do not abort an in-flight fetch on a client-side timer. Aborting closes the
 // browser connection while the Edge Function may still be writing its JSON
 // response, which is precisely what produces Deno's harmless-but-noisy
 // "connection closed before message completed" runtime log.
 const headers: Record<string, string> = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${publicAnonKey}`,
  apikey: publicAnonKey,
 };
 // Only conditional GETs can be short-circuited by the server. A cached
 // snapshot must already exist for a 304 to be meaningful.
 if (method === "GET" && stateETag && cachedState) headers["If-None-Match"] = stateETag;

 const response = await fetch(REMOTE_URL, {
  method,
  headers,
  body: body ? JSON.stringify(body) : undefined,
 });

 // Unchanged document: reuse the in-memory snapshot, no body to parse.
 if (response.status === 304 && cachedState) return { state: cachedState };
 if (!response.ok) throw new Error(`远程存档服务异常 (${response.status})`);

 const etag = response.headers.get("ETag");
 if (etag) stateETag = etag;
 return response.json();
}

export async function claimDailyRegistrationSlot(): Promise<void> {
 const response = await fetch(REMOTE_URL.replace(/\/state$/, "/registration/claim"), {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}`, apikey: publicAnonKey },
 });
 const data = await response.json().catch(() => ({}));
 if (!response.ok) throw new Error(data?.error || "注册资格校验失败，请稍后重试");
}

async function fetchState(): Promise<RemoteState> {
 const data = await request("GET");
 return data?.state && typeof data.state === "object" ? (data.state as RemoteState) : {};
}

/**
 * Shared-state helper. Reads can explicitly bypass the in-memory snapshot so a
 * browser refresh (or the lobby refresh button) sees countries created by
 * other users. Writes are serialized locally and always start from a newly
 * fetched remote document, preventing unrelated state sections from being
 * overwritten by an old browser snapshot.
 */
export const remoteState = {
 async load(options?: { fresh?: boolean }): Promise<RemoteState> {
  if (options?.fresh) {
   // Coalesce a burst of fresh reads: reuse an in-flight fetch, and reuse a
   // just-completed one within the TTL, so we hit the network at most once
   // per window instead of once per API call.
   if (freshLoading) return freshLoading;
   // A normal initial load and a fresh initial load are equivalent when no
   // snapshot exists. Share that first request rather than opening a second
   // connection just because two app modules mounted together.
   if (!cachedState && loading) return loading;
   if (cachedState && Date.now() - lastFreshAt < FRESH_TTL_MS) return cachedState;

   freshLoading = fetchState()
    .then((state) => {
     cachedState = state;
     lastFreshAt = Date.now();
     return state;
    })
    .catch((error) => {
     // Do not disguise a failed request as an empty, successful archive.
     // Callers such as AuthContext need this distinction to preserve a
     // valid locally stored session during a temporary outage.
     console.warn("Remote persistence unavailable; continuing with local cache.", error);
     throw error;
    })
    .finally(() => {
     freshLoading = null;
    });
   return freshLoading;
  }

  if (cachedState) return cachedState;
  // Match an already-started fresh initial read as well; otherwise the
  // auth provider and strategic archive each create their own GET on mount.
  if (freshLoading) return freshLoading;
  if (!loading) {
   loading = fetchState()
    .then((state) => {
     lastFreshAt = Date.now();
     return (cachedState = state);
    })
    .catch((error) => {
     console.warn("Remote persistence unavailable; continuing with local cache.", error);
     throw error;
    })
    .finally(() => {
     loading = null;
    });
  }
  return loading;
 },

 async readSection<T>(name: string, options?: { fresh?: boolean }): Promise<T | null> {
  const state = await this.load(options);
  return (state[name] as T | undefined) ?? null;
 },

 updateSection<T>(name: string, updater: (current: T | null) => T | null): Promise<T | null> {
  const task = writeQueue.then(async () => {
   // Reuse a recently-coalesced read instead of always issuing another GET.
   // Writes are serialized through `writeQueue` and the merge is id-based,
   // so a snapshot within the TTL is safe and removes one round-trip per
   // save — fewer concurrent requests means fewer aborted connections.
   const latest = await this.load({ fresh: true });
   const nextSection = updater((latest[name] as T | undefined) ?? null);
   const nextState = { ...latest };

   if (nextSection === null) delete nextState[name];
   else nextState[name] = nextSection;

   await request("PUT", nextState);
   cachedState = nextState;
   lastFreshAt = Date.now();
   return nextSection;
  });

  writeQueue = task.then(
   () => undefined,
   (error) => {
    console.warn("Remote persistence write failed.", error);
   }
  );
  return task;
 },

 writeSection(name: string, value: unknown) {
  return this.updateSection(name, () => value);
 },

 mergeSection(name: string, values: Record<string, unknown>) {
  return this.updateSection(name, (current: Record<string, unknown> | null) => ({ ...(current || {}), ...values }));
 },
};
