#!/usr/bin/env bun
/**
 * Geelark Upload App Creator
 *
 * Usage: bun create @geelark/create-upload-app <directory>
 *        bun create ./path/to/template <directory>
 *
 * Creates a new app with S3/R2 upload system, feature flags, and WebSocket support
 */

import * as fs from "fs";
import * as path from "path";

const TEMPLATE_DIR = new URL("../", import.meta.url).pathname;
const TARGET_DIR = process.argv[2] || ".";
const FORCE = process.argv.includes("--force");

async function createApp() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗██╗     ██╗         ║
║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝██║     ██║         ║
║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗██║     ██║         ║
║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║██║     ██║         ║
║   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║███████╗███████╗    ║
║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝    ║
║                                                                  ║
║   🚀 Create a new app with Geelark Upload System                ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
  `);

  const projectName = path.basename(path.resolve(TARGET_DIR));
  const targetPath = path.resolve(TARGET_DIR);

  // Check if directory exists and is not empty
  if (fs.existsSync(targetPath)) {
    const files = fs.readdirSync(targetPath);
    const filtered = files.filter(f => !f.startsWith('.'));

    if (filtered.length > 0) {
      if (!FORCE) {
        console.error(`❌ Error: Directory "${targetPath}" is not empty`);
        console.log(`\nExisting files:`);
        filtered.forEach(f => console.log(`  • ${f}`));
        console.log(`\nOptions:`);
        console.log(`  • Use ${GREEN}--force${NC} to overwrite existing files`);
        console.log(`  • Or choose an empty directory`);
        process.exit(1);
      } else {
        console.log(`⚠️  --force enabled: Will overwrite existing files`);
      }
    }
  } else {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  console.log(`📁 Creating app: ${projectName}`);
  console.log(`   Location: ${targetPath}`);
  if (FORCE) console.log(`   Mode: Force overwrite${NC}`);
  console.log(`\n`);

  // Files to copy (relative to template root)
  const files = [
    // Core files
    { src: "package.json", dest: "package.json", template: true },
    { src: "tsconfig.json", dest: "tsconfig.json", template: false },
    { src: ".gitignore", dest: ".gitignore", template: false },

    // Source files
    { src: "src/index.ts", dest: "src/index.ts", template: true },
    { src: "src/server/UploadService.ts", dest: "src/server/UploadService.ts", template: true },
    { src: "src/server/ServerConstants.ts", dest: "src/server/ServerConstants.ts", template: false },
    { src: "src/server/TelemetrySystem.ts", dest: "src/server/TelemetrySystem.ts", template: true },

    // Configuration
    { src: "env.d.ts", dest: "env.d.ts", template: true },
    { src: "meta.json", dest: "meta.json", template: true },
    { src: "bunfig.toml", dest: "bunfig.toml", template: false },

    // Environment
    { src: ".env.upload.template", dest: ".env.upload.template", template: false },

    // Documentation
    { src: "README.md", dest: "README.md", template: true },
  ];

  // Copy files
  for (const { src, dest, template } of files) {
    const srcPath = path.join(TEMPLATE_DIR, src);
    const destPath = path.join(targetPath, dest);

    if (!fs.existsSync(srcPath)) {
      console.log(`  ⚠️  ${src} (not found, skipping)`);
      continue;
    }

    // Create destination directory
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Read source file
    let content = fs.readFileSync(srcPath, "utf-8");

    // Replace placeholders
    if (template) {
      content = content
        .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
        .replace(/\{\{PROJECT_SLUG\}\}/g, projectName.toLowerCase().replace(/\s+/g, '-'))
        .replace(/\{\{AUTHOR\}\}/g, process.env.USER || "Your Name")
        .replace(/\{\{VERSION\}\}/g, "1.0.0")
        .replace(/\{\{DESCRIPTION\}\}/g, `${projectName} - Upload System`);
    }

    // Write destination file
    fs.writeFileSync(destPath, content, "utf-8");
    console.log(`  ✅ ${dest}`);
  }

  // Create .npmrc if it doesn't exist in template
  const npmrcPath = path.join(TEMPLATE_DIR, ".npmrc");
  if (fs.existsSync(npmrcPath)) {
    const npmrcContent = fs.readFileSync(npmrcPath, "utf-8");
    fs.writeFileSync(path.join(targetPath, ".npmrc"), npmrcContent);
    console.log(`  ✅ .npmrc`);
  }

  console.log(`
✅ App created successfully!

📦 Next steps:

  1. cd ${projectName}
  2. bun install
  3. cp .env.upload.template .env.upload
  4. nano .env.upload
     → Add your S3/R2 credentials
     → Set UPLOAD_PROVIDER to "s3" or "r2"
  5. bun run dev

🔥 Start developing:

  • Development server: ${GREEN}bun run dev${NC}
  • Build for production: ${GREEN}bun run build${NC}
  • Run tests: ${GREEN}bun run test${NC}

📚 Documentation & Help:

  • Upload System Guide: https://github.com/geelark/upload-system
  • Bun Documentation: https://bun.sh/docs
  • Feature Flags: See env.d.ts and meta.json
  • S3 Setup: https://bun.sh/docs/cli/s3
  • R2 Setup: https://developers.cloudflare.com/r2/

💡 Tips:

  • Use ${GREEN}bun run env:prod${NC} to switch to production config
  • Use ${GREEN}bun run server:s3${NC} to test S3 uploads
  • Use ${GREEN}bun run --help${NC} for all CLI options

🐛 Issues?
  • GitHub: https://github.com/geelark/upload-system/issues
  • Discord: https://discord.gg/bun

🎉 Happy coding!
`);
}

// ANSI color codes
const GREEN = "\x1b[32m";
const NC = "\x1b[0m";

// Run
createApp().catch((error) => {
  console.error("❌ Error creating app:", error.message);
  process.exit(1);
});
