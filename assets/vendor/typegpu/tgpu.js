// NOTE: This is a barrel file, internal files should not import things from this file
export { constant as const } from "./core/constant/tgpuConstant.js";
export { fn } from "./core/function/tgpuFn.js";
export { comptime } from "./core/function/comptime.js";
export { resolve, resolveWithContext } from "./core/resolve/tgpuResolve.js";
export { init, initFromDevice } from "./core/root/init.js";
export { slot } from "./core/slot/slot.js";
export { lazy } from "./core/slot/lazy.js";
export { accessor, mutableAccessor } from "./core/slot/accessor.js";
export { privateVar, workgroupVar } from "./core/variable/tgpuVariable.js";
export { vertexLayout } from "./core/vertexLayout/vertexLayout.js";
export { bindGroupLayout } from "./tgpuBindGroupLayout.js";
export { computeFn } from "./core/function/tgpuComputeFn.js";
export { fragmentFn } from "./core/function/tgpuFragmentFn.js";
export { vertexFn } from "./core/function/tgpuVertexFn.js";
export { unroll } from "./core/unroll/tgpuUnroll.js";
export * as '~unstable' from "./tgpuUnstable.js";
