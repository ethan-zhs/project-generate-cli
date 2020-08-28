#! /usr/bin/env node

const program = require('commander')
const { version } = require('../package')

program.version(version).usage('<command> [options]')

program
    .command('list')
    .alias('ls')
    .description('查看模板列表')
    .action(cmd => {
        require('../lib/list')(cmd)
    })

program
    .command('init')
    .description('根据模板初始化项目')
    .option('-o, --openvpn', 'Use openvpn to download templates')
    .action(cmd => {
        const options = cleanArgs(cmd)
        require('../lib/init')(options)
    })

program
    .command('add')
    .description('添加功能')
    .action(cmd => {
        const options = cleanArgs(cmd)
        require('../lib/add')(options)
    })

program
    .command('ui')
    .description('运行可视化UI')
    .action((name, cmd) => {
        require('../lib/ui')(name, cmd)
    })

program.parse(process.argv)

function camelize(str) {
    return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function cleanArgs(cmd) {
    const args = {}
    cmd.options.forEach(o => {
        const key = camelize(o.long.replace(/^--/, ''))
        // if an option is not present and Command has a method with the same name
        // it should not be copied
        if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
            args[key] = cmd[key]
        }
    })
    return args
}
