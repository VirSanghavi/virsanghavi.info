---
title: "Launching Antifailure"
pubDatetime: 2026-09-06
description: "Know what happens before you deploy. A disposable copy of production for every pull request, and why I built it."
readingTime: 4
video: /antifailure-launch.mp4
poster: /antifailure-launch-poster.jpg
tiltDebateId: bd8a6b15-db40-44de-ba34-028968b1fa03
---

Antifailure launches today. The short version: it builds a disposable copy of your production stack for every pull request, runs your change there first, tells you what would have broken, and then deletes everything. The site is [antifailure.dev](https://antifailure.dev) and the engine is open source.

## Why

Almost every change to software is still tested the way it was twenty years ago. You run the suite against a seeded database that is small, clean and empty. You click around staging. Someone reads the migration in review and says it looks fine. Then you deploy to a system that is enormous, tangled and full of real people, and that is where you find out.

The video above opens with two outages. Neither was an attack. Both were ordinary changes that had passed everything, because the thing they had passed was not production.

The gap looks the same everywhere. A migration that takes four seconds on an empty database can hold a lock for ninety on a real one. A passing suite does not know that the path which charges a card would have charged one. Staging is shared, stale, and reaches the same vendors production does, so the safe environment was never actually safe. The question before a risky deploy is always the same, and none of the usual ways of answering it answer that question.

## What it does

Antifailure answers it by building the thing you were about to deploy to, one copy per branch, and then destroying it.

- **A masked copy of production, and the masking is proved.** The rules compile to SQL and run deterministically, so one customer maps to the same fake customer across every table. A scanner then reads the result back with the detectors that would catch a leak and signs an attestation. A copy that has not been verified cannot be branched. That is enforced in code, not in a checklist.
- **A network the app cannot get around.** Every environment sits on a network with no route out. The only thing on both sides is a sidecar that owns the namespace, so a client that ignores its proxy variables has nowhere to send the packet. Each outside host gets a mode: block, allow, sandbox, capture, mock or synth. A live credential on the way out is refused.
- **Agents, not scripts.** A workflow is a sentence. The runner drives a real browser through the accessibility tree, signs in the way a person does, and comes back with pass, fail, flaky, blocked or unverified, plus a video, a trace and steps to reproduce.
- **Migration rehearsal.** Pending migrations run on a throwaway branch of the copy, every statement timed on its own, with locks sampled from a second connection, because a lock held by a statement in flight is invisible to the session holding it. Whether a statement rewrites a table is answered by Postgres, not by reading the SQL. Query plans are diffed against the base branch.

If it breaks, it breaks there. Then the copy deletes itself.

## Try it

You need Docker and a Postgres connection string you are allowed to read from. No account, no control plane, nothing calls home.

```bash
curl -fsSL https://antifailure.dev/install.sh | sh

af start          # where you are on this machine, and the single next command
af runner install # the agent runner, which drives a real browser
af init           # reads your repo, writes antifailure.yaml
af up             # masked database branch, built services, sealed network
af test           # agents run your workflows and return verdicts with evidence
af down           # every resource it created, gone
```

`af start` is the one to remember. It runs nothing, writes nothing, and names the one command to run next, so a first run you walked away from is one you can walk back into.

`af mcp` serves the same tools to a coding agent, and the part I care about most is what the agent cannot do with them. There is no argument on any tool that can disable masking, widen the egress policy, lower a threshold or skip the rehearsal. An agent cannot weaken the experiment to make its own change pass.

## Where it stands

The engine is MIT licensed, except the separately licensed `ee/` directory, and it runs in your own CI today. The hosted control plane is invitation only while it is in development. A passing run tells you how your change behaved at the fidelity the copy reached. It does not promise that no deployment can fail, and I would rather say that plainly than have you find out the other way.

Docs, the quickstart and the source are at [antifailure.dev](https://antifailure.dev). If you try it and something is wrong, tell me. That is the whole point of doing this in the open.
