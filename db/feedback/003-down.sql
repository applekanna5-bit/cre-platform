-- Destructive rollback. Stop auth traffic, revoke sessions, and take an authorised backup first.
DROP TABLE feedback_auth_owner;
DROP TABLE feedback_auth_factor;
DROP TABLE feedback_auth_verification;
DROP TABLE feedback_auth_session;
DROP TABLE feedback_auth_account;
DROP TABLE feedback_auth_user;
