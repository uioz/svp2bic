import { resolve, isAbsolute, dirname } from 'path';
import { cwd } from 'process';
import { parseString } from 'xml2js';

const PackageName: string = require('../package.json').name;

export async function convert(
  input: string,
  output?: string,
  logger?: (log: string) => void
) {
  if (!isAbsolute(input)) {
    input = resolve(cwd(), input);
  }

  if (typeof output !== 'string') {
    output = dirname(input);
  } else if (!isAbsolute(output)) {
    output = resolve(cwd(), output);
  }

  if (logger) {
    logger(`${PackageName}: Start Parsing xtl from ${input}`);
  }
}
