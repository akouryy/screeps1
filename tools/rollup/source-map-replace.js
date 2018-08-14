// プラグインの書き方の参考: https://github.com/Arcath/rollup-plugin-screeps/blob/d9f88b6634d234acc52e4a9d3926758b76087a27/src/rollup-plugin-screeps.ts
// import { Plugin, OutputOptions, SourceDescription } from 'rollup';
import * as fs from 'fs';

const dblStrRgxPart = `
  "
    (?: [^ " \\n \\\\]+ | \\\\ (?:
      [^0-9xu \\n]            # SingleEscapeCharacter or NonEscapeCharacter
    | 0 (?! \\d)
    | x [0-9a-fA-F]{2}        # HexEscapeSequence
    | u [0-9a-fA-F]{4}        # UnicodeEscapeSequence
    | u \\{ [0-9a-fA-F]+ \\}
    | \\n                     # LineContinuation
    ))*
  "
`.replace(/#.+/g, '').replace(/\s+/g, '');

const sourcesContentRgxPart = `
  "sourcesContent"
  \\s*:\\s*
  \\[
    ${dblStrRgxPart}
    (?:,${dblStrRgxPart})*
  \\]
  ,
`.replace(/#.+/g, '').replace(/\s+/g, '');

const sourcesContentRgx = new RegExp(sourcesContentRgxPart, 'g');

export default function sourceMapReplace() {
  const plugin/*: Plugin*/ = {
    name: "myReplace",

    onwrite(options/*: OutputOptions*/, _bundle/*: SourceDescription*/) {
      if(options.sourcemap) {
        const fname = options.file + '.map';
        let data = fs.readFileSync(fname).toString();
        data = data.replace('\u2028', '\\u2028').replace('\u2029', '\\u2029');
        data = data.replace(sourcesContentRgx, ''),
        fs.writeFileSync(fname, data);
      }
    },
  };
  return plugin;
}
