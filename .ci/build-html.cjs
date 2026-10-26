const { execSync } = require('child_process');
const version = process.argv[3] || process.env.YGOPRO3_VERSION || '0.1.0';
const command = process.argv[2] === 'build'
	? 'npm run build -- --mode web'
	: 'npm run dev -- --mode web --host 0.0.0.0 --port 80';

execSync(command, {
	stdio: 'inherit',
	env: {
		...process.env,
		YGOPRO3_VERSION: version,
	},
});
