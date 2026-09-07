# JobFinder

A simple job-search website built with Next.js and the Adzuna API.

## 1. Create Adzuna API credentials

Register at the official Adzuna developer portal:

https://developer.adzuna.com/

You will receive an `app_id` and `app_key`.

## 2. Configure environment variables

Create a `.env.local` file:

ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key

Never put these values in frontend code or commit `.env.local` to GitHub.

## 3. Run locally

Install Node.js, then:

npm install
npm run dev

Open:

http://localhost:3000

## 4. GitHub

Upload the project files to a new GitHub repository. Do not upload `.env.local`.

## 5. Deployment

This project can be deployed to a Next.js-compatible host such as Vercel. Add the same two environment variables in the host's project settings.

## Roadmap

- User profile
- Saved jobs
- Better skill matching
- CV upload and parsing
- Application tracker
- Telegram notifications
- Scheduled searches
- Admin dashboard
- More job sources
