import { $gpuValueOf } from "./shared/symbols.js";
export function getGPUValue(object) {
    return object?.[$gpuValueOf];
}
