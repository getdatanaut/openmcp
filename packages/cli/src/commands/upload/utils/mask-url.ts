/**
 * Masks authentication-related information in a given URL
 *
 * @param vars - This is used to track which variables have been masked.
 * @param url - The URL object to parse for embedded credentials or authentication query parameters.
 * @return a masked URL string
 */
export default function maskUrl(vars: Set<string>, url: URL): string {
  // Start with the protocol and host
  let joinedUrl = `${url.protocol}//`;

  // Extract embedded credentials (if any)
  for (const field of ['username', 'password'] as const) {
    if (url[field]) {
      vars.add(field);
      joinedUrl += `{{${field}}}`;
      if (field === 'username') {
        // Add separator between username and password or username and host
        joinedUrl += url.password ? ':' : '@';
      } else if (field === 'password') {
        // Add separator after password
        joinedUrl += '@';
      }
    }
  }

  // Add host and pathname
  joinedUrl += url.host + (url.pathname === '/' ? '' : url.pathname);

  // Add query parameters if they exist
  if (url.searchParams.size > 0) {
    joinedUrl += '?';

    // Check for common auth query parameters
    const paramKeys = ['token', 'access_token', 'api_key'];
    let isFirstParam = true;

    for (const [key, value] of url.searchParams.entries()) {
      if (!isFirstParam) {
        joinedUrl += '&';
      }

      if (paramKeys.includes(key) && value) {
        vars.add(key);
        joinedUrl += `${key}={{${key}}}`;
      } else {
        joinedUrl += `${key}=${value}`;
      }

      isFirstParam = false;
    }
  }

  return joinedUrl;
}
