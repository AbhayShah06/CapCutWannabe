import type { MediaAsset } from "@/media/types";
import type { TProject } from "@/project/types";
import { storageService } from "@/services/storage/service";
import { generateUUID } from "@/utils/id";

const BUNDLE_FORMAT = "capcutwannabe-project";
const BUNDLE_VERSION = 1;

type BundledMedia = {
	metadata: Omit<MediaAsset, "file" | "url">;
	file: {
		name: string;
		type: string;
		lastModified: number;
		base64: string;
	};
};

type ProjectBundle = {
	format: typeof BUNDLE_FORMAT;
	version: typeof BUNDLE_VERSION;
	exportedAt: string;
	project: TProject;
	media: BundledMedia[];
};

function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	const chunkSize = 0x8000;
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
	}
	return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
}

function safeFileName(name: string): string {
	const cleaned = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim();
	return cleaned || "CapCutWannabe project";
}

function downloadBlob({ blob, filename }: { blob: Blob; filename: string }): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export async function exportPortableProject({ projectId }: { projectId: string }): Promise<void> {
	const loaded = await storageService.loadProject({ id: projectId });
	if (!loaded) throw new Error("Project not found");

	const mediaAssets = await storageService.loadAllMediaAssets({ projectId });
	const media: BundledMedia[] = [];

	for (const asset of mediaAssets) {
		const { file, url: _url, ...metadata } = asset;
		const bytes = new Uint8Array(await file.arrayBuffer());
		media.push({
			metadata,
			file: {
				name: file.name,
				type: file.type,
				lastModified: file.lastModified,
				base64: bytesToBase64(bytes),
			},
		});
	}

	const bundle: ProjectBundle = {
		format: BUNDLE_FORMAT,
		version: BUNDLE_VERSION,
		exportedAt: new Date().toISOString(),
		project: loaded.project,
		media,
	};

	downloadBlob({
		blob: new Blob([JSON.stringify(bundle)], { type: "application/json" }),
		filename: `${safeFileName(loaded.project.metadata.name)}.ccwproject`,
	});
}

function isProjectBundle(value: unknown): value is ProjectBundle {
	if (!value || typeof value !== "object") return false;
	const bundle = value as Partial<ProjectBundle>;
	return (
		bundle.format === BUNDLE_FORMAT &&
		bundle.version === BUNDLE_VERSION &&
		!!bundle.project &&
		Array.isArray(bundle.media)
	);
}

export async function importPortableProject({ file }: { file: File }): Promise<TProject> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(await file.text());
	} catch {
		throw new Error("This is not a valid CapCutWannabe project file");
	}

	if (!isProjectBundle(parsed)) {
		throw new Error("Unsupported or damaged project file");
	}

	const now = new Date();
	const newProjectId = generateUUID();
	const project: TProject = {
		...parsed.project,
		metadata: {
			...parsed.project.metadata,
			id: newProjectId,
			name: `${parsed.project.metadata.name} (imported)`,
			createdAt: now,
			updatedAt: now,
		},
		scenes: parsed.project.scenes.map((scene) => ({
			...scene,
			createdAt: new Date(scene.createdAt),
			updatedAt: new Date(scene.updatedAt),
		})),
	};

	await storageService.saveProject({ project });
	try {
		for (const item of parsed.media) {
			const bytes = base64ToBytes(item.file.base64);
			const fileBuffer = bytes.buffer.slice(
				bytes.byteOffset,
				bytes.byteOffset + bytes.byteLength,
			) as ArrayBuffer;
			const mediaFile = new File([fileBuffer], item.file.name, {
				type: item.file.type,
				lastModified: item.file.lastModified,
			});
			await storageService.saveMediaAsset({
				projectId: newProjectId,
				mediaAsset: { ...item.metadata, file: mediaFile },
			});
		}
	} catch (error) {
		await Promise.all([
			storageService.deleteProject({ id: newProjectId }),
			storageService.deleteProjectMedia({ projectId: newProjectId }),
		]);
		throw error;
	}

	return project;
}
