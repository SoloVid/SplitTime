import { defineConfig, Plugin } from 'wmr';
import { loadConfig, createMatchPathAsync } from 'tsconfig-paths';

export default defineConfig({
  // alias: {
  //   "engine/*": "../../engine",
  //   "engine-api/*": "../../api",
  //   // "engine-api": "../../api",
  //   "server/*": "../server",
  // },
  plugins: [tsConfigPathsPlugin({ cwd: __dirname })],
});


function tsConfigPathsPlugin({ cwd }: { cwd: string }) {
	const tsconfig = loadConfig(cwd);

	if (tsconfig.resultType === 'failed' || !tsconfig.paths) {
		return {};
	}

	const matchPath = createMatchPathAsync(cwd, tsconfig.paths, ['exports', 'module', 'main'], false);

	return {
		resolveId(id) {
			return new Promise((resolve, reject) => {
				matchPath(id, undefined, undefined, ['js', 'ts', 'tsx', 'jsx'], (err, resolved) => {
					if (err) reject(err);
					else resolve(resolved);
				});
			});
		}
	};
}