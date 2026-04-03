export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'admin-jwt-secret-placeholder'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'api-token-salt-placeholder'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'transfer-token-salt-placeholder'),
    },
  },
});
