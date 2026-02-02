export function openInBrowser(url: string): void {
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
		const { shell } = require("electron") as { shell: { openExternal: (url: string) => Promise<void> } };
		void shell.openExternal(url);
	} catch {
		window.open(url, "_blank", "noopener");
	}
}
