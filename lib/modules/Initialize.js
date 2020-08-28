const fs = require('fs-extra')
const path = require('path')
const { promisify } = require('util')
const download = require('download-git-repo')
const validateNPMPackageName = require('validate-npm-package-name')
const ora = require('ora')
const inquirer = require('inquirer')
const chalk = require('chalk')
const ping = require('ping')
const execa = require('execa')
const config = require('../config')
const jenkins = require('../services/jenkins')
const rap2 = require('../services/rap2')
const gitlab = require('../services/gitlab')
const sentry = require('../services/sentry')

module.exports = class Initialize {
    constructor(options) {
        // super()

        this.options = options
        this.context = options.cwd || process.cwd()
        this.targetTemplate = {}
        this.targetGroup = {}
    }

    // 创建初始化项目
    async init() {
        await this.shouldUseOpenvpn()

        const reposList = await gitlab.getProjectsByGroupId(config.gitlab.templateGroupId)
        const gitlabGroups = await gitlab.getGroups(config.gitlab.sourceGroupId)

        if (Array.isArray(reposList) && reposList.length) {
            const answers = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'template',
                    message: chalk.green('【请选择脚手架类型】: '),
                    choices: reposList.map(item => item.name)
                },
                {
                    type: 'list',
                    name: 'group',
                    message: chalk.green('【请选择仓库归属gitlab平台分组】: '),
                    choices: gitlabGroups.map(item => item.name)
                },
                {
                    type: 'input',
                    name: 'name',
                    message: chalk.green('【请输入项目名称】: '),
                    when: answer => {
                        this.targetTemplate = reposList.find(item => item.name === answer.template)
                        this.targetGroup = gitlabGroups.find(item => item.name === answer.group)
                        return true
                    },
                    validate: async val => {
                        // 检测名称是否已经在gitlab上存在
                        const groupProjects = await gitlab.getProjectsByGroupId(this.targetGroup.id)
                        const isExistName = groupProjects.map(item => item.name).includes(val)

                        const ctx = path.resolve(this.context, val)

                        if (!this.validateProjectName(val)) {
                            return '请输入合法的项目名称'
                        }

                        if (fs.existsSync(ctx)) {
                            return '您输入的项目名当前目录已存在'
                        }

                        if (isExistName) {
                            return '项目名称gitlab上已经存在'
                        }

                        this.context = ctx

                        return true
                    }
                },
                {
                    type: 'input',
                    name: 'cnName',
                    message: chalk.green('【请输入项目中文名称】: '),
                    validate: val => (val !== '' ? true : '请填写您的项目中文名称')
                },
                {
                    type: 'input',
                    name: 'description',
                    message: chalk.green('【请输入项目描述】: '),
                    validate: val => (val !== '' ? true : '请填写您的项目描述')
                },
                {
                    type: 'confirm',
                    name: 'isCreateGitlabRepos',
                    message: chalk.green('【是否创建gitlab仓库】: ')
                },
                {
                    type: 'confirm',
                    name: 'isCreateJenkinsJob',
                    message: chalk.green('【是否创建Jenkins自动化构建】: ')
                },
                {
                    type: 'confirm',
                    name: 'isCreateRAP2',
                    message: chalk.green('【是否创建RAP2项目】: ')
                },
                {
                    type: 'confirm',
                    name: 'isCreateSentry',
                    message: chalk.green('【是否创建Sentry项目】: ')
                }
            ])

            // 下载模板仓库代码
            const tplRepos = this.targetTemplate.http_url_to_repo
            const defaultBranch = this.targetTemplate.default_branch
            await this.downloadTemplate(`direct:${tplRepos}#${defaultBranch}`, answers.name)

            // 生成packageJson
            const packageJson = this.generatePackageJson(answers)

            // 创建gitlab仓库
            if (answers.isCreateGitlabRepos) {
                await gitlab.createProject({
                    name: answers.name,
                    namespaceId: this.targetGroup.id,
                    description: answers.description,
                    context: this.context
                })
            }

            // 创建jenkins任务
            if (answers.isCreateJenkinsJob) {
                if (packageJson.handlebars && packageJson.handlebars.jenkins) {
                    await jenkins.createJenkinsJob({
                        name: answers.name,
                        cnName: answers.cnName,
                        groupName: answers.group,
                        description: answers.description,
                        context: this.context,
                        jenkinsHbsPath: packageJson.handlebars.jenkins
                    })
                } else {
                    console.log()
                    console.log('🗃 jenkins构建任务创建失败')
                    console.log('not found config.xml template configuration')
                }
            }

            // 创建RAP2项目
            if (answers.isCreateRAP2) {
                await rap2.createProjectOnRAP({
                    name: answers.name,
                    description: answers.description
                })
            }

            // 创建Sentry项目
            if (answers.isCreateSentry) {
                await sentry.createSentryProject(answers.name)
            }

            console.log()

            console.log(`🎉 Successfully created project ${chalk.yellow(answers.name)}.`)
        }
        console.log('\n No template repos to use Now . \n')
    }

    run(command, args) {
        if (!args) {
            ;[command, ...args] = command.split(/\s+/)
        }
        return execa(command, args, { cwd: this.context })
    }

    // 下载模板
    async downloadTemplate(template, name) {
        console.log()
        const spinner = ora('正在下载模板...')
        spinner.start()

        const downloader = promisify(download)

        try {
            await downloader(template, name, { clone: true })
            spinner.succeed('模板下载成功')
        } catch (error) {
            spinner.fail('模板下载失败')
            console.log(error)
            process.exit(1)
        }
    }

    // 是否使用Openvpn
    async shouldUseOpenvpn() {
        if (this.options.openvpn) {
            const res = await ping.promise.probe(config.testVpnHost, {
                timeout: 5
            })
            if (!res.alive) {
                console.error(chalk.red.dim('\n  Error: OpenVPN connection failed!'))
                console.error(chalk.red.dim('  Please start the OpenVPN or check your network status\n'))
                process.exit(1)
            }

            return res.alive
        }

        return false
    }

    validateProjectName(projectName) {
        // 检测名称是否符合npm包标准
        const result = validateNPMPackageName(projectName)
        return result.validForNewPackages
    }

    generatePackageJson(answers) {
        const packageJsonPath = path.resolve(this.context, 'package.json')
        const packageJson = fs.readJSONSync(packageJsonPath)

        packageJson.name = answers.name
        packageJson.cnName = answers.cnName
        packageJson.description = answers.description

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4))

        return packageJson
    }
}
