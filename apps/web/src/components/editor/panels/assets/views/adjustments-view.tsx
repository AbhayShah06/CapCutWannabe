"use client";

import { PanelView } from "./base-panel";
import { Button } from "@/components/ui/button";
import { useEditor } from "@/editor/use-editor";
import { useElementSelection } from "@/timeline/hooks/element/use-element-selection";
import { toast } from "sonner";

const LOOKS = [
	{ name: "Clean", detail: "Bright and balanced", values: { brightness: 106, contrast: 104, saturation: 102 }, className: "from-slate-100 to-sky-200" },
	{ name: "Vivid", detail: "Punchy social color", values: { brightness: 103, contrast: 112, saturation: 128 }, className: "from-orange-400 to-fuchsia-600" },
	{ name: "Cinematic", detail: "Deeper contrast and restraint", values: { brightness: 94, contrast: 122, saturation: 88 }, className: "from-amber-800 to-cyan-900" },
	{ name: "Soft", detail: "Gentle highlights", values: { brightness: 108, contrast: 88, saturation: 92 }, className: "from-rose-200 to-violet-300" },
	{ name: "Monochrome", detail: "True black and white", values: { brightness: 100, contrast: 112, saturation: 0 }, className: "from-white to-black" },
	{ name: "Muted", detail: "Editorial low saturation", values: { brightness: 99, contrast: 106, saturation: 68 }, className: "from-stone-300 to-stone-700" },
] as const;

export function AdjustmentsView() {
	const editor = useEditor();
	const { selectedElements } = useElementSelection();
	const selected = editor.timeline
		.getElementsWithTracks({ elements: selectedElements })
		.filter(({ element }) => element.type === "video" || element.type === "image");

	const apply = (values: { brightness: number; contrast: number; saturation: number }) => {
		if (selected.length === 0) {
			toast.info("Select a video or image first");
			return;
		}
		editor.timeline.updateElements({
			updates: selected.map(({ track, element }) => ({
				trackId: track.id,
				elementId: element.id,
				patch: {
					params: {
						...element.params,
						"adjust.brightness": values.brightness,
						"adjust.contrast": values.contrast,
						"adjust.saturation": values.saturation,
					},
				},
			})),
		});
		toast.success(`Look applied to ${selected.length} ${selected.length === 1 ? "clip" : "clips"}`);
	};

	return (
		<PanelView title="Adjustments" contentClassName="space-y-3 pb-4">
			<div className="rounded-xl border bg-muted/25 p-3 text-xs leading-relaxed text-muted-foreground">
				Apply a starting look, then fine-tune brightness, contrast and saturation in the selected clip&apos;s properties.
			</div>
			<div className="grid grid-cols-2 gap-2">
				{LOOKS.map((look) => (
					<button key={look.name} type="button" onClick={() => apply(look.values)} className="group overflow-hidden rounded-xl border bg-card text-left transition hover:-translate-y-0.5 hover:border-sky-400/40 active:translate-y-0">
						<span className={`block h-16 bg-gradient-to-br ${look.className} opacity-80 transition group-hover:opacity-100`} />
						<span className="block p-2.5"><span className="block text-xs font-semibold">{look.name}</span><span className="text-muted-foreground block text-[10px]">{look.detail}</span></span>
					</button>
				))}
			</div>
			<Button variant="outline" size="sm" className="w-full" disabled={selected.length === 0} onClick={() => apply({ brightness: 100, contrast: 100, saturation: 100 })}>Reset selected clips</Button>
		</PanelView>
	);
}
