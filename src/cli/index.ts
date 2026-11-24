import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import open from 'open';
import { NgAnalyzer } from '../analyzer/ng-analyzer.js';
import { NgLensServer } from '../server/index.js';
import { getDemoAngularProjectData } from './demo-data.js';

export function runCLI(): void {
  const program = new Command();

  program
    .name('nglens')
    .description('🅰️ NgLens - Visual Component & Signals Graph, Architecture Map & Health Auditor for Angular')
    .version('1.0.0');

  // Default command: nglens [projectDir]
  program
    .argument('[dir]', 'Angular project directory to analyze', '.')
    .option('-p, --port <number>', 'Port to run visualizer server on', '4242')
    .option('--no-open', 'Do not automatically open browser')
    .action(async (dir: string, options: { port: string; open: boolean }) => {
      const targetDir = path.resolve(dir);
      console.log(chalk.bold.magenta('\n🅰️  NgLens - Angular Architecture Visualizer\n'));
      console.log(chalk.cyan(`Analyzing Angular project at: ${chalk.bold(targetDir)}...`));

      const analyzer = new NgAnalyzer({ projectRoot: targetDir });
      const result = analyzer.analyze();

      printConsoleSummary(result);

      const server = new NgLensServer({
        port: parseInt(options.port, 10),
        data: result
      });

      const url = await server.start();
      console.log(chalk.green(`\n🚀 NgLens Visual Studio is live at: ${chalk.bold.underline(url)}\n`));
      console.log(chalk.dim('Press Ctrl+C to stop server.\n'));

      if (options.open) {
        try {
          await open(url);
        } catch {
          // Ignore if open browser fails in headless environments
        }
      }
    });

  // Export command: nglens export [dir] -o <file.html>
  program
    .command('export [dir]')
    .description('Export self-contained offline HTML visualizer report')
    .option('-o, --output <file>', 'Output HTML file path', 'nglens-report.html')
    .action((dir: string | undefined, options: { output: string }) => {
      const targetDir = path.resolve(dir || '.');
      console.log(chalk.cyan(`Analyzing and exporting report for: ${chalk.bold(targetDir)}...`));

      const analyzer = new NgAnalyzer({ projectRoot: targetDir });
      const result = analyzer.analyze();

      const html = NgLensServer.getHtmlWithData(result);
      const outPath = path.resolve(options.output);
      fs.writeFileSync(outPath, html, 'utf-8');

      console.log(chalk.green(`\n✅ Standalone Architecture Report saved to: ${chalk.bold(outPath)}`));
      console.log(chalk.dim(`File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB (Offline ready, zero CDN dependencies)\n`));
    });

  // Audit command: nglens audit [dir]
  program
    .command('audit [dir]')
    .description('Run CI/CD architecture health check and exit with status code')
    .action((dir: string | undefined) => {
      const targetDir = path.resolve(dir || '.');
      console.log(chalk.bold.magenta('\n🩺 NgLens Architecture Health Audit\n'));

      const analyzer = new NgAnalyzer({ projectRoot: targetDir });
      const result = analyzer.analyze();

      printConsoleSummary(result);

      const errors = result.diagnostics.filter(d => d.severity === 'error');
      const warnings = result.diagnostics.filter(d => d.severity === 'warning');

      if (errors.length > 0) {
        console.log(chalk.bold.red(`\n❌ Audit Failed: ${errors.length} critical architectural errors found.\n`));
        process.exit(1);
      } else if (warnings.length > 0) {
        console.log(chalk.bold.yellow(`\n⚠️  Audit Passed with ${warnings.length} warning(s).\n`));
        process.exit(0);
      } else {
        console.log(chalk.bold.green('\n✅ Clean Bill of Health! Zero architectural issues detected.\n'));
        process.exit(0);
      }
    });

  // Demo command: nglens demo
  program
    .command('demo')
    .description('Explore NgLens with an interactive Angular 19 signals demo project')
    .option('-p, --port <number>', 'Port to run visualizer server on', '4242')
    .option('--no-open', 'Do not automatically open browser')
    .action(async (options: { port: string; open: boolean }) => {
      console.log(chalk.bold.magenta('\n🅰️  NgLens - Launching Interactive Angular 19 Demo Playground\n'));

      const demoData = getDemoAngularProjectData();
      printConsoleSummary(demoData);

      const server = new NgLensServer({
        port: parseInt(options.port, 10),
        data: demoData
      });

      const url = await server.start();
      console.log(chalk.green(`\n🚀 NgLens Demo Visualizer is live at: ${chalk.bold.underline(url)}\n`));
      console.log(chalk.dim('Press Ctrl+C to stop server.\n'));

      if (options.open) {
        try {
          await open(url);
        } catch {
          // Ignore
        }
      }
    });

  program.parse();
}

function printConsoleSummary(result: any): void {
  const m = result.metrics;
  console.log(chalk.dim('──────────────────────────────────────────────────────'));
  console.log(
    `📦 Components:  ${chalk.bold.white(m.totalComponents)}  ` +
    `(${chalk.cyan(m.standaloneComponents)} Standalone, ${chalk.dim(m.legacyComponents)} Legacy)`
  );
  console.log(
    `⚡ Signals:     ${chalk.bold.green(m.totalSignals + m.totalComputed + m.totalSignalInputs)}  ` +
    `(${m.totalSignals} Signals, ${m.totalComputed} Computed, ${m.totalSignalInputs} Signal Inputs)`
  );
  console.log(`💉 Services:    ${chalk.bold.magenta(m.totalServices)}`);
  console.log(`📈 Modern Signal Adoption: ${chalk.bold.green(m.signalAdoptionRatePercent + '%')}`);
  console.log(chalk.dim('──────────────────────────────────────────────────────'));

  if (result.diagnostics.length > 0) {
    console.log(chalk.bold('\n🔍 Diagnostics & Health Issues:'));
    for (const d of result.diagnostics) {
      const badge = d.severity === 'error' ? chalk.bgRed.black(' ERROR ') : chalk.bgYellow.black(' WARN  ');
      console.log(` ${badge} ${chalk.bold(d.title)}`);
      console.log(`        ${chalk.dim(d.message)}`);
    }
  }
}
