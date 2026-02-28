import {
  type CreateNodesV2,
  createNodesFromFiles,
  type ProjectConfiguration,
  readJsonFile,
  joinPathFragments,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { dirname } from 'path';

/**
 * Nx inference plugin that automatically adds typecheck / typecheck-spec
 * targets to any project that has the corresponding tsconfig file.
 *
 * Register in nx.json:
 *   "plugins": ["@pokehub/workspace-plugin/src/plugins/typecheck"]
 */

export const createNodesV2: CreateNodesV2 = [
  '**/project.json',
  (projectFiles, _options, context) => {
    return createNodesFromFiles(
      (_projectFile, _opts, ctx) => {
        const projectRoot = dirname(_projectFile);
        const projectJsonPath = joinPathFragments(
          ctx.workspaceRoot,
          _projectFile
        );

        let projectConfig: ProjectConfiguration;
        try {
          projectConfig = readJsonFile(projectJsonPath);
        } catch {
          return {};
        }

        const targets: ProjectConfiguration['targets'] = {};

        // ── typecheck ────────────────────────────────────────────────────
        // Detect the appropriate tsconfig for source typechecking:
        //   - tsconfig.lib.json  → libraries
        //   - tsconfig.app.json  → NestJS apps
        //   - tsconfig.json      → Next.js apps (projectType: 'application')
        const tsconfigCandidates = [
          'tsconfig.lib.json',
          'tsconfig.app.json',
        ];

        let typecheckTsconfig: string | null = null;
        for (const candidate of tsconfigCandidates) {
          const candidatePath = joinPathFragments(
            ctx.workspaceRoot,
            projectRoot,
            candidate
          );
          if (existsSync(candidatePath)) {
            typecheckTsconfig = candidate;
            break;
          }
        }

        // For apps without tsconfig.lib.json or tsconfig.app.json,
        // fall back to tsconfig.json (e.g. Next.js apps)
        if (!typecheckTsconfig && projectConfig.projectType === 'application') {
          const baseTsconfigPath = joinPathFragments(
            ctx.workspaceRoot,
            projectRoot,
            'tsconfig.json'
          );
          if (existsSync(baseTsconfigPath)) {
            typecheckTsconfig = 'tsconfig.json';
          }
        }

        if (typecheckTsconfig && !projectConfig.targets?.['typecheck']) {
          targets['typecheck'] = {
            executor: 'nx:run-commands',
            options: {
              command: `tsc --noEmit -p ${projectRoot}/${typecheckTsconfig}`,
              cwd: '{workspaceRoot}',
            },
            cache: true,
            inputs: [
              `{projectRoot}/${typecheckTsconfig}`,
              '{projectRoot}/src/**/*.ts',
              '{projectRoot}/src/**/*.tsx',
              '!{projectRoot}/src/**/*.spec.ts',
              '!{projectRoot}/src/**/*.spec.tsx',
              '!{projectRoot}/src/**/*.test.ts',
              '!{projectRoot}/src/**/*.test.tsx',
              '{workspaceRoot}/tsconfig.base.json',
            ],
          };
        }

        // ── typecheck-spec (tsconfig.spec.json) ────────────────────────
        const tsconfigSpecPath = joinPathFragments(
          ctx.workspaceRoot,
          projectRoot,
          'tsconfig.spec.json'
        );

        if (
          existsSync(tsconfigSpecPath) &&
          !projectConfig.targets?.['typecheck-spec']
        ) {
          targets['typecheck-spec'] = {
            executor: 'nx:run-commands',
            options: {
              command: `if ls ${projectRoot}/src/**/*.spec.ts ${projectRoot}/src/**/*.spec.tsx 1> /dev/null 2>&1; then tsc --noEmit -p ${projectRoot}/tsconfig.spec.json; else echo "No spec files found, skipping typecheck"; fi`,
              cwd: '{workspaceRoot}',
            },
            cache: true,
            inputs: [
              '{projectRoot}/tsconfig.spec.json',
              '{projectRoot}/src/**/*.ts',
              '{projectRoot}/src/**/*.tsx',
              '{projectRoot}/src/**/*.spec.ts',
              '{projectRoot}/src/**/*.spec.tsx',
              '{workspaceRoot}/tsconfig.base.json',
            ],
          };
        }

        if (Object.keys(targets).length === 0) {
          return {};
        }

        return {
          projects: {
            [projectRoot]: { targets },
          },
        };
      },
      projectFiles,
      _options,
      context
    );
  },
];
