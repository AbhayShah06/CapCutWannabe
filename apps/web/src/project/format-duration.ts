const TICKS_PER_SECOND = 120_000;

export function formatProjectDuration(duration: number | undefined): string | null {
	if (duration === undefined) return null;

	const totalSeconds = Math.max(0, Math.floor(duration / TICKS_PER_SECOND));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const mmss = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

	return hours > 0 ? `${hours.toString().padStart(2, "0")}:${mmss}` : mmss;
}
