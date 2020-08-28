const Sentry = require('sentry-api').Client
const config = require('../config')

async function createSentryProject(name, platform = 'javascript') {
    const { dsnKey, host, port, token, orgSlug, teamSlug } = config.sentry

    const dsn = `http://${dsnKey}@${host}:${port}`
    const sentry = new Sentry(dsn, {
        token
    })

    console.log()
    console.log('🗃 Sentry项目创建中，请稍后...')
    try {
        const res = await sentry.teams.createProject(orgSlug, teamSlug, {
            name,
            slug: name,
            platform
        })
        console.log('🎉 Sentry项目创建成功')
        return res
    } catch (err) {
        console.log(err)
        console.log('🗃 Sentry项目创建失败')
    }
}

module.exports = {
    createSentryProject
}
