import * as path from 'path';
import * as fs from 'fs';

export interface FilePath {
  path: string;
  options?: { ensurePath?: boolean, baseDir?: string };
}

export interface DirFileObject {
  baseDir?: string;
  dirs?: (string | FilePath)[];
  files?: (string | FilePath)[];
}

/**
 * 
 * Validates whether files and directories exists, creates them if ensurePath is set to true
 * 
 * Directories will be evaluated first, then files
 * 
 * Example: 
 * 
 * ```
 * validateProjectDirectories({
    baseDir: __dirname, // this is optional, defaults to process.cwd()
    files: [
        "index.ts",
        "src/validators/index.ts", // if exists - do nothing
        {
            path: "src/components/test.ts", // if exists do nothing, otherwise create empty file
            options: {
                ensurePath: true
            }
        },
        "src/doesntexist/a.ts" // Doesn't exist, will log error and terminate
    ],
    dirs: [
        "/src/validators", // if exists - do nothing
        {
            path: "src/test/test", // if exists do nothing, otherwise create empty directories recursively
            options: {
                ensurePath: true
            }
        },
        "/src/doesntexist/" // Doesn't exist, will log error and terminate
    ]
})
```
 */
export function validateProjectDirectories(obj: DirFileObject): void {
  const { baseDir = process.cwd() } = obj;

  if (obj.dirs) {
    for (const dir of obj.dirs) {
      let dirPath: string;

      if (typeof dir === 'string') {
        dirPath = path.join(baseDir, dir);
      } else {
        dirPath = path.join(dir.options?.baseDir ?? baseDir, dir.path);

        if (dir.options?.ensurePath) {
          // Create directory if ensurePath option is true
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }

      if (!fs.existsSync(dirPath)) {
        console.error(`ERROR: Directory ${dirPath} does not exist.`);
        process.exit(1);
      } else if (!fs.statSync(dirPath).isDirectory()) {
        console.error(`ERROR: ${dirPath} is not a directory.`);
        process.exit(1);
      }
    }
  }

  if (obj.files) {
    for (const file of obj.files) {
      let filePath: string;

      if (typeof file === 'string') {
        filePath = path.join(baseDir, file);
      } else {
        filePath = path.join(file.options?.baseDir ?? baseDir, file.path);

        if (file.options?.ensurePath) {
          // Create empty file if ensurePath option is true
          fs.writeFileSync(filePath, '');
        }
      }

      if (!fs.existsSync(filePath)) {
        console.error(`ERROR: File ${filePath} does not exist.`);
        process.exit(1);
      } else if (!fs.statSync(filePath).isFile()) {
        console.error(`ERROR: ${filePath} is not a file.`);
        process.exit(1);
      }
    }
  }
}
