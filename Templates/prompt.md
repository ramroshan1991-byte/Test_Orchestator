📋 Project Overview
Build a production-ready single-page React application called "Test Orchestrator" 
— an AI-powered QA platform that integrates with Jira, generates test plans, 
creates test cases, and produces automation code.

CRITICAL RULE #1 — ZERO FRICTION ON LOAD:
If no Jira config is saved → silently load mock data, full app works instantly.
If config is saved → fetch real Jira data. On failure → fallback to mock + toast.
User is NEVER blocked. Empty states should NEVER appear on first load.

CRITICAL RULE #2 — JIRA CORS FIX (most important):
Browser-based apps CANNOT call Jira REST API directly due to CORS restrictions.
Recommended approach (production): route all Jira calls through your backend API
proxy (e.g. `/api/jira/*`). This keeps credentials off public proxies and avoids
rate/availability/security issues.

Quick dev fallback: if you need a fast browser-only workaround, you may use a
public CORS proxy such as `https://corsproxy.io/?` but only for short-term
development — never in production with real credentials.

IMPLEMENT THIS PATTERN (recommended — backend proxy):

// Frontend: call your backend proxy endpoint which performs Jira requests
const fetchJiraStories = async (config) => {
  const response = await fetch('/api/jira/stories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) throw new Error(`Jira proxy error: ${response.status}`);
  const data = await response.json();
  return data.stories || [];
};

// If you must use a public proxy for quick dev debugging (NOT recommended):
// const CORS_PROXY = 'https://corsproxy.io/?';
// const proxyUrl = `${CORS_PROXY}${encodeURIComponent(jiraEndpoint)}`;

// Jira returns description in Atlassian Document Format (ADF) — parse it:
const extractTextFromADF = (adf) => {
  if (!adf) return '';
  if (typeof adf === 'string') return adf;
  
  const extractFromNode = (node) => {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    if (node.content) return node.content.map(extractFromNode).join(' ');
    return '';
  };
  return extractFromNode(adf).trim();
};

// Extract acceptance criteria from ADF description
const extractAcceptanceCriteria = (adf) => {
  const text = extractTextFromADF(adf);
  const lines = text.split('\n').filter(l => l.trim());
  // Look for lines that seem like acceptance criteria
  const criteriaLines = lines.filter(l => 
    l.match(/^[-•*]|^\d+\.|given|when|then|should|must|can/i)
  );
  return criteriaLines.length > 0 ? criteriaLines : lines.slice(0, 5);
};
⚙️ Configuration Panel — Jira Setup
Build a clean configuration modal/panel with these EXACT input fields 
that match real Jira Cloud credentials:

FIELDS:
┌─────────────────────────────────────────────┐
│  Jira Base URL                              │
│  https://yourcompany.atlassian.net          │
│  (no trailing slash, no /rest/api/3)        │
├─────────────────────────────────────────────┤
│  Email Address                              │
│  your-email@company.com                     │
├─────────────────────────────────────────────┤
│  API Token                          👁 show │
│  (from id.atlassian.com/manage-profile)     │
├─────────────────────────────────────────────┤
│  Project Key                                │
│  e.g. QA, DEV, SCRUM (case sensitive)       │
└─────────────────────────────────────────────┘

[  🔗 Test Connection  ]  [  💾 Save & Fetch  ]

Below the form, show a helper note:
"ℹ️ Get your API token from: 
 id.atlassian.com → Security → API Tokens"

CONNECTION TEST FLOW:
1. On "Test Connection" click:
   - Show spinner "Testing..."
   - Make a lightweight call: GET /rest/api/3/myself via CORS proxy
   - If 200: show "✅ Connected as {displayName}" in green
   - If 401: show "❌ Invalid credentials" in red
   - If any error: show "⚠️ Connection failed — check URL and token" in amber

SAVE & FETCH FLOW:
1. Validate all fields filled
2. Save to localStorage as JSON
3. Call fetchJiraStories()
4. On success: close modal, show stories, show "Live Mode" badge
5. On failure: show error toast, load mock data, show "Demo Mode" badge

🔄 Mode System
TWO MODES — determined at app startup:

DEMO MODE (default, no config):
- Amber badge in header: "🟡 Demo Mode"
- Pre-load 4 realistic mock stories (see mock data section below)
- All AI features (Claude API) work normally with mock stories
- Config button shows tooltip: "Add Jira credentials to use live data"
- No empty states ever

LIVE MODE (config found + connection successful):
- Green badge in header: "🟢 Live Mode · {projectKey}"  
- Real stories fetched from Jira via CORS proxy
- Show story count: "Fetched 12 stories from QA project"
- Refresh button to re-fetch

SWITCHING MODES:
- Gear icon → Settings → Jira tab → enter credentials → Save
- "Clear Config" button → reverts to Demo Mode
- Toast on switch: "Switched to Live Mode — 8 stories loaded"

📦 Mock Data (Demo Mode)
const MOCK_STORIES = [
  {
    id: "QA-101",
    title: "User Login with OAuth2",
    description: "As a user, I want to log in using Google or GitHub OAuth so I don't need to remember passwords. The system should support SSO and remember me for 30 days.",
    priority: "High",
    status: "In Progress",
    assignee: "Ram Roshan",
    storyPoints: 5,
    acceptance_criteria: [
      "User can click 'Login with Google' or 'Login with GitHub' button",
      "OAuth popup opens and completes authentication flow",
      "User is redirected to dashboard after successful login",
      "Failed authentication shows clear error message",
      "Session persists across page refreshes for 30 days",
      "Logout clears session completely"
    ]
  },
  {
    id: "QA-102",
    title: "Shopping Cart — Add, Update & Remove Items",
    description: "As a shopper, I want to manage items in my cart so I can control what I purchase before checkout.",
    priority: "High",
    status: "To Do",
    assignee: "QA Team",
    storyPoints: 3,
    acceptance_criteria: [
      "Clicking 'Add to Cart' adds the item with default quantity 1",
      "Quantity can be incremented and decremented with +/- buttons",
      "Quantity cannot go below 1 or above 99",
      "Remove button deletes item from cart with undo option",
      "Cart badge in header updates in real-time",
      "Cart total recalculates correctly including tax",
      "Empty cart shows 'Your cart is empty' with CTA"
    ]
  },
  {
    id: "QA-103",
    title: "Payment Gateway Integration — Stripe & UPI",
    description: "As a customer, I want to pay using credit card, debit card, or UPI so my checkout experience is seamless and secure.",
    priority: "Critical",
    status: "To Do",
    assignee: "Ram Roshan",
    storyPoints: 8,
    acceptance_criteria: [
      "Stripe checkout loads within 3 seconds",
      "Valid card (Visa, Mastercard, Amex) processes successfully",
      "Declined card shows specific reason (insufficient funds, invalid CVV etc)",
      "UPI ID validation happens before submission",
      "Payment confirmation page shown after success",
      "Order confirmation email triggered within 60 seconds",
      "Failed payment does not deduct amount",
      "Payment retry is possible without re-entering cart"
    ]
  },
  {
    id: "QA-104",
    title: "Product Search & Advanced Filtering",
    description: "As a shopper, I want to search for products and filter by category, price, brand, and rating so I can find exactly what I need.",
    priority: "Medium",
    status: "Done",
    assignee: "Dev Team",
    storyPoints: 3,
    acceptance_criteria: [
      "Search results appear within 2 seconds of typing",
      "Search works on product name, description, and tags",
      "Filters can be applied simultaneously (category + price + rating)",
      "Active filters shown as removable chips",
      "Filter state persists in URL query parameters",
      "No results page shows suggestions and search tips",
      "Results count shown: 'Showing 24 of 156 products'"
    ]
  }
];

🎨 UI/UX Design
OVERALL LAYOUT:
┌──────────────────────────────────────────────────────┐
│ HEADER: Logo | Mode Badge | [⚙️ Config] [👤 User]   │
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ SIDEBAR  │           MAIN CONTENT AREA              │
│          │                                           │
│ Step 1   │  (changes based on active sidebar item)  │
│ 🌐 Jira  │                                           │
│          │                                           │
│ Step 2   │                                           │
│ 📄 Plan  │                                           │
│          │                                           │
│ Step 3   │                                           │
│ ✅ Cases │                                           │
│          │                                           │
│ Step 4   │                                           │
│ 💻 Code  │                                           │
│          │                                           │
└──────────┴───────────────────────────────────────────┘

SIDEBAR STEPS:
- Each step shows: icon + label + status indicator
- Completed steps: green checkmark ✅
- Active step: blue highlight with left border accent
- Locked steps: gray (until previous step done)
- Step numbers shown: 1, 2, 3, 4

DESIGN TOKENS:
- Background: #0F172A (body), #1E293B (card), #334155 (border)
- Accent Blue: #3B82F6 | Accent Green: #10B981 | Amber: #F59E0B
- Text: #F1F5F9 (primary), #94A3B8 (secondary)
- Font: Inter or system-ui
- Border radius: 8px cards, 6px buttons, 4px badges
- Shadows: subtle (0 1px 3px rgba(0,0,0,0.3))

COMPONENTS:
- Story cards: rounded, border-l-4 colored by priority
- Priority badges: Critical=red, High=orange, Medium=amber, Low=green
- Status chips: pill shape, outlined style
- Loading: skeleton pulse animation (not spinner)
- Transitions: 200ms ease for all hover/active states

RESPONSIVE:
- Desktop: sidebar + content side by side
- Tablet: collapsible sidebar (hamburger)
- Mobile: bottom tab navigation

📋 Feature 1 — Jira Integration View
LAYOUT: Two sections stacked or side by side

TOP — Config Status Bar:
- If Demo Mode: amber info bar "Using demo data · Click ⚙️ to connect Jira"
- If Live Mode: green bar "Connected to {jiraUrl} · Project: {key} · {n} stories"

MAIN — Stories Grid:
- Search input: "Search stories..."
- Filter chips: All | High | Medium | Low | Critical
- 2-column grid of story cards (1 col on mobile)
- Each card shows:
  ┌─────────────────────────────────────┐
  │ ☐  QA-101          [🔴 Critical]   │
  │                                     │
  │  User Login with OAuth2             │
  │                                     │
  │  As a user, I want to log in...     │
  │  (truncated to 2 lines)             │
  │                                     │
  │  [In Progress] [5 pts] [Ram R.]    │
  └─────────────────────────────────────┘
- Checkbox top-left for multi-select
- Click card body = expand to see full description + ACs

BOTTOM ACTION BAR (appears when ≥1 selected):
- "X stories selected" count
- "Generate Test Plan →" primary button
- "Select All" / "Clear" links

📄 Feature 2 — Test Plan Generation
TRIGGER: "Generate Test Plan" with selected stories

LOADING:
- Full content area replaced with animated steps:
  ⏳ "Analyzing 3 user stories..."
  ⏳ "Identifying scope and risks..."
  ⏳ "Building test strategy..."
  ✅ "Test plan ready!"
- Each step fades in sequentially with 800ms delay

CLAUDE API CALL:
{
  model: "claude-sonnet-4-20250514",
  max_tokens: 2000,
  system: "You are a senior QA lead with 10+ years experience. 
           Generate precise, professional test plans. 
           Always return valid JSON only — no markdown, no explanation.",
  messages: [{
    role: "user",
    content: `Generate a test plan JSON for these user stories:
    ${JSON.stringify(selectedStories, null, 2)}
    
    Return this exact structure:
    {
      "objective": "string",
      "scope": {
        "in_scope": ["string"],
        "out_of_scope": ["string"]
      },
      "test_types": [{"type":"string","description":"string","priority":"High|Medium|Low"}],
      "environments": [{"name":"string","browser":"string","os":"string","device":"string"}],
      "entry_criteria": ["string"],
      "exit_criteria": ["string"],
      "risks": [{"risk":"string","impact":"High|Medium|Low","mitigation":"string"}],
      "effort_estimate": {"total_hours": number, "phases": [{"phase":"string","hours":number}]}
    }`
  }]
}

DISPLAY — Accordion sections:
🎯 Objective — single paragraph, prominent
🔭 Scope — two columns: In Scope (green) | Out of Scope (red strikethrough)
🧪 Test Types — horizontal cards with type + priority badge
🌍 Environments — table: Name | Browser | OS | Device
✅ Entry Criteria — numbered green checklist
🚪 Exit Criteria — numbered blue checklist  
⚠️ Risks — table with colored Impact badges
⏱️ Effort — horizontal bar chart by phase

ACTIONS: [📥 Export] [📋 Copy JSON] [Generate Test Cases →]

🧪 Feature 3 — Test Case Creation
CLAUDE API CALL:
{
  model: "claude-sonnet-4-20250514",
  max_tokens: 4000,
  system: "You are an expert QA engineer. Generate thorough, executable test cases. 
           Return ONLY a valid JSON array.",
  messages: [{
    role: "user", 
    content: `Generate 8-10 test cases for this user story.
    
    Story: ${JSON.stringify(story)}
    
    Each test case must follow this structure exactly:
    {
      "id": "TC_001",
      "title": "string",
      "module": "string",
      "priority": "Critical|High|Medium|Low",
      "type": "Positive|Negative|Edge Case|Boundary|UI|API|Performance",
      "preconditions": ["string"],
      "steps": [
        {"step_no": 1, "action": "string", "test_data": "string", "expected": "string"}
      ],
      "expected_outcome": "string",
      "automation_feasibility": "High|Medium|Low",
      "estimated_mins": number,
      "tags": ["string"]
    }
    
    Include: happy paths, failure scenarios, edge cases, boundary values.
    Return ONLY the JSON array.`
  }]
}

DISPLAY:
Stats row: [Total] [Critical] [Positive] [Negative] [Edge] [Estimated Time]

Filter bar: Search + Priority dropdown + Type dropdown + View toggle (Grid/List)

Test case cards (grid):
┌──────────────────────────────────────┐
│ TC_001              [🔴 High] [Pos]  │
│                                      │
│ Login with valid Google OAuth        │
│                                      │
│ 📋 6 steps  ⏱ 15 min  🤖 High auto  │
│                                      │
│ [👁 View Details] [💻 Generate Code] │
└──────────────────────────────────────┘

Right-side drawer on "View Details":
- Full header: ID + title + all badges
- Preconditions list
- Steps table: # | Action | Test Data | Expected Result
- Expected Outcome box (highlighted)
- Tags
- [💻 Generate Automation Code] CTA button

💻 Feature 4 — Code Generator
MODAL or FULL PANEL with two sections:

LEFT — Controls:
Test case name + ID shown at top

Framework cards (click to select):
┌─────────────────┐    ┌─────────────────┐
│  🟢 Selenium    │    │  🎭 Playwright  │
│  Java + TestNG  │    │  TypeScript     │
│  + Page Object  │    │  + Fixtures     │
└─────────────────┘    └─────────────────┘

Options (toggle switches):
  ✅ Page Object Model
  ✅ Include Assertions
  ✅ Add Comments  
  ☐  Data-Driven (TestNG DataProvider)

[ ⚡ Generate Code ]

RIGHT — Code Output:
- Dark code block (bg-gray-950)
- Monospace font (JetBrains Mono or Fira Code)
- Syntax highlighting via CSS (keywords in blue, strings in green, comments in gray)
- Line numbers
- Toolbar: [📋 Copy] [⬇️ Download] [🔄 Regenerate]

SELENIUM JAVA PROMPT:
"Generate complete, production-ready Selenium WebDriver Java code using TestNG 
framework and Page Object Model for this test case.

Requirements:
- LoginPage.java: @FindBy locators, action methods, constructor with WebDriver
- LoginTest.java: @BeforeMethod WebDriver setup, @Test with @DataProvider if needed,
  @AfterMethod teardown, explicit assertions with meaningful messages
- Use WebDriverWait with ExpectedConditions for all element interactions
- Include package declarations and all necessary imports
- Add JavaDoc on class and method level
- Use Assert.assertEquals/assertTrue with custom failure messages

Test Case JSON:
${JSON.stringify(testCase, null, 2)}

Return ONLY the Java code as two clearly separated files with 
// === FILE: PageName.java === comments as dividers."

PLAYWRIGHT TS PROMPT:
"Generate complete Playwright TypeScript test code using @playwright/test framework 
and Page Object Model for this test case.

Requirements:
- LoginPage.ts: class with Page constructor, locators as getters, async action methods
- login.spec.ts: import fixtures, test.describe block, test.beforeEach, 
  individual test() blocks for each scenario, expect() assertions
- Use Playwright's auto-waiting (avoid manual waits)
- Add test.step() for clarity in reports
- Include type annotations throughout

Test Case JSON:
${JSON.stringify(testCase, null, 2)}

Return ONLY TypeScript code with 
// === FILE: name.ts === dividers between files."

🌐 Jira API — Complete Reference

The CORS proxy pattern MUST be used for ALL Jira calls.
Never call Jira directly — it will fail with CORS error in browser.

ENDPOINTS TO USE:

1. Test Connection:
   GET {jiraUrl}/rest/api/3/myself
   → Returns: { displayName, emailAddress, accountId }

2. Fetch Stories:
   GET {jiraUrl}/rest/api/3/search
   Query params:
   - jql: project={KEY} AND issuetype=Story ORDER BY created DESC
   - maxResults: 50
   - fields: summary,description,priority,status,assignee,
             customfield_10016,comment

3. Fetch Single Issue:
   GET {jiraUrl}/rest/api/3/issue/{issueKey}

AUTH: Basic Auth = btoa("email:apiToken")
PROXY: Route requests to your backend `/api/jira/*` endpoints (recommended).
For quick local development only: https://corsproxy.io/?{encodeURIComponent(fullUrl)}

ADF PARSING:
Jira Cloud returns all text fields in Atlassian Document Format (ADF):
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "actual text here" }]
    }
  ]
}
Always parse this recursively — never render the raw object.

