import { resolve, isAbsolute, dirname, basename } from 'path';
import { cwd } from 'process';
import { readFile } from 'fs-extra';
import { inspect } from 'util';
import { parseStringPromise, Builder } from 'xml2js';

const PackageName: string = require('../package.json').name;

function writeTask() {}

interface Task {
  outputFileName: string;
  clips: Array<{
    src: string;
    start: string;
    stop: string;
  }>;
}

function convertToBcpf(tasks: Array<Task>, outputLocation: string) {
  const template = {
    BandicutProjectFile: {
      General: [{ Version: ['3.6.6.676'] }],
      Setting: [{ Type: ['Cut'], Join: ['Yes'] }],
      VideoItem: [
        {
          Index: ['0'],
          Crc: ['0'],
          VideoIndex: ['0'],
          AudioIndex: ['0'],
          Start: ['0'],
          End: ['60000000'],
          Title: ['Notitle'],
          File: [
            '',
          ],
        },
      ],
    },
  };

  for (let index = 0; index < tasks.length; index++) {
    const element = tasks[index];
    template.BandicutProjectFile.VideoItem.push({
      Index: [`${index}`],
      Crc: ['0'],
      VideoIndex: ['0'],
      AudioIndex: ['0'],
      Start: [element.],
      End: ['60000000'],
      Title: ['Notitle'],
      File: [
        '',
      ],
    })
  }
  

}

// 不处理 smm 所支持的多视频格式
interface XtlFile {
  timelines?: {
    timeline: Array<{
      group: Array<{
        output: [string];
        track: Array<{
          clip: Array<{
            src: [string];
            start: [string];
            stop: [string];
          }>;
        }>;
      }>;
      view: Array<{
        timeline_files?: Array<unknown>;
      }>;
    }>;
  };
}

function extractTaskFromXtl(xtlFile: XtlFile): Array<Task> {
  const tasks = [];
  const timeline = xtlFile?.timelines?.timeline;

  if (timeline) {
    let i = 0,
      len = timeline.length;

    while (i < len) {
      try {
        const reuslt = timeline[i];

        if (reuslt.view[0].timeline_files?.length !== 1) {
          console.warn(
            `${PackageName}: Multi source but have one output in task ${
              i + 1
            } doesn't support auto skipped`
          );
          continue;
        }

        for (const {
          output: [output],
          track,
        } of reuslt.group) {
          tasks.push({
            outputFileName: basename(output),
            clips: track[0].clip.map(
              ({ src: [src], start: [start], stop: [stop] }) => ({
                src,
                start,
                stop,
              })
            ),
          });
        }
      } catch (_) {
        console.warn(
          `${PackageName}: Task ${i + 1} parseing failed auto skipped`
        );
        continue;
      }

      i++;
    }

    return tasks;
  } else {
    throw new Error(`${PackageName}: Xtl parsing failed`);
  }
}

export async function convert(
  inputPath: string,
  outputPath?: string,
  logger?: (log: string) => void
) {
  if (!isAbsolute(inputPath)) {
    inputPath = resolve(cwd(), inputPath);
  }
  inspect;
  if (typeof outputPath !== 'string') {
    outputPath = dirname(inputPath);
  } else if (!isAbsolute(outputPath)) {
    outputPath = resolve(cwd(), outputPath);
  }

  if (logger) {
    logger(`${PackageName}: Start Parsing xtl from ${inputPath}`);
    // logger(`${PackageName}: Output location was ${output}`)
  }

  try {
    const fileBuffer = await readFile(inputPath);

    const tasks = extractTaskFromXtl(
      (await parseStringPromise(fileBuffer.toString('utf16le'), {
        mergeAttrs: true,
      })) as XtlFile
    );

    const builder = new Builder({
      xmldec: {
        version: '1.0',
        encoding: 'utf-16',
      },
    });

    const bufferSet = convertToBcpf(tasks, outputPath).map((item) =>
      builder.buildObject(item)
    );

    //
  } catch (error) {
    console.log(error + '');
  }
}
