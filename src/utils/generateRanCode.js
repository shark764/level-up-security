const randomatic = require('randomatic')

const generateRanCode = () => {
    return randomatic('A0', 6)
}

module.exports = generateRanCode