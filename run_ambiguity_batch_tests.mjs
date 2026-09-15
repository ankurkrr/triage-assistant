import fs from 'fs';

const AMBIGUITY_TEST_CASES = [
  // A. Support vs Technical
  { id: 81, section: 'A. Support vs Technical', query: 'We need help adding new users to our workspace.' },
  { id: 82, section: 'A. Support vs Technical', query: 'Please guide us through changing user permissions.' },
  { id: 83, section: 'A. Support vs Technical', query: 'Our administrator cannot find the option to invite a new member.' },
  { id: 84, section: 'A. Support vs Technical', query: 'We need to deactivate three former employees.' },
  { id: 85, section: 'A. Support vs Technical', query: 'Please explain how to configure role-based access.' },
  { id: 86, section: 'A. Support vs Technical', query: 'We are unable to change a user’s role because the save button does nothing.' },
  { id: 87, section: 'A. Support vs Technical', query: 'The user-management page returns an error whenever we open it.' },
  { id: 88, section: 'A. Support vs Technical', query: 'We need help setting up our workspace for a new department.' },
  { id: 89, section: 'A. Support vs Technical', query: 'Our team does not understand how to create custom roles.' },
  { id: 90, section: 'A. Support vs Technical', query: 'Custom roles were configured, but users are still receiving the wrong permissions.' },

  // B. Sales vs Support
  { id: 91, section: 'B. Sales vs Support', query: 'Can you explain whether the Enterprise plan includes SSO?' },
  { id: 92, section: 'B. Sales vs Support', query: 'We are already customers and need help enabling SSO.' },
  { id: 93, section: 'B. Sales vs Support', query: 'We are comparing your platform with two competitors.' },
  { id: 94, section: 'B. Sales vs Support', query: 'Can you explain how to use the features included in our current plan?' },
  { id: 95, section: 'B. Sales vs Support', query: 'We want to upgrade our existing subscription.' },
  { id: 96, section: 'B. Sales vs Support', query: 'Please help us understand the features available in our current subscription.' },
  { id: 97, section: 'B. Sales vs Support', query: 'We need pricing information before deciding whether to purchase.' },
  { id: 98, section: 'B. Sales vs Support', query: 'We have already purchased the Enterprise plan but cannot access its features.' },
  { id: 99, section: 'B. Sales vs Support', query: 'Can someone explain whether additional seats can be purchased?' },
  { id: 100, section: 'B. Sales vs Support', query: 'We need help adding the additional seats we have already purchased.' },

  // C. Technical vs Support
  { id: 101, section: 'C. Technical vs Support', query: 'Please explain how to configure webhooks.' },
  { id: 102, section: 'C. Technical vs Support', query: 'We followed the webhook documentation, but events are not being delivered.' },
  { id: 103, section: 'C. Technical vs Support', query: 'Our API integration is returning an authentication error.' },
  { id: 104, section: 'C. Technical vs Support', query: 'Can you share the steps for generating an API key?' },
  { id: 105, section: 'C. Technical vs Support', query: 'We generated an API key, but it is rejected by every request.' },
  { id: 106, section: 'C. Technical vs Support', query: 'We need help importing a CSV file.' },
  { id: 107, section: 'C. Technical vs Support', query: 'The CSV import says it completed, but several records are missing.' },
  { id: 108, section: 'C. Technical vs Support', query: 'Our CSV import fails with a validation error.' },
  { id: 109, section: 'C. Technical vs Support', query: 'Please explain how to export data from the platform.' },
  { id: 110, section: 'C. Technical vs Support', query: 'The export completes, but the downloaded file is empty.' },

  // D. Billing vs Support
  { id: 111, section: 'D. Billing vs Support', query: 'Where can I download our previous invoices?' },
  { id: 112, section: 'D. Billing vs Support', query: 'We cannot download our invoices because the invoice page shows an error.' },
  { id: 113, section: 'D. Billing vs Support', query: 'Please explain how to update our billing address.' },
  { id: 114, section: 'D. Billing vs Support', query: 'We updated our billing address, but the invoice still shows the old address.' },
  { id: 115, section: 'D. Billing vs Support', query: 'We need to change the billing contact for our organization.' },
  { id: 116, section: 'D. Billing vs Support', query: 'The billing contact was changed, but notifications are still going to the previous person.' },
  { id: 117, section: 'D. Billing vs Support', query: 'Can you explain the difference between our invoice amount and usage amount?' },
  { id: 118, section: 'D. Billing vs Support', query: 'Our invoice amount is incorrect and does not match our usage.' },
  { id: 119, section: 'D. Billing vs Support', query: 'We need a copy of our payment receipt.' },
  { id: 120, section: 'D. Billing vs Support', query: 'Our payment was successful, but we have not received a receipt.' },

  // E. Priority Ambiguity
  { id: 121, section: 'E. Priority Ambiguity', query: 'One user is unable to log in, but everyone else can access the platform.' },
  { id: 122, section: 'E. Priority Ambiguity', query: 'Five users are unable to log in, but the rest of the organization is working normally.' },
  { id: 123, section: 'E. Priority Ambiguity', query: 'Our entire organization cannot log in.' },
  { id: 124, section: 'E. Priority Ambiguity', query: 'Our production environment is unavailable, and we have a customer deadline in two hours.' },
  { id: 125, section: 'E. Priority Ambiguity', query: 'The dashboard is slow for one user, but all other users are unaffected.' },
  { id: 126, section: 'E. Priority Ambiguity', query: 'The dashboard is slow for most users during business hours.' },
  { id: 127, section: 'E. Priority Ambiguity', query: 'We noticed one incorrect value in a non-critical report.' },
  { id: 128, section: 'E. Priority Ambiguity', query: 'Financial reports are showing incorrect totals before today’s regulatory submission.' },
  { id: 129, section: 'E. Priority Ambiguity', query: 'We need help configuring a feature before next month.' },
  { id: 130, section: 'E. Priority Ambiguity', query: 'We need help configuring a feature before a customer presentation in 20 minutes.' },

  // F. Owner Ambiguity
  { id: 131, section: 'F. Owner Ambiguity', query: 'We want to purchase 100 additional seats, but we also need help provisioning them.' },
  { id: 132, section: 'F. Owner Ambiguity', query: 'We are interested in Enterprise pricing and need technical details about SSO.' },
  { id: 133, section: 'F. Owner Ambiguity', query: 'Our invoice is incorrect, and we believe the usage data is also wrong.' },
  { id: 134, section: 'F. Owner Ambiguity', query: 'We need help with a customer-facing integration that is failing in production.' },
  { id: 135, section: 'F. Owner Ambiguity', query: 'We want to discuss a partnership that includes a joint product integration.' },
  { id: 136, section: 'F. Owner Ambiguity', query: 'We need help preparing security documentation for a sales proposal.' },
  { id: 137, section: 'F. Owner Ambiguity', query: 'Our customer wants a refund, but the payment appears to have been duplicated.' },
  { id: 138, section: 'F. Owner Ambiguity', query: 'We need to change account ownership after an employee leaves the company.' },
  { id: 139, section: 'F. Owner Ambiguity', query: 'We want to invite new users and assign them administrator permissions.' },
  { id: 140, section: 'F. Owner Ambiguity', query: 'We need someone to review our technical architecture before signing the contract.' },

  // G. Other vs Sales
  { id: 141, section: 'G. Other vs Sales', query: 'We would like to explore a strategic partnership with your company.' },
  { id: 142, section: 'G. Other vs Sales', query: 'We want to become a reseller of your product.' },
  { id: 143, section: 'G. Other vs Sales', query: 'We would like to discuss a co-marketing initiative.' },
  { id: 144, section: 'G. Other vs Sales', query: 'We want to purchase your product for our internal team.' },
  { id: 145, section: 'G. Other vs Sales', query: 'We are interested in integrating your product into our own commercial offering.' },
  { id: 146, section: 'G. Other vs Sales', query: 'We want to discuss a joint research initiative.' },
  { id: 147, section: 'G. Other vs Sales', query: 'We are looking for an implementation partner.' },
  { id: 148, section: 'G. Other vs Sales', query: 'We would like to sponsor or participate in your upcoming industry event.' },
  { id: 149, section: 'G. Other vs Sales', query: 'We want to discuss a commercial agreement involving both sales and technology.' },
  { id: 150, section: 'G. Other vs Sales', query: 'We are not looking to purchase yet, but would like to explore a long-term relationship.' },

  // H. Mixed Requests
  { id: 151, section: 'H. Mixed Requests', query: 'Our invoice is incorrect, and we also need help fixing the billing dashboard.' },
  { id: 152, section: 'H. Mixed Requests', query: 'We want to upgrade to Enterprise, but first need confirmation that SSO is supported.' },
  { id: 153, section: 'H. Mixed Requests', query: 'Our users cannot access the platform, and we suspect the issue is related to permissions.' },
  { id: 154, section: 'H. Mixed Requests', query: 'We need five new administrators added before our onboarding session tomorrow.' },
  { id: 155, section: 'H. Mixed Requests', query: 'We are requesting a refund because the application crashed during a critical customer demonstration.' },
  { id: 156, section: 'H. Mixed Requests', query: 'We need technical help integrating the API before signing an enterprise contract.' },
  { id: 157, section: 'H. Mixed Requests', query: 'Our payment failed, and now our entire team has lost access to the platform.' },
  { id: 158, section: 'H. Mixed Requests', query: 'We want to purchase more seats, but the current account administrator has left the company.' },
  { id: 159, section: 'H. Mixed Requests', query: 'We need a product demo and would also like to understand your security certification.' },
  { id: 160, section: 'H. Mixed Requests', query: 'Our CSV export is missing financial records that are required for an audit tomorrow.' },

  // I. Priority Without Explicit Urgency
  { id: 161, section: 'I. Priority Without Explicit Urgency', query: 'The application crashes occasionally when opening reports.' },
  { id: 162, section: 'I. Priority Without Explicit Urgency', query: 'The application crashes every time we open reports.' },
  { id: 163, section: 'I. Priority Without Explicit Urgency', query: 'The application crashes for all users when opening reports.' },
  { id: 164, section: 'I. Priority Without Explicit Urgency', query: 'Our payment failed once, but the next attempt succeeded.' },
  { id: 165, section: 'I. Priority Without Explicit Urgency', query: 'Every payment attempt is failing for our customers.' },
  { id: 166, section: 'I. Priority Without Explicit Urgency', query: 'One customer cannot download an invoice.' },
  { id: 167, section: 'I. Priority Without Explicit Urgency', query: 'No customer can download an invoice.' },
  { id: 168, section: 'I. Priority Without Explicit Urgency', query: 'One employee cannot access a non-critical report.' },
  { id: 169, section: 'I. Priority Without Explicit Urgency', query: 'Our finance team cannot access the reports needed to close the books today.' },
  { id: 170, section: 'I. Priority Without Explicit Urgency', query: 'Our platform is available, but one important workflow is failing intermittently.' },

  // J. Very Short and Underspecified Requests
  { id: 171, section: 'J. Very Short and Underspecified Requests', query: 'Need help with billing.' },
  { id: 172, section: 'J. Very Short and Underspecified Requests', query: 'Login issue.' },
  { id: 173, section: 'J. Very Short and Underspecified Requests', query: 'Need more users.' },
  { id: 174, section: 'J. Very Short and Underspecified Requests', query: 'Invoice problem.' },
  { id: 175, section: 'J. Very Short and Underspecified Requests', query: 'API help.' },
  { id: 176, section: 'J. Very Short and Underspecified Requests', query: 'Want a demo.' },
  { id: 177, section: 'J. Very Short and Underspecified Requests', query: 'Export not working.' },
  { id: 178, section: 'J. Very Short and Underspecified Requests', query: 'Need refund.' },
  { id: 179, section: 'J. Very Short and Underspecified Requests', query: 'Account access.' },
  { id: 180, section: 'J. Very Short and Underspecified Requests', query: 'Partnership inquiry.' },
];

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAmbiguityTests() {
  console.log(`Starting execution of ${AMBIGUITY_TEST_CASES.length} Ambiguity Test Cases (Tests 81 - 180)...`);
  const results = [];

  for (let i = 0; i < AMBIGUITY_TEST_CASES.length; i++) {
    const tc = AMBIGUITY_TEST_CASES[i];
    console.log(`[${i + 1}/${AMBIGUITY_TEST_CASES.length}] Test ${tc.id} (${tc.section}): "${tc.query}"`);

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
            section: tc.section,
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
            console.log(`  -> Rate limit / Capacity / Timeout hit. Waiting 4s before retry...`);
            await delay(4000);
          } else {
            resData = {
              id: tc.id,
              section: tc.section,
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
        section: tc.section,
        query: tc.query,
        status: 500,
        error: 'Failed after multiple attempts',
      };
    }

    results.push(resData);
    // Pacing delay to avoid rate limit spikes
    await delay(1200);
  }

  console.log('\nAll 100 ambiguity test cases executed. Writing output files...');

  // 1. Text File Output
  let textOutput = '='.repeat(80) + '\n';
  textOutput += 'AI REQUEST TRIAGE ASSISTANT — AMBIGUITY TEST EVALUATION RESULTS\n';
  textOutput += 'Test Suite: Tests 81 through 180 (100 Ambiguity-Focused Cases)\n';
  textOutput += `Executed at: ${new Date().toISOString()}\n`;
  textOutput += `Total Cases: ${results.length}\n`;
  textOutput += '='.repeat(80) + '\n\n';

  let currentSection = '';
  for (const r of results) {
    if (r.section !== currentSection) {
      currentSection = r.section;
      textOutput += '\n' + '#'.repeat(80) + '\n';
      textOutput += `SECTION ${currentSection.toUpperCase()}\n`;
      textOutput += '#'.repeat(80) + '\n\n';
    }

    textOutput += `TEST ${r.id}\n`;
    textOutput += `- Section: ${r.section}\n`;
    textOutput += `- Request Query: "${r.query}"\n`;
    if (r.error) {
      textOutput += `- Status: FAILED (${r.status})\n`;
      textOutput += `- Error: ${r.error}\n`;
    } else {
      textOutput += `- Executive Summary: ${r.summary}\n`;
      textOutput += `- Category: ${r.category}\n`;
      textOutput += `- Priority: ${r.priority}\n`;
      textOutput += `- Priority Justification: ${r.priorityReason}\n`;
      textOutput += `- Recommended Owner: ${r.owner}\n`;
      textOutput += `- Draft Response:\n    "${r.draftResponse}"\n`;
      textOutput += `- Response Latency: ${r.durationMs}ms\n`;
    }
    textOutput += '-'.repeat(80) + '\n\n';
  }

  fs.writeFileSync('ambiguity_test_cases_results.txt', textOutput, 'utf8');
  console.log('Saved ambiguity_test_cases_results.txt');

  // 2. Markdown File Output
  let mdOutput = '# AI Request Triage Assistant — Ambiguity Test Evaluation Report\n\n';
  mdOutput += `**Suite:** Tests 81 – 180 (100 Ambiguity-Focused Cases)  \n`;
  mdOutput += `**Executed at:** ${new Date().toISOString()}  \n`;
  mdOutput += `**Total Scenarios Tested:** ${results.length}  \n\n`;

  mdOutput += '## Summary Table\n\n';
  mdOutput += '| Test ID | Section | Request Query | Category | Priority | Owner |\n';
  mdOutput += '| :--- | :--- | :--- | :--- | :--- | :--- |\n';
  for (const r of results) {
    const q = r.query.length > 45 ? r.query.slice(0, 42) + '...' : r.query;
    mdOutput += `| Test ${r.id} | ${r.section.split('.')[0]} | "${q}" | **${r.category || 'N/A'}** | **${r.priority || 'N/A'}** | ${r.owner || 'N/A'} |\n`;
  }
  mdOutput += '\n---\n\n## Detailed Test Cases & Model Responses\n\n';

  currentSection = '';
  for (const r of results) {
    if (r.section !== currentSection) {
      currentSection = r.section;
      mdOutput += `\n## Section ${currentSection}\n\n`;
    }

    mdOutput += `### Test Case ${r.id}\n\n`;
    mdOutput += `> **Input Request:** "${r.query}"\n\n`;
    if (r.error) {
      mdOutput += `*Status: Failed (${r.status}) - ${r.error}*\n\n`;
    } else {
      mdOutput += `- **Executive Summary:** ${r.summary}\n`;
      mdOutput += `- **Category:** \`${r.category}\`\n`;
      mdOutput += `- **Priority:** \`${r.priority}\`\n`;
      mdOutput += `- **Priority Justification:** ${r.priorityReason}\n`;
      mdOutput += `- **Recommended Owner:** \`${r.owner}\`\n`;
      mdOutput += `- **Draft Response:**\n\n> ${r.draftResponse}\n\n`;
      mdOutput += `*Latency: ${r.durationMs}ms*\n\n`;
    }
    mdOutput += '---\n\n';
  }

  fs.writeFileSync('ambiguity_test_cases_results.md', mdOutput, 'utf8');
  console.log('Saved ambiguity_test_cases_results.md');

  // 3. Word Document (.doc format)
  let docHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>AI Request Triage Assistant - Ambiguity Test Report</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #222; line-height: 1.5; }
  h1 { color: #1a365d; border-bottom: 2px solid #2b6cb0; padding-bottom: 8px; }
  h2 { color: #2b6cb0; margin-top: 36px; border-bottom: 1px solid #cbd5e0; padding-bottom: 4px; }
  .test-card { border: 1px solid #cbd5e0; background: #f7fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .query { font-size: 15px; font-weight: bold; color: #2d3748; background: #edf2f7; padding: 10px; border-left: 4px solid #3182ce; margin-bottom: 12px; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .meta-table td { padding: 6px 12px; border: 1px solid #e2e8f0; font-size: 14px; }
  .meta-label { font-weight: bold; background: #edf2f7; width: 170px; color: #4a5568; }
  .draft-box { background: #ffffff; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; font-style: italic; color: #2d3748; }
  .badge { font-weight: bold; padding: 2px 8px; border-radius: 4px; display: inline-block; }
  .badge-urgent { background: #fed7d7; color: #9b2c2c; }
  .badge-high { background: #feebc8; color: #7b341e; }
  .badge-medium { background: #bee3f8; color: #2c5282; }
  .badge-low { background: #e2e8f0; color: #4a5568; }
</style>
</head>
<body>
<h1>AI Request Triage Assistant — Ambiguity Test Cases Evaluation Report</h1>
<p><strong>Suite:</strong> Tests 81 to 180 (100 Ambiguity & Stress Cases Across 10 Categories)<br>
<strong>Execution Timestamp:</strong> ${new Date().toLocaleString()}<br>
<strong>Environment:</strong> Localhost (http://localhost:3000)<br>
<strong>AI Provider:</strong> Google Gemini (Flash-Lite with Fallback Key Support)</p>

<h2>Summary Table</h2>
<table style="width:100%; border-collapse: collapse; margin-bottom: 30px;" border="1" cellpadding="6">
  <tr style="background:#2b6cb0; color:white;">
    <th>Test ID</th>
    <th>Section</th>
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
    <td style="font-size:12px; color:#4a5568;">${r.section}</td>
    <td>${r.query}</td>
    <td style="text-align:center;">${r.category || 'N/A'}</td>
    <td style="text-align:center;">${r.priority || 'N/A'}</td>
    <td style="text-align:center;">${r.owner || 'N/A'}</td>
  </tr>`;
  }

  docHtml += `</table>\n<h2>Detailed Ambiguity Test Cases & Model Responses</h2>\n`;

  currentSection = '';
  for (const r of results) {
    if (r.section !== currentSection) {
      currentSection = r.section;
      docHtml += `<h2 style="color:#2c5282; margin-top:40px;">Section: ${currentSection}</h2>\n`;
    }

    const priorityClass = r.priority === 'Urgent' ? 'badge-urgent' : r.priority === 'High' ? 'badge-high' : r.priority === 'Medium' ? 'badge-medium' : 'badge-low';
    docHtml += `
<div class="test-card">
  <div style="font-weight:bold; color:#2b6cb0; font-size:16px; margin-bottom:6px;">Test Case ${r.id} <span style="font-size:13px; font-weight:normal; color:#718096;">(${r.section})</span></div>
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
      <td class="meta-label">Priority Justification</td>
      <td colspan="3">${r.priorityReason || 'N/A'}</td>
    </tr>
  </table>
  <div style="font-weight:bold; margin-bottom:4px; font-size:13px; color:#4a5568;">Generated Reviewable Draft Response:</div>
  <div class="draft-box">"${r.draftResponse || 'N/A'}"</div>
</div>
`;
  }

  docHtml += `</body></html>`;

  fs.writeFileSync('ambiguity_test_cases_results.doc', docHtml, 'utf8');
  console.log('Saved ambiguity_test_cases_results.doc (Word Document format)');

  console.log('\nAMBIGUITY BATCH EXECUTION COMPLETE!');
}

runAmbiguityTests().catch(console.error);
