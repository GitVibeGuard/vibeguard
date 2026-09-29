#!/usr/bin/env node
import { Command } from 'commander';
import pc from 'picocolors';
import { simpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';
const program = new Command();
const git = simpleGit();
program
    .name('gitvibeguard')
    .description('🛡️ Guardrails for AI-generated code changes')
    .version('0.1.0');
program
    .command('check')
    .description('Scan modified files for AI coding risks and unsafe execution patterns')
    .action(async () => {
    console.log(pc.cyan('\n🛡️ GitVibeGuard: Analyzing recent code changes...'));
    try {
        // 1. Get the list of modified or untracked files in the current git repository
        const status = await git.status();
        const filesToScan = [...status.modified, ...status.not_added];
        if (filesToScan.length === 0) {
            console.log(pc.green('✅ No modified files found. Your vibes are clean!'));
            process.exit(0);
        }
        console.log(`Found ${pc.bold(filesToScan.length)} files to evaluate.\n`);
        let totalIssues = 0;
        // 2. Loop through and audit each file
        for (const file of filesToScan) {
            const filePath = path.resolve(process.cwd(), file);
            // Skip directories or deleted files safely
            if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory())
                continue;
            const content = fs.readFileSync(filePath, 'utf8');
            console.log(pc.yellow(`🔍 Scanning ${file}...`));
            const issues = [];
            // Risk Metric A: Unbounded Loops (Huge AI hallucination risk)
            if (content.includes('while(true)') || content.includes('while (true)')) {
                issues.push('Potential infinite loop found: "while(true)" execution risk.');
            }
            // Risk Metric B: Uncapped Recursion or Token Drain
            if (content.match(/fetch\(|axios\./) && (content.includes('for') || content.includes('forEach'))) {
                issues.push('API call embedded in a loop: High risk of uncontrolled billing/rate limits.');
            }
            // Risk Metric C: Hardcoded Credentials (Common LLM mistakes)
            if (content.match(/(api_key|secret|password|token)\s*=\s*['"`][a-zA-Z0-9_-]{8,}['"`]/i)) {
                issues.push('Possible plaintext API Key or Secret Credential leakage detected.');
            }
            // 3. Print the diagnostic results for the file
            if (issues.length > 0) {
                totalIssues += issues.length;
                console.log(pc.red(`❌ Issues identified in ${file}:`));
                issues.forEach(issue => console.log(`   - ${pc.dim(issue)}`));
            }
            else {
                console.log(pc.green(`✅ ${file} passed deterministic safety checks.`));
            }
            console.log('');
        }
        // 4. Final summary execution return
        if (totalIssues > 0) {
            console.log(pc.red(`⚠️ GitVibeGuard found a total of ${totalIssues} structural risks.`));
            process.exit(1); // Fail the build/commit if issues exist
        }
        else {
            console.log(pc.green('🎉 All checks passed! Code safe to stage and push.'));
            process.exit(0);
        }
    }
    catch (error) {
        console.error(pc.red(`Fatal Error: ${error.message}`));
        process.exit(1);
    }
});
program.parse(process.argv);
