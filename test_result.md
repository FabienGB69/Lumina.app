#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Build 'Lumina' (formerly Echo) — a sleek, edgy, minimalist dark-themed React Native + FastAPI app
  inspired by Co-Star but focused on tarot and astrology. Users onboard with birth date/time/place,
  get a real natal chart (pyswisseph), a daily horoscope (Claude Sonnet 4.5 via Emergent LLM key),
  and one tarot pull per day. Friends compatibility, journal, Stripe premium subscription, and now:
  Emergent-managed Google Auth + local scheduled push notifications. Brand identity: royal violet
  + luminous gold, mystical dark theme (icon: gilded "L" on violet).

backend:
  - task: "Google Auth session exchange (POST /api/auth/session)"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Added /api/auth/session exchange: accepts {session_id}, calls
          https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data with X-Session-ID,
          upserts user by email (custom user_id), stores a 7-day row in user_sessions collection
          with TTL index, returns {access_token=session_token, user}. get_current_user now
          accepts BOTH the opaque session_token (looked up in user_sessions) and legacy JWT
          (unchanged flow). Also added POST /api/auth/logout which deletes the session row.
          Manually verified invalid session_id → 401, missing field → 422, existing JWT flow
          still returns 200 on /auth/me. Full third-party e2e cannot be reproduced from the
          testing shell (needs a real Emergent-hosted OAuth redirect).

  - task: "Legacy JWT auth + all core endpoints (regression)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Register + login + /auth/me still work with JWT. get_current_user tries session_token
          first (fast fail if not in user_sessions), then decodes JWT — no regression.

frontend:
  - task: "Brand identity refresh (violet + gold, logo, splash, icons)"
    implemented: true
    working: true
    file: "frontend/src/theme.ts, frontend/app.json, frontend/src/components/LuminaLogo.tsx, frontend/app/login.tsx, frontend/app/register.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Replaced icon.png / adaptive-icon.png / splash-icon.png / favicon.png with the new
          gilded-L artwork provided by user. Theme moved from pure-black to deep royal violet
          (#0B0418 bg, #3A1580 deep violet, #F0C560 gold). Added gradients export for
          expo-linear-gradient. Login + Register now feature the logo, a gold-gradient primary
          button, an "OR" divider, and a "Continue with Google" secondary button. Screenshot
          verified on preview.

  - task: "Emergent Google Auth (frontend, mobile + web)"
    implemented: true
    working: "NA"
    file: "frontend/src/googleAuth.ts, frontend/src/auth.tsx, frontend/app/login.tsx, frontend/app/register.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Platform-aware flow: web → window.location.href = auth.emergentagent.com?redirect=...
          then AuthProvider consumes session_id from URL hash/query on mount. Native →
          WebBrowser.openAuthSessionAsync + Linking.addEventListener('url') + getInitialURL
          fallback, extraction via regex (hash-safe). Exchange happens exactly once per
          session_id via a Set guard. Session_token stored via secureSet under `lumina_token`
          (same key used by JWT flow, unified). E2E cannot be tested from the preview URL
          without going through the real Emergent OAuth host.

  - task: "Local scheduled push notifications (expo-notifications)"
    implemented: true
    working: "NA"
    file: "frontend/src/notifications.ts, frontend/app/(tabs)/profile.tsx, frontend/app.json"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Added `Daily reminder` section on Profile with toggle + 6 time presets (07:00, 08:00,
          09:30, 12:00, 18:00, 21:00). Uses expo-notifications with DAILY trigger, Android
          channel "daily-reading", golden LED color. Permission flow respects canAskAgain and
          surfaces an "Open Settings" alert when permanently denied. app.json declares
          POST_NOTIFICATIONS + SCHEDULE_EXACT_ALARM on Android and NSUserNotificationsUsageDescription
          on iOS. Not testable on web (toggle disabled + Alert).

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus:
    - "Google Auth session exchange (POST /api/auth/session)"
    - "Emergent Google Auth (frontend, mobile + web)"
    - "Local scheduled push notifications (expo-notifications)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Backend: added POST /api/auth/session (Google OAuth exchange), POST /api/auth/logout,
      user_sessions collection + TTL index on expires_at. get_current_user accepts both
      session_token and JWT. Please regression-test /api/auth/register, /api/auth/login,
      /api/auth/me, and verify /api/auth/session returns 401 on invalid session_id and 422
      on missing field. LLM-backed endpoints (/api/horoscope/today, /api/tarot/daily,
      /api/tarot/draw, /api/friends/compatibility) may still 503 due to EMERGENT_LLM_KEY
      budget cap ($0.001) — this is an env limit, not a code bug, and the code now returns
      a clean 503 rather than a raw 500. Stripe still uses the placeholder key
      'sk_test_emergent' — /api/stripe/checkout expected to return 503 with the current key.
