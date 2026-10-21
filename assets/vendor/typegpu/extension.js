import { getName } from "./shared/meta.js";
/**
 * @category Errors
 */
export class NotStorageError extends Error {
    constructor(value) {
        super(`Resource '${getName(value) ?? '<unnamed>'}' cannot be bound as 'storage'. Use .$usage('storage') to allow it.`);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, NotStorageError.prototype);
    }
}
// #endregion
