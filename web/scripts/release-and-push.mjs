import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const webDir = resolve(__dirname, '..');
const repoRootDir = resolve(webDir, '..');

// Helper to run shell commands cleanly
function run(cmd, cwd = repoRootDir, inherit = true) {
  try {
    return execSync(cmd, {
      cwd,
      encoding: 'utf-8',
      stdio: inherit ? 'inherit' : 'pipe'
    });
  } catch (err) {
    if (!inherit && err.stdout) console.log(err.stdout);
    if (!inherit && err.stderr) console.error(err.stderr);
    throw err;
  }
}

function runSilent(cmd, cwd = repoRootDir) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return '';
  }
}

async function main() {
  const bumpType = process.argv[2] || 'patch'; // patch, minor, major
  console.log(`\n==================================================`);
  console.log(`🚀 Starting Umkhuseli Release & Push Pipeline [${bumpType.toUpperCase()}]`);
  console.log(`==================================================\n`);

  // 1. Verify clean or stagable git status
  const currentBranch = runSilent('git rev-parse --abbrev-ref HEAD');
  console.log(`📌 Current Branch: ${currentBranch}`);

  // 2. Read package.json in web directory
  const pkgPath = resolve(webDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const oldVersion = pkg.version;
  const versionParts = oldVersion.split('.').map(Number);

  if (bumpType === 'major') {
    versionParts[0]++;
    versionParts[1] = 0;
    versionParts[2] = 0;
  } else if (bumpType === 'minor') {
    versionParts[1]++;
    versionParts[2] = 0;
  } else {
    // patch default
    versionParts[2]++;
  }

  const newVersion = versionParts.join('.');
  const tag = `v${newVersion}`;
  console.log(`📦 Bumping Version: ${oldVersion} -> ${newVersion} (${tag})`);

  // Write updated package.json
  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');

  // 3. Inspect recent commits since last tag to build release notes & find referenced issues
  const lastTag = runSilent('git describe --tags --abbrev=0') || runSilent('git rev-list --max-parents=0 HEAD');
  const commitLogRaw = runSilent(`git log ${lastTag}..HEAD --pretty=format:"* %s (%h)"`);
  const commitLog = commitLogRaw || '* Routine updates, performance enhancements & stability fixes.';

  // Scan commits for issue references like #12, fixes #12, closes #44
  const issueMatches = [...commitLog.matchAll(/#(\d+)/g)].map(m => m[1]);
  const uniqueIssues = [...new Set(issueMatches)];

  // 4. Update CHANGELOG.md (repo root)
  const changelogPath = resolve(repoRootDir, 'CHANGELOG.md');
  const today = new Date().toISOString().split('T')[0];
  const newChangelogEntry = `\n## [${newVersion}] - ${today}\n\n### Changes\n${commitLog}\n`;

  if (existsSync(changelogPath)) {
    const existingChangelog = readFileSync(changelogPath, 'utf-8');
    writeFileSync(changelogPath, existingChangelog.replace(/^#\s*Changelog/i, `# Changelog\n${newChangelogEntry}`), 'utf-8');
    console.log(`📝 Updated root CHANGELOG.md`);
  }

  // 5. Update README.md (root) version badge/indicator if present
  const readmePath = resolve(repoRootDir, 'README.md');
  if (existsSync(readmePath)) {
    let readme = readFileSync(readmePath, 'utf-8');
    const badgeRegex = /v\d+\.\d+\.\d+/g;
    if (badgeRegex.test(readme)) {
      readme = readme.replace(badgeRegex, tag);
      writeFileSync(readmePath, readme, 'utf-8');
      console.log(`📝 Updated root README.md version pointers`);
    }
  }

  // 6. Stage and Commit
  console.log(`\n🔄 Staging modified release files...`);
  run(`git add "${pkgPath}" "${changelogPath}" "${readmePath}"`);
  
  // Also stage any pending work if needed
  run(`git add -u`);

  const commitMsg = `chore(release): bump version to ${tag} and sync documentation`;
  try {
    run(`git commit -m "${commitMsg}"`);
  } catch {
    console.log(`ℹ️ Nothing new to commit or commit already recorded.`);
  }

  // 7. Create Git Tag
  console.log(`🏷️ Creating Git Tag ${tag}...`);
  try {
    run(`git tag -a ${tag} -m "Release ${tag}"`);
  } catch (e) {
    console.warn(`⚠️ Tag ${tag} might already exist or tag command exited with warning.`);
  }

  // 8. Push branch and tags
  console.log(`\n📤 Pushing to remote ${currentBranch} with tags...`);
  run(`git push origin ${currentBranch}`);
  run(`git push origin ${tag}`);

  // 9. GitHub CLI Automation: Release, Issue Status, & Milestone Linking
  const hasGh = runSilent('gh --version');
  if (hasGh) {
    console.log(`\n🐙 Triggering GitHub Release & Project Updates via GitHub CLI...`);
    const releaseTitle = `Release ${tag}`;
    const releaseNotes = `### Umkhuseli ${tag} (${today})\n\n${commitLog}\n\n---\n*Automated production release via Umkhuseli Pipeline.*`;

    // Create GitHub Release
    try {
      run(`gh release create ${tag} --title "${releaseTitle}" --notes "${releaseNotes.replace(/"/g, '\\"')}"`);
      console.log(`🎉 GitHub Release ${tag} created successfully!`);
    } catch (e) {
      console.warn(`⚠️ GitHub release creation warning (release may already exist).`);
    }

    // Close or update referenced issues
    if (uniqueIssues.length > 0) {
      console.log(`🎯 Found referenced issues in commit log: ${uniqueIssues.map(i => '#' + i).join(', ')}`);
      for (const issueNum of uniqueIssues) {
        try {
          run(`gh issue comment ${issueNum} --body "Resolved in release ${tag}."`);
          run(`gh issue close ${issueNum} --reason completed`);
          console.log(`✅ Closed Issue #${issueNum} with resolution status.`);
        } catch {
          console.warn(`Could not update issue #${issueNum}.`);
        }
      }
    }
  } else {
    console.log(`ℹ️ GitHub CLI (gh) not detected; git push & tags succeeded.`);
  }

  console.log(`\n✨ Pipeline complete! Umkhuseli ${tag} is live.\n`);
}

main().catch(err => {
  console.error('\n❌ Release & Push Pipeline Failed:', err.message);
  process.exit(1);
});
