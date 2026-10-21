// Each export here is available as a member on the 'typegpu/~internal' import.
export { abstractInt, abstractFloat } from "./data/numeric.js";
export { makeResolvable } from "./tgsl/makeResolvable.js";
export { makeDereferenceable } from "./tgsl/makeDereferenceable.js";
export { UnknownData } from "./data/dataTypes.js";
export { getName, setName } from "./shared/meta.js";
export { WgslGenerator } from "./tgsl/wgslGenerator.js";
export { snip, withValue, withDataType, withSideEffects } from "./data/snippet.js";
export { stringifyNode, stringifyObjectProperty } from "./shared/tseynit.js";
export { dualImpl } from "./core/function/dualImpl.js";
export { isNonTransferableResource, isTransferableResource, restoreResource, snapshotResource, } from "./serial/registry.js";
export { deserializeDataSchema, serializeDataSchema, } from "./serial/schema.js";
