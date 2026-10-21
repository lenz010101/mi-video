export class TaskQueue {
    _queue = [];
    _pending = false;
    enqueue(task) {
        return new Promise((resolve, reject) => {
            this._queue.push(async () => {
                try {
                    resolve(await task());
                }
                catch (e) {
                    reject(e);
                }
            });
            void this._processQueue();
        });
    }
    async _processQueue() {
        if (this._pending) {
            return;
        }
        this._pending = true;
        while (this._queue.length > 0) {
            const task = this._queue.shift();
            if (task) {
                await task();
            }
        }
        this._pending = false;
    }
}
