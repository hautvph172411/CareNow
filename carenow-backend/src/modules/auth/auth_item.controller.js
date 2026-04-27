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

exports.updateItem = async (req, res) => {
    try {
        const data = await service.updateItem(req.params.name, req.body);
        res.json({ success: true, data, message: 'Cập nhật thành công' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        await service.deleteItem(req.params.name);
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.assignToUser = async (req, res) => {
    try {
        const { userId, items } = req.body;
        await service.syncUserAssignments(userId, items || []);
        res.json({ success: true, message: 'Phân quyền thành công' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getUserAssignments = async (req, res) => {
    try {
        const data = await service.getUserItems(req.params.userId);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getUserPermissions = async (req, res) => {
    try {
        const data = await service.getUserPermissions(req.params.userId);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMyPermissions = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        }
        const data = await service.getUserPermissions(req.user.id);
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
        const { children } = req.body;
        const parentName = req.params.name;
        await service.syncChildren(parentName, children || []);
        res.json({ success: true, message: 'Cập nhật phân quyền thành công' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

/**
 * Upsert toàn bộ feature catalog từ frontend vào DB dưới dạng permission (type=2).
 * Body: { features: [{ name, description }] }
 */
exports.syncFeatures = async (req, res) => {
    try {
        const { features } = req.body;
        if (!Array.isArray(features)) {
            return res.status(400).json({ success: false, message: 'features phải là mảng' });
        }
        const data = await service.syncFeatures(features);
        res.json({ success: true, data, message: `Đồng bộ ${data.length} quyền` });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
