export const mockStories = [
  {
    id: 'QA-101',
    title: 'User Login with Email and Password',
    description:
      'Implement user authentication with email and password credentials',
    priority: 'High',
    status: 'In Progress',
    assignee: 'John Doe',
    storyPoints: 8,
    acceptanceCriteria:
      'User should be able to login with valid credentials, receive appropriate error messages for invalid credentials',
  },
  {
    id: 'QA-102',
    title: 'Product Search Functionality',
    description: 'Add search feature to find products by name, category, or tags',
    priority: 'High',
    status: 'To Do',
    assignee: 'Jane Smith',
    storyPoints: 5,
    acceptanceCriteria:
      'Search should return relevant results within 2 seconds, support filters',
  },
  {
    id: 'QA-103',
    title: 'Shopping Cart Total Calculation',
    description:
      'Calculate and display correct total in shopping cart including tax and shipping',
    priority: 'Medium',
    status: 'To Do',
    assignee: 'Bob Wilson',
    storyPoints: 3,
    acceptanceCriteria:
      'Total should include all items, apply tax correctly, show shipping cost',
  },
];

export const mockTestPlan = {
  objective: 'Ensure user authentication works correctly across all scenarios',
  scope: {
    in_scope: [
      'Email and password validation',
      'Session creation',
      'Error handling',
    ],
    out_of_scope: ['Payment processing', 'Account recovery'],
  },
  test_types: ['Functional', 'Security', 'API'],
  entry_criteria: ['Application deployed to test environment', 'Test data ready'],
  exit_criteria: [
    'All critical tests passed',
    '100% code coverage',
    'No open severity 1 bugs',
  ],
  risks: [
    'Database connectivity issues',
    'Third-party service downtime',
  ],
  test_environment: {
    browser: ['Chrome', 'Firefox', 'Safari'],
    os: ['Windows', 'macOS', 'Linux'],
    devices: ['Desktop', 'Tablet', 'Mobile'],
  },
  estimated_effort_hours: 40,
};

export const mockTestCases = [
  {
    id: 'TC_001',
    title: 'Valid Login with Correct Credentials',
    module: 'Authentication',
    priority: 'High',
    type: 'Positive',
    preconditions: ['User is on login page', 'Database is accessible'],
    test_steps: [
      {
        step_number: 1,
        action: 'Enter valid email',
        expected_result: 'Email field accepts input',
      },
      {
        step_number: 2,
        action: 'Enter valid password',
        expected_result: 'Password is masked',
      },
      {
        step_number: 3,
        action: 'Click Login button',
        expected_result: 'User is redirected to dashboard',
      },
    ],
    test_data: { email: 'test@example.com', password: 'TestPass123!' },
    expected_outcome: 'User successfully logged in and session created',
    automation_feasibility: 'Yes',
    status: 'Not Started',
  },
  {
    id: 'TC_002',
    title: 'Login with Invalid Email Format',
    module: 'Authentication',
    priority: 'High',
    type: 'Negative',
    preconditions: ['User is on login page'],
    test_steps: [
      {
        step_number: 1,
        action: 'Enter invalid email format',
        expected_result: 'Email field shows validation error',
      },
    ],
    test_data: { email: 'invalidemail', password: 'password' },
    expected_outcome: 'Error message displayed: Invalid email format',
    automation_feasibility: 'Yes',
    status: 'Not Started',
  },
];
