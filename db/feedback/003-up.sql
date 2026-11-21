-- Better Auth 1.7.27. Apply only to the reviewed, dedicated staging schema.
CREATE TABLE feedback_auth_user (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT NULL,
  createdAt DATETIME(3) NOT NULL,
  updatedAt DATETIME(3) NOT NULL,
  twoFactorEnabled BOOLEAN NULL DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE feedback_auth_account (
  id VARCHAR(255) PRIMARY KEY,
  accountId VARCHAR(255) NOT NULL,
  providerId VARCHAR(255) NOT NULL,
  userId VARCHAR(255) NOT NULL,
  accessToken TEXT NULL,
  refreshToken TEXT NULL,
  idToken TEXT NULL,
  accessTokenExpiresAt DATETIME(3) NULL,
  refreshTokenExpiresAt DATETIME(3) NULL,
  scope TEXT NULL,
  password TEXT NULL,
  createdAt DATETIME(3) NOT NULL,
  updatedAt DATETIME(3) NOT NULL,
  UNIQUE KEY feedback_auth_provider_account (providerId, accountId),
  KEY feedback_auth_account_user (userId),
  FOREIGN KEY (userId) REFERENCES feedback_auth_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE feedback_auth_session (
  id VARCHAR(255) PRIMARY KEY,
  expiresAt DATETIME(3) NOT NULL,
  token VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  createdAt DATETIME(3) NOT NULL,
  updatedAt DATETIME(3) NOT NULL,
  ipAddress VARCHAR(64) NULL,
  userAgent TEXT NULL,
  userId VARCHAR(255) NOT NULL,
  mfaVerified BOOLEAN NOT NULL DEFAULT FALSE,
  KEY feedback_auth_session_user (userId),
  KEY feedback_auth_session_expiry (expiresAt),
  FOREIGN KEY (userId) REFERENCES feedback_auth_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE feedback_auth_verification (
  id VARCHAR(255) PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  expiresAt DATETIME(3) NOT NULL,
  createdAt DATETIME(3) NOT NULL,
  updatedAt DATETIME(3) NOT NULL,
  KEY feedback_auth_verification_identifier (identifier),
  KEY feedback_auth_verification_expiry (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE feedback_auth_factor (
  id VARCHAR(255) PRIMARY KEY,
  secret VARCHAR(255) NOT NULL,
  backupCodes TEXT NOT NULL,
  userId VARCHAR(255) NOT NULL,
  verified BOOLEAN NULL DEFAULT TRUE,
  failedVerificationCount INT NULL DEFAULT 0,
  lockedUntil DATETIME(3) NULL,
  UNIQUE KEY feedback_auth_factor_user (userId),
  KEY feedback_auth_factor_secret (secret),
  FOREIGN KEY (userId) REFERENCES feedback_auth_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE feedback_auth_owner (
  slot TINYINT UNSIGNED PRIMARY KEY CHECK (slot = 1),
  userId VARCHAR(255) NOT NULL UNIQUE,
  FOREIGN KEY (userId) REFERENCES feedback_auth_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
