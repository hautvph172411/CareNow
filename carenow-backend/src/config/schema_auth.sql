-- =============================================================================
-- SCHEMA AUTH (RBAC) cho CareNow
-- Chạy: psql -U postgres -d CareNow -f src/config/schema_auth.sql
-- =============================================================================

-- Bảng item: chứa cả Vai trò (type=1) và Quyền (type=2)
CREATE TABLE IF NOT EXISTS tbl_auth_item (
    name        VARCHAR(64)  PRIMARY KEY,
    type        INTEGER      NOT NULL CHECK (type IN (1, 2)),   -- 1 = role, 2 = permission
    description TEXT,
    bizrule     TEXT,
    data        TEXT,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Quan hệ cha-con: role -> permission (hoặc role -> role)
CREATE TABLE IF NOT EXISTS tbl_auth_item_child (
    parent VARCHAR(64) NOT NULL,
    child  VARCHAR(64) NOT NULL,
    PRIMARY KEY (parent, child),
    CONSTRAINT fk_parent FOREIGN KEY (parent) REFERENCES tbl_auth_item(name) ON DELETE CASCADE,
    CONSTRAINT fk_child  FOREIGN KEY (child)  REFERENCES tbl_auth_item(name) ON DELETE CASCADE
);

-- Gán item (role hoặc permission) cho user
CREATE TABLE IF NOT EXISTS tbl_auth_assignment (
    item_name VARCHAR(64) NOT NULL,
    user_id   INTEGER     NOT NULL,
    created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_name, user_id),
    CONSTRAINT fk_auth_item FOREIGN KEY (item_name) REFERENCES tbl_auth_item(name) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_assignment_user ON tbl_auth_assignment(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_item_child_parent ON tbl_auth_item_child(parent);

-- =============================================================================
-- SEED: tạo vai trò mặc định + permission cơ bản
-- Permission sẽ được đồng bộ tự động bằng frontend (POST /auth/items/sync-features),
-- ở đây chỉ seed vai trò "super_admin" để có người nắm full quyền.
-- =============================================================================
INSERT INTO tbl_auth_item (name, type, description) VALUES
    ('super_admin', 1, 'Quản trị tối cao - toàn quyền hệ thống'),
    ('admin',       1, 'Quản trị viên'),
    ('staff',       1, 'Nhân viên')
ON CONFLICT (name) DO NOTHING;
