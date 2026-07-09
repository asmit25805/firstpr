import type { FSNode } from '../types';

// Chrome/Edge/Opera support showDirectoryPicker() with real read+write access
// to the local disk. Firefox and Safari do not implement it (Mozilla has
// flagged the local-disk pickers as a feature they don't intend to ship) and
// only expose the sandboxed Origin Private File System instead, which can't
// see a folder you `git clone`d. See README.md > Browser Requirements.
const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.cache',
  'coverage', '.venv', 'venv', '__pycache__', '.turbo', '.parcel-cache',
  'target', 'vendor',
]);
const MAX_FILES = 1200;

export function supportsFileSystemAccess(): boolean {
  return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
}

let fileCounter = 0;

async function walkDirectoryHandle(handle: FileSystemDirectoryHandle, path: string): Promise<FSNode> {
  const children: FSNode[] = [];
  // FileSystemDirectoryHandle is asynchronously iterable at runtime; TS lib
  // definitions for this API vary by version, so we go through a loose cast.
  const iterable = handle as unknown as AsyncIterable<[string, FileSystemHandle]>;
  for await (const [name, child] of iterable) {
    if (fileCounter > MAX_FILES) break;
    if (child.kind === 'directory') {
      if (IGNORED_DIRS.has(name)) continue;
      children.push(await walkDirectoryHandle(child as FileSystemDirectoryHandle, `${path}/${name}`));
    } else {
      fileCounter += 1;
      children.push({
        name,
        path: `${path}/${name}`,
        kind: 'file',
        handle: child as FileSystemFileHandle,
      });
    }
  }
  children.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'directory' ? -1 : 1));
  return { name: path.split('/').pop() || path, path, kind: 'directory', children };
}

export async function openLocalFolder(): Promise<FSNode> {
  const picker = (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
  const handle = await picker();
  fileCounter = 0;
  return walkDirectoryHandle(handle, handle.name);
}

export async function readFileNode(node: FSNode): Promise<string> {
  if (node.handle) {
    const file = await node.handle.getFile();
    return file.text();
  }
  if (node.file) {
    return node.file.text();
  }
  throw new Error('This file has no readable handle.');
}

export async function writeFileNode(node: FSNode, content: string): Promise<void> {
  if (!node.handle) {
    throw new Error('Read-only mode: your browser cannot save directly to disk. Copy the code back into your own editor, or switch to Chrome/Edge for full read+write support.');
  }
  const handleWithWrite = node.handle as unknown as {
    createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
  };
  const writable = await handleWithWrite.createWritable();
  await writable.write(content);
  await writable.close();
}

export function flattenFilePaths(root: FSNode, limit = 300): string[] {
  const out: string[] = [];
  function walk(node: FSNode) {
    if (out.length >= limit) return;
    if (node.kind === 'file') {
      out.push(node.path);
      return;
    }
    for (const child of node.children || []) {
      if (out.length >= limit) return;
      walk(child);
    }
  }
  for (const child of root.children || []) walk(child);
  return out;
}

// --- Fallback path for Firefox/Safari: <input type="file" webkitdirectory> ---
// Read-only: we can load and view the folder and get AI help, but changes
// have to be copied back into the learner's own editor manually.
export function buildTreeFromFileList(fileList: FileList): FSNode {
  const root: FSNode = { name: 'project', path: 'project', kind: 'directory', children: [] };
  const dirMap = new Map<string, FSNode>();
  dirMap.set('project', root);

  Array.from(fileList).forEach((file) => {
    const relPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const parts = relPath.split('/');
    if (parts.some((p) => IGNORED_DIRS.has(p))) return;

    let currentPath = 'project';
    let currentNode = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const dirName = parts[i];
      const nextPath = `${currentPath}/${dirName}`;
      let next = dirMap.get(nextPath);
      if (!next) {
        next = { name: dirName, path: nextPath, kind: 'directory', children: [] };
        dirMap.set(nextPath, next);
        currentNode.children!.push(next);
      }
      currentNode = next;
      currentPath = nextPath;
    }
    const fileName = parts[parts.length - 1];
    currentNode.children!.push({ name: fileName, path: `${currentPath}/${fileName}`, kind: 'file', file });
  });

  return root;
}
