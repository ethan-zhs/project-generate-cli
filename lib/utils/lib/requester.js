const axios = require('axios')

// 设置请求方法GET的参数
function paramsForGetMethod(endpoint, method, data) {
    if (method.toUpperCase() === 'GET' && data && typeof data === 'object') {
        const paramsArr = []
        const keys = Object.keys(data)
        keys.forEach(key => {
            paramsArr.push(`${key}=${data[key].toString()}`)
        })
        endpoint = paramsArr.length ? `${endpoint}?${paramsArr.join('&')}` : endpoint
    }
    return endpoint
}

exports.requester = (method, endpoint, data, headers) => {
    endpoint = paramsForGetMethod(endpoint, method, data)

    return new Promise((resolve, reject) => {
        axios({
            method,
            url: endpoint,
            data,
            headers
        })
            .then(res => {
                resolve(res)
            })
            .catch(err => {
                console.log(err)
                reject(err)
            })
    })
}
