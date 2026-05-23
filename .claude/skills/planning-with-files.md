# planning-with-files

Structured planning saved as persistent files in `memory/`.

## Usage
`/planning-with-files [topic]`

## Instructions

Before implementing anything non-trivial, write a plan file first.

### Create a plan
1. Write `memory/plan-<topic>.md` with:
   - **Goal** — one sentence
   - **Agent** — who leads (Sam/Max/Nyx/Alex/Leo)
   - **Steps** — numbered, concrete, checkboxable
   - **Risks** — what could go wrong
   - **Done when** — clear acceptance criteria

2. Work through steps, checking them off as you go (`- [x]`)

3. When complete, move file to `memory/done/plan-<topic>.md`

### File structure
```
memory/
  PRD.md               # source of truth
  plan-<topic>.md      # active plans
  done/                # completed plans
  decisions/           # architecture decisions (ADRs)
```

### ADR format (for Max)
`memory/decisions/adr-<NNN>-<title>.md`
- Context, Decision, Consequences — three sections, nothing more
