-- Fix proverb_stats view
-- This script creates or replaces the proverb_stats view needed by the Oracle service

-- Proverb statistics view
CREATE OR REPLACE VIEW proverb_stats AS
SELECT 
    COUNT(*) AS total_submissions,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) AS completed,
    COUNT(CASE WHEN s.status = 'pending' THEN 1 END) AS pending,
    COUNT(CASE WHEN s.status = 'failed' THEN 1 END) AS failed,
    AVG(v.quality_score) AS avg_quality_score,
    SUM(s.amount_zec) AS total_zec_received
FROM submissions s
LEFT JOIN verifications v ON s.id = v.submission_id;

-- Verify the view was created
SELECT 'proverb_stats view created successfully' AS status;

