export interface AppSettings {
	openRouterApiKey: string;
	model: string;
}

const SETTINGS_KEY = 'cashbook_settings';

const DEFAULT_SETTINGS: AppSettings = {
	openRouterApiKey: '',
	model: 'openai/gpt-4o',
};

export const AVAILABLE_MODELS = [
	{ id: 'openai/gpt-4o', name: 'GPT-4o', description: 'OpenAI 最新多模态模型，识别准确度高' },
	{ id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'GPT-4o 的轻量版本，速度快成本低' },
	{ id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Anthropic 的高性能模型' },
	{ id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', description: 'Anthropic 的最强模型' },
	{ id: 'google/gemini-pro-vision', name: 'Gemini Pro Vision', description: 'Google 的视觉模型' },
];

export const settings = {
	getSettings: (): AppSettings => {
		if (typeof window === 'undefined') return DEFAULT_SETTINGS;
		try {
			const data = localStorage.getItem(SETTINGS_KEY);
			if (data) {
				const parsed = JSON.parse(data);
				return { ...DEFAULT_SETTINGS, ...parsed };
			}
			return DEFAULT_SETTINGS;
		} catch {
			return DEFAULT_SETTINGS;
		}
	},

	saveSettings: (settings: Partial<AppSettings>): void => {
		if (typeof window === 'undefined') return;
		try {
			const current = settings.getSettings();
			const updated = { ...current, ...settings };
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
		} catch (error) {
			console.error('Failed to save settings:', error);
		}
	},

	resetSettings: (): void => {
		if (typeof window === 'undefined') return;
		try {
			localStorage.removeItem(SETTINGS_KEY);
		} catch (error) {
			console.error('Failed to reset settings:', error);
		}
	},
};

