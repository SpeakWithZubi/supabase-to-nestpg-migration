/**
 * Extracts transcript text from a bundleJson object.
 */
export function extractTranscriptFromBundle(bundleJson: any): string {
  if (!bundleJson || typeof bundleJson !== 'object') return '';

  if (typeof bundleJson.transcript === 'string' && bundleJson.transcript.trim()) {
    return bundleJson.transcript;
  }

  const turns = bundleJson.turns;
  if (!Array.isArray(turns) || turns.length === 0) return '';

  const childTurns = turns
    .filter((turn: any) => 
      turn && 
      typeof turn === 'object' && 
      turn.speaker === 'child' && 
      typeof turn.text === 'string' && 
      turn.text.trim().length > 0
    )
    .map((turn: any) => turn.text.trim())
    .filter((text: string) => text.length > 0);

  return childTurns.join(' ');
}

/**
 * Extracts transcripts from multiple bundle JSON objects and combines them.
 */
export function extractTranscriptsFromBundles(bundles: any[], separator: string = '\n\n'): string {
  if (!Array.isArray(bundles) || bundles.length === 0) return '';

  const transcripts = bundles
    .map((bundle: any) => extractTranscriptFromBundle(bundle?.bundleJson || bundle?.bundle_json))
    .filter((transcript: string) => transcript.length > 0);

  return transcripts.join(separator);
}