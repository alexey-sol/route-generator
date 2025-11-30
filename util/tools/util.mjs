import { nodeExternalsPlugin } from "esbuild-node-externals";
import { globSync } from "glob";

const TARGET_NODE = "node16";

export const baseEsbuildOptions = {
    bundle: true,
    entryPoints: globSync("src/**/*.ts"),
    logLevel: "error",
    minify: true,
    platform: "node",
    plugins: [nodeExternalsPlugin()],
    target: TARGET_NODE,
    treeShaking: true,
};
