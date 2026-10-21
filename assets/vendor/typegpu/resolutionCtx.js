import { ConfigurableImpl } from "./core/root/configurableImpl.js";
import { isLazy, isProviding, isSlot, } from "./core/slot/slotTypes.js";
import { isData, UnknownData } from "./data/dataTypes.js";
import { bool } from "./data/numeric.js";
import { snip, withValue, } from "./data/snippet.js";
import { isPtr, isWgslArray, isWgslStruct, Void } from "./data/wgslTypes.js";
import { invariant, MissingSlotValueError, ResolutionError, WgslTypeError } from "./errors.js";
import { provideCtx, topLevelState } from "./execMode.js";
import { naturalsExcept } from "./shared/generators.js";
import { isMarkedInternal } from "./shared/symbols.js";
import { safeStringify } from "./shared/stringify.js";
import { $internal, $providing, $resolve } from "./shared/symbols.js";
import { bindGroupLayout, TgpuBindGroupImpl, } from "./tgpuBindGroupLayout.js";
import { LogGeneratorImpl, LogGeneratorNullImpl } from "./tgsl/consoleLog/logGenerator.js";
import { getBestConversion } from "./tgsl/conversion.js";
import { coerceToSnippet, concretize, numericLiteralToSnippet } from "./tgsl/generationHelpers.js";
import { WgslGenerator } from "./tgsl/wgslGenerator.js";
import { CodegenState, isSelfResolvable, NormalState } from "./types.js";
import { getName, hasTinyestMetadata, isNamable, setName } from "./shared/meta.js";
import { FuncParameterType } from 'tinyest';
import { accessProp } from "./tgsl/accessProp.js";
import { createIoSchema } from "./core/function/ioSchema.js";
import { isShelllessImpl } from "./core/function/shelllessImpl.js";
import { isTgpuFn } from "./core/function/tgpuFn.js";
import { AutoStruct } from "./data/autoStruct.js";
import { EntryInputRouter } from "./core/function/entryInputRouter.js";
import { validateIdentifier, sanitizePrimer, bannedTokens } from "./nameUtils.js";
import { minify } from "./minify.js";
/**
 * Inserted into bind group entry definitions that belong
 * to the automatically generated catch-all bind group.
 *
 * A non-occupied group index can only be determined after
 * every resource has been resolved, so this acts as a placeholder
 * to be replaced with an actual numeric index at the very end
 * of the resolution process.
 */
