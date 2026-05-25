# Skill: agent-orchestration

## Trigger
Invoked with `/agent-orchestration` or when the user says "délègue avec orchestration 3 tiers", "use tier routing", or "route to the right model".

## Purpose
Orchestrate sub-agents using a **3-tier model strategy** to maximize speed, cost, and quality:

| Tier | Model | When to use |
|------|-------|-------------|
| **Haiku** | `claude-haiku-4-5-20251001` | Fast, cheap tasks — file renaming, grep, simple transforms, boilerplate, JSON edits, changelog updates |
| **Sonnet** | `claude-sonnet-4-6` | Standard coding — feature implementation, bug fixes, refactoring, test writing, API integration |
| **Opus** | `claude-opus-4-7` | Complex reasoning — architecture decisions, security audits, cross-cutting refactors, ambiguous specs, multi-file design |

---

## Decision Algorithm

Before spawning any agent, classify the task:

```
HAIKU  → rote/mechanical, single file, no design judgment needed, < 50 LOC
SONNET → standard feature, 1-3 files, clear spec, medium complexity
OPUS   → ambiguous requirement OR cross-system design OR security/perf-critical OR > 5 files impacted
```

When in doubt between two tiers: **go one tier up**.
Never send an ambiguous spec to Haiku.

---

## Spawning Rules

### Haiku tasks — spawn with `model: "haiku"`
Examples:
- Update a config file (app.json, package.json)
- Rename exports, fix typos
- Generate a boilerplate file from a template
- Run a search and return results
- Update a CHANGELOG / README section

```
Agent(subagent_type="general-purpose", model="haiku", prompt="...")
```

### Sonnet tasks — spawn with `model: "sonnet"` (default, can omit)
Examples:
- Implement a new screen or component
- Add an API endpoint
- Write/fix unit tests
- Integrate a third-party SDK

```
Agent(subagent_type="claude", model="sonnet", prompt="...")
```

### Opus tasks — spawn with `model: "opus"`
Examples:
- Design a new data model touching auth + payments + DB
- Security audit with adversarial thinking
- Resolve conflicting architectural requirements
- Diagnose a complex multi-layer bug

```
Agent(subagent_type="claude", model="opus", prompt="...")
```

---

## Parallelism Strategy

- **Independent tasks** → spawn all agents in the same response (parallel)
- **Dependent tasks** → chain: wait for upstream result, then spawn downstream
- **Mixed** → fan-out independents first, then fan-in to a Sonnet/Opus synthesis agent

### Example decomposition
Request: "Refactor PaymentProvider, update tests, and bump the changelog"

```
Tier 1 (parallel):
  → Opus:   redesign PaymentProvider architecture
  → Haiku:  bump version in package.json + update CHANGELOG header

Tier 2 (after Opus completes):
  → Sonnet: implement the Opus design + write tests
```

---

## Agent Prompt Template

Always include in the sub-agent prompt:
1. **Role**: which Lumina agent persona (Sam/Leo/Nyx/Alex/Max)
2. **Branch**: `claude/compassionate-fermat-4189p`
3. **Scope**: exact files to touch
4. **Constraints**: no new packages unless specified, TypeScript must pass, follow CLAUDE.md conventions
5. **Deliverable**: what to commit + push

---

## Output

After all agents complete, summarize:
- ✅ What each tier did
- Files changed per agent
- TypeScript / lint status
- Whether a PR was created/updated

---

## Notes
- Haiku is ~10× cheaper than Opus — default to it for mechanical work
- Opus reasoning is worth the cost for security, auth, and payment code
- Sonnet is the workhorse — use it for 80% of coding tasks
- Never spawn Opus for tasks with a clear, unambiguous spec — that's Sonnet's job
