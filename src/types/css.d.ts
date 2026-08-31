// Lets `tsc --noEmit` understand the CSS imports the Expo template uses.
// Metro / the web bundler handle the real transform at build time.
declare module '*.css';

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
