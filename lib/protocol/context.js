/**
 *
 * Retrieve current context or switch to the specified context
 *
 * @param {String=} id the context to switch to
 *
 * @see http://appium.io/slate/en/v1.1.0/?javascript#automating-hybrid-ios-apps, https://github.com/admc/wd/blob/master/lib/commands.js#L279
 * @type mobile
 * @for android, ios
 *
 */

let context = function (id, forceFetch) {
    let requestOptions = {
        path: '/session/:sessionId/context',
        method: 'GET'
    }

    let data = {}

    if (typeof id === 'string') {
        requestOptions.method = 'POST'
        data.name = id
    } else {
        if (global.browser.currentContext && !forceFetch) {
            console.log(`*** Quickly returning currentContext: ${global.browser.currentContext} ***`)// @nocommit
            return Promise.resolve({
                value: global.browser.currentContext
            })
        }
    }

    return this.requestHandler.create(requestOptions, data)
        .then(res => {
            global.browser.currentContext = res.value
            console.log(`*** SET currentContext to ${global.browser.currentContext} ***`)// @nocommit
            return res
        })
}

export default context
