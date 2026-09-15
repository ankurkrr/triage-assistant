import fs from 'fs';

const TEST_CASES = [
  { id: 26, query: 'Our customer wants to change the billing address on their account.' },
  { id: 27, query: 'The payment gateway is rejecting every transaction since this morning.' },
  { id: 28, query: 'A user forgot their password and cannot complete the reset process.' },
  { id: 29, query: 'We need a quotation for 200 enterprise licenses.' },
  { id: 30, query: 'The dashboard takes more than 30 seconds to load.' },
  { id: 31, query: 'Please explain the differences between your Basic and Enterprise plans.' },
  { id: 32, query: 'We were charged for a subscription after cancelling it.' },
  { id: 33, query: 'Our team needs help understanding how to configure the API.' },
  { id: 34, query: 'The application is showing a blank screen after the latest deployment.' },
  { id: 35, query: 'A customer is requesting a refund for an accidental purchase.' },
  { id: 36, query: 'We want to schedule a product demo for next week.' },
  { id: 37, query: 'The monthly invoice contains incorrect usage numbers.' },
  { id: 38, query: 'Several employees cannot access the platform because their accounts are locked.' },
  { id: 39, query: 'Can you provide documentation for integrating your service with Slack?' },
  { id: 40, query: 'We are interested in becoming a technology partner.' },
  { id: 41, query: 'The mobile application closes whenever we open the reports section.' },
  { id: 42, query: 'Our organization needs an urgent update to the company billing details.' },
  { id: 43, query: 'Please send information about your available enterprise security features.' },
  { id: 44, query: 'The export file is missing several records.' },
  { id: 45, query: 'We would like to discuss a joint marketing campaign.' },
  { id: 46, query: 'The service is completely unavailable for all users in our organization.' },
  { id: 47, query: 'A customer says their invoice was paid, but the account still shows an unpaid balance.' },
  { id: 48, query: 'We need help understanding the steps required to invite new team members.' },
  { id: 49, query: 'The API returns a 500 error when we upload a CSV file.' },
  { id: 50, query: 'Can someone from your sales team contact us about a large-volume contract?' },
  { id: 51, query: 'The customer portal is displaying outdated account information.' },
  { id: 52, query: 'We need to update the bank account used for subscription payments.' },
  { id: 53, query: 'Our users are receiving an error when downloading PDF invoices.' },
  { id: 54, query: 'Please share the pricing for your API usage.' },
  { id: 55, query: 'The system is sending the same notification multiple times.' },
  { id: 56, query: 'We need to add five new administrators to our workspace.' },
  { id: 57, query: 'The customer claims they never authorized this payment.' },
  { id: 58, query: 'Can you arrange a technical onboarding session for our team?' },
  { id: 59, query: 'The search function returns no results even when matching records exist.' },
  { id: 60, query: 'We are evaluating your platform for a government project.' },
  { id: 61, query: 'The account settings page is not saving changes.' },
  { id: 62, query: 'Our subscription renewal failed, but the card is valid.' },
  { id: 63, query: 'We want to know whether your platform supports SSO.' },
  { id: 64, query: 'The application became extremely slow after we imported a large dataset.' },
  { id: 65, query: 'Please connect us with someone who can discuss reseller opportunities.' },
  { id: 66, query: 'A user is unable to receive the two-factor authentication code.' },
  { id: 67, query: 'We need a copy of all invoices issued during the previous financial year.' },
  { id: 68, query: 'The platform is showing incorrect data in the analytics dashboard.' },
  { id: 69, query: 'Can you provide a trial account for our evaluation team?' },
  { id: 70, query: 'The integration stopped working after we rotated our API credentials.' },
  { id: 71, query: 'We need to change the billing cycle from monthly to annual.' },
  { id: 72, query: 'Our entire department is receiving permission-denied errors.' },
  { id: 73, query: 'The customer is asking whether a discount is available for an annual contract.' },
  { id: 74, query: 'The CSV import completes successfully, but some records are missing.' },
  { id: 75, query: 'We would like to explore a co-selling partnership with your company.' },
  { id: 76, query: 'The invoice total does not match the amount shown during checkout.' },
  { id: 77, query: 'The application crashes only when users access it from Safari.' },
  { id: 78, query: 'Please explain how to configure webhooks for our account.' },
  { id: 79, query: 'We need immediate assistance because our production environment is unavailable.' },
  { id: 80, query: 'Our company is interested in purchasing additional seats for the existing contract.' },
];

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log(`Starting execution of ${TEST_CASES.length} test cases...`);
  const results = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    console.log(`[${i + 1}/${TEST_CASES.length}] Running Test ${tc.id}: "${tc.query}"`);
    
    let resData = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const startTime = Date.now();
      try {
        const response = await fetch('http://localhost:3000/api/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request: tc.query }),
        });

        const duration = Date.now() - startTime;
        const data = await response.json();

        if (response.ok) {
          resData = {
            id: tc.id,
            query: tc.query,
            status: response.status,
            durationMs: duration,
            summary: data.summary,
            category: data.category,
            priority: data.priority,
            priorityReason: data.priorityReason,
            owner: data.owner,
            draftResponse: data.draftResponse,
          };
          console.log(`  -> SUCCESS [${data.category} | ${data.priority} | ${data.owner}] in ${duration}ms`);
          break;
        } else {
          console.log(`  -> API Error (Status ${response.status}):`, data?.error?.message || data);
          if (response.status === 429 || response.status === 503 || response.status === 504) {
            console.log(`  -> Rate limit or capacity hit. Waiting 5s before attempt ${attempts + 1}...`);
            await delay(5000);
          } else {
            resData = {
              id: tc.id,
              query: tc.query,
              status: response.status,
              durationMs: duration,
              error: data?.error?.message || 'Error occurred',
            };
            break;
          }
        }
      } catch (err) {
        console.error(`  -> Network error on attempt ${attempts}:`, err.message);
        await delay(3000);
      }
    }

    if (!resData) {
      resData = {
        id: tc.id,
        query: tc.query,
        status: 500,
        error: 'Failed after multiple attempts',
      };
    }

    results.push(resData);
    // Pacing delay to avoid rate limit spikes
    await delay(1200);
  }

  console.log('\nAll test cases executed. Writing output files...');

  // 1. Text File Output
  let textOutput = '='.repeat(80) + '\n';
  textOutput += 'AI REQUEST TRIAGE ASSISTANT — TEST EXECUTION RESULTS (TESTS 26 - 80)\n';
  textOutput += `Executed at: ${new Date().toISOString()}\n`;
  textOutput += `Total Cases: ${results.length}\n`;
  textOutput += '='.repeat(80) + '\n\n';

  for (const r of results) {
    textOutput += `TEST ${r.id}\n`;
    textOutput += `- Request Query: "${r.query}"\n`;
    if (r.error) {
      textOutput += `- Status: FAILED (${r.status})\n`;
      textOutput += `- Error: ${r.error}\n`;
    } else {
      textOutput += `- Executive Summary: ${r.summary}\n`;
      textOutput += `- Category: ${r.category}\n`;
      textOutput += `- Priority: ${r.priority}\n`;
      textOutput += `- Priority Reason: ${r.priorityReason}\n`;
      textOutput += `- Assigned Owner: ${r.owner}\n`;
      textOutput += `- Draft Response:\n    "${r.draftResponse}"\n`;
      textOutput += `- Response Latency: ${r.durationMs}ms\n`;
    }
    textOutput += '-'.repeat(80) + '\n\n';
  }

  fs.writeFileSync('test_cases_results.txt', textOutput, 'utf8');
  console.log('Saved test_cases_results.txt');

  // 2. Markdown Output
  let mdOutput = '# AI Request Triage Assistant — Test Execution Report (Tests 26 – 80)\n\n';
  mdOutput += `**Executed at:** ${new Date().toISOString()}  \n`;
  mdOutput += `**Total Scenarios Tested:** ${results.length}  \n\n`;
  mdOutput += '| Test ID | Request Query | Category | Priority | Owner |\n';
  mdOutput += '| :--- | :--- | :--- | :--- | :--- |\n';
  for (const r of results) {
    const q = r.query.length > 50 ? r.query.slice(0, 47) + '...' : r.query;
    mdOutput += `| Test ${r.id} | "${q}" | **${r.category || 'N/A'}** | **${r.priority || 'N/A'}** | ${r.owner || 'N/A'} |\n`;
  }
  mdOutput += '\n---\n\n## Detailed Test Case Responses\n\n';

  for (const r of results) {
    mdOutput += `### Test Case ${r.id}\n\n`;
    mdOutput += `> **Input Request:** "${r.query}"\n\n`;
    if (r.error) {
      mdOutput += `*Status: Failed (${r.status}) - ${r.error}*\n\n`;
    } else {
      mdOutput += `- **Executive Summary:** ${r.summary}\n`;
      mdOutput += `- **Category:** \`${r.category}\`\n`;
      mdOutput += `- **Priority:** \`${r.priority}\`\n`;
      mdOutput += `- **Priority Reason:** ${r.priorityReason}\n`;
      mdOutput += `- **Recommended Owner:** \`${r.owner}\`\n`;
      mdOutput += `- **Draft Response:**\n\n> ${r.draftResponse}\n\n`;
      mdOutput += `*Latency: ${r.durationMs}ms*\n\n`;
    }
    mdOutput += '---\n\n';
  }

  fs.writeFileSync('test_cases_results.md', mdOutput, 'utf8');
  console.log('Saved test_cases_results.md');

  // 3. Word Document (.doc format) HTML
  let docHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>AI Request Triage Assistant - Test Results</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #222; line-height: 1.5; }
  h1 { color: #1a365d; border-bottom: 2px solid #2b6cb0; padding-bottom: 8px; }
  h2 { color: #2b6cb0; margin-top: 30px; }
  .test-card { border: 1px solid #cbd5e0; background: #f7fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .query { font-size: 15px; font-weight: bold; color: #2d3748; background: #edf2f7; padding: 10px; border-left: 4px solid #3182ce; margin-bottom: 12px; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .meta-table td { padding: 6px 12px; border: 1px solid #e2e8f0; font-size: 14px; }
  .meta-label { font-weight: bold; background: #edf2f7; width: 160px; color: #4a5568; }
  .draft-box { background: #ffffff; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; font-style: italic; color: #2d3748; }
  .badge { font-weight: bold; padding: 2px 8px; border-radius: 4px; display: inline-block; }
  .badge-urgent { background: #fed7d7; color: #9b2c2c; }
  .badge-high { background: #feebc8; color: #7b341e; }
  .badge-medium { background: #bee3f8; color: #2c5282; }
  .badge-low { background: #e2e8f0; color: #4a5568; }
</style>
</head>
<body>
<h1>AI Request Triage Assistant — Test Cases Evaluation Report</h1>
<p><strong>Test Range:</strong> Test 26 to Test 80 (55 Test Cases)<br>
<strong>Execution Timestamp:</strong> ${new Date().toLocaleString()}<br>
<strong>Environment:</strong> Localhost (http://localhost:3000)<br>
<strong>AI Provider:</strong> Google Gemini (Flash-Lite with Multi-Key Fallback)</p>

<h2>Summary Table</h2>
<table style="width:100%; border-collapse: collapse; margin-bottom: 30px;" border="1" cellpadding="6">
  <tr style="background:#2b6cb0; color:white;">
    <th>Test ID</th>
    <th>Request Query</th>
    <th>Category</th>
    <th>Priority</th>
    <th>Assigned Owner</th>
  </tr>
`;

  for (const r of results) {
    docHtml += `
  <tr>
    <td style="text-align:center; font-weight:bold;">Test ${r.id}</td>
    <td>${r.query}</td>
    <td style="text-align:center;">${r.category || 'N/A'}</td>
    <td style="text-align:center;">${r.priority || 'N/A'}</td>
    <td style="text-align:center;">${r.owner || 'N/A'}</td>
  </tr>`;
  }

  docHtml += `</table>\n<h2>Detailed Test Cases & Generated Responses</h2>\n`;

  for (const r of results) {
    const priorityClass = r.priority === 'Urgent' ? 'badge-urgent' : r.priority === 'High' ? 'badge-high' : r.priority === 'Medium' ? 'badge-medium' : 'badge-low';
    docHtml += `
<div class="test-card">
  <div style="font-weight:bold; color:#2b6cb0; font-size:16px; margin-bottom:6px;">Test Case ${r.id}</div>
  <div class="query">"${r.query}"</div>
  <table class="meta-table">
    <tr>
      <td class="meta-label">Category</td>
      <td><strong>${r.category || 'N/A'}</strong></td>
      <td class="meta-label">Recommended Owner</td>
      <td><strong>${r.owner || 'N/A'}</strong></td>
    </tr>
    <tr>
      <td class="meta-label">Priority</td>
      <td><span class="badge ${priorityClass}">${r.priority || 'N/A'}</span></td>
      <td class="meta-label">Response Time</td>
      <td>${r.durationMs || 0} ms</td>
    </tr>
    <tr>
      <td class="meta-label">Executive Summary</td>
      <td colspan="3">${r.summary || 'N/A'}</td>
    </tr>
    <tr>
      <td class="meta-label">Priority Reason</td>
      <td colspan="3">${r.priorityReason || 'N/A'}</td>
    </tr>
  </table>
  <div style="font-weight:bold; margin-bottom:4px; font-size:13px; color:#4a5568;">Generated Reviewable Draft Response:</div>
  <div class="draft-box">"${r.draftResponse || 'N/A'}"</div>
</div>
`;
  }

  docHtml += `</body></html>`;

  fs.writeFileSync('test_cases_results.doc', docHtml, 'utf8');
  console.log('Saved test_cases_results.doc (Word Document format)');

  console.log('\nBATCH EXECUTION COMPLETE!');
}

runTests().catch(console.error);
