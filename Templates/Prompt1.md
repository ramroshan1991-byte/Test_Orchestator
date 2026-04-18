Project Overview
You are a senior full-stack engineer. Build a production-ready, 
single-page web application called "Test Orchestrator" — an AI-powered 
QA automation platform.

CRITICAL UX RULE:
The app must work INSTANTLY out of the box with zero configuration.
- If NO Jira credentials are configured → auto-load rich mock data silently
- If Jira credentials ARE configured → fetch real data from Jira API
- User should never see a broken or empty state on first load
- Mock mode must be indistinguishable in quality from live mode
- Show a subtle "Demo Mode" or "Live Mode" badge in the header to 
  indicate current state — never block the user

🏗️ Tech Stack
Frontend  : React.js (single file JSX artifact) + Tailwind CSS
AI Engine : Claude API (claude-sonnet-4-20250514) via fetch
Jira API  : Atlassian REST API v3
Storage   : React useState + localStorage for persistence
Code Gen  : Claude API with Selenium/Playwright prompt templates
Icons     : Lucide React

🎨 UI/UX Design (Reference: test-orchestrator.vercel.app)
LAYOUT:
- Left sidebar (collapsible) with step-based navigation:
  * 🌐 Jira Integration
  * 📄 Test Plan  
  * ✅ Test Cases
  * 💻 Code Generator
- Top header bar: App logo + Mode badge + Config button
- Main content area: Full width, scrollable
- Progress indicator showing which steps are complete ✅

DESIGN SYSTEM:
- Dark theme: bg-gray-950 / bg-gray-900 / bg-gray-800
- Accent: Electric blue #3B82F6, Emerald #10B981, Amber #F59E0B
- Cards with subtle border + hover glow effects
- Loading skeletons (not spinners) during AI generation
- Smooth step transitions with fade-in animations
- Status badges: color-coded chips for Priority/Type/Status
- Empty states: illustrated with helpful CTA (never just blank)

MOBILE:
- Sidebar collapses to bottom tab bar on mobile
- Cards stack vertically
- All modals become full-screen sheets

🔄 Smart Mock / Live Mode System
On app load, check localStorage for Jira config:

IF no config found:
  - Set mode = "DEMO"
  - Show amber badge "Demo Mode" in header  
  - Auto-populate with realistic mock Jira stories (see mock data below)
  - All features work end-to-end with mock data
  - Claude API still generates REAL AI content using mock stories
  - Config button shows "Configure Jira to use live data"

IF config found:
  - Set mode = "LIVE"  
  - Show green badge "Live Mode" in header
  - Fetch from real Jira API
  - On failure → fallback to mock data + show toast warning

MOCK JIRA STORIES (pre-loaded in Demo Mode):
[
  {
    id: "QA-101",
    title: "User Login with OAuth2",
    description: "As a user, I want to log in using Google/GitHub OAuth so that I don't need to remember passwords.",
    acceptance_criteria: [
      "User can click 'Login with Google' button",
      "OAuth popup opens and authenticates",
      "User is redirected to dashboard after login",
      "Failed auth shows error message",
      "Session persists across page refreshes"
    ],
    priority: "High",
    status: "In Progress",
    story_points: 5,
    assignee: "Ram Roshan"
  },
  {
    id: "QA-102", 
    title: "Shopping Cart - Add/Remove Items",
    description: "As a shopper, I want to add and remove items from cart so I can manage my purchase.",
    acceptance_criteria: [
      "Click 'Add to Cart' adds item with quantity 1",
      "Quantity can be increased/decreased",
      "Remove button deletes item from cart",
      "Cart total updates in real-time",
      "Cart persists on page refresh"
    ],
    priority: "High",
    status: "To Do",
    story_points: 3,
    assignee: "QA Team"
  },
  {
    id: "QA-103",
    title: "Payment Gateway Integration",
    description: "As a user, I want to pay securely using credit card or UPI.",
    acceptance_criteria: [
      "Stripe/Razorpay checkout loads correctly",
      "Valid card processes successfully",
      "Invalid card shows appropriate error",
      "UPI payment flow works end-to-end",
      "Payment confirmation email is triggered"
    ],
    priority: "Critical",
    status: "To Do",
    story_points: 8,
    assignee: "Ram Roshan"
  },
  {
    id: "QA-104",
    title: "Search & Filter Products",
    description: "As a shopper, I want to search and filter products by category, price, and rating.",
    acceptance_criteria: [
      "Search returns relevant results within 2s",
      "Filters can be combined",
      "No results shows helpful empty state",
      "Filter state persists in URL params"
    ],
    priority: "Medium",
    status: "Done",
    story_points: 3,
    assignee: "Dev Team"
  }
]

📦 Feature 1 — Jira Integration Panel
LAYOUT: Two-column — left config form, right stories list

