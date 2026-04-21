const specialtyService = require('./specialty.service');

const createSpecialty = async (req, res) => {
  try {
    const data = await specialtyService.createSpecialty(req.body);
    res.status(201).json({ message: 'Success', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSpecialties = async (req, res) => {
  try {
    const result = await specialtyService.getSpecialties(req.query);
    res.status(200).json({ message: 'Success', ...result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSpecialtyById = async (req, res) => {
  try {
    const data = await specialtyService.getSpecialtyById(req.params.id);
    res.status(200).json({ message: 'Success', data });
  } catch (error) {
    if (error.message === 'NOT_FOUND') return res.status(404).json({ message: 'Specialty not found' });
    res.status(500).json({ message: error.message });
  }
};

const updateSpecialty = async (req, res) => {
  try {
    const data = await specialtyService.updateSpecialty(req.params.id, req.body);
    res.status(200).json({ message: 'Success', data });
  } catch (error) {
    if (error.message === 'NOT_FOUND') return res.status(404).json({ message: 'Specialty not found' });
    res.status(500).json({ message: error.message });
  }
};

const deleteSpecialty = async (req, res) => {
  try {
    await specialtyService.deleteSpecialty(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    if (error.message === 'NOT_FOUND') return res.status(404).json({ message: 'Specialty not found' });
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSpecialty,
  getSpecialties,
  getSpecialtyById,
  updateSpecialty,
  deleteSpecialty
};
