const userResolver = require('./userResolver')
const trackResolver = require('./trackResolver')
const miscResolver = require('./miscResolver')
const geojsonResolver = require('./geojsonResolver')

const rootResolver = {
  ...userResolver,
  ...trackResolver,
  ...miscResolver,
  ...geojsonResolver,
}

module.exports = rootResolver