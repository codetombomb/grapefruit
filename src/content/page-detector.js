/**
 * Return the numeric value embedded in a matching Finalsite class name.
 *
 * @param {DOMTokenList | string[]} classList
 * @param {RegExp} pattern
 * @returns {string | null}
 */
const getClassId = (classList, pattern) => {
  for (const className of classList) {
    const match = className.match(pattern);

    if (match) {
      return match[1];
    }
  }

  return null;
};

/**
 * Convert the current document into normalized Finalsite page information.
 *
 * @param {Document} document
 * @param {Location | { href?: string }} location
 */
export const detectPage = (document, location) => {
  const page = {
    isFinalsite: false,
    pageId: null,
    pageName: null,
    documentTitle: document.title || "",
    url: location?.href || "",
    canonicalUrl: null,
    buildVersion: null,
    mode: null,
    locationId: null,
    themeId: null,
    createdAt: null,
    publishedAt: null,
  };

  const body = document.body;
  const pageId = body?.dataset.pageid || null;

  if (!pageId) {
    return page;
  }

  return {
    ...page,
    isFinalsite: true,
    pageId,
    pageName:
      document.querySelector(".fsPageTitle")?.textContent.trim() || null,
    canonicalUrl:
      document.querySelector('link[rel="canonical"]')?.href || null,
    buildVersion: body.dataset.buildver || null,
    mode: body.classList.contains("fsLiveMode") ? "live" : null,
    locationId: getClassId(body.classList, /^fsLocation(\d+)$/),
    themeId: getClassId(body.classList, /^fsHasTheme(\d+)$/),
    createdAt:
      document.querySelector('meta[name="page-created"]')?.content || null,
    publishedAt:
      document.querySelector('meta[name="page-published"]')?.content || null,
  };
};
