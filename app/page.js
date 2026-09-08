"use client";

import { useState } from "react";

const SEARCH_OPTIONS = [
  ["remote", "🌎 Remote jobs"],
  ["international", "🌐 International"],
  ["southeast_asia", "🌏 Southeast Asia"],
  ["europe", "🇪🇺 Europe"],
  ["north_america", "🌎 North America"],
  ["oceania", "🌊 Oceania"],
  ["africa", "🌍 Africa"],
  ["country", "📍 Specific country / location"]
];

const COUNTRIES = [
  ["gb", "🇬🇧 United Kingdom"],
  ["us", "🇺🇸 United States"],
  ["au", "🇦🇺 Australia"],
  ["ca", "🇨🇦 Canada"],
  ["de", "🇩🇪 Germany"],
  ["fr", "🇫🇷 France"],
  ["nl", "🇳🇱 Netherlands"],
  ["nz", "🇳🇿 New Zealand"],
  ["sg", "🇸🇬 Singapore"],
  ["za", "🇿🇦 South Africa"]
];

export default function Home() {
  const [skills, setSkills] = useState(
    "Excel, Canva, customer service, translation"
  );

  const [what, setWhat] = useState(
    "customer service"
  );

  const [where, setWhere] = useState("");

  const [scope, setScope] = useState(
    "remote"
  );

  const [country, setCountry] = useState(
    "gb"
  );

  const [employment, setEmployment] =
    useState("all");

  const [jobs, setJobs] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searched, setSearched] =
    useState(false);

  const [totalResults, setTotalResults] =
    useState(0);

  async function searchJobs(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSearched(true);
    setJobs([]);
    setTotalResults(0);

    try {
      const params =
        new URLSearchParams({
          scope,
          country,
          what:
            what.trim() ||
            "customer service",
          where: where.trim(),
          skills: skills.trim()
        });

      if (employment !== "all") {
        params.set(
          "employment",
          employment
        );
      }

      const res = await fetch(
        `/api/jobs?${params.toString()}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Job search failed."
        );
      }

      setJobs(data.jobs || []);

      setTotalResults(
        data.totalResults || 0
      );

    } catch (err) {
      setJobs([]);
      setTotalResults(0);

      setError(
        err.message ||
          "Something went wrong."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">

      <section className="hero">

        <div className="badge">
          JOBFINDER MVP
        </div>

        <h1>
          Find a job that actually
          fits you.
        </h1>

        <p>
          Search real job listings,
          including remote and
          international opportunities,
          then rank them against your
          skills.
        </p>

      </section>

      <section className="panel">

        <form onSubmit={searchJobs}>

          <div className="grid">

            <label>
              Job title / keywords

              <input
                value={what}
                onChange={(e) =>
                  setWhat(e.target.value)
                }
                placeholder="Customer service, virtual assistant..."
              />
            </label>

            <label>
              Search area

              <select
                value={scope}
                onChange={(e) =>
                  setScope(e.target.value)
                }
              >

                {SEARCH_OPTIONS.map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}

              </select>

            </label>

            {scope === "country" && (
              <>
                <label>
                  Country

                  <select
                    value={country}
                    onChange={(e) =>
                      setCountry(
                        e.target.value
                      )
                    }
                  >

                    {COUNTRIES.map(
                      ([code, name]) => (
                        <option
                          key={code}
                          value={code}
                        >
                          {name}
                        </option>
                      )
                    )}

                  </select>

                </label>

                <label>
                  City / location

                  <input
                    value={where}
                    onChange={(e) =>
                      setWhere(
                        e.target.value
                      )
                    }
                    placeholder="London, Singapore, New York..."
                  />

                </label>
              </>
            )}

            {scope === "remote" && (
              <div className="full">
                <div className="empty">
                  🌎 Remote mode searches
                  for jobs advertised as
                  remote, work-from-home,
                  home-based or similar.
                </div>
              </div>
            )}

            {scope === "southeast_asia" && (
              <div className="full">
                <div className="empty">
                  🌏 Southeast Asia currently
                  searches the Singapore
                  Adzuna source available
                  in this app.
                </div>
              </div>
            )}

            {scope === "international" && (
              <div className="full">
                <div className="empty">
                  🌐 International mode
                  searches all configured
                  countries at the same time.
                </div>
              </div>
            )}

            {(scope === "europe" ||
              scope === "north_america" ||
              scope === "oceania" ||
              scope === "africa") && (
              <div className="full">
                <div className="empty">
                  🌍 Searching multiple
                  countries in this region.
                </div>
              </div>
            )}

            <label>
              Employment

              <select
                value={employment}
                onChange={(e) =>
                  setEmployment(
                    e.target.value
                  )
                }
              >
                <option value="all">
                  Any
                </option>

                <option value="full_time">
                  Full time
                </option>

                <option value="part_time">
                  Part time
                </option>

                <option value="contract">
                  Contract
                </option>
              </select>

            </label>

          </div>

          <label className="full">

            Your skills

            <textarea
              value={skills}
              onChange={(e) =>
                setSkills(e.target.value)
              }
              placeholder="Excel, Canva, customer service, English..."
              rows={3}
            />

          </label>

          <button
            className="search"
            disabled={loading}
          >

            {loading
              ? "Searching..."
              : "Find matching jobs"}

          </button>

        </form>

      </section>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {searched &&
        !loading &&
        !error && (

          <section className="results">

            <div className="resultsHeader">

              <h2>
                {jobs.length} jobs found
              </h2>

              <span>
                {totalResults > 0
                  ? `${totalResults.toLocaleString()} available results`
                  : "Ranked by skill match"}
              </span>

            </div>

            {jobs.length === 0 ? (

              <div className="empty">
                No jobs found. Try a
                broader job title or
                another search area.
              </div>

            ) : (

              jobs.map((job) => (

                <article
                  className="job"
                  key={job.id}
                >

                  <div className="score">

                    {job.match}%

                    <small>
                      match
                    </small>

                  </div>

                  <div className="jobBody">

                    <h3>
                      {job.title}
                    </h3>

                    <p className="company">
                      {job.company ||
                        "Company not listed"}
                    </p>

                    <p className="meta">

                      {job.location ||
                        "Location not listed"}

                      {" · "}

                      {job.country ||
                        ""}

                      {" · "}

                      {job.contract ||
                        "Job"}

                    </p>

                    <p className="description">
                      {job.description}
                    </p>

                    {job.matchedSkills &&
                      job.matchedSkills
                        .length > 0 && (

                        <div className="tags">

                          {job.matchedSkills.map(
                            (skill) => (
                              <span key={skill}>
                                {skill}
                              </span>
                            )
                          )}

                        </div>

                      )}

                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View & apply →
                    </a>

                  </div>

                </article>

              ))

            )}

          </section>

        )}

      <footer>

        <p>
          Powered by Adzuna job listings.
          Your API credentials stay on
          the server.
        </p>

      </footer>

    </main>
  );
}
