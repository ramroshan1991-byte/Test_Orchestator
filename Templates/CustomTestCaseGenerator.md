The Test Cases screen must support TWO independent ways to generate test cases.
Both modes output test cases into the SAME unified dashboard/list.

MODE A — From Test Plan (existing flow):
  Triggered when user arrives from Test Plan screen.
  Uses the selected Jira story + generated test plan as context.
  Button: "Generate from Test Plan" (pre-filled, one-click)

MODE B — Custom Test Case Generator (NEW — direct access):
  Accessible directly from the Test Cases tab WITHOUT going through 
  Jira → Test Plan flow first.
  User manually describes what they want to test.
  No Jira story or test plan required.
  Should be the DEFAULT view if no test plan has been generated yet.

Layout — Test Cases Screen
┌─────────────────────────────────────────────────────────────┐
│  ✅ Test Cases                          [+ Custom Generate] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌────────────────────────────┐   │
│  │  📋 From Test Plan  │  │  ✏️ Custom Generator       │   │
│  │  (if plan exists)   │  │  (always available)        │   │
│  └─────────────────────┘  └────────────────────────────┘   │
│                                                             │
│  ─────────────────── Generated Test Cases ───────────────  │
│  [Search] [Filter: Priority ▼] [Type ▼] [Story ▼] [Export] │
│                                                             │
│  TC_001 card | TC_002 card | TC_003 card ...               │
└─────────────────────────────────────────────────────────────┘

TAB BEHAVIOR:
- "From Test Plan" tab is disabled/grayed if no test plan exists yet,
  with tooltip: "Generate a test plan first from the Jira screen"
- "Custom Generator" tab is ALWAYS enabled
- Both tabs produce test cases that appear in the shared list below
- Test cases from custom generator are tagged with source: "Custom"
- Test cases from test plan are tagged with source: story ID e.g. "QA-101"

Custom Test Case Generator Panel
A clean form panel that appears when "Custom Generator" tab is active.
User fills in as much or as little as they want — all fields optional 
except Scenario (the only required field).

┌──────────────────────────────────────────────────────────────┐
│  ✏️  Custom Test Case Generator                              │
│  Generate test cases directly — no Jira or test plan needed  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Feature / Module Name *                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  e.g. Login Page, Payment Flow, Search Feature         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Test Scenario / What to Test *  (required)                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Describe what you want to test in plain English.      │  │
│  │                                                        │  │
│  │  e.g. "Test the login functionality with valid and     │  │
│  │  invalid credentials, session timeout, remember me     │  │
│  │  checkbox, and forgot password flow"                   │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Acceptance Criteria  (optional)                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Paste acceptance criteria if available                │  │
│  │  (one per line or as bullet points)                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Application Type                                            │
│  ● Web App   ○ Mobile App   ○ API / Backend   ○ Desktop      │
│                                                              │
│  Priority Focus                                              │
│  ● All   ○ Critical Only   ○ High & Above   ○ Custom         │
│                                                              │
│  Test Case Types to Generate  (multi-select chips)           │
│  [✅ Positive] [✅ Negative] [✅ Edge Case]                  │
│  [✅ Boundary] [☐ UI/UX]  [☐ API]  [☐ Performance]          │
│                                                              │
│  Number of Test Cases                                        │
│  ○ Auto (AI decides)   ○ 5-8   ● 8-12   ○ 12-20             │
│                                                              │
│  Additional Context  (optional)                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Tech stack, known edge cases, environment details,    │  │
│  │  or any specific scenarios to include/exclude          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [ 🔄 Clear Form ]        [ ⚡ Generate Test Cases ]         │
└──────────────────────────────────────────────────────────────┘

UX Behavior — Custom Generator
FORM VALIDATION:
- "Scenario" field is the only required field
- If empty and user clicks Generate → shake animation + red border + 
  "Please describe what you want to test"
- All other fields are optional with smart defaults

GENERATION FLOW:
1. User fills form → clicks "⚡ Generate Test Cases"
2. Button changes to "⏳ Generating..." + disabled
3. Loading skeleton cards appear in the test cases list below 
   (show 4 placeholder cards while waiting)
4. On success:
   - New test cases prepended to the shared test case list
   - Smooth fade-in animation for each new card
   - Toast: "✅ 10 test cases generated for '{module}'"
   - Form collapses (or stays open with a "Generate More" option)
   - Auto-scroll to the test cases list
5. On error:
   - Toast: "❌ Generation failed — please try again"
   - Form stays filled (don't clear on error)

AFTER GENERATION:
- Show a summary banner above new results:
  ┌──────────────────────────────────────────────────────────┐
  │ ✅ Generated 10 test cases for "Login Functionality"     │
  │    3 Positive · 4 Negative · 2 Edge Case · 1 Boundary   │
  │                          [Generate More] [Clear Results] │
  └──────────────────────────────────────────────────────────┘
- "Generate More" reopens the form pre-filled with same inputs
- User can edit scenario and generate additional test cases 
  which ADD to (not replace) the existing list

FORM PERSISTENCE:
- Save last used form values to localStorage key 'to_custom_form'
- Restore on next visit so user doesn't re-type everything
- "🔄 Clear Form" resets all fields and clears localStorage entry

Unified Test Case List — Source Tagging
All test cases regardless of source appear in one shared list.
Distinguish their origin using a source tag on each card:

FROM JIRA STORY:    [🔗 QA-101]  ← blue badge, story ID
FROM TEST PLAN:     [📋 Plan]    ← purple badge
FROM CUSTOM:        [✏️ Custom]  ← amber badge

Add a "Source" filter dropdown to the filter bar:
[All Sources ▼] → All | From Jira | From Test Plan | Custom

This lets QA engineers manage a single unified test suite 
regardless of how individual test cases were created.


Empty State — Test Cases Screen (no cases yet)

When no test cases exist, show TWO CTAs side by side — not just one:

┌─────────────────────────────────────────────────────────┐
│                                                         │
│              📋 No Test Cases Yet                       │
│                                                         │
│    Generate test cases using one of these methods:      │
│                                                         │
│  ┌──────────────────────┐  ┌────────────────────────┐   │
│  │   🔗 From Jira       │  │   ✏️ Custom Generator  │   │
│  │                      │  │                        │   │
│  │  Fetch user stories  │  │  Describe a scenario   │   │
│  │  from Jira and auto- │  │  and generate test     │   │
│  │  generate test cases │  │  cases instantly       │   │
│  │  via test plan       │  │  without Jira          │   │
│  │                      │  │                        │   │
│  │  [Go to Jira →]      │  │  [Open Generator →]    │   │
│  └──────────────────────┘  └────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

