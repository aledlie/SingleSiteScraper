"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.cleanText = exports.makeAbsoluteUrl = exports.normalizeUrl = exports.validateUrl = void 0;
var validateUrl = function (url) {
    try {
        var urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol);
    }
    catch (_a) {
        return false;
    }
};
exports.validateUrl = validateUrl;
var normalizeUrl = function (inputUrl) {
    var normalized = inputUrl.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        normalized = 'https://' + normalized;
    }
    return normalized;
};
exports.normalizeUrl = normalizeUrl;
var makeAbsoluteUrl = function (relativeUrl, baseUrl) {
    try {
        return new URL(relativeUrl, baseUrl).href;
    }
    catch (_a) {
        return relativeUrl;
    }
};
exports.makeAbsoluteUrl = makeAbsoluteUrl;
var cleanText = function (text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[\r\n\t]/g, ' ')
        .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
        .trim();
};
exports.cleanText = cleanText;
var sleep = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
exports.sleep = sleep;
