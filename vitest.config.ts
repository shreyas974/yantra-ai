import { defineConfig } from "vitest/config";
import path from "path";
export default defineConfig({
    esbuild: { jsx: "automatic" },
    test: {
        globals: true,
        include: ["tests/*.test.ts", "tests/*.test.tsx"],
        environment: "node",
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
        },
    },
});
