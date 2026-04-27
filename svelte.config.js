import adapter from '@sveltejs/adapter-vercel';
import { execSync } from 'node:child_process';

function getCommit() {
	const sha = process.env.VERCEL_GIT_COMMIT_SHA;
	if (sha) return sha.slice(0, 7);
	try {
		return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		return 'dev';
	}
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		version: { name: getCommit() },
		adapter: adapter({
			runtime: 'nodejs22.x'
		})
	}
};

export default config;
