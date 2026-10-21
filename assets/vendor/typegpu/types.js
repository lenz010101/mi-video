import { isLazy, isProviding, isSlot, } from "./core/slot/slotTypes.js";
import { UnknownData } from "./data/dataTypes.js";
import { withValue } from "./data/snippet.js";
import { isWgslData, } from "./data/wgslTypes.js";
import { $cast, $comptimeValueOf, $gpuCallable, $gpuValueOf, $internal, $ownSnippet, $resolve, } from "./shared/symbols.js";
export class NormalState {
    type = 'normal';
}
export class CodegenState {
    type = 'codegen';
}
export class SimulationState {
    type = 'simulate';
    buffers;
    vars;
    constructor(buffers, vars) {
        this.buffers = buffers;
        this.vars = vars;
    }
}
export function isSelfResolvable(value) {
    return !!value?.[$resolve];
}
export function getOwnSnippet(value) {
    return value?.[$ownSnippet];
}
/**
 * A `[$comptimeValueOf]` implementation for resources that are only known at runtime
 */
export function runtimeOnly() {
    return { comptime: false };
}
export function isGPUCallable(value) {
    return !!value?.[$gpuCallable];
}
export function hasCast(value) {
    return !!value?.[$cast];
}
/**
 * @returns A snippet holding the JS value that `snippet` represents at comptime,
 * or `undefined` if it is only known at runtime.
 */
export function asComptime(snippet) {
    const { value } = snippet;
    if (typeof value === 'string' && snippet.dataType !== UnknownData) {
        // Resolved WGSL code
        return undefined;
    }
    const getter = value?.[$comptimeValueOf];
    if (!getter) {
        // Objects that meet the criteria and didn't explicitly opt out of
        // being known at comptime, are treated as known at comptime.
        // That's mainly because there are far more objects that are eligible
        // and we want to be treated as known at comptime than those that are
        // special cases and need to opt out.
        return snippet;
    }
    const result = getter.call(value);
    return result.comptime ? withValue(result.value, snippet) : undefined;
}
export function isConstant(snippet) {
    return (asComptime(snippet) !== undefined ||
        snippet.origin === 'constant' ||
        snippet.origin === 'constant-immutable-def');
}
export function isWgsl(value) {
    return (typeof value === 'number' ||
        typeof value === 'boolean' ||
        isSelfResolvable(value) ||
        isWgslData(value) ||
        isSlot(value) ||
        isLazy(value) ||
        isProviding(value));
}
export function isGPUBuffer(value) {
    return !!value && typeof value === 'object' && 'getMappedRange' in value && 'mapAsync' in value;
}
export function isBuffer(value) {
    return value.resourceType === 'buffer';
}
export function isUsableAsVertex(buffer) {
    return !!buffer.usableAsVertex;
}
export function isUsableAsIndex(buffer) {
    return !!buffer.usableAsIndex;
}
export function isUsableAsUniform(buffer) {
    return !!buffer.usableAsUniform;
}
export function isUsableAsStorage(value) {
    return !!value?.usableAsStorage;
}
