export class AuthorizationConstants {
  // offset to subtract from the authorization expiration date for validation
  public static readonly EXPIRATION_OFFSET_SECS: number = 60;
  public static readonly EXPIRATION_OFFSET_MILLIS: number = AuthorizationConstants.EXPIRATION_OFFSET_SECS * 1000;

  // Commercetools: "Refresh tokens expire 6 months after last usage"
  // (https://docs.commercetools.com/api/authorization#refresh-token-flow)
  // the statement "6 months after last usage" is vague (leap years, months with 28/30/31 days),
  // to make things a little easier, we instruct the client to send back the cookie for the next 5 months.
  public static readonly AUTHORIZATION_COOKIE_MAX_AGE_MONTHS: number = 5;

  private constructor() {}
}
