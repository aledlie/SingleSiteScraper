// workaround for TypeScript + Rollup 4 incompatibility
declare module 'rollup/parseAst' {
  export function parseAst(...args: any[]): any;
  export function parseAstAsync(...args: any[]): any;
}
