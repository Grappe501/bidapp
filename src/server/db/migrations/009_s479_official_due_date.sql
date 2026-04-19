-- Align S000000479 project due date with issued RFP (Proposal Due May 4, 2026 — not June).
UPDATE projects
SET due_date = '2026-05-04', updated_at = now()
WHERE bid_number = 'S000000479';
