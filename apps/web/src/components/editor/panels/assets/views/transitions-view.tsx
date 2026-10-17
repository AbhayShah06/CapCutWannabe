"use client";

import { PanelView } from "./base-panel";
import { Button } from "@/components/ui/button";
import { useEditor } from "@/editor/use-editor";
import { useElementSelection } from "@/timeline/hooks/element/use-element-selection";
import { isVisualElement } from "@/timeline/element-utils";
import type { ElementAnimations, ScalarAnimationChannel } from "@/animation/types";
import type { TimelineElement } from "@/timeline";
import { generateUUID } from "@/utils/id";
import { mediaTimeFromSeconds, roundMediaTime, ZERO_MEDIA_TIME } from "@/wasm";
import { ArrowUp, Eye, Sparkles, ZoomIn } from "lucide-react";
import { toast } from "sonner";

type MotionPresetId = "fade" | "slide-up" | "zoom" | "pop";

const PRESETS = [
	{ id: "fade" as const, name: "Fade in and out", detail: "A clean dissolve at both edges", icon: Eye },
	{ id: "slide-up" as const, name: "Slide up", detail: "Enter from below with a soft ease", icon: ArrowUp },
	{ id: "zoom" as const, name: "Slow zoom", detail: "A restrained push toward the subject", icon: ZoomIn },
	{ id: "pop" as const, name: "Pop in", detail: "Fast scale-up for text and callouts", icon: Sparkles },
] as const;

function scalarChannel(keys: Array<{ time: number; value: number }>): ScalarAnimationChannel {
	return {
		keys: keys.map((key, index) => ({
			id: generateUUID(),
			time: roundMediaTime({ time: key.time }),
			value: key.value,
			segmentToNext: "bezier",
			tangentMode: "auto",
			...(index === keys.length - 1 ? { segmentToNext: "linear" as const } : {}),
		})),
	};
}

function numberParam(element: TimelineElement, key: string, fallback: number): number {
	const value = element.params[key];
	return typeof value === "number" ? value : fallback;
}

function buildPresetAnimations(element: TimelineElement, preset: MotionPresetId): ElementAnimations {
	const duration = element.duration;
	const transition = Math.min(mediaTimeFromSeconds({ seconds: 0.45 }), roundMediaTime({ time: duration * 0.2 }));
	const endTransition = roundMediaTime({ time: Math.max(transition, duration - transition) });
	const existing = { ...(element.animations ?? {}) };

	if (preset === "fade") {
		const opacity = numberParam(element, "opacity", 1);
		return {
			...existing,
			opacity: scalarChannel([
				{ time: ZERO_MEDIA_TIME, value: 0 },
				{ time: transition, value: opacity },
				{ time: endTransition, value: opacity },
				{ time: duration, value: 0 },
			]),
		};
	}

	const scaleX = numberParam(element, "transform.scaleX", 1);
	const scaleY = numberParam(element, "transform.scaleY", 1);
	if (preset === "zoom") {
		return {
			...existing,
			"transform.scaleX": scalarChannel([{ time: ZERO_MEDIA_TIME, value: scaleX }, { time: duration, value: scaleX * 1.12 }]),
			"transform.scaleY": scalarChannel([{ time: ZERO_MEDIA_TIME, value: scaleY }, { time: duration, value: scaleY * 1.12 }]),
		};
	}

	if (preset === "slide-up") {
		const y = numberParam(element, "transform.positionY", 0);
		return {
			...existing,
			"transform.positionY": scalarChannel([{ time: ZERO_MEDIA_TIME, value: y + 180 }, { time: transition, value: y }]),
			opacity: scalarChannel([{ time: ZERO_MEDIA_TIME, value: 0 }, { time: transition, value: numberParam(element, "opacity", 1) }]),
		};
	}

	const overshoot = roundMediaTime({ time: transition * 0.62 });
	return {
		...existing,
		"transform.scaleX": scalarChannel([
			{ time: ZERO_MEDIA_TIME, value: scaleX * 0.7 },
			{ time: overshoot, value: scaleX * 1.06 },
			{ time: transition, value: scaleX },
		]),
		"transform.scaleY": scalarChannel([
			{ time: ZERO_MEDIA_TIME, value: scaleY * 0.7 },
			{ time: overshoot, value: scaleY * 1.06 },
			{ time: transition, value: scaleY },
		]),
	};
}

export function TransitionsView() {
	const editor = useEditor();
	const { selectedElements } = useElementSelection();
	const selected = editor.timeline.getElementsWithTracks({ elements: selectedElements }).filter(({ element }) => isVisualElement(element));

	const applyPreset = (preset: MotionPresetId) => {
		if (selected.length === 0) {
			toast.info("Select a clip, image, sticker or text layer first");
			return;
		}
		editor.timeline.updateElements({
			updates: selected.map(({ track, element }) => ({
				trackId: track.id,
				elementId: element.id,
				patch: { animations: buildPresetAnimations(element, preset) },
			})),
		});
		toast.success(`Applied to ${selected.length} ${selected.length === 1 ? "layer" : "layers"}`);
	};

	const clearMotion = () => {
		if (selected.length === 0) return;
		editor.timeline.updateElements({
			updates: selected.map(({ track, element }) => ({ trackId: track.id, elementId: element.id, patch: { animations: undefined } })),
		});
	};

	return (
		<PanelView title="Motion and transitions" contentClassName="space-y-2 pb-4">
			<div className="mb-3 rounded-xl border bg-muted/25 p-3 text-xs leading-relaxed text-muted-foreground">
				Select one or more visual layers, then apply a polished motion preset. Every preset creates editable keyframes.
			</div>
			{PRESETS.map((preset) => (
				<button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="group flex w-full items-center gap-3 rounded-xl border bg-card/55 p-3 text-left transition hover:border-sky-400/40 hover:bg-accent active:scale-[0.99]">
					<span className="rounded-lg bg-gradient-to-br from-sky-400/20 to-violet-500/20 p-2.5"><preset.icon className="size-4" /></span>
					<span className="min-w-0"><span className="block text-sm font-medium">{preset.name}</span><span className="text-muted-foreground block text-xs">{preset.detail}</span></span>
				</button>
			))}
			<Button variant="outline" size="sm" className="mt-3 w-full" disabled={selected.length === 0} onClick={clearMotion}>Clear motion from selection</Button>
		</PanelView>
	);
}
