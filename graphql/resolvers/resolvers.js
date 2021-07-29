const userResolver = require('./userResolver')
const trackResolver = require('./trackResolver')
const miscResolver = require('./miscResolver')

const rootResolver = {
  ...userResolver,
  ...trackResolver,
  ...miscResolver,
}

module.exports = rootResolver