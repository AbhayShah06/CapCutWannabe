import type { TCanvasSize } from "@/project/types";
import type { TScene, TextElement, TextTrack } from "@/timeline";
import { buildDefaultScene } from "@/timeline/scenes";
import { buildTextElement } from "@/timeline/element-utils";
import { generateUUID } from "@/utils/id";
import { mediaTimeFromSeconds } from "@/wasm";

export type ProjectTemplateId =
	| "blank-landscape"
	| "blank-vertical"
	| "blank-square"
	| "social-hook"
	| "product-promo"
	| "tutorial"
	| "podcast-clip";

export interface ProjectTemplate {
	id: ProjectTemplateId;
	name: string;
	detail: string;
	category: "Blank" | "Social" | "Business" | "Creator";
	canvasSize: TCanvasSize;
	durationSeconds?: number;
	accent: string;
}

export const PROJECT_TEMPLATES: readonly ProjectTemplate[] = [
	{
		id: "blank-landscape",
		name: "Landscape video",
		detail: "YouTube, presentations, desktop",
		category: "Blank",
		canvasSize: { width: 1920, height: 1080 },
		accent: "from-sky-500/45 to-blue-700/15",
	},
	{
		id: "blank-vertical",
		name: "Vertical video",
		detail: "Shorts, Reels and TikTok",
		category: "Blank",
		canvasSize: { width: 1080, height: 1920 },
		accent: "from-violet-500/45 to-fuchsia-700/15",
	},
	{
		id: "blank-square",
		name: "Square video",
		detail: "Social posts and promos",
		category: "Blank",
		canvasSize: { width: 1080, height: 1080 },
		accent: "from-emerald-500/45 to-teal-700/15",
	},
	{
		id: "social-hook",
		name: "Fast social hook",
		detail: "Hook, proof and call to action",
		category: "Social",
		canvasSize: { width: 1080, height: 1920 },
		durationSeconds: 15,
		accent: "from-orange-500/55 to-red-700/20",
	},
	{
		id: "product-promo",
		name: "Product promo",
		detail: "Problem, benefit and final offer",
		category: "Business",
		canvasSize: { width: 1920, height: 1080 },
		durationSeconds: 20,
		accent: "from-cyan-500/45 to-indigo-700/20",
	},
	{
		id: "tutorial",
		name: "Quick tutorial",
		detail: "Intro, three steps and result",
		category: "Creator",
		canvasSize: { width: 1920, height: 1080 },
		durationSeconds: 30,
		accent: "from-lime-500/40 to-emerald-700/20",
	},
	{
		id: "podcast-clip",
		name: "Podcast clip",
		detail: "Speaker title, captions and follow prompt",
		category: "Social",
		canvasSize: { width: 1080, height: 1920 },
		durationSeconds: 30,
		accent: "from-pink-500/45 to-purple-700/20",
	},
] as const;

type TemplateBeat = {
	content: string;
	start: number;
	duration: number;
	y: number;
	size: number;
	weight?: "normal" | "bold";
	background?: boolean;
};

const TEMPLATE_BEATS: Partial<Record<ProjectTemplateId, TemplateBeat[]>> = {
	"social-hook": [
		{ content: "STOP SCROLLING", start: 0, duration: 3, y: -260, size: 78, weight: "bold" },
		{ content: "Show the problem here", start: 3, duration: 4, y: -40, size: 54, weight: "bold" },
		{ content: "Prove the result", start: 7, duration: 5, y: -40, size: 54, weight: "bold" },
		{ content: "Follow for the full breakdown", start: 12, duration: 3, y: 310, size: 38, background: true },
	],
	"product-promo": [
		{ content: "THE PROBLEM", start: 0, duration: 4, y: -250, size: 72, weight: "bold" },
		{ content: "Introduce your product", start: 4, duration: 6, y: -40, size: 62, weight: "bold" },
		{ content: "Show the main benefit", start: 10, duration: 6, y: -40, size: 56, weight: "bold" },
		{ content: "Try it today", start: 16, duration: 4, y: 270, size: 42, background: true },
	],
	 tutorial: [
		{ content: "HOW TO DO THIS", start: 0, duration: 4, y: -260, size: 68, weight: "bold" },
		{ content: "1  Set up the shot", start: 4, duration: 7, y: 250, size: 42, background: true },
		{ content: "2  Show the important action", start: 11, duration: 7, y: 250, size: 42, background: true },
		{ content: "3  Reveal the result", start: 18, duration: 7, y: 250, size: 42, background: true },
		{ content: "Save this for later", start: 25, duration: 5, y: 270, size: 38, background: true },
	],
	"podcast-clip": [
		{ content: "THE BIG IDEA", start: 0, duration: 4, y: -350, size: 66, weight: "bold" },
		{ content: "Speaker name  •  Show name", start: 0, duration: 30, y: -250, size: 32 },
		{ content: "Generate captions from the Captions tab", start: 4, duration: 22, y: 320, size: 44, background: true },
		{ content: "Watch the full conversation", start: 26, duration: 4, y: 370, size: 36, background: true },
	],
};

function buildTemplateTextElement(beat: TemplateBeat): TextElement {
	const element = buildTextElement({
		raw: {
			name: beat.content,
			duration: mediaTimeFromSeconds({ seconds: beat.duration }),
			params: {
				content: beat.content,
				fontFamily: "Arial",
				fontSize: beat.size,
				fontWeight: beat.weight ?? "normal",
				color: "#ffffff",
				"transform.positionY": beat.y,
				"background.enabled": beat.background ?? false,
				"background.color": "#111111",
				"background.cornerRadius": 18,
				"background.paddingX": 28,
				"background.paddingY": 18,
			},
		},
		startTime: mediaTimeFromSeconds({ seconds: beat.start }),
	});

	return { ...element, id: generateUUID() } as TextElement;
}

export function buildSceneFromTemplate({
	templateId,
}: {
	templateId: ProjectTemplateId;
}): TScene {
	const scene = buildDefaultScene({ name: "Main scene", isMain: true });
	const beats = TEMPLATE_BEATS[templateId];
	if (!beats?.length) return scene;

	const textTrack: TextTrack = {
		id: generateUUID(),
		name: "Template guide",
		type: "text",
		hidden: false,
		elements: beats.map(buildTemplateTextElement),
	};

	return {
		...scene,
		tracks: { ...scene.tracks, overlay: [textTrack] },
	};
}

export function getProjectTemplate(id: ProjectTemplateId): ProjectTemplate {
	return PROJECT_TEMPLATES.find((template) => template.id === id) ?? PROJECT_TEMPLATES[0];
}
