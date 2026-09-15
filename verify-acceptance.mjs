const BASE_URL = 'http://localhost:3000';

const VALID_CATEGORIES = ['Sales', 'Support', 'Billing', 'Technical', 'Other'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const VALID_OWNERS = ['Sales Team', 'Client Success', 'Finance', 'Engineering'];
const EXACT_KEYS = ['category', 'draftResponse', 'owner', 'priority', 'priorityReason', 'summary'];

const validScenarios = [
  {
    name: 'Access removal / credential revocation',
    payload: { request: 'Immediate access removal and revoke access for terminated employee.' },
    expectedCategory: 'Technical',
    expectedPriority: 'Urgent',
    expectedOwner: 'Engineering',
  },
  {
    name: 'Login failure or portal outage',
    payload: { request: 'Customer cannot log in due to a portal error.' },
    expectedCategory: 'Technical',
    expectedPriority: 'Urgent',
    expectedOwner: 'Engineering',
  },
  {
    name: 'Website loading slowly',
    payload: { request: 'Website is loading slowly with severe latency.' },
    expectedCategory: 'Technical',
    expectedPriority: 'Medium',
    expectedOwner: 'Engineering',
  },
  {
    name: 'Invoice or billing discrepancy',
    payload: { request: 'Discrepancy in billing and invoice amount.' },
    expectedCategory: 'Billing',
    expectedPriority: 'Medium',
    expectedOwner: 'Finance',
  },
  {
    name: 'Pricing or product information',
    payload: { request: 'Requesting enterprise pricing and product details.' },
    expectedCategory: 'Sales',
    expectedPriority: 'Medium',
    expectedOwner: 'Sales Team',
  },
  {
    name: 'Partnership or collaboration request',
    payload: { request: 'Exploring strategic partnership and collaboration opportunities.' },
    expectedCategory: 'Other',
    expectedPriority: 'Low',
    expectedOwner: 'Client Success',
  },
  {
    name: 'Unknown/general request',
    payload: { request: 'We need help reviewing our project quarterly milestones and deliverables.' },
    expectedCategory: 'Support',
    expectedPriority: 'Medium',
    expectedOwner: 'Client Success',
  },
];

const invalidScenarios = [
  {
    name: 'Empty request',
    body: JSON.stringify({ request: '' }),
    headers: { 'Content-Type': 'application/json' },
  },
  {
    name: 'Whitespace-only request',
    body: JSON.stringify({ request: '     ' }),
    headers: { 'Content-Type': 'application/json' },
  },
  {
    name: 'Missing request field',
    body: JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' },
  },
  {
    name: 'Invalid JSON',
    body: '{"invalid_json": true,',
    headers: { 'Content-Type': 'application/json' },
  },
  {
    name: 'Overlong request',
    body: JSON.stringify({ request: 'a'.repeat(10001) }),
    headers: { 'Content-Type': 'application/json' },
  },
  {
    name: 'Non-string request',
    body: JSON.stringify({ request: 12345 }),
    headers: { 'Content-Type': 'application/json' },
  },
  {
    name: 'Null request field',
    body: JSON.stringify({ request: null }),
    headers: { 'Content-Type': 'application/json' },
  },
];

async function runVerification() {
  let passed = 0;
  let failed = 0;
  const failures = [];

  // 1. Valid scenarios (7)
  for (const scenario of validScenarios) {
    try {
      const res = await fetch(`${BASE_URL}/api/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario.payload),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      const keys = Object.keys(data || {}).sort();
      const keysMatch = JSON.stringify(keys) === JSON.stringify(EXACT_KEYS);
      const noAssignedTeam = !('assignedTeam' in (data || {}));
      const categoryValid = VALID_CATEGORIES.includes(data?.category);
      const priorityValid = VALID_PRIORITIES.includes(data?.priority);
      const ownerValid = VALID_OWNERS.includes(data?.owner);
      const matchExpected =
        data?.category === scenario.expectedCategory &&
        data?.priority === scenario.expectedPriority &&
        data?.owner === scenario.expectedOwner;

      if (
        res.status === 200 &&
        keysMatch &&
        noAssignedTeam &&
        categoryValid &&
        priorityValid &&
        ownerValid &&
        matchExpected
      ) {
        passed++;
      } else {
        failed++;
        failures.push({
          scenario: scenario.name,
          actual: { status: res.status, body: data },
        });
      }
    } catch (err) {
      failed++;
      failures.push({
        scenario: scenario.name,
        actual: { error: err.message },
      });
    }
  }

  // 2. Invalid scenarios (7)
  for (const scenario of invalidScenarios) {
    try {
      const res = await fetch(`${BASE_URL}/api/triage`, {
        method: 'POST',
        headers: scenario.headers,
        body: scenario.body,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      const hasErrorShape =
        data &&
        typeof data.error === 'object' &&
        typeof data.error.code === 'string' &&
        typeof data.error.message === 'string';

      const lowerText = text.toLowerCase();
      const noLeakage =
        !lowerText.includes('node_modules') &&
        !lowerText.includes('stack') &&
        !lowerText.includes('c:\\') &&
        !lowerText.includes('api_key') &&
        !lowerText.includes('mockaiprovider');

      if (res.status === 400 && hasErrorShape && noLeakage) {
        passed++;
      } else {
        failed++;
        failures.push({
          scenario: scenario.name,
          actual: { status: res.status, body: data },
        });
      }
    } catch (err) {
      failed++;
      failures.push({
        scenario: scenario.name,
        actual: { error: err.message },
      });
    }
  }

  // 3. GET /api/triage returns 405 (1)
  try {
    const res = await fetch(`${BASE_URL}/api/triage`, {
      method: 'GET',
    });

    if (res.status === 405) {
      passed++;
    } else {
      failed++;
      failures.push({
        scenario: 'GET /api/triage returns 405',
        actual: { status: res.status },
      });
    }
  } catch (err) {
    failed++;
    failures.push({
      scenario: 'GET /api/triage returns 405',
      actual: { error: err.message },
    });
  }

  const total = passed + failed;
  console.log(`TOTAL: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`Scenario: ${f.scenario}`);
      console.log(`Actual Response: ${JSON.stringify(f.actual, null, 2)}`);
    }
  }
}

runVerification();