LEFT PANEL - Configuration Form:
- Input: Jira Base URL
- Input: Email  
- Input: API Token (password type + show/hide toggle)
- Input: Project Key
- Input: Sprint/Epic filter (optional)
- Button: "Connect & Fetch Stories" (primary, full width)
- Button: "Use Demo Data" (secondary, outlined)
- Link: "How to get Jira API token?" → opens tooltip/modal

RIGHT PANEL - Stories List:
- Search bar to filter stories
- Stories rendered as cards showing:
  * Story ID badge (e.g. QA-101) in blue
  * Title (bold)
  * Priority badge (Red=Critical, Orange=High, Yellow=Medium, Green=Low)
  * Status chip
  * Story points badge
  * Assignee avatar initial
  * Checkbox for selection (top-right corner of card)
- Multi-select with "Select All" toggle
- Selected count badge: "3 stories selected"
- CTA: "Generate Test Plan →" button (disabled until ≥1 selected)

BEHAVIOR:
- On demo mode: stories pre-loaded, user can still reconfigure
- Story cards animate in with staggered entrance
- Selecting a story highlights it with blue border glow

📋 Feature 2 — Test Plan Generation
TRIGGER: User clicks "Generate Test Plan" with stories selected

LOADING STATE:
- Show typewriter animation: 
  "Analyzing user stories..." → 
  "Identifying test scope..." → 
  "Building test strategy..." →
  "Finalizing test plan..."
- Animated progress bar

CLAUDE API PROMPT:
system: "You are a senior QA engineer with 10+ years experience. 
Generate structured, professional test plans."

user: "Generate a comprehensive test plan as valid JSON for these 
user stories. Structure:
{
  objective: string,
  scope: { in_scope: string[], out_of_scope: string[] },
  test_types: [{ type: string, description: string, priority: string }],
  test_environments: [{ name, browser, os, devices }],
  entry_criteria: string[],
  exit_criteria: string[],
  risks: [{ risk: string, mitigation: string, severity: string }],
  test_schedule: { phases: [{ phase, duration, activities[] }] },
  estimated_effort: { total_hours: number, breakdown: {} }
}
Stories: {JSON.stringify(selectedStories)}
Return ONLY valid JSON, no markdown."

DISPLAY:
- Rendered as beautiful accordion sections, each with icon:
  🎯 Objective | 🔭 Scope | 🧪 Test Types | 🌍 Environments
  ✅ Entry/Exit Criteria | ⚠️ Risks | 📅 Schedule | ⏱️ Effort
- Expand/collapse each section
- Risk table with color-coded severity rows
- Effort breakdown as mini horizontal bar chart
- Action buttons: "📥 Export PDF" | "📋 Copy" | "➡️ Generate Test Cases"

🧪 Feature 3 — Smart Test Case Creation
TRIGGER: "Generate Test Cases" from test plan view

CLAUDE API PROMPT:
system: "You are an expert QA engineer. Generate thorough, 
executable test cases."

user: "Generate 8-12 test cases as a JSON array for this user story.
Each test case:
{
  id: 'TC_001',
  title: string,
  module: string,
  priority: 'Critical'|'High'|'Medium'|'Low',
  type: 'Positive'|'Negative'|'Edge Case'|'Boundary'|'UI'|'API',
  preconditions: string[],
  steps: [{ step_no: number, action: string, expected: string }],
  test_data: {},
  expected_outcome: string,
  automation_feasibility: 'High'|'Medium'|'Low',
  estimated_mins: number
}

Story: {selectedStory}
Acceptance Criteria: {criteria}
Cover: happy paths, failure scenarios, edge cases, boundary values.
Return ONLY a valid JSON array."

DISPLAY:
- Stats bar at top:
  Total | Critical | High | Medium | Automated | Manual | Est. Time
- Filter chips: All | Positive | Negative | Edge Case | By Priority
- Test case cards in a responsive grid (2-col desktop, 1-col mobile):
  * TC ID badge | Priority badge | Type badge
  * Title (bold)
  * Steps count chip
  * Automation feasibility indicator (green/yellow/red dot)
  * "View" and "Generate Code" action buttons
- Clicking "View" opens right-side drawer with:
  * Full step-by-step table
  * Test data section
  * Expected outcome
  * "Generate Code" CTA

💻 Feature 4 — Test Case Dashboard
A dedicated tab showing ALL generated test cases across all stories.

TOP BAR:
- Search input (searches title + module)
- Filter dropdowns: Priority | Type | Story | Status
- View toggle: Grid | Table
- "Export CSV" button

TABLE VIEW columns:
Checkbox | TC ID | Title | Story | Module | Priority | Type | 
Automation | Actions (View / Generate Code / Delete)

- Sortable columns (click header to sort)
- Bulk actions when rows selected:
  "Generate Code for Selected" | "Export Selected" | "Delete Selected"
- Pagination: 10/25/50 per page

