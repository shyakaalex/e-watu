"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readJwtPemFromEnv = readJwtPemFromEnv;
function readJwtPemFromEnv(value, envName) {
    if (!value?.trim()) {
        throw new Error(`Missing ${envName}`);
    }
    return value.replace(/\\n/g, '\n').trim();
}
//# sourceMappingURL=jwt-pem.js.map