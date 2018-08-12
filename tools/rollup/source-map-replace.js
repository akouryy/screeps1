// プラグインの書き方の参考: https://github.com/Arcath/rollup-plugin-screeps/blob/d9f88b6634d234acc52e4a9d3926758b76087a27/src/rollup-plugin-screeps.ts
// import { Plugin, OutputOptions, SourceDescription } from 'rollup';
import * as fs from 'fs';

export default function sourceMapReplace() {
  const plugin/*: Plugin*/ = {
    name: "myReplace",

    onwrite(options/*: OutputOptions*/, _bundle/*: SourceDescription*/) {
      if(options.sourcemap) {
        const fname = options.file + '.map';
        let data = fs.readFileSync(fname).toString();
        data = data.replace('\u2028', '\\u2028').replace('\u2029', '\\u2029');
        fs.writeFileSync(fname, data);
      }
    },
  };
  return plugin;
}
