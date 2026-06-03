export function mkContentBlock() {
  return {
    id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: '',
    body: '',
  };
}

export function normalizeContentBlocksFromApi(pageContentBlocks, legacyInfo) {
  let raw = pageContentBlocks;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = [];
    }
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((b) => ({
      ...mkContentBlock(),
      title: typeof b?.title === 'string' ? b.title : '',
      body: typeof b?.body === 'string' ? b.body : '',
    }));
  }
  if (legacyInfo && String(legacyInfo).trim()) {
    return [{ ...mkContentBlock(), title: '', body: legacyInfo }];
  }
  return [mkContentBlock()];
}

export function serializeContentBlocks(blocks) {
  const out = blocks.map(({ title, body }) => ({
    title: (title || '').trim(),
    body: body || '',
  }));
  return out.filter((b) => {
    if (b.title) return true;
    const text = String(b.body || '').replace(/<[^>]*>/g, '').trim();
    return text.length > 0;
  });
}
