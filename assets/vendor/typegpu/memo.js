/**
 * Caches results of the function passed in as
 * the argument to the constructor.
 *
 * If the key can be garbage collected, it will be.
 */
export class WeakMemo {
    #map = new WeakMap();
    #make;
    constructor(make) {
        this.#make = make;
    }
    getOrMake(key, ...args) {
        if (this.#map.has(key)) {
            return this.#map.get(key);
        }
        const value = this.#make(key, ...args);
        this.#map.set(key, value);
        return value;
    }
}