FIELD MAPPING:
issue.key                    → story ID (e.g. "QA-101")
issue.fields.summary         → title
issue.fields.description     → description (ADF — parse it)
issue.fields.priority.name   → priority
issue.fields.status.name     → status
issue.fields.assignee?.displayName → assignee
issue.fields.customfield_10016 → story points (may be null)

🔔 Error Handling & Toast System
TOAST TYPES (bottom-right, stack up to 3, auto-dismiss 4s):
✅ success  — green left border
❌ error    — red left border  
⚠️ warning  — amber left border
ℹ️ info     — blue left border

SPECIFIC MESSAGES:
- Jira 401: "Invalid credentials. Check your email and API token."
- Jira 403: "Access denied. Ensure your token has project read permission."
- Jira 404: "Project '{key}' not found. Check the project key."
- CORS error: "Cannot reach Jira. Check your Base URL format."
- Claude API error: "AI generation failed. Check your API key."
- Success fetch: "✅ Fetched {n} stories from {projectKey}"
- Demo fallback: "⚠️ Jira connection failed — loaded demo data instead"

💾 State & Persistence
// localStorage keys:
'to_config'      → { jiraUrl, email, apiToken, projectKey, anthropicKey }
'to_stories'     → [] // cached fetched stories
'to_test_plans'  → {} // { storyId: testPlan }
'to_test_cases'  → {} // { storyId: [testCases] }
'to_gen_code'    → {} // { tcId: { selenium: '', playwright: '' } }
'to_mode'        → 'DEMO' | 'LIVE'

// App initializes by:
1. Read config from localStorage
2. If config exists → attempt Jira fetch → on success set LIVE mode
3. If no config OR fetch fails → set DEMO mode, load MOCK_STORIES
4. Restore any previously generated test plans/cases from localStorage

🚀 Build Instructions
1. Single self-contained React JSX artifact (no separate files)
2. Tailwind CSS via CDN
3. Lucide React for icons
4. All Claude API calls via fetch() to Anthropic endpoint  
5. All Jira calls MUST go through a proxy. Prefer your backend proxy
  (`/api/jira/*`) in production; `corsproxy.io` may be used only as a
  temporary development fallback.
6. Basic Auth = btoa(email + ':' + apiToken) — never store decoded
7. ADF parser must handle nested content recursively
8. localStorage for all persistence
9. App must be fully functional in Demo Mode with zero config
10. Jira Live Mode must work with real atlassian.net credentials
11. All loading states use skeleton animation, not spinners
12. Graceful fallback to Demo Mode on any Jira error