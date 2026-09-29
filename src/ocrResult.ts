export type OcrSummary =
  | { status: 'success'; text: string; partialFailure: boolean }
  | { status: 'empty' }
  | { status: 'error' };

export function summarizeOcrResults(
  results: PromiseSettledResult<{ text: string }>[]
): OcrSummary {
  const lines = new Set<string>();
  let failed = false;

  for (const result of results) {
    if (result.status === 'rejected') {
      failed = true;
      continue;
    }

    for (const line of result.value.text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed) lines.add(trimmed);
    }
  }

  if (lines.size > 0) {
    return { status: 'success', text: [...lines].join('\n'), partialFailure: failed };
  }
  return failed ? { status: 'error' } : { status: 'empty' };
}
