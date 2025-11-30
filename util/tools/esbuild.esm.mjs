import { baseEsbuildOptions } from "./util.mjs";
import * as esbuild from "esbuild";

await esbuild.build({
    ...baseEsbuildOptions,
    format: "esm",
    outdir: "dist/esm",
});
