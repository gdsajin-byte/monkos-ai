export async function getPublishedCountries(db) {
  const { results } = await db.prepare(`
    SELECT c.*, COUNT(d.id) as doc_count
    FROM countries c
    LEFT JOIN documents d ON d.country_id = c.id AND d.is_published = 1
    WHERE c.is_published = 1
    GROUP BY c.id
    ORDER BY c.continent, c.priority
  `).all();
  return results;
}

export async function getCountryWithDocuments(db, countrySlug) {
  const country = await db.prepare(
    'SELECT * FROM countries WHERE slug = ? AND is_published = 1'
  ).bind(countrySlug).first();
  if (!country) return null;

  const { results: documents } = await db.prepare(`
    SELECT d.*, s.seo_description_ko, s.seo_description_en, s.seo_description_ja
    FROM documents d
    LEFT JOIN seo_content s ON s.document_id = d.id
    WHERE d.country_id = ? AND d.is_published = 1
    ORDER BY d.priority
  `).bind(country.id).all();

  return { country, documents };
}

export async function getDocumentDetail(db, countrySlug, docSlug) {
  const doc = await db.prepare(`
    SELECT d.*,
      c.name_ko AS country_name_ko, c.name_en AS country_name_en,
      c.name_ja AS country_name_ja, c.slug AS country_slug, c.flag, c.continent,
      s.details_ko, s.details_en, s.details_ja,
      s.rejection_reasons_ko, s.rejection_reasons_en, s.rejection_reasons_ja,
      s.faqs_ko, s.faqs_en, s.faqs_ja,
      s.seo_title_ko, s.seo_title_en, s.seo_title_ja,
      s.seo_description_ko, s.seo_description_en, s.seo_description_ja,
      s.cta_service
    FROM documents d
    JOIN countries c ON c.id = d.country_id
    LEFT JOIN seo_content s ON s.document_id = d.id
    WHERE c.slug = ? AND d.slug = ? AND d.is_published = 1
  `).bind(countrySlug, docSlug).first();

  if (!doc) return null;

  const { results: requirements } = await db.prepare(
    'SELECT * FROM common_requirements WHERE document_id = ? OR document_id IS NULL ORDER BY sort_order'
  ).bind(doc.id).all();

  const { results: related } = await db.prepare(`
    SELECT d.slug, d.name_ko, d.name_en, d.name_ja, d.size_display, d.reliability_grade
    FROM documents d
    WHERE d.country_id = ? AND d.id != ? AND d.is_published = 1
    ORDER BY d.priority
  `).bind(doc.country_id, doc.id).all();

  return { doc, requirements, related };
}

export async function getAllPublishedDocuments(db) {
  const { results } = await db.prepare(`
    SELECT d.slug AS doc_slug, c.slug AS country_slug, d.updated_at
    FROM documents d
    JOIN countries c ON c.id = d.country_id
    WHERE d.is_published = 1
    ORDER BY c.priority, d.priority
  `).all();
  return results;
}

export async function getAllPublishedCountrySlugs(db) {
  const { results } = await db.prepare(`
    SELECT slug, updated_at FROM countries WHERE is_published = 1 ORDER BY priority
  `).all();
  return results;
}
