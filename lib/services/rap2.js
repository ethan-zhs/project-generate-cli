const cookie = require('cookie')
const config = require('../config')
const { requester } = require('../utils')

function cookieJsonParse(cookieInput) {
    const result = []
    if (Array.isArray(cookieInput)) {
        for (const el of cookieInput) {
            result.push(el.split(';')[0])
        }
        return cookie.parse(result.join(';'))
    }
    return cookie.parse(cookieInput)
}

async function createProjectOnRAP({ name, description }) {
    const { user, host, port } = config.rap2
    const baseName = `http://${host}:${port}`

    try {
        console.log()
        console.log(`🗃 RAP2项目创建中，请稍后...`)
        const loginRes = await requester('POST', `${baseName}/account/cli-login`, { email: user })

        const cookieJson = cookieJsonParse(loginRes.headers['set-cookie'])
        let cookieStr = ''

        for (const c in cookieJson) {
            cookieStr += `${c}=${cookieJson[c]};`
        }

        const data = {
            id: loginRes.data.id,
            name,
            description,
            members: [],
            collaborators: [],
            collaboratorIdstring: '',
            memberIds: [],
            collaboratorIds: ['']
        }

        const headers = {
            Cookie: cookieStr
        }

        const res = await requester('POST', `${baseName}/repository/create`, data, headers)
        console.log(`🎉 RAP2项目创建成功(id: ${res.data.data.id})`)
    } catch (err) {
        console.log(err)
        console.log('🗃 RAP2项目创建失败')
    }
}

module.exports = {
    createProjectOnRAP
}
