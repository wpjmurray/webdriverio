var chai = require('chai')
var chaiString = require('chai-string')
var chaiAsPromised = require('chai-as-promised')

exports.config = {
    specs: [],
    suites: {
        basicCommandExecution: [__dirname + '/specs/async.spec.js'],
        customCommands: [__dirname + '/specs/custom.commands.async.spec.js']
    },
    capabilities: [{
        browserName: 'phantomjs'
    }],
    mochaOpts: {
        compilers: ['js:babel/register'],
        timeout: 60000
    },
    baseUrl: 'http://localhost:8080',
    sync: false,
    before: function () {
        chai.should()
        chai.use(chaiString)
        chai.use(chaiAsPromised)
        global.assert = chai.assert
        global.expect = chai.expect

        browser.addCommand('someCustomCommand', function () {
            return browser.getTitle()
        })

        browser.addCommand('anotherCustomCommand', () => {
            return browser.someCustomCommand().then(() => {
                return true
            })
        })

        browser.addCommand('notAnotherCustomCommand', () => {
            return browser.url('http://localhost:8080').isExisting('body').then((exists) => {
                if (exists) {
                    return browser
                        .setValue('textarea', 'yo')
                        .setValue('textarea', 'hey')
                        .waitForExist('body', 100)
                        .getValue('textarea').then((value) => {
                            expect(value).to.be.equal('hey')
                        })
                }
            })
        })
    }
}
