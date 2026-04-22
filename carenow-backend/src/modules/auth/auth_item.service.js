const repo = require('./auth_item.repository');

exports.getAllItems = () => repo.findAll();

exports.createItem = async (data) => {
    const exists = await repo.findByName(data.name);
    if (exists) throw new Error('Quyền/Vai trò này đã tồn tại');
    return repo.create(data);
};

exports.updateItem = (name, data) => repo.update(name, data);

exports.deleteItem = (name) => repo.delete(name);

exports.addChild = (parent, child) => repo.addChild(parent, child);
exports.removeChild = (parent, child) => repo.removeChild(parent, child);
exports.getItemChildren = (parent) => repo.getChildren(parent);

exports.assignUser = (itemName, userId) => repo.assign(itemName, userId);
exports.revokeUser = (itemName, userId) => repo.revoke(itemName, userId);
exports.getUserItems = (userId) => repo.getAssignments(userId);

// Multi-assignment helper
exports.syncUserAssignments = async (userId, itemNames) => {
    const current = await repo.getAssignments(userId);
    
    // Revoke removed items
    for (const name of current) {
        if (!itemNames.includes(name)) {
            await repo.revoke(name, userId);
        }
    }
    
    // Assign new items
    for (const name of itemNames) {
        if (!current.includes(name)) {
            await repo.assign(name, userId);
        }
    }
};
