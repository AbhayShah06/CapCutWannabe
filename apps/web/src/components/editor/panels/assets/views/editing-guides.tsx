"use client";

import { PanelView } from "./base-panel";
import { Button } from "@/components/ui/button";
import { useAssetsPanelStore, type Tab } from "../assets-panel-store";
import { Check, Captions, Film, Gauge, Layers, Scissors, Share2, Sparkles } from "lucide-react";

const WORKFLOWS: Array<{
	title: string;
	description: string;
	icon: typeof Scissors;
	steps: string[];
	tab?: Tab;
	action?: string;
}> = [
	{
		title: "Make a clean first cut",
		description: "The fastest route from raw clips to a watchable edit.",
		icon: Scissors,
		steps: ["Import clips", "Drag the best take to the main track", "Split with S", "Delete dead space", "Use ripple mode to close gaps"],
		tab: "media",
		action: "Open media",
	},
	{
		title: "Create a short-form clip",
		description: "A repeatable 15 to 30 second social structure.",
		icon: Sparkles,
		steps: ["Lead with the result", "Change the visual every 2 to 4 seconds", "Keep text inside safe margins", "End with one clear action"],
		tab: "text",
		action: "Add text",
	},
	{
		title: "Add readable captions",
		description: "Generate locally, then correct names and timing.",
		icon: Captions,
		steps: ["Open Captions", "Choose a language", "Generate", "Review words and line breaks", "Keep captions to two lines"],
		tab: "captions",
		action: "Open captions",
	},
	{
		title: "Animate without looking cheap",
		description: "Use keyframes for restrained motion and emphasis.",
		icon: Layers,
		steps: ["Select a visual", "Add position or scale keyframes", "Move the playhead", "Change the value", "Use the graph editor to ease motion"],
	},
	{
		title: "Keep playback smooth",
		description: "Simple habits for larger projects.",
		icon: Gauge,
		steps: ["Trim unused source footage", "Avoid stacking effects until the cut is locked", "Split long edits into scenes", "Close other GPU-heavy apps"],
	},
	{
		title: "Finish and share",
		description: "Export a video or hand the editable project to someone else.",
		icon: Share2,
		steps: ["Watch once from start to finish", "Check audio with headphones", "Export MP4 at High", "Use Share project to create an editable .ccwproject file"],
	},
];

const SHORTCUTS = [
	["Space", "Play or pause"],
	["S", "Split at playhead"],
	["Delete", "Remove selection"],
	["Ctrl/Cmd + Z", "Undo"],
	["Ctrl/Cmd + D", "Duplicate"],
	["Ctrl/Cmd + C / V", "Copy and paste"],
] as const;

export function EditingGuidesView() {
	const setActiveTab = useAssetsPanelStore((state) => state.setActiveTab);

	return (
		<PanelView title="Editing guides" contentClassName="space-y-3 pb-5">
			<div className="rounded-xl border bg-gradient-to-br from-sky-500/10 via-background to-violet-500/10 p-3">
				<div className="flex items-center gap-2 text-sm font-semibold">
					<Film className="size-4 text-sky-400" />
					Build the story before the effects
				</div>
				<p className="text-muted-foreground mt-1 text-xs leading-relaxed">
					Cut for clarity, fix audio, add captions, then style. This keeps the timeline fast and makes every effect intentional.
				</p>
			</div>

			{WORKFLOWS.map((workflow) => (
				<section key={workflow.title} className="rounded-xl border bg-card/55 p-3">
					<div className="flex items-start gap-2.5">
						<div className="rounded-lg bg-accent p-2"><workflow.icon className="size-4" /></div>
						<div className="min-w-0 flex-1">
							<h3 className="text-sm font-semibold">{workflow.title}</h3>
							<p className="text-muted-foreground mt-0.5 text-xs">{workflow.description}</p>
						</div>
					</div>
					<ol className="mt-3 space-y-1.5">
						{workflow.steps.map((step) => (
							<li key={step} className="flex gap-2 text-xs leading-relaxed">
								<Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
								<span>{step}</span>
							</li>
						))}
					</ol>
					{workflow.tab && workflow.action && (
						<Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => setActiveTab(workflow.tab!)}>
							{workflow.action}
						</Button>
					)}
				</section>
			))}

			<section className="rounded-xl border p-3">
				<h3 className="text-sm font-semibold">Essential shortcuts</h3>
				<div className="mt-2 space-y-2">
					{SHORTCUTS.map(([keys, label]) => (
						<div key={keys} className="flex items-center justify-between gap-3 text-xs">
							<span className="text-muted-foreground">{label}</span>
							<kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">{keys}</kbd>
						</div>
					))}
				</div>
			</section>
		</PanelView>
	);
}
