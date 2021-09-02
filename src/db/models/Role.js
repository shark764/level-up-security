const mongoose = require('mongoose');
const roleSchema = require('./schemas/Role');

module.exports = mongoose.model('roles', roleSchema);
