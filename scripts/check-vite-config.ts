import { resolve } from "node:path";
import { createLogger, loadConfigFromFile, type ConfigEnv } from "vite-plus";

export async function assertViteConfigCompatible({
  configFile = resolve("vite.config.ts"),
  command = "serve",
}: {
  configFile?: string;
  command?: ConfigEnv["command"];
} = {}): Promise<void> {
  const warnings: string[] = [];
  const logger = createLogger("silent");
  logger.warn = logger.warnOnce = (message) => warnings.push(message);
  const ignored = process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING;
  // The gate must still detect incompatibilities when a shell hides dev warnings.
  delete process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING;
  try {
    const loaded = await loadConfigFromFile(
      { command, mode: command === "serve" ? "development" : "production" },
      configFile,
      process.cwd(),
      "warn",
      logger,
      "bundle",
    );
    if (!loaded) throw new Error(`Vite config not found: ${configFile}`);
    if (warnings.length) throw new Error(warnings.join("\n"));
  } finally {
    if (ignored === undefined) delete process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING;
    else process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = ignored;
  }
}

if (import.meta.main) {
  try {
    const commands: ConfigEnv["command"][] = ["serve", "build"];
    for (const command of commands) await assertViteConfigCompatible({ command });
    console.log("check:vite-config ✓ — dev and build configs load without warnings.");
  } catch (error) {
    console.error("check:vite-config ✗ — fix the config or its imported dependencies:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
