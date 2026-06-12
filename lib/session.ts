/**
 * Centralized mock session config.
 * All client pages read credentials from env vars — never hardcoded in source.
 * Replace this module with a real auth solution (e.g. NextAuth.js) in production.
 */

export const MOCK_CUSTOMER_ID = process.env.NEXT_PUBLIC_MOCK_USER_ID ?? "";
export const MOCK_CUSTOMER_ROLE = process.env.NEXT_PUBLIC_MOCK_USER_ROLE ?? "CUSTOMER";
export const MOCK_ADMIN_ID = process.env.NEXT_PUBLIC_MOCK_ADMIN_ID ?? "";
export const MOCK_ADMIN_ROLE = process.env.NEXT_PUBLIC_MOCK_ADMIN_ROLE ?? "ADMIN";

/** Authorization header for customer-scoped GraphQL requests */
export const customerAuthHeader = () =>
  `Bearer ${MOCK_CUSTOMER_ID}:${MOCK_CUSTOMER_ROLE}`;

/** Authorization header for admin-scoped GraphQL requests */
export const adminAuthHeader = () =>
  `Bearer ${MOCK_ADMIN_ID}:${MOCK_ADMIN_ROLE}`;
