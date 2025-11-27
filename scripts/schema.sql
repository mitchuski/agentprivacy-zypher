-- Proverb Protocol Database Schema

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    tracking_code VARCHAR(64) UNIQUE NOT NULL,
    sender_address VARCHAR(128) NOT NULL,
    proverb_text TEXT NOT NULL,
    amount_zec DECIMAL(18, 8) NOT NULL,
    txid VARCHAR(128) NOT NULL,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'pending',
    memo_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verification results table
CREATE TABLE IF NOT EXISTS verifications (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id),
    ai_provider VARCHAR(64) NOT NULL,
    quality_score DECIMAL(5, 4),
    matched_act VARCHAR(256),
    reasoning TEXT,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'verified'
);

-- Inscriptions table
CREATE TABLE IF NOT EXISTS inscriptions (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id),
    public_txid VARCHAR(128),
    private_txid VARCHAR(128),
    public_amount DECIMAL(18, 8),
    private_amount DECIMAL(18, 8),
    network_fee DECIMAL(18, 8),
    inscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    block_height INTEGER,
    status VARCHAR(32) DEFAULT 'confirmed'
);

-- Spellbook acts table (cached from IPFS)
CREATE TABLE IF NOT EXISTS spellbook_acts (
    id SERIAL PRIMARY KEY,
    act_id VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(128),
    ipfs_cid VARCHAR(128),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Oracle status table
CREATE TABLE IF NOT EXISTS oracle_status (
    id SERIAL PRIMARY KEY,
    check_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submissions_processed INTEGER DEFAULT 0,
    verifications_completed INTEGER DEFAULT 0,
    inscriptions_made INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    last_error TEXT,
    status VARCHAR(32) DEFAULT 'running'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_tracking ON submissions(tracking_code);
CREATE INDEX IF NOT EXISTS idx_verifications_submission ON verifications(submission_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_submission ON inscriptions(submission_id);
CREATE INDEX IF NOT EXISTS idx_oracle_status_timestamp ON oracle_status(check_timestamp DESC);

-- Views for monitoring
CREATE OR REPLACE VIEW submission_pipeline AS
SELECT 
    s.id,
    s.tracking_code,
    s.status AS submission_status,
    v.quality_score,
    v.matched_act,
    i.public_txid,
    i.inscribed_at,
    s.created_at
FROM submissions s
LEFT JOIN verifications v ON s.id = v.submission_id
LEFT JOIN inscriptions i ON s.id = i.submission_id
ORDER BY s.created_at DESC;

-- Proverb statistics view
CREATE OR REPLACE VIEW proverb_stats AS
SELECT 
    COUNT(*) AS total_submissions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed,
    AVG(v.quality_score) AS avg_quality_score,
    SUM(amount_zec) AS total_zec_received
FROM submissions s
LEFT JOIN verifications v ON s.id = v.submission_id;

