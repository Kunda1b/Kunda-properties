const cmd = process.argv[2] ?? "dev";
const messages = {
  dev: "Admin app: add Vite/React and src/pages (KYC queue, moderation, escrow).",
  build: "noop",
  lint: "noop",
  typecheck: "noop",
};
console.log(messages[cmd] ?? messages.dev);
process.exit(0);
