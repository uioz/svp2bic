import { Command } from 'commander';
import { convert } from './index';

const Program = new Command();

Program.version(require('../package.json').version)
  .argument('<input>', 'The path of xtl file')
  .argument('[ouput]', 'The path for output', undefined)
  .action((input, output) => convert(input, output, (log) => console.log(log)));

Program.parse(process.argv);
