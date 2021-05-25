const randomatic = require('randomatic');

const generateRanCode = () => randomatic('A0', 6);

module.exports = generateRanCode;