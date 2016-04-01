describe('promised based custom command handling', () => {
    it('custom commands should have a then method', () => {
        expect(browser.someCustomCommand().then).to.be.a('function')
    })

    it('should use custom command in custom command', () => {
        return browser.anotherCustomCommand().should.be.eventually.be.true
    })

    it('should run some sophisticated custom command', () => {
        return browser.notAnotherCustomCommand()
    })
})
