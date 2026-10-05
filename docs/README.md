# Indahnya docs

Start with the [README](../README.md) for what Indahnya is. The pages here go
deeper.

| Page | Read it when |
|---|---|
| [architecture.md](architecture.md) | You need the shape of the system: diagrams, buckets, worker jobs, clocks, data model, security choices |
| [development.md](development.md) | You're setting up locally, adding a script, or checking a convention |
| [deployment.md](deployment.md) | You're preparing the launch: checklist, every env var, R2, Stripe, PM2, nginx |
| [api.md](api.md) | You need a route: method, path, who may call it, what it does |
| [screenshots.md](screenshots.md) | You want to see a screen without running the app |

Elsewhere in the repo:

| Where | What |
|---|---|
| [`../PLAN.md`](../PLAN.md) | The product spec: decisions (don't re-ask), pricing, flows, phase notes, the 2026-09-24 audit |
| [`../brand/README.md`](../brand/README.md) | The Mekar mark and wordmark, colours, clear space, how to rebuild |
| [`geo/`](geo/) | GEO/AEO work: [brief](geo/brief.md), [baseline](geo/baseline.md), [facts](geo/facts.md), [plan](geo/plan.md), [off-site plan](geo/offsite-plan.md), [owner to-dos](geo/owner-todo.md), audits |
| [`images/`](images/) | The screenshots used in these docs |

When the code changes, update the page that describes it in the same commit.
Decisions go in `PLAN.md`, how things work goes here.
