const db = require('../../config/database');

exports.findAll = async () => {
    const res = await db.query('SELECT * FROM tbl_auth_item ORDER BY type, name');
    return res.rows;
};

exports.findByName = async (name) => {
    const res = await db.query('SELECT * FROM tbl_auth_item WHERE name = $1', [name]);
    return res.rows[0];
};

exports.create = async (data) => {
    const query = `
        INSERT INTO tbl_auth_item (name, type, description, bizrule, data)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const res = await db.query(query, [
        data.name,
        data.type,
        data.description || null,
        data.bizrule || null,
        data.data || null
    ]);
    return res.rows[0];
};

exports.upsert = async (data) => {
    // CHỈ update description khi trùng tên, KHÔNG đổi type để tránh đè role thành permission
    const query = `
        INSERT INTO tbl_auth_item (name, type, description, bizrule, data)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name) DO UPDATE
            SET description = EXCLUDED.description
        RETURNING *
    `;
    const res = await db.query(query, [
        data.name,
        data.type,
        data.description || null,
        data.bizrule || null,
        data.data || null
    ]);
    return res.rows[0];
};

exports.update = async (name, data) => {
    const query = `
        UPDATE tbl_auth_item SET description = $1, bizrule = $2, data = $3
        WHERE name = $4
        RETURNING *
    `;
    const res = await db.query(query, [
        data.description || null,
        data.bizrule || null,
        data.data || null,
        name
    ]);
    return res.rows[0];
};

exports.delete = async (name) => {
    await db.query('DELETE FROM tbl_auth_item_child WHERE parent = $1 OR child = $1', [name]);
    await db.query('DELETE FROM tbl_auth_assignment WHERE item_name = $1', [name]);
    await db.query('DELETE FROM tbl_auth_item WHERE name = $1', [name]);
};

// Hierarchy
exports.addChild = async (parent, child) => {
    await db.query(
        `INSERT INTO tbl_auth_item_child (parent, child) VALUES ($1, $2)
         ON CONFLICT (parent, child) DO NOTHING`,
        [parent, child]
    );
};

exports.removeChild = async (parent, child) => {
    await db.query('DELETE FROM tbl_auth_item_child WHERE parent = $1 AND child = $2', [parent, child]);
};

exports.getChildren = async (parent) => {
    const res = await db.query(`
        SELECT i.* FROM tbl_auth_item i
        JOIN tbl_auth_item_child c ON i.name = c.child
        WHERE c.parent = $1
    `, [parent]);
    return res.rows;
};

// Assignments
exports.assign = async (itemName, userId) => {
    await db.query(`
        INSERT INTO tbl_auth_assignment (item_name, user_id)
        VALUES ($1, $2)
        ON CONFLICT (item_name, user_id) DO NOTHING
    `, [itemName, userId]);
};

exports.revoke = async (itemName, userId) => {
    await db.query('DELETE FROM tbl_auth_assignment WHERE item_name = $1 AND user_id = $2', [itemName, userId]);
};

exports.getAssignments = async (userId) => {
    const res = await db.query('SELECT item_name FROM tbl_auth_assignment WHERE user_id = $1', [userId]);
    return res.rows.map(r => r.item_name);
};

/**
 * Get flattened permissions for a user: tất cả quyền (type=2) mà user được gán trực tiếp
 * hoặc kế thừa thông qua các role (type=1) được gán.
 * Dùng Recursive CTE để đi qua toàn bộ cây auth_item_child.
 */
exports.getEffectivePermissions = async (userId) => {
    const query = `
        WITH RECURSIVE tree AS (
            -- Các item được gán trực tiếp cho user
            SELECT ai.name, ai.type, ai.description
            FROM tbl_auth_assignment a
            JOIN tbl_auth_item ai ON ai.name = a.item_name
            WHERE a.user_id = $1

            UNION

            -- Mở rộng đệ quy xuống các child
            SELECT ai.name, ai.type, ai.description
            FROM tree t
            JOIN tbl_auth_item_child c ON c.parent = t.name
            JOIN tbl_auth_item ai ON ai.name = c.child
        )
        SELECT DISTINCT name, type, description FROM tree
    `;
    const res = await db.query(query, [userId]);
    return res.rows;
};
