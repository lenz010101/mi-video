import {} from "./core/buffer/buffer.js";
import { isBuffer, isUsableAsStorage, isUsableAsUniform } from "./types.js";
import { isComparisonSampler, isSampler, TgpuLaidOutSamplerImpl, } from "./core/sampler/sampler.js";
import { comparisonSampler as wgslComparisonSampler, sampler as wgslSampler, } from "./data/sampler.js";
import { TgpuExternalTextureImpl } from "./core/texture/externalTexture.js";
import { isTexture, isTextureView, TgpuLaidOutTextureViewImpl, } from "./core/texture/texture.js";
import { isUsableAsSampled, NotSampledError, } from "./core/texture/usageExtension.js";
import {} from "./data/texture.js";
import { invariant, NotUniformError } from "./errors.js";
import { NotStorageError } from "./extension.js";
import { getName, setName } from "./shared/meta.js";
import { safeStringify } from "./shared/stringify.js";
import { $gpuValueOf, $internal, $soul } from "./shared/symbols.js";
import { TgpuLaidOutBufferImpl } from "./core/buffer/laidOutBuffer.js";
import { isMutableBinding, isReadonlyBinding, isUniformBinding, } from "./core/buffer/bufferBinding.js";
export function bindGroupLayout(entries) {
    return new TgpuBindGroupLayoutImpl({ ...entries });
}
export function INTERNAL_restoreBindGroupLayout(soul) {
    return bindGroupLayout({ ...soul.entries }).$idx(soul.index);
}
export function INTERNAL_restoreBindGroup(soul, ctx) {
    invariant(soul.raw, 'A bind group soul is only complete once materialized.');
    return new TgpuBindGroupImpl(ctx.getRoot(soul.device), soul.layout, {}, soul.raw);
}
export function isBindGroupLayout(value) {
    return !!value && value.resourceType === 'bind-group-layout';
}
export function isBindGroup(value) {
    return !!value && value.resourceType === 'bind-group';
}
/**
 * @category Errors
 */
