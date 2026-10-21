import { NormalState } from "./types.js";
/**
 * Used to track if the code we're currently
 * executing is inside an executing TypeGPU function.
 *
 * Helpful for providing better error messages.
 */
let insideTgpuFn = false;
export function provideInsideTgpuFn(callback) {
    if (insideTgpuFn) {
        return callback();
    }
    try {
        insideTgpuFn = true;
        return callback();
    }
    finally {
        insideTgpuFn = false;
    }
}
export function isInsideTgpuFn() {
    return insideTgpuFn;
}
let resolutionCtx;
/**
 * Used to mock the context before all tests. For normal use-cases, use `provideCtx`
 */
export function INTERNAL_setCtx(ctx) {
    resolutionCtx = ctx;
}
export function provideCtx(ctx, callback) {
    if (resolutionCtx === ctx) {
        return callback();
    }
    const prevCtx = resolutionCtx;
    resolutionCtx = ctx;
    try {
        return callback();
    }
    finally {
        resolutionCtx = prevCtx;
    }
}
export function getResolutionCtx() {
    return resolutionCtx;
}
/**
 * Applicable when code is being executed outside of any
 * execution-altering APIs.
 */
export const topLevelState = new NormalState();
export function getExecMode() {
    return resolutionCtx?.mode ?? topLevelState;
}
export function inCodegenMode() {
    return resolutionCtx?.mode.type === 'codegen';
}
// You can add getters for more modes if necessary...
