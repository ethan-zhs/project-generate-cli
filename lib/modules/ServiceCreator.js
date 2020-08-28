const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const chalk = require('chalk')
const config = require('../config')
const jenkins = require('../services/jenkins')
const rap2 = require('../services/rap2')
const gitlab = require('../services/gitlab')
const sentry = require('../services/sentry')

module.exports = class ServiceCreator {
    constructor(options) {
        // super()

        this.options = options
        this.context = options.cwd || process.cwd()
    }

    // 创建初始化项目
    async add() {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'service',
                message: chalk.green('【请选择添加的服务】: '),
                choices: ['gitlab', 'jenkins', 'rap2', 'sentry']
            }
        ])

        // 获得packageJson
        const packageJson = this.getPackageJson()

        const targetGroup = await this.getTargetGroup(answers.service)

        // 创建gitlab仓库
        if (answers.service === 'gitlab') {
            await gitlab.createProject({
                name: packageJson.name,
                namespaceId: targetGroup.id,
                description: packageJson.description,
                context: this.context
            })
        }

        // 创建jenkins任务
        if (answers.service === 'jenkins') {
            if (packageJson.handlebars && packageJson.handlebars.jenkins) {
                await jenkins.createJenkinsJob({
                    name: packageJson.name,
                    cnName: packageJson.cnName || packageJson.name,
                    groupName: targetGroup.name,
                    description: packageJson.description,
                    context: this.context,
                    jenkinsHbsPath: packageJson.handlebars.jenkins
                })
            } else {
                console.log('🗃 jenkins构建任务创建失败')
                console.log('not found config.xml template configuration')
            }
        }

        // 创建RAP2项目
        if (answers.service === 'rap2') {
            await rap2.createProjectOnRAP({
                name: packageJson.name,
                description: packageJson.description
            })
        }

        // 创建Sentry项目
        if (answers.service === 'sentry') {
            await sentry.createSentryProject(packageJson.name)
        }

        console.log()

        console.log(`🎉 Successfully created service ${chalk.yellow(answers.service)}.`)
    }

    getPackageJson() {
        try {
            const packageJsonPath = path.resolve(this.context, 'package.json')
            const packageJson = fs.readJSONSync(packageJsonPath)
            if (packageJson && packageJson.name) {
                return packageJson
            }
        } catch (err) {
            console.log()
            console.log(`当前目录没有找到package.json文件`)
            process.exit(1)
        }
    }

    async getTargetGroup(service) {
        const gitlabGroups = await gitlab.getGroups(config.gitlab.sourceGroupId)
        let targetGroup = null

        if (service === 'gitlab' || service === 'jenkins') {
            const group = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'groupName',
                    message: chalk.green('【请选择仓库归属gitlab平台分组】: '),
                    choices: gitlabGroups.map(item => item.name)
                }
            ])

            targetGroup = gitlabGroups.find(item => item.name === group.groupName)
        }

        return targetGroup
    }
}