const CATCHALL_BIND_GROUP_IDX_MARKER = '#CATCHALL#';
class ItemStateStackImpl {
    _stack = [];
    _itemDepth = 0;
    get itemDepth() {
        return this._itemDepth;
    }
    get topItem() {
        const state = this._stack[this._stack.length - 1];
        if (!state || state.type !== 'item') {
            throw new Error('Internal error, expected item layer to be on top.');
        }
        return state;
    }
    get topFunctionScope() {
        return this._stack.findLast((e) => e.type === 'functionScope');
    }
    get topBlockScope() {
        return this._stack.findLast((e) => e.type === 'blockScope');
    }
    get blockDepth() {
        let depth = 0;
        for (let i = this._stack.length - 1; i >= 0; --i) {
            const layer = this._stack[i];
            if (layer?.type === 'functionScope') {
                break;
            }
            if (layer?.type === 'blockScope') {
                depth++;
            }
        }
        return depth;
    }
    pushItem() {
        this._itemDepth++;
        this._stack.push({
            type: 'item',
            usedSlots: new Set(),
        });
    }
    pushSlotBindings(pairs) {
        this._stack.push({
            type: 'slotBinding',
            bindingMap: new WeakMap(pairs),
        });
    }
    pushFunctionScope(functionType, argAccess, returnType, externalMap) {
        const scope = {
            type: 'functionScope',
            functionType,
            argAccess,
            returnType,
            externalMap,
            reportedReturnTypes: new Set(),
            placeholderForVariable: new Map(),
            modifiedVariables: new Set(),
        };
        this._stack.push(scope);
        return scope;
    }
    pushBlockScope() {
        this._stack.push({
            type: 'blockScope',
            takenLocalIdentifiers: new Set(),
            declarations: new Map(),
            externals: new Map(),
        });
    }
    pop(type) {
        const layer = this._stack[this._stack.length - 1];
        if (!layer || (type && layer.type !== type)) {
            throw new Error(`Internal error, expected a ${type} layer to be on top.`);
        }
        const poppedValue = this._stack.pop();
        if (type === 'item') {
            this._itemDepth--;
        }
        return poppedValue;
    }
    readSlot(slot) {
        for (let i = this._stack.length - 1; i >= 0; --i) {
            const layer = this._stack[i];
            if (layer?.type === 'item') {
                // Binding not available yet, so this layer is dependent on the slot's value.
                layer.usedSlots.add(slot);
            }
            else if (layer?.type === 'slotBinding') {
                const boundValue = layer.bindingMap.get(slot);
                if (boundValue !== undefined) {
                    return boundValue;
                }
            }
            else if (layer?.type === 'functionScope' || layer?.type === 'blockScope') {
                // Skip
            }
            else {
                throw new Error('Unknown layer type.');
            }
        }
        return slot.defaultValue;
    }
    getSnippetById(id) {
        for (let i = this._stack.length - 1; i >= 0; --i) {
            const layer = this._stack[i];
            if (layer?.type === 'functionScope') {
                const access = layer.argAccess[id];
                if (access) {
                    return access();
                }
                if (Object.hasOwn(layer.externalMap, id)) {
                    const external = layer.externalMap[id];
                    if (isNamable(external) && getName(external) === undefined) {
                        setName(external, id.replaceAll('.', '_'));
                    }
                    return coerceToSnippet(external);
                }
                return undefined;
            }
            if (layer?.type === 'blockScope') {
                // the order matters
                const snippet = layer.declarations.get(id) ?? layer.externals.get(id);
                if (snippet !== undefined) {
                    return snippet;
                }
            }
            else {
                // Skip
            }
        }
        return undefined;
    }
    /**
     * Returns whether the given identifier is taken in any block scope up to the nearest function scope.
     */
    isIdentifierTakenLocally(id) {
        for (let i = this._stack.length - 1; i >= 0; --i) {
            const layer = this._stack[i];
            if (layer?.type === 'functionScope') {
                // Since functions cannot access resources from the calling scope, we
                // return early here.
                return false;
            }
            if (layer?.type === 'blockScope') {
                if (layer.takenLocalIdentifiers.has(id)) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Returns whether the given identifier is taken in any block scope on the stack.
     *
     * This is useful when resolving a global identifier for the first time within a nested function.
     */
    isIdentifierTakenInCallStack(id) {
        for (let i = this._stack.length - 1; i >= 0; --i) {
            const layer = this._stack[i];
            if (layer?.type === 'blockScope') {
                if (layer.takenLocalIdentifiers.has(id)) {
                    return true;
                }
            }
        }
        return false;
    }
    defineBlockVariable(id, snippet) {
        if (snippet.dataType === UnknownData) {
            throw Error(`Tried to define variable '${id}' of unknown type`);
        }
        for (let i = this._stack.length - 1; i >= 0; --i) {
            const layer = this._stack[i];
            if (layer?.type === 'blockScope') {
                layer.declarations.set(id, snippet);
                return;
            }
        }
        throw new Error('No block scope found to define a variable in.');
    }
    setBlockExternals(externals) {
        for (let i = this._stack.length - 1; i >= 0; --i) {
            const layer = this._stack[i];
            if (layer?.type === 'blockScope') {
                Object.entries(externals).forEach(([id, snippet]) => {
                    layer.externals.set(id, snippet);
                });
                return;
            }
        }
        throw new Error('No block scope found to set externals in.');
    }
    clearBlockExternals() {
        for (let i = this._stack.length - 1; i >= 0; --i) {
            const layer = this._stack[i];
            if (layer?.type === 'blockScope') {
                layer.externals.clear();
                return;
            }
        }
        throw new Error('No block scope found to clear externals in.');
    }
}
const INDENT = [
    '', // 0
    '  ', // 1
    '    ', // 2
    '      ', // 3
    '        ', // 4
    '          ', // 5
    '            ', // 6
    '              ', // 7
    '                ', // 8
];
const N = INDENT.length - 1;
export class IndentController {
    identLevel = 0;
    get pre() {
        return (INDENT[this.identLevel] ??
            INDENT[N].repeat(this.identLevel / N) + INDENT[this.identLevel % N]);
    }
    indent() {
        const str = this.pre;
        this.identLevel++;
        return str;
    }
    dedent() {
        this.identLevel--;
        return this.pre;
    }
    withResetLevel(callback) {
        const savedLevel = this.identLevel;
        this.identLevel = 0;
        try {
            return callback();
        }
        finally {
            this.identLevel = savedLevel;
        }
    }
}
function createArgument(name, type, origin = 'argument') {
    let used = false;
    return {
        name,
        access: () => {
            used = true;
            return snip(name, type, origin, /* possibleSideEffects */ false);
        },
        decoratedType: type,
        get used() {
            return used;
        },
    };
}
function createArgumentPropAccess(argAccess, prop) {
    return () => {
        const argSnippet = argAccess();
        if (!argSnippet) {
            return undefined;
        }
        return accessProp(argSnippet, prop);
    };
}
export class ResolutionCtxImpl {
    #namespaceInternal;
    _indentController = new IndentController();
    _itemStateStack = new ItemStateStackImpl();
    #modeStack = [];
    _declarations = [];
    _varyingLocations;
    /**
     * Holds a set of base (slot-less) functions that have started their resolution process.
     * Used for recursion detection check - a function is recursive if:
     * - it was passed to ctx.resolve while already present in this set,
     * - it never finished resolution (<=> it does not appear in `memoizedResolves`).
     * The set is NOT cleared after the resolution finishes.
     */
    #startedFunctionResolves = new WeakSet();
    #logGenerator;
    gen;
    get varyingLocations() {
        return this._varyingLocations;
    }
    [$internal] = {
        itemStateStack: this._itemStateStack,
    };
    // -- Bindings
    /**
     * A map from registered bind group layouts to random strings put in
     * place of their group index. The whole tree has to be traversed to
     * collect every use of a typed bind group layout, since they can be
     * explicitly imposed group indices, and they cannot collide.
     */
    bindGroupLayoutsToPlaceholderMap = new Map();
    _nextFreeLayoutPlaceholderIdx = 0;
    fixedBindings = [];
    // --
    enableExtensions;
    expectedType;
    #usedImmediate;
    /**
     * A counter used to generate unique identifiers for globally-scoped definitions in the 'random' strategy.
     */
    #lastUniqueId = 0;
    constructor(opts) {
        this.enableExtensions = opts.enableExtensions;
        this.#logGenerator = opts.root ? new LogGeneratorImpl(opts.root) : new LogGeneratorNullImpl();
        this.#namespaceInternal = opts.namespace[$internal];
        this.gen = opts.shaderGenerator ?? new WgslGenerator();
        this.gen.initGenerator(this);
    }
    registerImmediate(immediate) {
        if (this.#usedImmediate !== undefined && this.#usedImmediate !== immediate) {
            throw new Error(`Cannot use both immediate variables '${getName(this.#usedImmediate) ?? '<unnamed>'}' and '${getName(immediate) ?? '<unnamed>'}' in a single shader. At most one immediate variable is allowed per resolution.`);
        }
        this.#usedImmediate = immediate;
    }
    get usedImmediate() {
        return this.#usedImmediate;
    }
    isIdentifierBanned(name) {
        return bannedTokens.has(name);
    }
    isIdentifierTaken(name, scope) {
        return (this.#namespaceInternal.takenGlobalIdentifiers.has(name) ||
            (scope === 'block'
                ? this._itemStateStack.isIdentifierTakenLocally(name)
                : this._itemStateStack.isIdentifierTakenInCallStack(name)));
    }
    makeUniqueIdentifier(primer = 'item', scope) {
        if (scope === 'block' &&
            validateIdentifier(primer).success &&
            !this.isIdentifierTaken(primer, scope)) {
            // Preserving local definitions as they are, provided they are valid and not already taken.
            this.reserveIdentifier(primer, 'block');
            return primer;
        }
        const base = sanitizePrimer(primer);
        let index = 0;
        const random = this.#namespaceInternal.strategy === 'random';
        let name = random ? `${base}_${this.#lastUniqueId++}` : base;
        while (this.isIdentifierTaken(name, scope)) {
            name = random ? `${base}_${this.#lastUniqueId++}` : `${base}_${++index}`;
        }
        this.reserveIdentifier(name, scope);
        return name;
    }
    reserveIdentifier(name, scope) {
        if (scope === 'block') {
            const blockScope = this._itemStateStack.topBlockScope;
            if (blockScope) {
                blockScope.takenLocalIdentifiers.add(name);
                return;
            }
            // Fall through if no block scope is present, treating as global.
        }
        this.#namespaceInternal.takenGlobalIdentifiers.add(name);
    }
    get pre() {
        return this._indentController.pre;
    }
    get topFunctionScope() {
        return this._itemStateStack.topFunctionScope;
    }
    get topFunctionReturnType() {
        const scope = this._itemStateStack.topFunctionScope;
        invariant(scope, 'Internal error, expected function scope to be present.');
        return scope.returnType;
    }
    get shelllessRepo() {
        return this.#namespaceInternal.shelllessRepo;
    }
    get blockDepth() {
        return this._itemStateStack.blockDepth;
    }
    indent() {
        return this._indentController.indent();
    }
    dedent() {
        return this._indentController.dedent();
    }
    getDedented(code) {
        return code.replaceAll(`\n${INDENT[1]}`, '\n').replaceAll(new RegExp(`^${INDENT[1]}`, 'g'), '');
    }
    withResetIndentLevel(callback) {
        return this._indentController.withResetLevel(callback);
    }
    getById(id) {
        const item = this._itemStateStack.getSnippetById(id);
        if (item === undefined) {
            return null;
        }
        return item;
    }
    defineVariable(id, snippet) {
        this._itemStateStack.defineBlockVariable(id, snippet);
    }
    reportReturnType(dataType) {
        const scope = this._itemStateStack.topFunctionScope;
        invariant(scope, 'Internal error, expected function scope to be present.');
        scope.reportedReturnTypes.add(dataType);
    }
    pushBlockScope() {
        this._itemStateStack.pushBlockScope();
    }
    popBlockScope() {
        this._itemStateStack.pop('blockScope');
    }
    setBlockExternals(externals) {
        this._itemStateStack.setBlockExternals(externals);
    }
    clearBlockExternals() {
        this._itemStateStack.clearBlockExternals();
    }
    generateLog(op, args) {
        return this.#logGenerator.generateLog(this, op, args);
    }
    get logResources() {
        return this.#logGenerator.logResources;
    }
    resolveFunction(options) {
        try {
            const scope = this._itemStateStack.pushFunctionScope(options.functionType, {}, options.returnType, options.externalMap);
            // Pushing a block scope as well, so that any identifiers declared at this point will be scoped to the function body.
            this._itemStateStack.pushBlockScope();
            const args = [];
            if (options.entryInput) {
                const { dataSchema, positionalArgs } = options.entryInput;
                const firstParam = options.params[0];
                const structArg = dataSchema
                    ? createArgument(this.makeUniqueIdentifier('_arg_0', 'block'), dataSchema)
                    : undefined;
                if (structArg) {
                    args.push(structArg);
                }
                if (firstParam?.type === FuncParameterType.destructuredObject) {
                    // Route each destructured prop to a positional arg or struct field.
                    for (const { name, alias } of firstParam.props) {
                        const argInfo = positionalArgs.find((a) => a.schemaKey === name);
                        if (argInfo) {
                            const arg = createArgument(this.makeUniqueIdentifier(alias, 'block'), argInfo.type);
                            args.push(arg);
                            scope.argAccess[alias] = arg.access;
                        }
                        else if (structArg) {
                            scope.argAccess[alias] = createArgumentPropAccess(structArg.access, name);
                        }
                    }
                }
                else if (firstParam?.type === FuncParameterType.identifier) {
                    // Create named arg snippets, then a proxy for property access routing.
                    const proxyEntries = [];
                    for (const a of positionalArgs) {
                        const argName = this.makeUniqueIdentifier(a.schemaKey, 'block');
                        const arg = createArgument(argName, a.type);
                        args.push(arg);
                        proxyEntries.push({ schemaKey: a.schemaKey, arg: arg.access });
                    }
                    const router = new EntryInputRouter(structArg?.access, proxyEntries);
                    scope.argAccess[firstParam.name] = () => snip('N/A', router, 'argument');
                }
                else {
                    // No first param: push positional args with schema key names.
                    for (const a of positionalArgs) {
                        const argName = this.makeUniqueIdentifier(`_arg_${a.schemaKey}`, 'block');
                        const arg = createArgument(argName, a.type);
                        args.push(arg);
                        scope.argAccess[argName] = arg.access;
                    }
                }
            }
            else {
                for (const [i, argType] of options.argTypes.entries()) {
                    const astParam = options.params[i];
                    // We know if arguments are passed by reference or by value, because we
                    // enforce that based on the whether the argument is a pointer or not.
                    //
                    // It still applies for shell-less functions, since we determine the type
                    // of the argument based on the argument's referentiality.
                    // In other words, if we pass a reference to a function, it's typed as a pointer,
                    // otherwise it's typed as a value.
                    const origin = isPtr(argType)
                        ? argType.addressSpace === 'storage'
                            ? argType.access === 'read'
                                ? 'readonly'
                                : 'mutable'
                            : argType.addressSpace
                        : 'argument';
                    switch (astParam?.type) {
                        case FuncParameterType.identifier: {
                            const arg = createArgument(this.makeUniqueIdentifier(astParam.name, 'block'), argType, origin);
                            args.push(arg);
                            scope.argAccess[astParam.name] = arg.access;
                            break;
                        }
                        case FuncParameterType.destructuredObject: {
                            const objArg = createArgument(this.makeUniqueIdentifier(`_arg_${i}`, 'block'), argType, origin);
                            args.push(objArg);
                            for (const { name, alias } of astParam.props) {
                                scope.argAccess[alias] = createArgumentPropAccess(objArg.access, name);
                            }
                            break;
                        }
                        case undefined: {
                            // Only push the argument if it's not an auto-struct.
                            // If we're not using an auto-struct, it's not going to
                            // have any properties anyway.
                            if (!(argType instanceof AutoStruct)) {
                                args.push({
                                    name: this.makeUniqueIdentifier(`_arg_${i}`, 'block'),
                                    access: () => {
                                        throw new Error(`Unreachable: Accessing an argument that wasn't named in the function signature`);
                                    },
                                    decoratedType: argType,
                                    used: false,
                                });
                            }
                        }
                    }
                }
            }
            let returnType;
            const code = this.gen.functionDefinition({
                functionType: options.functionType,
                name: options.name,
                workgroupSize: options.workgroupSize,
                args,
                body: options.body,
                determineReturnType: () => {
                    if (returnType) {
                        // Already determined
                        return returnType;
                    }
                    returnType = options.returnType;
                    if (returnType instanceof AutoStruct) {
                        // We're expecting an "auto" return type, so if there were structs returned,
                        // we accept the struct, otherwise we let the rest of the code unify on a
                        // primitive type.
                        if (isWgslStruct(scope.reportedReturnTypes.values().next().value)) {
                            returnType = returnType.completeStruct;
                        }
                        else {
                            returnType = undefined;
                        }
                    }
                    if (!returnType) {
                        const returnTypes = [...scope.reportedReturnTypes];
                        if (returnTypes.length === 0) {
                            returnType = Void;
                        }
                        else {
                            const conversion = getBestConversion(returnTypes);
                            if (conversion && !conversion.hasImplicitConversions) {
                                returnType = conversion.targetType;
                            }
                        }
                        if (!returnType) {
                            throw new Error(`Expected function to have a single return type, got [${returnTypes.join(', ')}]. Cast explicitly to the desired type.`);
                        }
                        returnType = concretize(returnType);
                        if (options.functionType === 'vertex' || options.functionType === 'fragment') {
                            returnType = createIoSchema(returnType);
                        }
                    }
                    return returnType;
                },
            });
            if (!returnType) {
                throw new Error(`Failed to determine return type`);
            }
            return {
                code,
                returnType,
            };
        }
        finally {
            this._itemStateStack.pop('blockScope');
            this._itemStateStack.pop('functionScope');
        }
    }
    addDeclaration(declaration, name) {
        this._declarations.push({ name, code: declaration });
    }
    get declarations() {
        return this._declarations;
    }
    allocateLayoutEntry(layout) {
        const memoMap = this.bindGroupLayoutsToPlaceholderMap;
        let placeholderKey = memoMap.get(layout);
        if (!placeholderKey) {
            placeholderKey = `#BIND_GROUP_LAYOUT_${this._nextFreeLayoutPlaceholderIdx++}#`;
            memoMap.set(layout, placeholderKey);
        }
        return placeholderKey;
    }
    allocateFixedEntry(layoutEntry, resource) {
        const binding = this.fixedBindings.length;
        this.fixedBindings.push({ layoutEntry, resource });
        return {
            group: CATCHALL_BIND_GROUP_IDX_MARKER,
            binding,
        };
    }
    readSlot(slot) {
        const value = this._itemStateStack.readSlot(slot);
        if (value === undefined) {
            throw new MissingSlotValueError(slot);
        }
        return value;
    }
    withSlots(pairs, callback) {
        if (pairs.length === 0) {
            return callback();
        }
        this._itemStateStack.pushSlotBindings(pairs);
        try {
            return callback();
        }
        finally {
            this._itemStateStack.pop('slotBinding');
        }
    }
    withVaryingLocations(locations, callback) {
        this._varyingLocations = locations;
        try {
            return callback();
        }
        finally {
            this._varyingLocations = undefined;
        }
    }
    withRenamed(item, name, callback) {
        if (!name) {
            return callback();
        }
        const oldName = getName(item);
        try {
            setName(item, name);
            return callback();
        }
        finally {
            if (oldName) {
                setName(item, oldName);
            }
        }
    }
    unwrap(eventual) {
        if (isProviding(eventual)) {
            return this.withRenamed(eventual[$providing].inner, getName(eventual), () => this.withSlots(eventual[$providing].pairs, () => this.unwrap(eventual[$providing].inner)));
        }
        let maybeEventual = eventual;
        // Unwrapping all layers of slots.
        while (true) {
            if (isSlot(maybeEventual)) {
                maybeEventual = this.readSlot(maybeEventual);
            }
            else if (isLazy(maybeEventual)) {
                maybeEventual = this._getOrCompute(maybeEventual);
            }
            else {
                break;
            }
        }
        return maybeEventual;
    }
    _getOrCompute(lazy) {
        // All memoized versions of `lazy`
        const instances = this.#namespaceInternal.memoizedLazy.get(lazy) ?? [];
        this._itemStateStack.pushItem();
        try {
            for (const instance of instances) {
                const slotValuePairs = [...instance.slotToValueMap.entries()];
                if (slotValuePairs.every(([slot, expectedValue]) => slot.areEqual(this._itemStateStack.readSlot(slot), expectedValue))) {
                    return instance.result;
                }
            }
            // If we got here, no item with the given slot-to-value combo exists in cache yet
            // Getting out of codegen or simulation mode so we can execute JS normally.
            this.pushMode(new NormalState());
            let result;
            try {
                result = lazy[$internal].compute();
            }
            finally {
                this.popMode('normal');
            }
            // We know which slots the item used while resolving
            const slotToValueMap = new Map();
            for (const usedSlot of this._itemStateStack.topItem.usedSlots) {
                slotToValueMap.set(usedSlot, this._itemStateStack.readSlot(usedSlot));
            }
            instances.push({ slotToValueMap, result });
            this.#namespaceInternal.memoizedLazy.set(lazy, instances);
            return result;
        }
        catch (err) {
            if (err instanceof ResolutionError) {
                throw err.appendToTrace(lazy);
            }
            throw new ResolutionError(err, [lazy]);
        }
        finally {
            this._itemStateStack.pop('item');
        }
    }
    /**
     * @param item The item whose resolution should be either retrieved from the cache (if there is a cache hit), or resolved.
     */
    _getOrInstantiate(item) {
        // All memoized versions of `item`
        const instances = this.#namespaceInternal.memoizedResolves.get(item) ?? [];
        this._itemStateStack.pushItem();
        try {
            for (const instance of instances) {
                const slotValuePairs = [...instance.slotToValueMap.entries()];
                if (slotValuePairs.every(([slot, expectedValue]) => slot.areEqual(this._itemStateStack.readSlot(slot), expectedValue))) {
                    return instance.result;
                }
            }
            // If we got here, no item with the given slot-to-value combo exists in cache yet
            let result;
            if (isData(item)) {
                // Ref is arbitrary, as we're resolving a schema
                result = snip(this.gen.emitTypeAnnotation(item), Void, /* origin */ 'runtime');
            }
            else if (isLazy(item) || isSlot(item)) {
                result = this.resolve(this.unwrap(item));
            }
            else if (isSelfResolvable(item)) {
                result = item[$resolve](this);
            }
            else if (hasTinyestMetadata(item)) {
                // Resolving a function with tinyest metadata directly means calling it with no arguments, since
                // we cannot infer the types of the arguments from a WGSL string.
                const shellless = this.#namespaceInternal.shelllessRepo.get(item, 
                /* no arguments */ undefined);
                if (!shellless) {
                    throw new Error(`Couldn't resolve ${item.name}. Make sure it's a function that accepts no arguments, or call it from another TypeGPU function.`);
                }
                return this.withResetIndentLevel(() => this.resolve(shellless));
            }
            else {
                throw new TypeError(`Unresolvable internal value: ${safeStringify(item)}`);
            }
            // We know which slots the item used while resolving
            const slotToValueMap = new Map();
            for (const usedSlot of this._itemStateStack.topItem.usedSlots) {
                slotToValueMap.set(usedSlot, this._itemStateStack.readSlot(usedSlot));
            }
            instances.push({ slotToValueMap, result });
            this.#namespaceInternal.memoizedResolves.set(item, instances);
            return result;
        }
        catch (err) {
            if (err instanceof ResolutionError) {
                throw err.appendToTrace(item);
            }
            throw new ResolutionError(err, [item]);
        }
        finally {
            this._itemStateStack.pop('item');
        }
    }
    resolve(item, schema) {
        if (typeof item === 'string') {
            if (!schema || schema === UnknownData) {
                throw new Error(`Strings cannot be injected into WGSL directly (tried to inject '${item}'). Look for TypeGPU APIs that cover your use-case, or resort to using tgpu['~unstable'].rawCodeSnippet for raw code injection.`);
            }
            // For example:
            // () => { 'use gpu'; const color = d.vec3f(); return color; }
            //                             snip('color', d.vec3f) ^^^^^
            return snip(item, schema, /* origin */ 'runtime');
        }
        if ((isTgpuFn(item) || isShelllessImpl(item)) && !isProviding(item)) {
            // We skip providing functions to only perform the checks on slot-less functions.
            if (this.#startedFunctionResolves.has(item) &&
                !this.#namespaceInternal.memoizedResolves.has(item)) {
                throw new Error(`Recursive function ${item} detected. Recursion is not allowed on the GPU.`);
            }
            this.#startedFunctionResolves.add(item);
        }
        if (isProviding(item)) {
            return this.withRenamed(item[$providing].inner, getName(item), () => this.withSlots(item[$providing].pairs, () => this.resolve(item[$providing].inner, schema)));
        }
        if (isMarkedInternal(item) || hasTinyestMetadata(item)) {
            // Top-level resolve
            if (this._itemStateStack.itemDepth === 0) {
                try {
                    this.pushMode(new CodegenState());
                    const result = provideCtx(this, () => this._getOrInstantiate(item));
                    return snip(`${this._declarations.map((decl) => decl.code).join('\n\n')}${result.value}`, Void, 
                    /* origin */ 'runtime');
                }
                finally {
                    this.popMode('codegen');
                }
            }
            return this._getOrInstantiate(item);
        }
        // This is a value that comes from the outside, maybe we can coerce it
        if (typeof item === 'number') {
            const realSchema = schema ?? numericLiteralToSnippet(item).dataType;
            invariant(realSchema !== UnknownData, 'Schema has to be known for resolving numbers');
            return this.gen.numericLiteral(item, realSchema);
        }
        if (typeof item === 'boolean') {
            return snip(item ? 'true' : 'false', bool, /* origin */ 'constant', false);
        }
        if (schema && isWgslArray(schema)) {
            if (!Array.isArray(item)) {
                throw new WgslTypeError(`Cannot coerce ${item} into value of type '${schema}'`);
            }
            if (schema.elementCount !== item.length) {
                throw new WgslTypeError(`Cannot create value of type '${schema}' from an array of length: ${item.length}`);
            }
            return this.gen.typeInstantiation(schema, item.map((element) => snip(element, schema.elementType, /* origin */ 'runtime')));
        }
        if (schema && isWgslStruct(schema)) {
            return this.gen.typeInstantiation(schema, Object.entries(schema.propTypes).map(([key, propType]) => snip(item[key], propType, /* origin */ 'runtime')));
        }
        if (item === null) {
            throw new WgslTypeError(`'null' is not resolvable. 'null' is only allowed in comptime checks.`);
        }
        throw new WgslTypeError(`Value ${safeStringify(item)} is not resolvable${schema && schema !== UnknownData ? ` to type ${safeStringify(schema)}` : ''}`);
    }
    resolveSnippet(snippet) {
        return withValue(this.resolve(snippet.value, snippet.dataType).value, snippet);
    }
    pushMode(mode) {
        this.#modeStack.push(mode);
    }
    popMode(expected) {
        const mode = this.#modeStack.pop();
        if (expected !== undefined) {
            invariant(mode?.type === expected, 'Unexpected mode');
        }
    }
    get mode() {
        return this.#modeStack[this.#modeStack.length - 1] ?? topLevelState;
    }
}
export function resolve(item, options) {
    const ctx = new ResolutionCtxImpl(options);
    const snippet = options.config
        ? ctx.withSlots(options.config(new ConfigurableImpl([])).bindings, () => ctx.resolve(item))
        : ctx.resolve(item);
    let code = snippet.value;
    const memoMap = ctx.bindGroupLayoutsToPlaceholderMap;
    const usedBindGroupLayouts = [];
    const takenIndices = new Set([...memoMap.keys()].map((layout) => layout.index).filter((v) => v !== undefined));
    const automaticIds = naturalsExcept(takenIndices);
    const layoutEntries = ctx.fixedBindings.map((binding, idx) => [String(idx), binding.layoutEntry]);
    // Bind group indices are only known now, so the same placeholder
    // replacements applied to `code` are recorded and re-applied to each
    // declaration's code.
    const bindingReplacements = [];
    const createCatchallGroup = () => {
        const catchallIdx = automaticIds.next().value;
        const catchallLayout = bindGroupLayout(Object.fromEntries(layoutEntries));
        usedBindGroupLayouts[catchallIdx] = catchallLayout;
        code = code.replaceAll(CATCHALL_BIND_GROUP_IDX_MARKER, String(catchallIdx));
        bindingReplacements.push([CATCHALL_BIND_GROUP_IDX_MARKER, String(catchallIdx)]);
        return [
            catchallIdx,
            new TgpuBindGroupImpl(
            // Undefined only in rootless `tgpu.resolve()`, where the group is never unwrapped
            options.root, catchallLayout, Object.fromEntries(
            // oxlint-disable-next-line typescript/no-explicit-any -- it's fine
            ctx.fixedBindings.map((binding, idx) => [String(idx), binding.resource]))),
        ];
    };
    // Retrieving the catch-all binding index first, because it's inherently
    // the least swapped bind group (fixed and cannot be swapped).
    const catchall = layoutEntries.length > 0 ? createCatchallGroup() : undefined;
    for (const [layout, placeholder] of memoMap.entries()) {
        const idx = layout.index ?? automaticIds.next().value;
        usedBindGroupLayouts[idx] = layout;
        code = code.replaceAll(placeholder, String(idx));
        bindingReplacements.push([placeholder, String(idx)]);
    }
    if (options.enableExtensions && options.enableExtensions.length > 0) {
        const extensions = options.enableExtensions.map((ext) => `enable ${ext};`);
        code = `${extensions.join('\n')}\n\n${code}`;
    }
    let declarations = ctx.declarations.map(({ name, code: declarationCode }) => ({
        name,
        code: bindingReplacements.reduce((acc, [placeholder, idx]) => acc.replaceAll(placeholder, idx), declarationCode),
    }));
    if (options.minify) {
        code = minify(code);
        // TODO(#2804): remove this workaround
        declarations = declarations.map((entry) => ({ ...entry, code: minify(entry.code) }));
    }
    return {
        code,
        declarations,
        usedBindGroupLayouts,
        catchall,
        logResources: ctx.logResources,
        usedImmediate: ctx.usedImmediate,
    };
}
