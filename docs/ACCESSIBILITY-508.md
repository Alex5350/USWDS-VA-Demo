# Section 508 and Accessibility

## Goal

This demo should feel appropriate for a federal-facing workflow. It should prioritize semantic HTML, USWDS patterns, keyboard operation, visible focus, readable reports, and accessible alternatives for visual summaries.

## Checklist

- Include a skip-to-main-content link.
- Use semantic landmarks: `header`, `nav`, `main`, and `footer`.
- Give each page a unique title.
- Use descriptive headings in order.
- Ensure every form control has a visible label.
- Associate validation messages with fields.
- Use native buttons for actions and links for navigation.
- Ensure buttons and icon-only controls have accessible names.
- Make link text descriptive.
- Use tables with captions.
- Use `scope="col"` and `scope="row"` where appropriate.
- Do not rely on color alone to communicate risk level or status.
- Maintain visible keyboard focus indicators.
- Keep all controls keyboard-accessible.
- Target WCAG AA color contrast.
- Provide text summaries and data tables for charts.
- Keep report exports and print pages readable without interactive-only controls.
- Use `aria-live` only for useful dynamic updates.
- Do not add ARIA when native HTML communicates the behavior.
- If a modal is introduced, trap focus, restore focus on close, and support Escape.

## USWDS Use

The frontend should use USWDS 3.x as the design foundation. Preferred components and patterns:

- Header
- Side navigation
- Breadcrumb
- Alert
- Summary box
- Tag
- Table
- Form controls
- Button
- Pagination
- Modal only if needed

Do not directly edit files inside `node_modules`.

## Report Accessibility

Charts must include:

- Short text summary
- Data table alternative
- Clear labels
- No color-only meaning
- Keyboard-accessible drill-down links when applicable

CSV exports should preserve clear column names.

## Verification Steps

1. Navigate every page with keyboard only.
2. Confirm focus order follows the visual workflow.
3. Confirm skip link reaches the main content.
4. Confirm tables have captions and scoped headers.
5. Confirm form controls have labels.
6. Confirm role selector, filters, pagination, and export controls are reachable by keyboard.
7. Confirm risk level is shown with text, not color alone.
8. Confirm reports have accessible table alternatives.
9. Run automated checks with browser accessibility tooling.
10. Perform a manual screen reader spot check for dashboard, risk queue, case detail, and reports.

## Synthetic Data Notice

Every page that displays data should include or link to this notice:

```text
This demo uses synthetic data only. It does not contain real veteran, patient, claim, provider, VA, PHI, PII, or government data. Risk indicators are for demonstration purposes only and do not represent confirmed fraud, waste, or abuse.
```