SUMMARY CARDS (top of dashboard):
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 24 Total    │ │ 8 Critical  │ │ 18 Auto     │ │ 4.5h Est.   │
│ Test Cases  │ │ Priority    │ │ Feasible    │ │ Total Time  │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

💻 Feature 5 — Automation Code Generator
TRIGGER: "Generate Code" button on any test case

UI: Full-page modal or dedicated tab with two panels

LEFT PANEL - Controls:
- Test case title + ID shown at top
- Framework selector (large toggle cards):
  ┌──────────────────┐  ┌──────────────────┐
  │  🟢 Selenium     │  │  🎭 Playwright   │
  │  Java + TestNG   │  │  TypeScript      │
  └──────────────────┘  └──────────────────┘
- Options (toggle switches):
  * Page Object Model
  * Include Assertions  
  * Add Comments
  * Data-driven Testing
- Wait Strategy: Explicit | Implicit | Fluent
- "⚡ Generate Code" button (large, primary)
- "🔄 Regenerate" link (after first generation)

RIGHT PANEL - Code Display:
- Language label badge (Java / TypeScript)  
- Syntax-highlighted code block (dark theme, monospace font)
- Toolbar: Copy | Download (.java/.spec.ts) | Fullscreen
- Line numbers on the left
- After generation: show file structure suggestion:
  src/
  ├── pages/LoginPage.java
  ├── tests/LoginTest.java
  └── utils/BaseTest.java

SELENIUM CLAUDE PROMPT:
"Generate production-ready Selenium WebDriver Java code using TestNG 
and Page Object Model pattern for this test case.
Requirements:
- Separate Page class with @FindBy locators
- Test class extending BaseTest
- Explicit WebDriverWait for all interactions
- TestNG @Test annotation with description and groups
- Meaningful assertion messages
- JavaDoc comments
Test Case: {testCaseJSON}
Return ONLY the Java code."

PLAYWRIGHT CLAUDE PROMPT:
"Generate production-ready Playwright TypeScript test for this test case.
Requirements:  
- Use test() and expect() from @playwright/test
- Async/await throughout
- Page Object Model with a separate class
- Auto-waiting best practices (no manual waits unless needed)
- Descriptive test.step() blocks
- Inline comments explaining each action
Test Case: {testCaseJSON}
Return ONLY the TypeScript code."

⚙️ Configuration Modal
Accessible via gear icon in header. Settings persisted in localStorage.

TABS:
1. Jira Settings
   - Base URL, Email, API Token, Project Key
   - "Test Connection" button → shows green ✅ or red ❌
   - "Clear Config" button → reverts to Demo Mode

2. AI Settings  
   - Anthropic API Key (optional — uses built-in if blank)
   - Model selector (claude-sonnet-4-20250514)
   - Max tokens slider

3. Preferences
   - Default framework: Selenium / Playwright
   - Theme: Dark / Light / System
   - Auto-generate test cases after test plan: ON/OFF

🔔 Global UX Patterns
TOAST NOTIFICATIONS (bottom-right):
- ✅ Success: "Test plan generated successfully"
- ⚠️ Warning: "Jira connection failed, using demo data"  
- ❌ Error: "Claude API error — please check your API key"
- ℹ️ Info: "12 test cases generated in 8.3s"
- Auto-dismiss after 4s, manual close X button

LOADING STATES:
- Skeleton cards (pulsing gray blocks) during data fetch
- Typewriter text during AI generation
- Progress bar with estimated time for long operations

EMPTY STATES:
- Always show illustration + helpful description + CTA button
- Never show just blank space

KEYBOARD SHORTCUTS:
- Cmd/Ctrl+K → open search
- Escape → close modals
- Enter → confirm primary action

PERSISTENCE:
- All generated test plans + test cases saved to localStorage
- Survives page refresh
- "Clear All Data" option in settings

🗂️ Complete App State Structure
javascript{
  mode: 'DEMO' | 'LIVE',
  config: {
    jiraUrl, jiraEmail, jiraToken, projectKey,
    anthropicKey, defaultFramework
  },
  jiraStories: [],          // fetched or mock stories
  selectedStories: [],      // IDs of selected stories
  testPlan: null,           // generated test plan object
  testCases: [],            // all generated test cases
  activeTab: 'jira',        // current sidebar tab
  selectedTestCase: null,   // for code generation
  generatedCode: {          // code per test case ID
    [tcId]: { selenium: '', playwright: '' }
  }
}

🚀 Build Instructions
1. Build as a SINGLE self-contained React JSX artifact
2. Use Tailwind CSS via CDN for styling
3. Import Lucide icons from lucide-react
4. All Claude API calls via fetch to Anthropic endpoint
5. No backend needed — fully client-side
6. Demo mode works with zero configuration on first load
7. Jira calls routed through a CORS proxy if needed:
   https://corsproxy.io/?{jiraUrl}
8. Handle all errors gracefully with fallback to mock data
9. Add subtle entrance animations using CSS transitions
10. Ensure the app feels as polished as a real SaaS product