// NOTE: This is a barrel file, internal files should not import things from this file
export { declare } from "./core/declare/tgpuDeclare.js";
export { immediateVar } from "./core/immediate/immediateVar.js";
export { rawCodeSnippet } from "./core/rawCodeSnippet/tgpuRawCodeSnippet.js";
export { namespace } from "./core/resolve/namespace.js";
export { simulate } from "./core/simulate/tgpuSimulate.js";
// DEPRECATED
import { constant } from "./core/constant/tgpuConstant.js";
import { comptime } from "./core/function/comptime.js";
import { computeFn } from "./core/function/tgpuComputeFn.js";
import { fn } from "./core/function/tgpuFn.js";
import { fragmentFn } from "./core/function/tgpuFragmentFn.js";
import { vertexFn } from "./core/function/tgpuVertexFn.js";
import { accessor, mutableAccessor } from "./core/slot/accessor.js";
import { lazy } from "./core/slot/lazy.js";
import { slot } from "./core/slot/slot.js";
import { privateVar, workgroupVar } from "./core/variable/tgpuVariable.js";
import { vertexLayout } from "./core/vertexLayout/vertexLayout.js";
/** @deprecated This feature is now stable, use tgpu.const. */
const _constant = constant;
/** @deprecated This feature is now stable, use tgpu.comptime. */
const _comptime = comptime;
/** @deprecated This feature is now stable, use tgpu.computeFn. */
const _computeFn = computeFn;
/** @deprecated This feature is now stable, use tgpu.fn. */
const _fn = fn;
/** @deprecated This feature is now stable, use tgpu.fragmentFn. */
const _fragmentFn = fragmentFn;
/** @deprecated This feature is now stable, use tgpu.vertexFn. */
const _vertexFn = vertexFn;
/** @deprecated This feature is now stable, use tgpu.accessor. */
const _accessor = accessor;
/** @deprecated This feature is now stable, use tgpu.mutableAccessor. */
const _mutableAccessor = mutableAccessor;
/** @deprecated This feature is now stable, use tgpu.lazy. */
const _lazy = lazy;
/** @deprecated This feature is now stable, use tgpu.slot. */
const _slot = slot;
/** @deprecated This feature is now stable, use tgpu.privateVar. */
const _privateVar = privateVar;
/** @deprecated This feature is now stable, use tgpu.workgroupVar. */
const _workgroupVar = workgroupVar;
/** @deprecated This feature is now stable, use tgpu.vertexLayout. */
const _vertexLayout = vertexLayout;
export { _accessor as accessor, _comptime as comptime, _computeFn as computeFn, _constant as const, _fn as fn, _fragmentFn as fragmentFn, _lazy as derived, _mutableAccessor as mutableAccessor, _privateVar as privateVar, _slot as slot, _vertexFn as vertexFn, _vertexLayout as vertexLayout, _workgroupVar as workgroupVar, };
