import { ProtocolError } from '../utils/ErrorHandler'

const CSS_SELECTOR = 'css selector'
const ID = 'id'
const XPATH = 'xpath'
const LINK_TEXT = 'link text'
const PARTIAL_LINK_TEXT = 'partial link text'
const ANDROID_UIAUTOMATOR = '-android uiautomator'
const IOS_UIAUTOMATION = '-ios uiautomation'
const ACCESSIBILITY_ID = 'accessibility id'
const TAG_NAME = 'tag name'
const NAME = 'name'

const nativeStrategies = [ID, XPATH, ANDROID_UIAUTOMATOR, IOS_UIAUTOMATION, ACCESSIBILITY_ID, NAME]
let isNativeContext

function containsCss (value) {
    return !!value.match(/(\s|>|\.|\[|\])/)
}

function hasXpathStart (value) {
    return value.indexOf('/') === 0 ||
        value.indexOf('(') === 0 ||
        value.indexOf('../') === 0 ||
        value.indexOf('./') === 0 ||
        value.indexOf('*/') === 0
}

function hasTextStrategyStart (value) {
    return value.indexOf('=') === 0
}

function hasPartialTextStrategyStart (value) {
    return value.indexOf('*=') === 0
}

function hasAndroidUiautomatorStart (value) {
    return value.indexOf('android=') === 0
}

function hasIosUiautomatonStart (value) {
    return value.indexOf('ios=') === 0
}

function hasAccessibilityStart (value) {
    return value.indexOf('~') === 0
}

function containsTag (value) {
    return !!value.match(/<[a-zA-Z\-]+( \/)*>/)
}

function replaceTag (value) {
    return value.replace(/<|>|\/|\s/g, '')
}

function getNameAttributePair (value) {
    return value.match(/^\[name=("|')([a-zA-z0-9\-_ ]+)("|')\]$/)
}

function getTextSearchParams (value) {
    return value.match(/^([a-z0-9]*)(\*)?=(.+)$/)
}

function getClassIdSearchParams (value) {
    return value.match(/^([a-z0-9]*)(\.|#)(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)(\*)?=(.+)$/)
}

function supported (strategy) {
    if (!isNativeContext) return true
    return (nativeStrategies.indexOf(strategy) >= 0)
}

let findStrategy = function (...args) {
    let value = args[0]
    let relative = (args.length > 1 ? args[1] : false)
    let xpathPrefix = relative ? './' : '//'

    let nameAttributePair
    let textSearchParams
    let classIdSearchParams

    isNativeContext = (/NATIVE/).test(global.browser.currentContext)

    /**
     * set default selector
     */
    let using = CSS_SELECTOR

    if (typeof value !== 'string') {
        throw new ProtocolError('selector needs to be typeof `string`')
    }

    // check value type
    // use id strategy if value starts with # and CSS selectors are not supported (native context)
    if (value.indexOf('#') === 0 && !supported(CSS_SELECTOR)) {
        using = ID
        value = value.slice(1)

    // check value type
    // use id strategy if value starts with # and doesnt contain any other CSS selector-relevant character
    } else if (value.indexOf('#') === 0 && !containsCss(value.slice(1))) {
        using = ID
        value = value.slice(1)

    // use xPath strategy if value starts with //, etc.
    } else if (hasXpathStart(value)) {
        using = XPATH

    // use link text strategy if value startes with =
    } else if (hasTextStrategyStart(value)) {
        using = LINK_TEXT
        value = value.slice(1)

    // use partial link text strategy if value startes with *=
    } else if (hasPartialTextStrategyStart(value)) {
        using = PARTIAL_LINK_TEXT
        value = value.slice(2)

    // recursive element search using the UiAutomator library (Android only)
    } else if (hasAndroidUiautomatorStart(value)) {
        using = ANDROID_UIAUTOMATOR
        value = value.slice(8)

    // recursive element search using the UIAutomation library (iOS-only)
    } else if (hasIosUiautomatonStart(value)) {
        using = IOS_UIAUTOMATION
        value = value.slice(4)

    // recursive element search using accessibility id
    } else if (hasAccessibilityStart(value)) {
        using = ACCESSIBILITY_ID
        value = value.slice(1)

    // use tag name strategy if value contains a tag
    // e.g. "<div>" or "<div />"
    } else if (containsTag(value)) {
        using = TAG_NAME
        value = replaceTag(value)

    // use name strategy if value queries elements with name attributes
    // e.g. "[name='myName']" or '[name="myName"]'
    } else if ((nameAttributePair = getNameAttributePair(value))) {
        using = NAME
        value = nameAttributePair[2]

    // any element with given text e.g. h1=Welcome
    } else if ((textSearchParams = getTextSearchParams(value))) {
        let tag = textSearchParams[1]
        let similar = !!textSearchParams[2]
        let query = textSearchParams[3]

        using = XPATH

        if (similar) {
            value = `${xpathPrefix}${tag.length ? tag : '*'}[contains(., "${query}")]`
        } else {
            value = `${xpathPrefix}${tag.length ? tag : '*'}[normalize-space() = "${query}"]`
        }

    // any element with certain class or id + given content
    } else if ((classIdSearchParams = getClassIdSearchParams(value))) {
        let classOrId = classIdSearchParams[2] === '#' ? 'id' : 'class'
        let classOrIdName = classIdSearchParams[3]
        let tag = classIdSearchParams[1]

        let similar = !!classIdSearchParams[4]
        let query = classIdSearchParams[5]

        using = XPATH

        if (similar) {
            value = `${xpathPrefix}${tag.length ? tag : '*'}[contains(@${classOrId}, "${classOrIdName}") and contains(., "${query}")]`
        } else {
            value = `${xpathPrefix}${tag.length ? tag : '*'}[contains(@${classOrId}, "${classOrIdName}") and normalize-space() = "${query}"]`
        }

    // allow to move up to the parent or select current element
    } else if (value === '..' || value === '.') {
        using = XPATH
    }

    return {
        using: using,
        value: value
    }
}

export default findStrategy
