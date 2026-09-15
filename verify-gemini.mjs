const BASE_URL = 'http://localhost:3000';

const VALID_CATEGORIES = ['Sales', 'Support', 'Billing', 'Technical', 'Other'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const VALID_OWNERS = ['Sales Team', 'Client Success', 'Finance', 'Engineering'];
const EXACT_KEYS = ['category', 'draftResponse', 'owner', 'priority', 'priorityReason', 'summary'];

const geminiScenarios = [
  {
    id: 1,
    name: 'Password reset emails not arriving',
    request: 'Password reset emails are not arriving for several users.',
  },
  {
    id: 2,
    name: 'Mobile app crash during upload',
    request: 'The mobile app crashes whenever a user uploads a large image.',
  },
  {
    id: 3,
    name: 'Duplicate subscription charge',
    request: 'A customer was charged twice for the same subscription.',
  },
  {
    id: 4,
    name: 'Enterprise product demonstration',
    request: 'A prospective enterprise customer wants a product demonstration.',
  },
  {
    id: 5,
    name: 'Exporting a monthly report',
    request: 'We need help exporting our monthly report.',
  },
  {
    id: 6,
    name: 'Entire team unable to access the platform',
    request: 'Our entire team is unable to access the platform.',
  },
  {
    id: 7,
    name: 'Strategic partnership proposal',
    request: 'We would like to discuss a strategic partnership.',
  },
];

async function runGeminiVerification() {
  console.log('--- Starting Gemini Verification Suite ---\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const scenario of geminiScenarios) {
    try {
      // Add brief delay to respect API rate limits (15 RPM)
      await new Promise((r) => setTimeout(r, 1500));

      const res = await fetch(`${BASE_URL}/api/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: scenario.request }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (res.status !== 200) {
        failed++;
        results.push({
          scenario: scenario.name,
          status: 'FAIL',
          reason: `HTTP ${res.status}: ${JSON.stringify(data)}`,
        });
        continue;
      }

      const keys = Object.keys(data || {}).sort();
      const keysMatch = JSON.stringify(keys) === JSON.stringify(EXACT_KEYS);
      const noAssignedTeam = !('assignedTeam' in (data || {}));
      const categoryValid = VALID_CATEGORIES.includes(data?.category);
      const priorityValid = VALID_PRIORITIES.includes(data?.priority);
      const ownerValid = VALID_OWNERS.includes(data?.owner);
      const summaryValid = typeof data?.summary === 'string' && data.summary.trim().length > 0;
      const priorityReasonValid = typeof data?.priorityReason === 'string' && data.priorityReason.trim().length > 0;
      const draftResponseValid = typeof data?.draftResponse === 'string' && data.draftResponse.trim().length > 0;

      const rawText = JSON.stringify(data).toLowerCase();
      const noLeak =
        !rawText.includes('api_key') &&
        !rawText.includes('stack') &&
        !rawText.includes('node_modules') &&
        !rawText.includes('c:\\');

      const isValid =
        keysMatch &&
        noAssignedTeam &&
        categoryValid &&
        priorityValid &&
        ownerValid &&
        summaryValid &&
        priorityReasonValid &&
        draftResponseValid &&
        noLeak;

      if (isValid) {
        passed++;
        results.push({
          scenario: scenario.name,
          status: 'PASS',
          category: data.category,
          priority: data.priority,
          owner: data.owner,
          summary: data.summary,
        });
      } else {
        failed++;
        results.push({
          scenario: scenario.name,
          status: 'FAIL',
          reason: 'Schema, enum, or security violation',
          data,
        });
      }
    } catch (err) {
      failed++;
      results.push({
        scenario: scenario.name,
        status: 'FAIL',
        reason: err.message,
      });
    }
  }

  const total = passed + failed;
  console.log(`TOTAL: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}\n`);

  for (const r of results) {
    if (r.status === 'PASS') {
      console.log(`✓ [${r.scenario}] -> Category: ${r.category} | Priority: ${r.priority} | Owner: ${r.owner}`);
      console.log(`  Summary: "${r.summary}"\n`);
    } else {
      console.log(`✗ [${r.scenario}] FAILED: ${r.reason}\n`);
    }
  }
}

runGeminiVerification();
