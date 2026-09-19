import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    open: "/examples/events.html",
    watch: {
      ignored: ["!**/dist/**"],
    },
  },
});
