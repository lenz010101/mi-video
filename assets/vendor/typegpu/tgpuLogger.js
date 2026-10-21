import { DEV, TEST } from "./shared/env.js";
const warningTypes = [
    'deprecated',
    'suspicious',
    'fallback',
    'precision-loss',
    'implicit-conversion',
    'webgpu-feature-missing',
    'webgpu-limits-exceeded',
    'log-limit-exceeded',
    'external-omitted',
    'uniform-schema-misaligned',
];
export class TgpuLogger {
    #initialEnabledWarnings;
    #enabledWarnings;
    #warned = new WeakMap();
    constructor(prod) {
        if (prod) {
            this.#initialEnabledWarnings = [
                'webgpu-feature-missing',
                'webgpu-limits-exceeded',
                'log-limit-exceeded',
                'external-omitted',
            ];
        }
        else {
            this.#initialEnabledWarnings = warningTypes;
        }
        this.#enabledWarnings = new Set(this.#initialEnabledWarnings);
    }
    disable(type) {
        this.#enabledWarnings.delete(type);
    }
    reset() {
        this.#enabledWarnings = new Set(this.#initialEnabledWarnings);
    }
    warn(type, ...args) {
        if (this.#enabledWarnings.has(type)) {
            console.warn(`⚠️ [${type}] `, ...args);
        }
    }
    warnOnce(type, key, tag, ...args) {
        if (!this.#enabledWarnings.has(type)) {
            return;
        }
        let warnings = this.#warned.get(key);
        if (!warnings) {
            warnings = new Set();
            this.#warned.set(key, warnings);
        }
        const warningId = `${type}:${tag}`;
        if (warnings.has(warningId)) {
            return;
        }
        warnings.add(warningId);
        this.warn(type, ...args);
    }
}
const tgpuLogger = new TgpuLogger(!(DEV || TEST));
export const logger = tgpuLogger;
export const warn = tgpuLogger;
