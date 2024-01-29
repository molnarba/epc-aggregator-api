import Joi = require('joi');

/**
 * This schema is used to notify at startup of the application,
 * if any of the required environment variables aren't set.
 * It can be used to verify the type or values, too.
 * See https://docs.nestjs.com/techniques/configuration#schema-validation
 * and
 * https://github.com/hapijs/joi for more information.
 */
export const environmentValidationSchema = Joi.object({
  COMMERCETOOLS_API_URL: Joi.string().required(),
  COMMERCETOOLS_AUTH_URL: Joi.string().required(),
  COMMERCETOOLS_PROJECT_KEY: Joi.string().required(),
  COMMERCETOOLS_CLIENT_ID: Joi.string().required(),
  COMMERCETOOLS_CLIENT_SECRET: Joi.string().required(),
  COMMERCETOOLS_AUTH_CLIENT_ID: Joi.string().required(),
  COMMERCETOOLS_AUTH_CLIENT_SECRET: Joi.string().required(),
  COMMERCETOOLS_AUTH_CLIENT_SCOPES: Joi.string().required(),

  STORYBLOK_ACCESS_TOKEN: Joi.string().required(),

  TELEGRAF_HOST: Joi.string().required(),
  TELEGRAF_PORT: Joi.number().required(),

  FACET_CONFIGURATION_YAML_FILE: Joi.string().required(),

  COOKIE_PARSER_SIGNATURE_SECRET: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),

  CRYPTO_SECRET: Joi.string().required(),
  CRYPTO_IV: Joi.string().required(),

  CORS_WHITELIST: Joi.string().required(),
  AUTHORIZATION_COOKIE_OPTIONS_NAME: Joi.string().required(),
});
