"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = [
    'strapi::logger',
    'strapi::errors',
    'strapi::security',
    {
        name: 'strapi::cors',
        config: {
            origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
        },
    },
    'strapi::poweredBy',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
];
