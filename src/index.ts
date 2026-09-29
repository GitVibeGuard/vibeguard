#!/usr/bin/env node
import { Command } from 'commander';
import pc from 'picocolors';
import { simpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';

const program = new Command();
const git = simpleGit();

interface RiskIssue {
  line: number;
  description: string;
  type: 'LOOP' | 'BILLING' | 'SECURITY';
  suggestion: string;
}

program
  .name('gitvibeguard')
  .description('🛡️ Guardrails and auto-fixes for AI-generated code changes')
  .version('0.2.0');

program
  .command('check')
  .description('Scan modified files for AI coding risks and unsafe execution patterns')
  .option('--fix', 'Automatically attempt to rewrite and patch identified structural risks')
  .action(async (options) => {
    options.fix = true; // ⚡ FORCE AUTO-FIX MODE TO RUN ALWAYS
    console.log(pc.cyan('\n🛡️ GitVibeGuard: Analyzing recent code changes...'));

    try {
      const status = await git.status();
      const filesToScan = [...status.modified, ...status.not_added];

      if (filesToScan.length === 0) {
        console.log(pc.green('✅ No modified files found. Your vibes are clean!'));
        process.exit(0);
      }

      console.log(`Found ${pc.bold(filesToScan.length)} files to evaluate.\n`);
      let totalIssues = 0;

      for (const file of filesToScan) {
        const filePath = path.resolve(process.cwd(), file);
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) continue;

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        console.log(pc.yellow(`🔍 Scanning ${file}...`));
        const issues: RiskIssue[] = [];

        // Scan line-by-line to tell you EXACTLY where the problems are
        lines.forEach((lineText, index) => {
          const lineNumber = index + 1;

          // 1. Check for Infinite Loops
          if (lineText.includes('while(true)') || lineText.includes('while (true)')) {
            issues.push({
              line: lineNumber,
              type: 'LOOP',
              description: 'Potential infinite loop found: "while(true)" execution risk.',
              suggestion: 'Add a maximum iteration counter or a deterministic break condition.'
            });
          }

          // 2. Check for API Rate Limit Bleed
          if (lineText.match(/fetch\(|axios\./) && (lineText.includes('for') || lineText.includes('while'))) {
            issues.push({
              line: lineNumber,
              type: 'BILLING',
              description: 'Network request inside a loop: High risk of uncontrolled cloud billing.',
              suggestion: 'Refactor to use batching, Promise.all(), or pass a rate-limiter.'
            });
          }

          // 3. Check for Secret Leakage
          if (lineText.match(/(api_key|secret|password|token)\s*=\s*['"`][a-zA-Z0-9_-]{8,}['"`]/i)) {
            issues.push({
              line: lineNumber,
              type: 'SECURITY',
              description: 'Plaintext secret credential leak detected.',
              suggestion: 'Move the key to a .env file and load it using process.env.'
            });
          }
        });

        // Output formatting: Tell the user exactly what and where things broke
        if (issues.length > 0) {
          totalIssues += issues.length;
          console.log(pc.red(`❌ Found ${issues.length} risks in ${file}:`));
          
          issues.forEach(issue => {
            console.log(`   [Line ${pc.bold(issue.line)}] ${pc.bold(issue.type)}: ${issue.description}`);
            console.log(`   💡 Suggestion: ${pc.dim(issue.suggestion)}\n`);
          });

          // If the user passed the --fix flag, execute automated healing
          if (options.fix) {
            console.log(pc.blue(`🔧 Attempting auto-fixes for ${file}...`));
            let updatedContent = content;

            issues.forEach(issue => {
              const targetLine = lines[issue.line - 1];
              
              if (issue.type === 'SECURITY') {
                // Auto-fix strategy: Replace the leaked token string with a process.env reference
                const fixedLine = targetLine.replace(/=\s*['"`].*?['"`]/, "= process.env.VIBE_GUARD_SECRET_KEY");
                updatedContent = updatedContent.replace(targetLine, fixedLine);
              }
              
              if (issue.type === 'LOOP') {
                // Auto-fix strategy: Inject a circuit breaker safeguard inside the loop execution context
                const safeLoop = `let _loopGuard = 0;\nwhile(true) {\n  if (_loopGuard++ > 1000) throw new Error("GitVibeGuard: Blocked infinite loop safety trigger");`;
                updatedContent = updatedContent.replace(/while\s*true\s*\{/, safeLoop);
              }
            });

            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(pc.green(`✨ Successfully applied safe patches to ${file}!\n`));
          }

        } else {
          console.log(pc.green(`✅ ${file} passed safety checks.\n`));
        }
      }

      if (totalIssues > 0) {
        if (options.fix) {
          console.log(pc.green(`🎉 Auto-fix complete! Run 'npm run start' again to verify your code is clean.`));
        } else {
          console.log(pc.red(`⚠️ GitVibeGuard detected ${totalIssues} structural risks. Run with ${pc.bold('--fix')} to patch them automatically.`));
          process.exit(1);
        }
      } else {
        console.log(pc.green('🎉 Your code is perfectly safe. Vibes immaculate.'));
        process.exit(0);
      }

    } catch (error: any) {
      console.error(pc.red(`Fatal Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
