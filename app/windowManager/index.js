const { EventEmitter } = require('node:events');

/**
 * WindowManager — singleton that tracks all open BrowserWindows.
 *
 * Registry entries: { type: 'main'|'meeting'|'chat', id: string, window: BrowserWindow }
 *
 * Emits:
 *   'all-closed' — when unregister() leaves the registry empty.
 */
class WindowManager extends EventEmitter {
  #registry = new Map();

  /**
   * Register a BrowserWindow.
   * @param {'main'|'meeting'|'chat'} type
   * @param {string} id
   * @param {Electron.BrowserWindow} browserWindow
   */
  register(type, id, browserWindow) {
    this.#registry.set(id, { type, id, window: browserWindow });
  }

  /**
   * Unregister a BrowserWindow by id.
   * Emits 'all-closed' if the registry becomes empty.
   * @param {string} id
   */
  unregister(id) {
    this.#registry.delete(id);
    if (this.#registry.size === 0) {
      this.emit('all-closed');
    }
  }

  /**
   * Returns all registered entries.
   * @returns {{ type: string, id: string, window: Electron.BrowserWindow }[]}
   */
  getAll() {
    return Array.from(this.#registry.values());
  }

  /**
   * Returns all entries matching the given type.
   * @param {'main'|'meeting'|'chat'} type
   * @returns {{ type: string, id: string, window: Electron.BrowserWindow }[]}
   */
  getByType(type) {
    return this.getAll().filter((entry) => entry.type === type);
  }
}

module.exports = new WindowManager();
