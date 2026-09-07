import { NextResponse } from "next/server";

const STOP_WORDS = new Set([
  "and", "the", "for", "with", "from", "this", "that", "your", "you",
  "job", "jobs", "remote", "work", "working", "role", "position"
]);

function words(text) {
  return [...new Set(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9+#.\- ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
  )];
}

function cleanHtml(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreJob(job, userText) {
  const wanted = words(userText);
  const haystack = [
    job.title,
    job.description,
    job.company?.display_name,
    job.category?.label
  ].join(" ").toLowerCase();

  const matched = wanted.filter((word) => haystack.includes(word));
  const raw = wanted.length ? Math.round((matched.length / wanted.length) * 100) : 0;

  return {
    match: Math.min(99, Math.max(10, raw)),
    matchedSkills: matched.slice(0, 8)
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const country = searchParams.get("country") || "gb";
  const what = searchParams.get("what") || "remote jobs";
  const where = searchParams.get("where") || "remote";
  const employment = searchParams.get("employment") || "all";

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    return NextResponse.json(
      { error: "Adzuna is not configured. Add ADZUNA_APP_ID and ADZUNA_APP_KEY to your environment variables." },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "30",
    what,
    where,
    "content-type": "application/json"
  });

  if (employment === "full_time") params.set("full_time", "1");
  if (employment === "part_time") params.set("part_time", "1");
  if (employment === "contract") params.set("contract", "1");

  const url = `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/1?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: `Adzuna returned HTTP ${response.status}: ${text.slice(0, 500)}` },
        { status: response.status }
      );
    }

    const data = JSON.parse(text);

    const jobs = (data.results || []).map((job) => {
      const scoring = scoreJob(job, `${what} ${searchParams.get("skills") || ""}`);

      return {
        id: job.id,
        title: job.title,
        company: job.company?.display_name || "",
        location: job.location?.display_name || "",
        contract: [job.contract_time, job.contract_type].filter(Boolean).join(" / "),
        description: cleanHtml(job.description).slice(0, 500),
        url: job.redirect_url,
        ...scoring
      };
    }).sort((a, b) => b.match - a.match);

    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json(
      { error: `Could not reach Adzuna: ${error.message}` },
      { status: 502 }
    );
  }
}
