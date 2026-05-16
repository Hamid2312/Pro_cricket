You are continuing the development of the Hafiz Stars Eleven PWA. Here is the exact handover state and your immediate backlog.

### What Is Already Done
1. **Database**: Migration `002_teams_join_requests.sql` is ready. It adds `teams`, `join_requests`, `is_captain` flag to `players`, RLS policies, and Realtime publications. (Captain bootstrap instructions are in the SQL comments).
2. **Backend**: `PyJWT` authentication is implemented (`auth_deps.py`). `config.py` uses `SUPABASE_JWT_SECRET` and handles dynamic CORS. The team API router (`/api/team`) is fully registered in `main.py`.
3. **Frontend API Client**: `lib/api.js` automatically attaches the Supabase Auth Bearer token and handles 401 token refreshes.
4. **Frontend Auth State**: `lib/AuthContext.jsx` is created to manage session state and cache the `/api/team/me` response.

### What You Must Do Next (Implementation Backlog)
1. **Mandatory Auth Gate & Routing (`App.jsx`)**:
   - Create `Login.jsx` and `Signup.jsx` (using Supabase Auth).
   - Create a `JoinRequest.jsx` screen for users who have signed up but aren't active squad members.
   - Update `App.jsx` routing: 
     - No session → Force `/login` or `/signup`.
     - Session but `can_use_app === false` → Force Join Request screen (or "Waiting for approval" state).
     - Session + Active player → Full app access.
2. **Captain UX**:
   - Add a UI for captains (e.g., in the Dashboard) to view pending join requests (`/api/team/join-requests`).
   - Implement Approve/Reject buttons calling the backend endpoints.
3. **Complete Realtime & State Management**:
   - Expand `useRealtimeSubscription.js` to listen to `join_requests`, `rsvps`, `matches`, and `stats` tables.
   - Update `useAppStore.js` (`applyDbEvent`) to handle CDC events for these tables so the UI updates live.
4. **Replace Mock Data**:
   - Refactor `Matches.jsx`, `Players.jsx`, and `Dashboard.jsx` to consume live data from the API/Zustand store instead of hardcoded arrays. Use the logged-in player's ID for RSVP actions.

Focus on implementing the Frontend Auth Gate first, then the Captain UX, followed by wiring up the live data. Maintain the existing premium, dark glassmorphism aesthetic.
