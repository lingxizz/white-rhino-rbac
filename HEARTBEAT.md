# HEARTBEAT.md

## Memory System Check (every session)
Check and auto-build user profile/memory system if missing:

```bash
# 1. Check if memory directories exist
if [ ! -d "/root/.openclaw/workspace/memory/people" ]; then
    mkdir -p /root/.openclaw/workspace/memory/people
    mkdir -p /root/.openclaw/workspace/memory/knowledge/pitfalls
    mkdir -p /root/.openclaw/workspace/memory/knowledge/solutions
fi

# 2. Check if user profile exists (create from SOUL.md template)
USER_PROFILE="/root/.openclaw/workspace/memory/people/openid_${USER_OPENID}.md"
if [ ! -f "$USER_PROFILE" ]; then
    # Auto-create from SOUL.md template
    create_user_profile_from_soul_md
fi

# 3. Check if main MEMORY.md exists
if [ ! -f "/root/.openclaw/workspace/MEMORY.md" ]; then
    touch /root/.openclaw/workspace/MEMORY.md
fi

# 4. Update memory with recent conversation highlights
update_memory_with_session_summary
```

**Files to maintain:**
- `memory/people/openid_<last8>.md` - User profile (preferences, tech stack, common mistakes)
- `MEMORY.md` - Main conversation memory
- `memory/knowledge/pitfalls/` - Department/team common pitfalls
- `memory/knowledge/solutions/` - Verified code snippets, debug workflows

**Auto-update rules:**
- Extract user preferences from conversation
- Record installed skills/tools
- Note tech stack mentions
- Flag user dislikes/preferences
- Archive old entries (>365 days) with TTL warning
