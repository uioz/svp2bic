import { resolve, isAbsolute, dirname, basename } from 'path';
import { cwd } from 'process';
import { readFile, writeFile } from 'fs-extra';
import { inspect } from 'util';
import { parseStringPromise, Builder } from 'xml2js';

const PackageName: string = require('../package.json').name;

interface Task {
  outputFileName: string;
  clips: Array<{
    src: string;
    start: string;
    stop: string;
  }>;
}

interface BcpfFile {
  BandicutProjectFile: any;
}

function writeToDisk(
  bcpfSet: Array<{
    fileName: string;
    bcpfRaw: string;
  }>,
  outputLocaiton: string
) {
  return Promise.all(
    bcpfSet.map(({ fileName, bcpfRaw }) => {
      console.log(bcpfRaw);

      return writeFile(resolve(outputLocaiton, `${fileName}.bcpf`), bcpfRaw, {
        flag: 'w+',
        encoding: 'utf16le',
      });
    })
  );
}

function convertToBcpf(tasks: Array<Task>): Array<BcpfFile> {
  const BcpfStructures = [];

  for (let index = 0; index < tasks.length; index++) {
    const task = tasks[index];

    BcpfStructures.push({
      BandicutProjectFile: {
        General: {
          $: {
            Version: '3.6.6.676',
          },
        },
        Setting: {
          $: {
            Type: 'Cut',
            Join: 'Yes',
          },
        },
        VideoItem: task.clips.map(({ src, start, stop }, index) => ({
          $: {
            Index: [index],
            Crc: ['0'],
            VideoIndex: ['0'],
            AudioIndex: ['0'],
            Start: [start.slice(0, -1)],
            End: [stop.slice(0, -1)],
            Title: ['Notitle'],
            File: [src],
          },
        })),
      },
    });
  }

  return BcpfStructures;
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
    logger(`${PackageName}: Starting parsing ${inputPath}`);
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

    const BcpfSet = convertToBcpf(tasks).map((item, index) => ({
      fileName: tasks[index].outputFileName,
      bcpfRaw: builder.buildObject(item),
    }));

    if (logger) {
      logger(`${PackageName}: location of output is ${outputPath}`);
    }

    await writeToDisk(BcpfSet, outputPath);
  } catch (error) {
    console.log(error + '');
  }
}
