"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeWebsite = void 0;
// src/scraper/scrapeWebsite.ts
var network_ts_1 = require("../utils/network.ts");
var validators_ts_1 = require("../utils/validators.ts");
var scrapeWebsite = function (rawUrl, options, setProgress) { return __awaiter(void 0, void 0, void 0, function () {
    var url, startTime, proxyServices, responseData, proxyUsed, _i, proxyServices_1, proxy, attempt, res, json, _1, parser, doc, scrapedData, getFromSelectors, links, imgs, nodes, texts, _a, nodes_1, el, txt, meta, _b, meta_1, tag, name_1, content;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                url = (0, validators_ts_1.normalizeUrl)(rawUrl);
                if (!(0, validators_ts_1.validateUrl)(url)) {
                    return [2 /*return*/, { error: 'Invalid URL', url: url }];
                }
                setProgress('Initializing...');
                startTime = Date.now();
                proxyServices = [
                    {
                        name: 'AllOrigins',
                        url: "https://api.allorigins.win/get?url=".concat(encodeURIComponent(url)),
                        headers: { 'Accept': 'application/json' },
                    },
                    {
                        name: 'CORS Proxy',
                        url: "https://corsproxy.io/?".concat(encodeURIComponent(url)),
                        headers: { 'Accept': 'text/html' },
                    },
                    {
                        name: 'Proxy6',
                        url: "https://proxy6.workers.dev/?url=".concat(encodeURIComponent(url)),
                        headers: { 'Accept': 'text/html' },
                    },
                    {
                        name: 'ThingProxy',
                        url: "https://thingproxy.freeboard.io/fetch/".concat(url),
                        headers: { 'Accept': 'text/html' },
                    },
                ];
                responseData = null;
                proxyUsed = '';
                _i = 0, proxyServices_1 = proxyServices;
                _c.label = 1;
            case 1:
                if (!(_i < proxyServices_1.length)) return [3 /*break*/, 14];
                proxy = proxyServices_1[_i];
                setProgress("Trying ".concat(proxy.name, "..."));
                attempt = 1;
                _c.label = 2;
            case 2:
                if (!(attempt <= options.retryAttempts)) return [3 /*break*/, 12];
                _c.label = 3;
            case 3:
                _c.trys.push([3, 9, , 11]);
                return [4 /*yield*/, (0, network_ts_1.fetchWithTimeout)(proxy.url, { method: 'GET', headers: proxy.headers }, options.timeout)];
            case 4:
                res = _c.sent();
                if (!res.ok)
                    throw new Error("HTTP ".concat(res.status));
                if (!(proxy.name === 'AllOrigins')) return [3 /*break*/, 6];
                return [4 /*yield*/, res.json()];
            case 5:
                json = _c.sent();
                responseData = json.contents || '';
                return [3 /*break*/, 8];
            case 6: return [4 /*yield*/, res.text()];
            case 7:
                responseData = _c.sent();
                _c.label = 8;
            case 8:
                if (responseData) {
                    proxyUsed = proxy.name;
                    return [3 /*break*/, 12];
                }
                return [3 /*break*/, 11];
            case 9:
                _1 = _c.sent();
                setProgress("".concat(proxy.name, " attempt ").concat(attempt, " failed. Retrying..."));
                return [4 /*yield*/, (0, validators_ts_1.sleep)(attempt * 1000)];
            case 10:
                _c.sent();
                return [3 /*break*/, 11];
            case 11:
                attempt++;
                return [3 /*break*/, 2];
            case 12:
                if (responseData)
                    return [3 /*break*/, 14];
                _c.label = 13;
            case 13:
                _i++;
                return [3 /*break*/, 1];
            case 14:
                if (!responseData) {
                    return [2 /*return*/, { error: 'All proxies failed to fetch website.', url: url }];
                }
                setProgress('Parsing HTML...');
                parser = new DOMParser();
                doc = parser.parseFromString(responseData, 'text/html');
                scrapedData = {
                    title: '',
                    description: '',
                    links: [],
                    images: [],
                    text: [],
                    metadata: {},
                    status: {
                        success: true,
                        contentLength: responseData.length,
                        responseTime: Date.now() - startTime,
                        proxyUsed: proxyUsed,
                        contentType: 'text/html',
                    },
                };
                getFromSelectors = function (selectors) {
                    for (var _i = 0, selectors_1 = selectors; _i < selectors_1.length; _i++) {
                        var sel = selectors_1[_i];
                        var el = doc.querySelector(sel);
                        if (el) {
                            var content = el.getAttribute('content') || el.textContent || '';
                            var cleaned = (0, validators_ts_1.cleanText)(content);
                            if (cleaned)
                                return cleaned;
                        }
                    }
                    return '';
                };
                scrapedData.title = getFromSelectors(['title', '[property="og:title"]', 'h1']) || 'No title found';
                scrapedData.description = getFromSelectors([
                    'meta[name="description"]',
                    'meta[property="og:description"]',
                ]) || 'No description found';
                if (options.includeLinks) {
                    links = Array.from(doc.querySelectorAll('a[href]'))
                        .map(function (a) {
                        var href = a.getAttribute('href') || '';
                        var text = (0, validators_ts_1.cleanText)(a.textContent || '');
                        return { url: (0, validators_ts_1.makeAbsoluteUrl)(href, url), text: text };
                    })
                        .filter(function (l) { return l.url && l.text && l.text.length < 200; })
                        .slice(0, options.maxLinks);
                    scrapedData.links = links;
                }
                if (options.includeImages) {
                    imgs = Array.from(doc.querySelectorAll('img[src]'))
                        .map(function (img) {
                        var src = img.getAttribute('src') || '';
                        var alt = (0, validators_ts_1.cleanText)(img.getAttribute('alt') || 'Image');
                        return { src: (0, validators_ts_1.makeAbsoluteUrl)(src, url), alt: alt };
                    })
                        .filter(function (img) { return img.src.startsWith('http'); })
                        .slice(0, options.maxImages);
                    scrapedData.images = imgs;
                }
                if (options.includeText) {
                    nodes = Array.from(doc.querySelectorAll('p, h1, h2, h3'));
                    texts = new Set();
                    for (_a = 0, nodes_1 = nodes; _a < nodes_1.length; _a++) {
                        el = nodes_1[_a];
                        txt = (0, validators_ts_1.cleanText)(el.textContent || '');
                        if (txt.length > 15 && txt.length < 1000 && !texts.has(txt)) {
                            texts.add(txt);
                            if (texts.size >= options.maxTextElements)
                                break;
                        }
                    }
                    scrapedData.text = Array.from(texts);
                }
                if (options.includeMetadata) {
                    meta = Array.from(doc.querySelectorAll('meta'));
                    for (_b = 0, meta_1 = meta; _b < meta_1.length; _b++) {
                        tag = meta_1[_b];
                        name_1 = tag.getAttribute('name') || tag.getAttribute('property') || '';
                        content = tag.getAttribute('content');
                        if (name_1 && content) {
                            scrapedData.metadata[name_1] = (0, validators_ts_1.cleanText)(content);
                        }
                    }
                    scrapedData.metadata['scraped-url'] = url;
                    scrapedData.metadata['scraped-date'] = new Date().toISOString();
                }
                return [2 /*return*/, { data: scrapedData, url: url }];
        }
    });
}); };
exports.scrapeWebsite = scrapeWebsite;
