CREATE TABLE feedback_owner_sessions (
  session_id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  subject_id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  provider_session_id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  ciphertext TEXT CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at BIGINT UNSIGNED NOT NULL,
  KEY feedback_session_subject (subject_id, provider_session_id),
  KEY feedback_provider_session (provider_session_id),
  KEY feedback_session_expiry (expires_at)
) ENGINE=InnoDB;
