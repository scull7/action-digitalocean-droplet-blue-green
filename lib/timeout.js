"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.make = void 0;
const defaultNow = () => new Date().getTime();
function make(timeoutMillis, injectedNow) {
    const now = injectedNow == null ? defaultNow : injectedNow;
    return {
        getStart() {
            return new Date().getTime();
        },
        hasExpired(start) {
            return (now() - start) >= timeoutMillis;
        },
    };
}
exports.make = make;
