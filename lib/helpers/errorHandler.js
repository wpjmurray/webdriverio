import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'

import sanitize from './sanitize'

export default [
    /**
     * stale reference error handler
     */
    function (e) {
        if (!e.seleniumStack || e.seleniumStack.type !== 'StaleElementReference') {
            return
        }

        /**
         * get through command list and find most recent command where an element(s)
         * command contained the failing json web element
         */
        let failingCommand = this.commandList.slice(-1)[0]

        let commandToRepeat
        for (let i = this.commandList.length - 1; i >= 0; --i) {
            const command = this.commandList[i]

            if (command.name !== 'element' && command.name !== 'elements') {
                continue
            }
            if (command.name === 'element' && (!command.result[0].value || command.result[0].value.ELEMENT !== failingCommand.args[0])) {
                continue
            }

            for (let result of command.result.value) {
                if (result.ELEMENT === failingCommand.args[0]) {
                    commandToRepeat = this.commandList[i - 1]
                    break
                }
            }

            if (commandToRepeat) {
                break
            }
        }

        if (!commandToRepeat) {
            return
        }

        return this[commandToRepeat.name].apply(this, commandToRepeat.args)
    },
    /**
     * create a screenshot if commands fail
     */
    function (e) {
        if (e.type !== 'TimeoutError' || this.depth !== 0 || typeof this.options.screenshotPath !== 'string') {
            return
        }

        let screenshotPath = this.options.screenshotPath[0] === '/'
            ? this.options.screenshotPath : path.join(process.cwd(), this.options.screenshotPath)

        /**
        * create directory if not existing
        */
        try {
            fs.statSync(screenshotPath)
        } catch (e) {
            mkdirp.sync(screenshotPath)
        }

        let capId = sanitize.caps(this.desiredCapabilities)
        let timestamp = new Date().toJSON().replace(/:/g, '-')
        let fileName = `ERROR_${capId}_${timestamp}.png`
        let filePath = path.join(screenshotPath, fileName)
        let emitScreenshotEvent = (screenshot) => {
            this.logger.log(`\tSaved screenshot: ${fileName}`)
            this.emit('screenshot', {
                data: screenshot || e.screenshot,
                filename: fileName,
                path: filePath
            })
        }

        /**
         * don't take a new screenshot if we already got one from Selenium
         */
        if (typeof e.screenshot === 'string') {
            let screenshot = new Buffer(e.screenshot, 'base64')
            fs.writeFileSync(filePath, screenshot)
            emitScreenshotEvent()

            /**
             * return nothing so the command still fails
             */
            return
        }

        return this.saveScreenshot(filePath).then(emitScreenshotEvent)
    }
]
