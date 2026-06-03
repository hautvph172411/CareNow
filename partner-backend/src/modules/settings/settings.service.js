const repo = require('./settings.repository');

exports.getAllSettings = async () => {
  const rows = await repo.getAll();
  const settings = {};
  for (const row of rows) {
    settings[row.setting_key] = row.setting_value;
  }
  return settings;
};

exports.getSettingByKey = async (key) => {
  const row = await repo.getByKey(key);
  return row ? row.setting_value : null;
};

exports.updateSettings = async (settingsObject) => {
  const arr = Object.keys(settingsObject).map(key => ({
    key,
    value: settingsObject[key]
  }));
  await repo.updateBulk(arr);
  return exports.getAllSettings();
};
