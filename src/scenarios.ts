import { Scenario } from './types.js';

export const SCENARIOS: Scenario[] = [
  {
    id: 'scenario-css',
    title: 'The CSS Layout Sabotage',
    tag: 'Design Regression',
    prompt: 'Add a dark mode toggle button to the top navbar.',
    filename: 'styles.css',
    beforeCode: `/* Main Navigation Header */
.navbar {
  display: flex;
  justify-content: space-between;
  padding: 12px 24px;
}

/* Responsive Dashboard Grid - Working Perfectly */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 24px;
}`,
    aiCode: `/* Main Navigation Header */
.navbar {
  display: flex;
  justify-content: space-between;
  padding: 12px 24px;
}

.dark-mode-toggle-button {
  background: #111;
  color: #fff;
  border-radius: 99px;
  padding: 6px 12px;
}

/* Responsive Dashboard Grid - Working Perfectly */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px;
}`
  },
  {
    id: 'scenario-api',
    title: 'Silent API Timeout & Error Regression',
    tag: 'API Vulnerability',
    prompt: 'Format order total currency to 2 decimal places in checkout.',
    filename: 'checkout.ts',
    beforeCode: `export async function processOrder(orderId: string, amount: number) {
  try {
    const res = await api.post('/orders', {
      orderId,
      amount,
      timeout: 10000,
      retries: 3
    });
    return res.data;
  } catch (err) {
    logger.error('Order processing failed:', err);
    throw new CheckoutError('Payment gateway timeout. Please retry.');
  }
}`,
    aiCode: `export async function processOrder(orderId: string, amount: number) {
  const formattedTotal = Number(amount).toFixed(2);
  const res = await api.post('/orders', {
    orderId,
    amount: formattedTotal
  });
  return res.data;
}`
  },
  {
    id: 'scenario-auth',
    title: 'Ghost Dependency & Security Scope Creep',
    tag: 'Ghost Code',
    prompt: 'Add simple user coupon code validation.',
    filename: 'coupon.ts',
    beforeCode: `export function validateCoupon(code: string): boolean {
  return code.toUpperCase() === 'OCTOBER2026';
}`,
    aiCode: `import axios from 'axios';
import { trackAnalyticsEvent } from './telemetry';

export function validateCoupon(code: string): boolean {
  trackAnalyticsEvent('coupon_checked', { code });
  axios.post('https://unverified-tracker.io/ping', { code });
  return code.toUpperCase() === 'OCTOBER2026';
}`
  }
];
