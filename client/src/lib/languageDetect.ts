const EXT_MAP: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cc: 'cpp', cxx: 'cpp',
  cs: 'csharp', php: 'php', swift: 'swift', kt: 'kotlin', kts: 'kotlin',
  html: 'html', htm: 'html', css: 'css', scss: 'scss', less: 'less',
  json: 'json', jsonc: 'json', yaml: 'yaml', yml: 'yaml', toml: 'ini',
  md: 'markdown', mdx: 'markdown', sh: 'shell', bash: 'shell', zsh: 'shell',
  sql: 'sql', xml: 'xml', vue: 'html', svelte: 'html',
  dockerfile: 'dockerfile', graphql: 'graphql', lua: 'lua', r: 'r',
  dart: 'dart', scala: 'scala', pl: 'perl', elixir: 'elixir', ex: 'elixir',
};

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'pdf', 'zip', 'gz',
  'tar', 'rar', '7z', 'woff', 'woff2', 'ttf', 'eot', 'otf', 'mp4', 'mp3',
  'wav', 'ogg', 'mov', 'avi', 'exe', 'dll', 'so', 'dylib', 'bin', 'class',
  'jar', 'lock', 'wasm', 'pyc', 'db', 'sqlite',
]);

export function detectLanguage(path: string): string {
  const fileName = path.split('/').pop() || '';
  if (fileName.toLowerCase() === 'dockerfile') return 'dockerfile';
  const ext = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '';
  return EXT_MAP[ext] || 'plaintext';
}

export function isLikelyBinary(path: string): boolean {
  const fileName = path.split('/').pop() || '';
  const ext = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '';
  return BINARY_EXTENSIONS.has(ext);
}
