const service = require('./auth_item.service');

exports.getItems = async (req, res) => {
    try {
        const data = await service.getAllItems();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createItem = async (req, res) => {
    try {
        const data = await service.createItem(req.body);
        res.status(201).json({ success: true, data });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        await service.deleteItem(req.params.name);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.assignToUser = async (req, res) => {
    try {
        const { userId, items } = req.body; // items is array of names
        await service.syncUserAssignments(userId, items);
        res.json({ success: true, message: 'Phân quyền thành công' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getUserPermissions = async (req, res) => {
    try {
        const data = await service.getUserItems(req.params.userId);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getItemChildren = async (req, res) => {
    try {
        const data = await service.getItemChildren(req.params.name);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.setItemChildren = async (req, res) => {
    try {
        const { children } = req.body; // Array of names
        const parentName = req.params.name;
        
        // Remove all current children then add new ones
        const current = await service.getItemChildren(parentName);
        for (const child of current) {
            await service.removeChild(parentName, child.name);
        }
        for (const childName of children) {
            await service.addChild(parentName, childName);
        }
        
        res.json({ success: true, message: 'Cập nhật phân quyền thành công' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
