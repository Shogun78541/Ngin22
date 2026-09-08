import { NextResponse } from "next/server";

const COUNTRY_NAMES = {
  gb: "United Kingdom",
  us: "United States",
  au: "Australia",
  ca: "Canada",
  de: "Germany",
  fr: "France",
  nl: "Netherlands",
  nz: "New Zealand",
  sg: "Singapore",
  za: "South Africa"
};

const SEARCH_GROUPS = {
  international: [
    "gb",
    "us",
    "au",
    "ca",
    "de",
    "fr",
    "nl",
    "nz",
    "sg",
    "za"
  ],

  southeast_asia: [
    "sg"
  ],

  europe: [
    "gb",
    "de",
    "fr",
    "nl"
  ],

  north_america: [
    "us",
    "ca"
  ],

  oceania: [
    "au",
    "nz"
  ],

  africa: [
    "za"
  ]
};

const REMOTE_TERMS = [
  "remote",
  "work from home",
  "work-from-home",
  "home based",
  "home-based",
  "remote working",
  "fully remote",
  "100% remote"
];

function cleanHtml(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text) {
  return [
    ...new Set(
      String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9+#.\- ]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 3)
    )
  ];
}

function isRemoteJob(job) {
  const text = [
    job.title,
    job.description,
    job.location?.display_name
  ]
    .join(" ")
    .toLowerCase();

  return REMOTE_TERMS.some((term) =>
    text.includes(term)
  );
}

function scoreJob(job, userText, remoteMode = false) {
  const wanted = words(userText);

  const haystack = [
    job.title,
    job.description,
    job.company?.display_name,
    job.category?.label
  ]
    .join(" ")
    .toLowerCase();

  const matched = wanted.filter((word) =>
    haystack.includes(word)
  );

  let score = wanted.length
    ? Math.round(
        (matched.length / wanted.length) * 100
      )
    : 50;

  if (remoteMode && isRemoteJob(job)) {
    score += 15;
  }

  return {
    match: Math.min(99, Math.max(10, score)),
    matchedSkills: matched.slice(0, 8)
  };
}

async function searchCountry({
  country,
  appId,
  appKey,
  what,
  where,
  employment,
  remoteMode,
  page
}) {
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "30",
    what,
    "content-type": "application/json"
  });

  if (!remoteMode && where) {
    params.set("where", where);
  }

  if (remoteMode) {
    params.set(
      "what",
      `${what} remote`
    );
  }

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
    `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(
      country
    )}/search/${page}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Adzuna ${country} returned HTTP ${response.status}`
    );
  }

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Adzuna ${country} returned invalid JSON`
    );
  }

  return {
    country,
    count: data.count || 0,
    results: Array.isArray(data.results)
      ? data.results
      : []
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const country =
    searchParams.get("country") || "gb";

  const scope =
    searchParams.get("scope") || "country";

  const what =
    searchParams.get("what") ||
    "customer service";

  const where =
    searchParams.get("where") || "";

  const skills =
    searchParams.get("skills") || "";

  const employment =
    searchParams.get("employment") || "all";

  const page = Math.max(
    1,
    Number(searchParams.get("page") || "1")
  );

  const appId =
    process.env.ADZUNA_APP_ID;

  const appKey =
    process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    return NextResponse.json(
      {
        error:
          "Adzuna credentials are missing."
      },
      { status: 500 }
    );
  }

  let countries = [];

  if (scope === "international") {
    countries =
      SEARCH_GROUPS.international;
  } else if (scope === "southeast_asia") {
    countries =
      SEARCH_GROUPS.southeast_asia;
  } else if (scope === "europe") {
    countries =
      SEARCH_GROUPS.europe;
  } else if (scope === "north_america") {
    countries =
      SEARCH_GROUPS.north_america;
  } else if (scope === "oceania") {
    countries =
      SEARCH_GROUPS.oceania;
  } else if (scope === "africa") {
    countries =
      SEARCH_GROUPS.africa;
  } else {
    countries = [country];
  }

  const remoteMode =
    scope === "remote";

  try {
    const responses = await Promise.all(
      countries.map((countryCode) =>
        searchCountry({
          country: countryCode,
          appId,
          appKey,
          what,
          where,
          employment,
          remoteMode,
          page
        })
      )
    );

    let allResults = [];

    for (const response of responses) {
      for (const job of response.results) {
        allResults.push({
          ...job,
          _country: response.country
        });
      }
    }

    /*
     * Remove duplicate jobs.
     */
    const uniqueJobs = new Map();

    for (const job of allResults) {
      const key =
        job.id ||
        `${job.title}-${job.company?.display_name}-${job.location?.display_name}`;

      if (!uniqueJobs.has(key)) {
        uniqueJobs.set(key, job);
      }
    }

    let jobs = [
      ...uniqueJobs.values()
    ];

    /*
     * Remote mode:
     * Only keep jobs that actually
     * look like remote jobs.
     */
    if (remoteMode) {
      jobs = jobs.filter(isRemoteJob);
    }

    /*
     * Convert jobs to our website format.
     */
    jobs = jobs.map((job) => {
      const scoring = scoreJob(
        job,
        `${what} ${skills}`,
        remoteMode
      );

      return {
        id: job.id,
        title: job.title,
        company:
          job.company?.display_name || "",
        location:
          job.location?.display_name ||
          COUNTRY_NAMES[job._country] ||
          "",
        country:
          COUNTRY_NAMES[job._country] ||
          job._country,
        contract: [
          job.contract_time,
          job.contract_type
        ]
          .filter(Boolean)
          .join(" / "),
        description:
          cleanHtml(job.description).slice(
            0,
            600
          ),
        url: job.redirect_url,
        ...scoring
      };
    });

    /*
     * Best matches first.
     */
    jobs.sort(
      (a, b) => b.match - a.match
    );

    /*
     * Total number of available
     * results from Adzuna.
     */
    const totalResults =
      responses.reduce(
        (total, response) =>
          total + response.count,
        0
      );

    /*
     * There may be another page
     * available from Adzuna.
     */
    const hasMore =
      responses.some(
        (response) =>
          response.results.length >= 30
      );

    return NextResponse.json({
      success: true,

      page,

      pageSize: 30,

      totalResults,

      hasMore,

      search: {
        scope,
        country,
        countries,
        what,
        where,
        employment,
        skills,
        remote: remoteMode
      },

      countriesSearched:
        countries.map((code) => ({
          code,
          name:
            COUNTRY_NAMES[code] ||
            code
        })),

      jobs
    });

  } catch (error) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Could not reach Adzuna."
      },
      { status: 502 }
    );
  }
}
