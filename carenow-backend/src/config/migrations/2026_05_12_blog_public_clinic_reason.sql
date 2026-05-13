-- Tạo bảng danh mục cẩm nang, lý do khám và bài cẩm nang.
-- Chạy thủ công:
-- psql "$DATABASE_URL" -f src/config/migrations/2026_05_12_blog_public_clinic_reason.sql

BEGIN;

CREATE TABLE IF NOT EXISTS tbl_blog_category (
  id SERIAL PRIMARY KEY,
  name VARCHAR(250),
  title VARCHAR(255),
  url VARCHAR(255),
  description VARCHAR(255),
  content TEXT,
  rank INTEGER,
  status INTEGER DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbl_blog_category_url
  ON tbl_blog_category (url)
  WHERE url IS NOT NULL AND url <> '';

CREATE INDEX IF NOT EXISTS idx_tbl_blog_category_status
  ON tbl_blog_category (status);

CREATE TABLE IF NOT EXISTS tbl_clinic_reason (
  id SERIAL PRIMARY KEY,
  clinic_id TEXT,
  name VARCHAR(250),
  rank INTEGER,
  status INTEGER DEFAULT 1,
  title VARCHAR(255),
  url VARCHAR(255),
  description VARCHAR(255),
  content TEXT,
  updated_at INTEGER,
  place_id INTEGER,
  in_trash_clinic_ids TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbl_clinic_reason_url
  ON tbl_clinic_reason (url)
  WHERE url IS NOT NULL AND url <> '';

CREATE INDEX IF NOT EXISTS idx_tbl_clinic_reason_status
  ON tbl_clinic_reason (status);

CREATE TABLE IF NOT EXISTS tbl_blog_public (
  id SERIAL PRIMARY KEY,
  type INTEGER DEFAULT 1,
  title TEXT NOT NULL,
  picture TEXT,
  picture_alt VARCHAR(255),
  summary TEXT,
  content TEXT,
  url TEXT NOT NULL,
  description TEXT,
  published_time INTEGER,
  published_by INTEGER,
  published_start INTEGER,
  published_version INTEGER,
  version INTEGER,
  created_time INTEGER,
  updated_time INTEGER,
  status INTEGER DEFAULT 1,
  views INTEGER DEFAULT 0,
  categories TEXT,
  created_by INTEGER,
  updated_by INTEGER,
  rank INTEGER,
  show_related_article INTEGER DEFAULT 1,
  show_list_category INTEGER DEFAULT 1,
  is_check INTEGER DEFAULT 0,
  show_comment INTEGER DEFAULT 1,
  show_phone INTEGER DEFAULT 0,
  reason INTEGER,
  "references" TEXT,
  next_post INTEGER,
  suggest_specialist INTEGER,
  suggest_doctor INTEGER,
  suggest_content VARCHAR(255),
  custom_button_text VARCHAR(255),
  custom_button_link TEXT,
  author VARCHAR(250),
  advisor VARCHAR(250),
  censor VARCHAR(250),
  tag VARCHAR(250),
  metadata TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbl_blog_public_url
  ON tbl_blog_public (url);

CREATE INDEX IF NOT EXISTS idx_tbl_blog_public_status
  ON tbl_blog_public (status);

CREATE INDEX IF NOT EXISTS idx_tbl_blog_public_reason
  ON tbl_blog_public (reason);

COMMENT ON TABLE tbl_blog_category IS 'Danh mục cẩm nang';
COMMENT ON TABLE tbl_clinic_reason IS 'Lý do khám, chứa danh sách bác sĩ liên quan';
COMMENT ON TABLE tbl_blog_public IS 'Bài viết cẩm nang public';

COMMIT;
