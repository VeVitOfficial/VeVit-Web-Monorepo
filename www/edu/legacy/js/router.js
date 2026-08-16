const router = {
    routes: [],
    isFileProtocol: false,

    init() {
        this.isFileProtocol = window.location.protocol === 'file:';
        window.addEventListener('popstate', () => this.resolve());
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-link]');
            if (link) {
                e.preventDefault();
                const path = link.getAttribute('href');
                if (path) this.navigate(path);
            }
        });
        this.resolve();
    },

    route(pattern, handler) {
        const paramNames = [];
        const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
            paramNames.push(name);
            return '([^/]+)';
        });
        this.routes.push({ pattern, regex: new RegExp(`^${regexStr}$`), paramNames, handler });
        return this;
    },

    navigate(path) {
        if (this.isFileProtocol) {
            window.location.hash = path;
        } else {
            window.history.pushState(null, '', path);
            this.resolve();
        }
    },

    getCurrentPath() {
        if (this.isFileProtocol) {
            const hash = window.location.hash.slice(1) || '/';
            return hash;
        }
        return window.location.pathname || '/';
    },

    resolve() {
        const path = this.getCurrentPath();
        window.scrollTo({ top: 0, behavior: 'instant' });
        for (const route of this.routes) {
            const match = path.match(route.regex);
            if (match) {
                const params = {};
                route.paramNames.forEach((name, i) => {
                    params[name] = decodeURIComponent(match[i + 1]);
                });
                route.handler(params);
                return;
            }
        }
        // Default route
        const homeRoute = this.routes.find(r => r.pattern === '/');
        if (homeRoute) homeRoute.handler({});
    }
};

export default router;