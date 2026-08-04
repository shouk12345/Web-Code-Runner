import {defineConfig} from "vitest/config";

export default defineConfig({
    test: {
        // 基本実行は__tests__内の*.test.ts
        include:['src/**/__tests__/**/*.test.ts'],
        // Dockerが必要な統合テストは分離
        exclude:['**/*.integration.test.ts', 'node_modules/**'],
    },
})