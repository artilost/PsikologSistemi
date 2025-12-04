const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class CustomEnvironment extends NodeEnvironment {
    constructor(config, context) {
        // Patch BEFORE calling super to prevent localStorage initialization
        const originalGlobalThis = globalThis;
        Object.defineProperty(globalThis, 'localStorage', {
            get() { return undefined; },
            configurable: true
        });
        Object.defineProperty(globalThis, 'sessionStorage', {
            get() { return undefined; },
            configurable: true
        });

        super(config, context);

        // Also patch the environment's global
        this.global.localStorage = undefined;
        this.global.sessionStorage = undefined;
    }
}

module.exports = CustomEnvironment;
