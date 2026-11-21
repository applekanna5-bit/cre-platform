CREATE TABLE feedback_submissions (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  category VARCHAR(24) NOT NULL,
  specialization VARCHAR(32) NULL,
  message TEXT NOT NULL,
  source_url VARCHAR(2048) NULL,
  contact_name VARCHAR(100) NULL,
  contact_email VARCHAR(254) NULL,
  status ENUM('New','Under Review','Accepted','Resolved','Closed') NOT NULL DEFAULT 'New',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY feedback_status_created (status, created_at, id),
  KEY feedback_category_created (category, created_at, id),
  KEY feedback_created (created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE feedback_status_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submission_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  status ENUM('New','Under Review','Accepted','Resolved','Closed') NOT NULL,
  actor ENUM('system','owner') NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY feedback_history_submission (submission_id, id),
  FOREIGN KEY (submission_id) REFERENCES feedback_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE feedback_owner_notes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submission_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  note TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY feedback_notes_submission (submission_id, id),
  FOREIGN KEY (submission_id) REFERENCES feedback_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE feedback_corrections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submission_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  article_path VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY feedback_correction_path (submission_id, article_path),
  FOREIGN KEY (submission_id) REFERENCES feedback_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE feedback_outbox (
  submission_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  state ENUM('pending','sending','sent','failed','uncertain') NOT NULL DEFAULT 'pending',
  available_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  lease_until DATETIME(3) NULL,
  claim_token CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  attempt_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  KEY feedback_outbox_schedule (state, available_at, submission_id),
  KEY feedback_outbox_expiry (state, lease_until),
  FOREIGN KEY (submission_id) REFERENCES feedback_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE feedback_outbox_attempts (
  claim_token CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  submission_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  outcome ENUM('sending','sent','retry','failed','uncertain') NOT NULL,
  started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  finished_at DATETIME(3) NULL,
  KEY feedback_attempts_submission (submission_id, started_at),
  FOREIGN KEY (submission_id) REFERENCES feedback_outbox(submission_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE feedback_idempotency (
  request_key CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  fingerprint CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  submission_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY feedback_idempotency_age (created_at),
  FOREIGN KEY (submission_id) REFERENCES feedback_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE feedback_rate_windows (
  bucket_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  window_start BIGINT UNSIGNED NOT NULL,
  attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_key, window_start),
  KEY feedback_rate_expiry (window_start)
) ENGINE=InnoDB;
