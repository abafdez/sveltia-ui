// The showcase only runs in the browser: the locale comes from the URL or the local storage, which
// the server can’t read, and server-rendered strings would stay in place after hydration
export const ssr = false;
