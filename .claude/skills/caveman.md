# caveman

Strip everything back to the primitive working core.

## Usage
`/caveman [broken thing]`

## Instructions

Use when something is over-engineered, broken in mysterious ways, or tangled beyond quick repair. Go full caveman: remove everything until it works, then add back only what's needed.

### Process
1. **Identify** — what is the one thing this must do?
2. **Delete** — remove all abstractions, wrappers, fancy logic
3. **Hardcode** — make the simplest possible version work first
4. **Verify** — confirm the primitive version actually works
5. **Restore** — add back complexity one piece at a time, verifying at each step

### When to invoke
- A component renders nothing and you don't know why
- An API call fails and logs show nothing useful
- State is corrupted and the source is unclear
- An animation freezes on first load

### Rule
If you can't describe what's broken in one sentence, you're not ready to fix it — describe it first, then caveman it.
