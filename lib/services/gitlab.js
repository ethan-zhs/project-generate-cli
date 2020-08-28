const execa = require('execa')
const chalk = require('chalk')
const { Gitlab } = require('@gitbeaker/node')
const config = require('../config')

function createApi() {
    const { host, port, token } = config.gitlab

    try {
        const api = new Gitlab({
            host: `http://${host}:${port}`,
            token
        })
        return api
    } catch (err) {
        console.error(chalk.red.dim('\n  Error: Gitlab connection failed!'))
        console.error(err)
        process.exit(1)
    }
}

async function getGroups(groupId) {
    const api = createApi()
    let groups = await api.Groups.all()
    if (groupId) {
        groups = groups.filter(item => item.parent_id === groupId)
    }
    return groups
}

async function getProjectsByGroupId(groupId) {
    try {
        const api = createApi()
        return await api.GroupProjects.all(groupId)
    } catch (err) {
        console.log(err)
    }
}

async function createProject({ name, namespaceId, description, context = process.cwd() }) {
    const api = createApi()

    function run(command, args) {
        if (!args) {
            ;[command, ...args] = command.split(/\s+/)
        }
        return execa(command, args, { cwd: context })
    }

    try {
        const res = await api.Projects.create({
            name,
            namespace_id: namespaceId,
            description,
            visibility: 'internal'
        })

        console.log()
        console.log(`🗃 gitlab项目创建中，请稍后...`)
        await run('git init')
        await run('git', ['remote', 'add', 'origin', res.http_url_to_repo])
        await run('git add .')
        await run('git', ['commit', '-m', 'Initialize project'])
        await run('git push -u origin master')
        console.log(`🎉 gitlab项目创建成功`)
    } catch (err) {
        console.log(`🗃 gitlab项目创建失败`)
        console.log(err)
        process.exit(1)
    }
}

module.exports = {
    getGroups,
    getProjectsByGroupId,
    createProject
}
