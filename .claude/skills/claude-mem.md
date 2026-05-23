# claude-mem

Persist and retrieve memory across sessions using agentmemory.

## Usage
`/claude-mem [store|recall|list] [key] [value]`

## Instructions

agentmemory runs at `http://localhost:3111`. Use it to preserve important decisions, findings, and context across sessions.

### Store a memory
```bash
curl -s -X POST http://localhost:3111/memories \
  -H "Content-Type: application/json" \
  -d '{"content": "<value>", "metadata": {"key": "<key>", "agent": "<agent-name>"}}'
```

### Recall memories
```bash
# Search by query
curl -s "http://localhost:3111/memories?query=<search-term>" | jq .

# List all
curl -s "http://localhost:3111/memories" | jq .
```

### When to use
- Before starting work: recall relevant past decisions
- After completing a feature: store what was built and why
- When a bug is fixed: store root cause + fix for future Nyx reference
- Architecture decisions: Max stores rationale so it's never re-litigated

### Memory format
Always tag memories with `agent` and a descriptive `key` in metadata so they're searchable by any agent later.
