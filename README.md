# ContractSense

An interactive React + TypeScript prototype for an AI-assisted contract-risk analyzer aimed at Indian MSMEs.

## Run locally

Run npm install, then npm run dev. Open the local address shown in the terminal.

## Included experience

- Four upload paths: PDF, pasted text, document, and camera capture
- Animated, staged analysis flow rather than a generic spinner
- Contract-health score, recommendation, risk distribution, and MSME-aware payment context
- Evidence-linked contract viewer, filtering, risk cards, confidence indicators, plain-English explanations, and redline suggestions
- Missing protections, obligation balance, important-date timeline, version comparison, report export, history, and contract Q&A
- Responsive layout, keyboard-focus styling, semantic controls, reduced-motion support, and a custom desktop cursor

## Backend handoff

The application currently uses carefully labelled sample data so the complete interface can be explored without a backend. Its data models follow the provided architecture:

- Upload: POST /api/documents
- Job progress: GET /api/jobs/:jobId or WS /ws/jobs/:jobId
- Results: GET /api/documents/:id/summary and GET /api/documents/:id/clauses
- Chat: POST /api/documents/:id/chat
- Export: POST /api/documents/:id/export

Before using it for real contracts, connect those endpoints, enforce authentication through secure httpOnly cookies, validate files on the server, and keep document contents out of analytics and error logs.