export class MissingBindingError extends Error {
    constructor(groupLabel, key) {
        super(`Bind group '${groupLabel ?? '<unnamed>'}' is missing a required binding '${key}'`);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, MissingBindingError.prototype);
    }
}
// --------------
// Implementation
// --------------
const DEFAULT_MUTABLE_VISIBILITY = ['compute', 'fragment'];
const DEFAULT_READONLY_VISIBILITY = ['compute', 'vertex', 'fragment'];
class TgpuBindGroupLayoutImpl {
    [$internal];
    [$soul];
    resourceType = 'bind-group-layout';
    $ = {};
    entries;
    get [$gpuValueOf]() {
        return this.$;
    }
    constructor(entries) {
        this.entries = entries;
        this[$internal] = [];
        const normalizedEntries = {};
        this[$soul] = {
            type: 'bind-group-layout',
            entries: normalizedEntries,
            index: undefined,
            label: undefined,
        };
        let idx = 0;
        for (const [key, entry] of Object.entries(entries)) {
            if (entry === null) {
                normalizedEntries[key] = null;
                idx++;
                continue;
            }
            const membership = { layout: this, key, idx };
            let item = undefined;
            normalizedEntries[key] = entry;
            if ('uniform' in entry) {
                item = new TgpuLaidOutBufferImpl('uniform', entry.uniform, membership);
            }
            if ('storage' in entry) {
                const dataType = 'type' in entry.storage ? entry.storage : entry.storage(0);
                item = new TgpuLaidOutBufferImpl(entry.access ?? 'readonly', dataType, membership);
                normalizedEntries[key] = { ...entry, storage: dataType };
            }
            if ('texture' in entry) {
                item = new TgpuLaidOutTextureViewImpl(entry.texture, membership);
            }
            if ('storageTexture' in entry) {
                item = new TgpuLaidOutTextureViewImpl(entry.storageTexture, membership);
            }
            if ('externalTexture' in entry) {
                item = new TgpuExternalTextureImpl(entry.externalTexture, membership);
            }
            if ('sampler' in entry) {
                item = new TgpuLaidOutSamplerImpl(entry.sampler === 'comparison' ? wgslComparisonSampler() : wgslSampler(), membership);
            }
            invariant(item !== undefined, 'Internal error, expected item to be defined');
            Object.defineProperty(this.$, key, {
                get: () => {
                    return item.$;
                },
            });
            this[$internal].push(item);
            idx++;
        }
    }
    toString() {
        return `bindGroupLayout:${getName(this) ?? '<unnamed>'}`;
    }
    get index() {
        return this[$soul].index;
    }
    $name(label) {
        setName(this, label);
        return this;
    }
    $idx(index) {
        this[$soul].index = index;
        return this;
    }
    unwrap(unwrapper) {
        const unwrapped = unwrapper.device.createBindGroupLayout({
            label: getName(this) ?? '<unnamed>',
            entries: Object.values(this.entries)
                .map((entry, idx) => {
                if (entry === null) {
                    return null;
                }
                let visibility = entry.visibility;
                const binding = {
                    binding: idx,
                    visibility: 0,
                };
                if ('uniform' in entry) {
                    visibility = visibility ?? DEFAULT_READONLY_VISIBILITY;
                    binding.buffer = {
                        type: 'uniform',
                    };
                }
                else if ('storage' in entry) {
                    visibility =
                        visibility ??
                            (entry.access === 'mutable'
                                ? DEFAULT_MUTABLE_VISIBILITY
                                : DEFAULT_READONLY_VISIBILITY);
                    binding.buffer = {
                        type: entry.access === 'mutable' ? 'storage' : 'read-only-storage',
                    };
                }
                else if ('sampler' in entry) {
                    visibility = visibility ?? DEFAULT_READONLY_VISIBILITY;
                    binding.sampler = {
                        type: entry.sampler,
                    };
                }
                else if ('texture' in entry) {
                    visibility = visibility ?? DEFAULT_READONLY_VISIBILITY;
                    const { multisampled, dimension, bindingSampleType } = entry.texture;
                    binding.texture = {
                        sampleType: entry.sampleType ?? bindingSampleType[0],
                        viewDimension: dimension,
                        multisampled,
                    };
                }
                else if ('storageTexture' in entry) {
                    visibility = visibility ?? DEFAULT_MUTABLE_VISIBILITY;
                    const { dimension, access, format } = entry.storageTexture;
                    binding.storageTexture = {
                        access,
                        format,
                        viewDimension: dimension,
                    };
                }
                else if ('externalTexture' in entry) {
                    visibility = visibility ?? DEFAULT_READONLY_VISIBILITY;
                    binding.externalTexture = {};
                }
                if (visibility?.includes('compute')) {
                    binding.visibility |= GPUShaderStage.COMPUTE;
                }
                if (visibility?.includes('vertex')) {
                    binding.visibility |= GPUShaderStage.VERTEX;
                }
                if (visibility?.includes('fragment')) {
                    binding.visibility |= GPUShaderStage.FRAGMENT;
                }
                return binding;
            })
                .filter((v) => v !== null),
        });
        return unwrapped;
    }
}
export class TgpuBindGroupImpl {
    [$internal];
    [$soul];
    resourceType = 'bind-group';
    #entries;
    constructor(root, layout, entries, raw) {
        this.#entries = entries;
        this[$soul] = {
            type: 'bind-group',
            // Undefined only in rootless `tgpu.resolve()`, where the group is never unwrapped
            device: root?.device,
            layout,
            raw,
            label: undefined,
        };
        this[$internal] = {
            materialize: () => {
                const soul = this[$soul];
                if (!soul.raw) {
                    invariant(root, 'Cannot unwrap a bind group created outside of a root.');
                    soul.raw = root.unwrap(this);
                }
                return soul.raw;
            },
        };
        if (!raw) {
            // Checking if all entries are present.
            for (const key of Object.keys(layout.entries)) {
                if (layout.entries[key] !== null && !(key in entries)) {
                    throw new MissingBindingError(getName(layout), key);
                }
            }
        }
    }
    get layout() {
        return this[$soul].layout;
    }
    get entries() {
        return this.#entries;
    }
    unwrap(unwrapper) {
        const raw = this[$soul].raw;
        if (raw) {
            return raw;
        }
        const unwrapped = unwrapper.device.createBindGroup({
            label: getName(this.layout) ?? '<unnamed>',
            layout: unwrapper.unwrap(this.layout),
            entries: Object.entries(this.layout.entries)
                .map(([key, entry], idx) => {
                if (entry === null) {
                    return null;
                }
                const value = this.entries[key];
                if (value === undefined) {
                    throw new Error(`'${key}' is a resource required to populate bind group layout '${getName(this.layout) ?? '<unnamed>'}'.`);
                }
                if ('uniform' in entry) {
                    let resource;
                    if (isBuffer(value)) {
                        if (!isUsableAsUniform(value)) {
                            throw new NotUniformError(value);
                        }
                        resource = { buffer: unwrapper.unwrap(value) };
                    }
                    else if (isUniformBinding(value)) {
                        resource = { buffer: unwrapper.unwrap(value) };
                    }
                    else {
                        resource = { buffer: value };
                    }
                    return {
                        binding: idx,
                        resource,
                    };
                }
                if ('storage' in entry) {
                    let resource;
                    if (isBuffer(value)) {
                        if (!isUsableAsStorage(value)) {
                            throw new NotStorageError(value);
                        }
                        resource = { buffer: unwrapper.unwrap(value) };
                    }
                    else if (isMutableBinding(value) || isReadonlyBinding(value)) {
                        // Types should guarantee that access is mutable if and only if the binding is mutable.
                        invariant((entry.access === 'mutable') === (value.resourceType === 'mutable'), 'Invalid buffer access mode.');
                        resource = { buffer: unwrapper.unwrap(value) };
                    }
                    else {
                        resource = { buffer: value };
                    }
                    return {
                        binding: idx,
                        resource,
                    };
                }
                if ('texture' in entry) {
                    let resource;
                    if (isTexture(value)) {
                        if (!isUsableAsSampled(value)) {
                            throw new NotSampledError(value);
                        }
                        resource = unwrapper.unwrap(value.createView(entry.texture));
                    }
                    else if (isTextureView(value)) {
                        resource = unwrapper.unwrap(value);
                    }
                    else {
                        resource = value;
                    }
                    return {
                        binding: idx,
                        resource,
                    };
                }
                if ('storageTexture' in entry) {
                    let resource;
                    if (isTexture(value)) {
                        if (!isUsableAsStorage(value)) {
                            throw new NotStorageError(value);
                        }
                        resource = unwrapper.unwrap(value.createView(entry.storageTexture));
                    }
                    else if (isTextureView(value)) {
                        resource = unwrapper.unwrap(value);
                    }
                    else {
                        resource = value;
                    }
                    return {
                        binding: idx,
                        resource,
                    };
                }
                if ('sampler' in entry) {
                    if (isComparisonSampler(value) || isSampler(value)) {
                        return {
                            binding: idx,
                            resource: unwrapper.unwrap(value),
                        };
                    }
                    return {
                        binding: idx,
                        resource: value,
                    };
                }
                if ('externalTexture' in entry) {
                    return {
                        binding: idx,
                        resource: value,
                    };
                }
                throw new Error(`Malformed bind group entry: ${safeStringify(value)}`);
            })
                .filter((v) => v !== null),
        });
        return unwrapped;
    }
}
