#!/usr/bin/env node
// Refresh data/stats.json from the GitHub API. Never throws the file away:
// on any failure it warns, keeps old values and exits 0. Never prints the token.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const statsPath = resolve(root, "data/stats.json");
const profile = JSON.parse(readFileSync(resolve(root, "data/profile.json"), "utf8"));
const handle = profile.handle;
const token = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

let stats;
try {
  stats = JSON.parse(readFileSync(statsPath, "utf8"));
} catch (e) {
  console.warn(`warn: cannot read ${statsPath} (${e.message}); starting from defaults`);
  stats = { updated: "", commits12mo: 0, commitsAllTime: 0, repos: 0, since: 0, followers: 0, contributions12mo: 0, languages: [] };
}

const headers = { Accept: "application/vnd.github+json", "User-Agent": "profile-stats", "X-GitHub-Api-Version": "2022-11-28" };
if (token) headers.Authorization = `Bearer ${token}`;

async function api(path, init = {}) {
  const res = await fetch(path.startsWith("http") ? path : `https://api.github.com${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  if (!res.ok) throw new Error(`${init.method || "GET"} ${path.split("?")[0]} -> HTTP ${res.status}`);
  return res.json();
}
const attempt = async (label, fn) => {
  try { return await fn(); } catch (e) { console.warn(`warn: ${label} failed (${e.message}); keeping old value`); return undefined; }
};

console.log(`token: ${token ? "present" : "none"}`);
const now = new Date();
stats.updated = now.toISOString().slice(0, 10);
const yearAgo = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10);

// Always-refresh fields
const gql = token && await attempt("graphql user", () => api("/graphql", {
  method: "POST",
  body: JSON.stringify({ query: `query($l:String!){user(login:$l){createdAt followers{totalCount} contributionsCollection{contributionCalendar{totalContributions}}}}`, variables: { l: handle } }),
}).then((j) => { if (j.errors || !j.data?.user) throw new Error("graphql error"); return j.data.user; }));
if (gql) {
  stats.followers = gql.followers.totalCount;
  stats.contributions12mo = gql.contributionsCollection.contributionCalendar.totalContributions;
  stats.since = Number(gql.createdAt.slice(0, 4));
} else {
  const u = await attempt("REST user", () => api(`/users/${handle}`));
  if (u) { stats.followers = u.followers; stats.since = Number(u.created_at.slice(0, 4)); }
}

// Private-derived fields: only with a personal token that is the profile owner.
const me = token ? await attempt("GET /user", () => api("/user")) : undefined;
if (me && me.login === handle) {
  console.log("owner token detected: refreshing private-derived fields");
  const c12 = await attempt("commits12mo", () => api(`/search/commits?q=${encodeURIComponent(`author:${handle} committer-date:>=${yearAgo}`)}&per_page=1`));
  if (c12) stats.commits12mo = c12.total_count;
  const call = await attempt("commitsAllTime", () => api(`/search/commits?q=${encodeURIComponent(`author:${handle}`)}&per_page=1`));
  if (call) stats.commitsAllTime = call.total_count;
  const repos = await attempt("repos", async () => {
    const all = [];
    for (let p = 1; p < 20; p++) {
      const page = await api(`/user/repos?affiliation=owner&per_page=100&page=${p}`);
      all.push(...page);
      if (page.length < 100) break;
    }
    return all.filter((r) => !r.fork);
  });
  if (repos) {
    stats.repos = repos.length;
    const bytes = {};
    let failed = false;
    for (const r of repos) {
      try {
        const l = await api(`/repos/${r.full_name}/languages`);
        for (const [k, v] of Object.entries(l)) bytes[k] = (bytes[k] || 0) + v;
      } catch (e) { failed = true; console.warn(`warn: languages for ${r.name} failed (${e.message})`); }
    }
    const total = Object.values(bytes).reduce((a, b) => a + b, 0);
    if (total > 0 && !failed) {
      stats.languages = Object.entries(bytes).sort((a, b) => b[1] - a[1]).slice(0, 6)
        .map(([k, v]) => [k, Math.round((v / total) * 1000) / 10]);
    } else console.warn("warn: language stats incomplete; keeping old languages");
  }
} else {
  console.log("no owner token: keeping private-derived fields (commits12mo, commitsAllTime, repos, languages)");
}

// Write, preserving key order and _note
const out = JSON.stringify(stats, null, 2).replace(/\[\s*\n\s*"([^"]+)",\s*\n\s*([\d.]+)\s*\n\s*\]/g, '["$1", $2]');
writeFileSync(statsPath, out + "\n");
console.log(`wrote data/stats.json (updated ${stats.updated}, commits12mo ${stats.commits12mo}, repos ${stats.repos}, since ${stats.since})`);
