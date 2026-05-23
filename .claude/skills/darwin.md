# darwin

Evolutionary iteration: mutate → evaluate → select → repeat.

## Usage
`/darwin [problem]`

## Instructions

Use when stuck on a hard problem where the right solution isn't obvious. Generate variants, test them, keep what survives.

### Process
1. **Baseline** — identify what currently exists (even if broken)
2. **Mutate** — produce 3 distinct variants (different approaches, not tweaks)
3. **Select** — run each, evaluate against a clear fitness criterion
4. **Survive** — keep the strongest, discard the others
5. **Repeat** — mutate the survivor until fit enough to ship

### Fitness criteria for Lumina
- Does it feel premium / Instagramable?
- Does it load fast on a mid-range Android?
- Does it move the paywall conversion needle?
- Does Leo's backend actually return the right data?

### Rules
- Never keep two variants alive at once in committed code
- Variants live in feature branches, not main
- Document why each loser lost — that's the real learning
