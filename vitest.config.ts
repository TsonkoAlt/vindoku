import { defineConfig, defaultInclude } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		include: defaultInclude,
		environment: 'happy-dom',
	},
})
