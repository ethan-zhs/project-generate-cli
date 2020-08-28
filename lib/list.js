const chalk = require('chalk')
const gitlab = require('./services/gitlab')
const config = require('./config')

async function list() {
    try {
        const res = await gitlab.getProjectsByGroupId(config.gitlab.templateGroupId)

        if (Array.isArray(res) && res.length) {
            console.log('\n  Available templates: \n')
            res.forEach(repo => {
                console.log(`  ${chalk.yellow('★')}  ${chalk.blue(repo.name)} - ${repo.description}`)
            })

            console.log('')
        } else {
            console.log('  No template repos Now .')
        }
    } catch (err) {
        console.log(err)
    }
}

module.exports = (...args) => {
    return list(...args).catch(err => {
        console.error(err)
    })
}
