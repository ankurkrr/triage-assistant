import type { AiProvider, AiProviderInput } from './provider';
import type { TriageResult } from '../triage/types';

export class MockAiProvider implements AiProvider {
  public readonly name = 'mock';

  async generateTriageResult(input: AiProviderInput): Promise<unknown> {
    const text = input.userRequest.toLowerCase();

    // 1. Immediate access removal / security / credentials
    if (
      text.includes('access removal') ||
      text.includes('remove access') ||
      text.includes('revoke access') ||
      text.includes('former employee') ||
      text.includes('terminated')
    ) {
      const result: TriageResult = {
        summary: 'Request for immediate user access removal and credential revocation.',
        category: 'Technical',
        priority: 'Urgent',
        priorityReason: 'Immediate access removal is required to prevent unauthorized system access and protect confidential data.',
        owner: 'Engineering',
        draftResponse:
          'Thank you for notifying us. We have received your urgent request for access removal and have escalated it immediately to the Engineering team for processing.',
      };
      return result;
    }

    // 2. Authentication / Login outage
    if (
      text.includes('cannot log in') ||
      text.includes('unable to log in') ||
      text.includes('login issue') ||
      text.includes('login error') ||
      text.includes('portal down') ||
      text.includes('portal unavailable')
    ) {
      const result: TriageResult = {
        summary: 'Customer reports inability to log into the portal.',
        category: 'Technical',
        priority: 'Urgent',
        priorityReason: 'Users are actively blocked from accessing their accounts and critical business records.',
        owner: 'Engineering',
        draftResponse:
          'Thank you for reporting this issue. We understand that you are currently unable to log in. Our Engineering team is actively reviewing the incident.',
      };
      return result;
    }

    // 3. Technical performance / slow loading / bugs
    if (
      text.includes('slow') ||
      text.includes('slowly') ||
      text.includes('loading slowly') ||
      text.includes('slow performance') ||
      text.includes('latency') ||
      text.includes('bug') ||
      text.includes('error') ||
      text.includes('performance')
    ) {
      const result: TriageResult = {
        summary: 'Report of slow page load times and degraded performance.',
        category: 'Technical',
        priority: 'Medium',
        priorityReason: 'The application remains accessible, but degraded performance impacts user experience.',
        owner: 'Engineering',
        draftResponse:
          'Thank you for bringing this to our attention. Our Engineering team has been notified and is looking into the performance degradation you experienced.',
      };
      return result;
    }

    // 4. Billing / Invoice inquiries
    if (
      text.includes('invoice') ||
      text.includes('billing') ||
      text.includes('charge') ||
      text.includes('payment') ||
      text.includes('receipt') ||
      text.includes('refund')
    ) {
      const result: TriageResult = {
        summary: 'Inquiry regarding an invoice discrepancy or billing question.',
        category: 'Billing',
        priority: 'Medium',
        priorityReason: 'Financial inquiry requiring account review without critical service disruption.',
        owner: 'Finance',
        draftResponse:
          'Thank you for contacting us regarding your billing inquiry. Our Finance team will review your account records and follow up with you shortly.',
      };
      return result;
    }

    // 5. Sales / Pricing inquiries
    if (
      text.includes('pricing') ||
      text.includes('quote') ||
      text.includes('buy') ||
      text.includes('sales') ||
      text.includes('purchase') ||
      text.includes('enterprise plan')
    ) {
      const result: TriageResult = {
        summary: 'Inquiry requesting product information and pricing details.',
        category: 'Sales',
        priority: 'Medium',
        priorityReason: 'Standard commercial inquiry regarding pricing and product offerings.',
        owner: 'Sales Team',
        draftResponse:
          'Thank you for your interest in our products. Our Sales Team will be happy to assist you with pricing information and product details.',
      };
      return result;
    }

    // 6. Partnership / Business development
    if (
      text.includes('partnership') ||
      text.includes('partner') ||
      text.includes('collaborate') ||
      text.includes('collaboration')
    ) {
      const result: TriageResult = {
        summary: 'General partnership and collaboration inquiry.',
        category: 'Other',
        priority: 'Low',
        priorityReason: 'Exploratory business inquiry without immediate deadline or operational impact.',
        owner: 'Client Success',
        draftResponse:
          'Thank you for reaching out to explore a potential partnership. We have routed your inquiry to our Client Success team for review.',
      };
      return result;
    }

    // 7. General fallback for arbitrary business requests
    const trimmed = input.userRequest.trim();
    const shortSummary = trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed;

    const fallbackResult: TriageResult = {
      summary: `Business request: ${shortSummary}`,
      category: 'Support',
      priority: 'Medium',
      priorityReason: 'Standard incoming business request requiring assistance.',
      owner: 'Client Success',
      draftResponse:
        'Thank you for contacting us. We have received your request and routed it to our Client Success team for review and next steps.',
    };

    return fallbackResult;
  }
}
