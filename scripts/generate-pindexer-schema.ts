import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const targetSchemaPath = './src/shared/database/schema.ts';
const pindexerTableWhitelist = [
  'dex_ex_aggregate_summary',
  'dex_ex_pairs_block_snapshot',
  'dex_ex_pairs_summary',
  'dex_ex_price_charts',
];

const envFileReady = (): boolean => {
  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  return envContent.includes('DATABASE_URL=');
};

const lintExcludes = '// @ts-nocheck\n/* eslint-disable -- auto generated file */\n';

const modifySchema = (): void => {
  let content = fs.readFileSync(targetSchemaPath, 'utf8');

  // 1. Add lint excludes at the top
  content = lintExcludes + content;

  // 2. Add import statement for DurationWindow
  const importStatement = "import { DurationWindow } from '@/shared/utils/duration.ts';\n";
  content = `${lintExcludes}${importStatement}` + content.slice(lintExcludes.length);

  // 3. Replace `the_window: string;` with `the_window: DurationWindow;`
  content = content.replace(/the_window:\s*string;/g, 'the_window: DurationWindow;');

  // 4. Rename `export interface DB {` to `interface RawDB {`
  content = content.replace(/export\s+interface\s+DB\s+{/, 'interface RawDB {');

  // 5. Create new `export type DB = Pick<RawDB, 'prop1' | 'prop2' | ...>;`
  const pickedProps = pindexerTableWhitelist.map(prop => `'${prop}'`).join(' | ');
  const newDBType = `\nexport type DB = Pick<RawDB, ${pickedProps}>;\n`;
  content += `\n${newDBType}`;

  // Write the modified content back to `schema.ts`
  fs.writeFileSync(targetSchemaPath, content, 'utf8');
  // eslint-disable-next-line -- logging successful completion
  console.log(`Schema modified and copied to ${targetSchemaPath}`);
};

const main = (): void => {
  try {
    if (!envFileReady()) {
      throw new Error('kysely-codegen requires an .env file with DATABASE_URL=<url> set.');
    }

    // Run codegen
    execSync('pnpm kysely-codegen --dialect postgres', { stdio: 'inherit' });

    // Copy output
    const sourceDbDtsPath = path.resolve('node_modules', 'kysely-codegen', 'dist', 'db.d.ts');
    fs.copyFileSync(sourceDbDtsPath, targetSchemaPath);

    modifySchema();
  } catch (error) {
    console.error('An error occurred:', (error as Error).message);
    process.exit(1); // Exit with a non-zero status code to indicate failure
  }
};

main();
