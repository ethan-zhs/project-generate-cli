const fs = require('fs-extra')
const path = require('path')
const jenkins = require('jenkins')
const handlebars = require('handlebars')
const parse = require('parse-git-config')
const config = require('../config')

function getGogsBaseUrl() {
    const { host, port, user, password } = config.gogs
    return `http://${user}:${password}@${host}:${port}`
}

function getJenkinsbaseUrl() {
    const { host, port, user, token } = config.jenkins
    return `http://${user}:${token}@${host}:${port}`
}

function commonJenkinsJobCreate(baseUrl, name, xml) {
    const { job } = jenkins({
        baseUrl,
        promisify: true
    })

    return job.create(name, xml)
}

function createJenkinsFolder(name, cnName, description) {
    const baseUrl = getJenkinsbaseUrl()
    const folderTpsPath = path.resolve(__dirname, '../handlebars/jenkins_folder.hbs')
    const content = fs.readFileSync(folderTpsPath, 'utf8')
    const template = handlebars.compile(content)

    const groupXML = template({
        jenkins: {
            name,
            cnName,
            description
        }
    })

    return commonJenkinsJobCreate(baseUrl, name, groupXML)
}

async function createJenkinsJob({ name, cnName, description, context, jenkinsHbsPath }) {
    try {
        const baseUrl = `${getJenkinsbaseUrl()}/job/${name}`
        const jobTplPath = path.resolve(context, jenkinsHbsPath)
        const content = fs.readFileSync(jobTplPath, 'utf8')
        const template = handlebars.compile(content)
        const gitlabConfig = parse.expandKeys(parse.sync())
        const { remote: { origin: { url: gitlabUrl = '' } = {} } = {} } = gitlabConfig

        const gogsRepos = `${getGogsBaseUrl()}/test/${name}.git`
        const gitlabRepos = gitlabUrl

        const branch = [
            { name: 'dev', branch: 'dev' },
            { name: 'prod', branch: 'master' }
        ]

        console.log()
        console.log(`🗃 jenkins构建任务创建中，请稍后...`)

        await createJenkinsFolder(name, cnName, description)

        branch.forEach(async b => {
            const xml = template({
                jenkins: {
                    gogsRepos,
                    gitlabRepos,
                    branch: b.branch
                }
            })

            await commonJenkinsJobCreate(baseUrl, b.name, xml)
            console.log(`🎉 jenkins构建任务创建成功`)
        })
    } catch (err) {
        console.log(`🗃 jenkins构建任务创建失败`)
        console.log(err && err.message)
    }
}

module.exports = {
    createJenkinsJob
}
