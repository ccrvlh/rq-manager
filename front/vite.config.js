import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 5174,
    },
    resolve: {
        alias: [
            {
                find: "@",
                replacement: fileURLToPath(new URL("./src", import.meta.url)),
            },
        ],
    },
    plugins: [react()],
});
