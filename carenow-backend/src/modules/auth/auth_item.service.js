const repo = require('./auth_item.repository');

exports.getAllItems = () => repo.findAll();

exports.createItem = async (data) => {
    const exists = await repo.findByName(data.name);
    if (exists) throw new Error('Quyền/Vai trò này đã tồn tại');
    return repo.create(data);
};

exports.updateItem = (name, data) => repo.update(name, data);

exports.deleteItem = async (name) => {
    const exists = await repo.findByName(name);
    if (!exists) throw new Error('Không tìm thấy');
    return repo.delete(name);
};

exports.addChild = (parent, child) => repo.addChild(parent, child);
exports.removeChild = (parent, child) => repo.removeChild(parent, child);
exports.getItemChildren = (parent) => repo.getChildren(parent);

exports.assignUser = (itemName, userId) => repo.assign(itemName, userId);
exports.revokeUser = (itemName, userId) => repo.revoke(itemName, userId);
exports.getUserItems = (userId) => repo.getAssignments(userId);

exports.getUserPermissions = async (userId) => {
    const rows = await repo.getEffectivePermissions(userId);
    // Chỉ trả về permissions (type=2) - các quyền thực tế để hiển thị UI
    return rows.filter(r => r.type === 2).map(r => r.name);
};

// Multi-assignment helper: đồng bộ danh sách role/permission cho 1 user
exports.syncUserAssignments = async (userId, itemNames = []) => {
    const current = await repo.getAssignments(userId);

    for (const name of current) {
        if (!itemNames.includes(name)) {
            await repo.revoke(name, userId);
        }
    }

    for (const name of itemNames) {
        if (!current.includes(name)) {
            await repo.assign(name, userId);
        }
    }
};

// Đồng bộ danh sách children cho 1 parent (ví dụ: set quyền cho 1 role)
exports.syncChildren = async (parentName, childNames = []) => {
    const parent = await repo.findByName(parentName);
    if (!parent) throw new Error('Vai trò không tồn tại');

    const current = await repo.getChildren(parentName);
    const currentNames = current.map(c => c.name);

    for (const name of currentNames) {
        if (!childNames.includes(name)) {
            await repo.removeChild(parentName, name);
        }
    }

    for (const name of childNames) {
        if (!currentNames.includes(name)) {
            await repo.addChild(parentName, name);
        }
    }
};

/**
 * Đồng bộ feature catalog (danh sách tính năng) vào tbl_auth_item dưới dạng permission (type=2).
 * Được dùng khi frontend mở trang Phân quyền: tự upsert những permission hiện có trong hệ thống.
 */
exports.syncFeatures = async (features = []) => {
    const results = [];
    for (const f of features) {
        if (!f.name) continue;
        const item = await repo.upsert({
            name: f.name,
            type: 2,
            description: f.description || f.label || f.name
        });
        results.push(item);
    }
    return results;
};
