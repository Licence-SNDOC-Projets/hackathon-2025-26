const PROXY_CONFIG = {
  "/api/**": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "pathRewrite": {
      "^/api": "/api"  // Le backend a déjà le préfixe /api, on le garde
    }
  }
};

module.exports = PROXY_CONFIG;
