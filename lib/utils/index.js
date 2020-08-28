[
    'logger',
    'exit',
    'requester'
].forEach(m => {
    Object.assign(exports, require(`./lib/${m}`))
})

