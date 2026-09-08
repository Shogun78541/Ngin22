import { NextResponse } from "next/server";

function cleanHtml(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text) {
  return [...new Set(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9+#.\- ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3)
  )];
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

  const raw = wanted.length
    ? Math.round((matched.length / wanted.length) * 100)
    : 0;

  return {
    match: Math.min(99, Math.max(10, raw)),
    matchedSkills: matched.slice(0, 8)
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const country = searchParams.get("country") || "gb";
  const what = searchParams.get("what") || "customer service";
  const where = searchParams.get("where") || "London";
  const employment = searchParams.get("employment") || "all";
  const skills = searchParams.get("skills") || "";

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    return NextResponse.json(
      {
        error: "Adzuna credentials are missing.",
        hasAppId: Boolean(appId),
        hasAppKey: Boolean(appKey)
      },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "30",
    what,
    where
  });

  if (employment === "full_time") {
    params.set("full_time", "1");
  }

  if (employment === "part_time") {
    params.set("part_time", "1");
  }

  if (employment === "contract") {
    params.set("contract", "1");
  }

  const url =
    `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/1?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Adzuna returned HTTP ${response.status}`,
          adzunaResponse: text.slice(0, 1000)
        },
        { status: response.status }
      );
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error: "Adzuna returned something that was not valid JSON.",
          response: text.slice(0, 1000)
        },
        { status: 502 }
      );
    }

    const results = Array.isArray(data.results)
      ? data.results
      : [];

    const jobs = results.map((job) => {
      const scoring = scoreJob(
        job,
        `${what} ${skills}`
      );

      return {
        id: job.id,
        title: job.title,
        company: job.company?.display_name || "",
        location: job.location?.display_name || "",
        contract: [
          job.contract_time,
          job.contract_type
        ]
          .filter(Boolean)
          .join(" / "),
        description: cleanHtml(job.description).slice(0, 500),
        url: job.redirect_url,
        ...scoring
      };
    });

    return NextResponse.json({
      success: true,
      search: {
        country,
        what,
        where,
        employment,
        skills
      },
      totalResults: data.count ?? results.length,
      jobs
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not reach Adzuna.",
        details: error?.message || "Unknown error"
      },
      { status: 502 }
    );
  }
}
