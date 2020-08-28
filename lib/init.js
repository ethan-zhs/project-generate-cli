const chalk = require('chalk')
const Initialize = require('./modules/Initialize')

async function init(options) {
    console.clear()
    console.log(chalk.blue(` Generate CLI v${require('../package').version}\n`))
    console.log('👉  work generate-cli init')

    const initialization = new Initialize(options)
    initialization.init()
}

module.exports = (...args) => {
    return init(...args).catch(err => {
        console.error(err)
    })
}
