const chalk = require('chalk')
const ServiceCreator = require('./modules/ServiceCreator')

async function add(options) {
    console.clear()
    console.log(chalk.blue(` Generate CLI v${require('../package').version}\n`))
    console.log('👉  work generate-cli add')

    const serviceCreator = new ServiceCreator(options)
    serviceCreator.add()
}

module.exports = (...args) => {
    return add(...args).catch(err => {
        console.error(err)
    })
}
