## Demo Engineering Team Handbook

Welcome to the Demo Engineering Team. This handbook is intentionally small and self‑contained so you can use it as a reliable sample document for cf_ai_docpilot.

The rest of this file is organized into clear sections that are easy to query:

- What this team does
- Onboarding checklist
- PTO policy
- Communication guidelines
- Deployment and tooling notes

Use questions like “What is this document about?”, “What are the onboarding steps?”, or “Summarize the PTO policy” when testing the app.

---

## 1. What this team does

The Demo Engineering Team builds internal tools and proof‑of‑concept applications that help other teams move faster.

The team’s primary responsibilities are:

- Designing and building small, focused web applications.
- Integrating with internal and external APIs.
- Providing clear documentation and demos so other teams can adopt the tools.
- Maintaining a small set of shared libraries and starter templates.

The team is not responsible for:

- Running 24/7 production on‑call rotations.
- Owning customer‑facing SLAs.
- Long‑term ownership of large, core product surfaces.

You can think of this group as a “productivity multipliers” team: their work should make it easier for other engineers, PMs, and analysts to get things done.

---

## 2. Onboarding checklist

The first week should be structured and predictable. A new engineer’s onboarding checklist includes:

1. **Access and accounts**
   - Get access to the main GitHub organization.
   - Join the “demo‑engineering” Slack channel.
   - Log in to the Cloudflare dashboard with the shared sandbox account.
   - Confirm access to the internal documentation portal.

2. **Environment setup**
   - Install Node.js (LTS), Git, and Docker.
   - Install and start Ollama locally.
   - Clone the `cf_ai_docpilot` repository and run the local dev environment.
   - Verify that `npm test` and `npm run lint` succeed.

3. **First tasks**
   - Pair with a teammate to ship a tiny change (for example, a doc update).
   - Add yourself to the team page in the internal handbook.
   - Join the next weekly demo meeting and introduce yourself.

Onboarding should feel calm and intentional. New hires should not be asked to debug critical production issues in their first week.

---

## 3. PTO policy

The Demo Engineering Team encourages people to take time off and disconnect fully while they are away.

Key points of the PTO policy:

- PTO is **encouraged**, not just allowed. The target is at least three full weeks off per year, in addition to company holidays.
- Longer breaks (one week or more) should be requested at least **two weeks in advance** when possible.
- Before leaving, engineers should:
  - Hand off any active work in progress.
  - Update the team calendar with the exact dates.
  - Set a clear Slack status and enable an out‑of‑office message.
- While on PTO, people are **not expected to monitor Slack or email**. The default assumption is that you are unreachable unless you explicitly say otherwise.

If a production issue arises during someone’s PTO, the team will treat them as unavailable and will not page them unless it is a true emergency and they have explicitly opted in to being contacted.

---

## 4. Communication guidelines

The team values clear, calm, and written‑first communication.

The main channels are:

- **Slack**
  - `#demo‑engineering`: day‑to‑day discussion and quick questions.
  - `#demo‑eng‑incidents`: temporary channel for any major outage or incident.
- **Docs**
  - The internal docs portal is the source of truth for architecture decisions.
  - Each project should have a short README with setup and a “How to demo it” section.
- **Meetings**
  - Weekly team sync (30 minutes, agenda‑driven).
  - Bi‑weekly demo / show‑and‑tell (45 minutes).

Guidelines to keep communication healthy:

- Prefer **asynchronous updates** with enough context that someone can read them later.
- Use **threads** in Slack for multi‑message discussions.
- When raising an issue, include:
  - What you expected to happen.
  - What actually happened.
  - Any relevant logs or screenshots.
- Assume good intent and ask clarifying questions before escalating.

---

## 5. Deployment and tooling notes

The Demo Engineering Team favors simple, reproducible deploys over complex pipelines.

For most projects:

- Cloudflare Pages + Functions are used for hosting.
- D1 is used for lightweight relational data.
- R2 is used for object storage when needed.
- Local‑only tools like Ollama are used for experiments, prototypes, and internal demos.

Standard deployment notes:

- The **main branch** should always be in a deployable state.
- Every pull request should include a short description of:
  - What changed.
  - How it was tested.
  - Any follow‑up work that is out of scope.
- Production deploys are usually triggered from main after automated checks pass.

When in doubt, prefer a smaller change with a clear demo over a large change that is hard to explain. A good rule of thumb is that any reviewer should be able to:

- Read the project README.
- Run a single command to start the app.
- Run a second command (or short script) to see a complete demo.

