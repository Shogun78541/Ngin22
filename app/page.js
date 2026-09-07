"use client";

import { useMemo, useState } from "react";

const COUNTRIES = [
  ["gb", "United Kingdom"],
  ["us", "United States"],
  ["au", "Australia"],
  ["ca", "Canada"],
  ["de", "Germany"],
  ["fr", "France"],
  ["nl", "Netherlands"],
  ["nz", "New Zealand"],
  ["sg", "Singapore"],
  ["za", "South Africa"]
];

export default function Home() {
  const [skills, setSkills] = useState("Excel, Canva, customer service, translation");
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("remote");
  const [country, setCountry] = useState("gb");
  const [employment, setEmployment] = useState("all");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const searchText = useMemo(() => {
    return [what, skills].filter(Boolean).join(", ");
  }, [what, skills]);

  async function searchJobs(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const params = new URLSearchParams({
        country,
        what: searchText || "remote jobs",
        where
      });

      if (employment !== "all") params.set("employment", employment);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Job search failed.");
      setJobs(data.jobs || []);
    } catch (err) {
      setJobs([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="badge">JOBFINDER MVP</div>
        <h1>Find a job that actually fits you.</h1>
        <p>
          Search real job listings, then rank them against your skills and
          preferences.
        </p>
      </section>

      <section className="panel">
        <form onSubmit={searchJobs}>
          <div className="grid">
            <label>
              Job title / keywords
              <input
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                placeholder="Customer service, virtual assistant..."
              />
            </label>

            <label>
              Location
              <input
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder="remote, London, New York..."
              />
            </label>

            <label>
              Country
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </label>

            <label>
              Employment
              <select value={employment} onChange={(e) => setEmployment(e.target.value)}>
                <option value="all">Any</option>
                <option value="full_time">Full time</option>
                <option value="part_time">Part time</option>
                <option value="contract">Contract</option>
              </select>
            </label>
          </div>

          <label className="full">
            Your skills
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Excel, Canva, customer service, English..."
              rows={3}
            />
          </label>

          <button className="search" disabled={loading}>
            {loading ? "Searching..." : "Find matching jobs"}
          </button>
        </form>
      </section>

      {error && <div className="error">{error}</div>}

      {searched && !loading && !error && (
        <section className="results">
          <div className="resultsHeader">
            <h2>{jobs.length} jobs found</h2>
            <span>Ranked by skill match</span>
          </div>

          {jobs.length === 0 ? (
            <div className="empty">No jobs found. Try broader keywords or another country.</div>
          ) : (
            jobs.map((job) => (
              <article className="job" key={job.id}>
                <div className="score">{job.match}%<small>match</small></div>
                <div className="jobBody">
                  <h3>{job.title}</h3>
                  <p className="company">{job.company || "Company not listed"}</p>
                  <p className="meta">
                    {job.location || "Location not listed"} · {job.contract || "Job"}
                  </p>
                  <p className="description">{job.description}</p>
                  <div className="tags">
                    {job.matchedSkills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                  <a href={job.url} target="_blank" rel="noreferrer">
                    View & apply →
                  </a>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      <footer>
        <p>Powered by Adzuna job listings. Your API credentials stay on the server.</p>
      </footer>
    </main>
  );
}
