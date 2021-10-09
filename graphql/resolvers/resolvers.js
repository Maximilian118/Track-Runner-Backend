const userResolver = require('./userResolver')
const postResolver = require('./postResolver')
const trackResolver = require('./trackResolver')
const miscResolver = require('./miscResolver')
const geojsonResolver = require('./geojsonResolver')

const rootResolver = {
  ...userResolver,
  ...postResolver,
  ...trackResolver,
  ...miscResolver,
  ...geojsonResolver,
}

module.exports = rootResolver