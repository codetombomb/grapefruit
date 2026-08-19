import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { JSDOM } from "jsdom";

import { detectPage } from "../src/content/page-detector.js";

const createPage = (html, url = "https://www.yesprep.org/") => {
  const dom = new JSDOM(html, { url });

  return {
    document: dom.window.document,
    location: dom.window.location,
  };
};

const emptyPage = ({ documentTitle = "", url = "" } = {}) => ({
  isFinalsite: false,
  pageId: null,
  pageName: null,
  documentTitle,
  url,
  canonicalUrl: null,
  buildVersion: null,
  mode: null,
  locationId: null,
  themeId: null,
  createdAt: null,
  publishedAt: null,
});

describe("detectPage", () => {
  test("extracts normalized information from a Finalsite page", () => {
    const { document, location } = createPage(`
      <html>
        <head>
          <title>Home - YES Prep Public Schools</title>
          <link rel="canonical" href="https://www.yesprep.org/">
          <meta name="page-created" content="2025-02-14T19:18:27Z">
          <meta name="page-published" content="2026-07-06T21:09:20Z">
        </head>
        <body
          data-pageid="5628"
          data-buildver="7.2.1"
          class="fsLiveMode fsLocation56 fsHasTheme102 fsHasOneColumnLayout"
        >
          <h1 class="fsPageTitle"> Home </h1>
        </body>
      </html>
    `);

    const actual = detectPage(document, location);
    const expected = {
      isFinalsite: true,
      pageId: "5628",
      pageName: "Home",
      documentTitle: "Home - YES Prep Public Schools",
      url: "https://www.yesprep.org/",
      canonicalUrl: "https://www.yesprep.org/",
      buildVersion: "7.2.1",
      mode: "live",
      locationId: "56",
      themeId: "102",
      createdAt: "2025-02-14T19:18:27Z",
      publishedAt: "2026-07-06T21:09:20Z",
    };

    assert.deepStrictEqual(
      actual,
      expected,
      "Expected Finalsite markup to produce normalized page information",
    );
  });

  test("extracts stable metadata from an older Composer page", () => {
    const { document, location } = createPage(
      `
        <html>
          <head>
            <title>Instructions - Grenada School District</title>
            <link rel="canonical" href="https://www.grenadak12.com/instructions">
            <meta name="page-created" content="2022-05-09T18:14:42Z">
            <meta name="page-published" content="2022-05-09T18:37:43Z">
          </head>
          <body
            data-pageid="433"
            data-buildver="5.8.0"
            data-sitetemplate="newclientcustom"
            class="fsLiveMode fsHasTwoColumnWideLeftLayout fsSection433 fsLocation1 fsHasTheme2"
          >
            <h1 class="fsPageTitle">Instructions</h1>
            <div class="fsPageLayout fsLayout fsTwoColumnWideLeftLayout"></div>
          </body>
        </html>
      `,
      "https://www.grenadak12.com/instructions",
    );

    assert.deepStrictEqual(
      detectPage(document, location),
      {
        isFinalsite: true,
        pageId: "433",
        pageName: "Instructions",
        documentTitle: "Instructions - Grenada School District",
        url: "https://www.grenadak12.com/instructions",
        canonicalUrl: "https://www.grenadak12.com/instructions",
        buildVersion: "5.8.0",
        mode: "live",
        locationId: "1",
        themeId: "2",
        createdAt: "2022-05-09T18:14:42Z",
        publishedAt: "2022-05-09T18:37:43Z",
      },
      "Expected stable page metadata to work across Composer versions and layouts",
    );
  });

  test("returns a consistent empty shape for a non-Finalsite page", () => {
    const { document, location } = createPage(
      `
        <html>
          <head><title>Example website</title></head>
          <body><main>Not a Finalsite page</main></body>
        </html>
      `,
      "https://example.com/about",
    );

    assert.deepStrictEqual(
      detectPage(document, location),
      emptyPage({
        documentTitle: "Example website",
        url: "https://example.com/about",
      }),
      "Expected non-Finalsite pages to return the complete empty page shape",
    );
  });

  test("uses null for optional Finalsite metadata that is absent", () => {
    const { document, location } = createPage(`
      <html>
        <head><title>Minimal Finalsite page</title></head>
        <body data-pageid="99"></body>
      </html>
    `);

    assert.deepStrictEqual(
      detectPage(document, location),
      {
        ...emptyPage({
          documentTitle: "Minimal Finalsite page",
          url: "https://www.yesprep.org/",
        }),
        isFinalsite: true,
        pageId: "99",
      },
      "Expected missing optional metadata to be represented by null",
    );
  });

  test("does not throw when the document has no body", () => {
    const documentWithoutBody = {
      title: "Document still loading",
      body: null,
      querySelector: () => null,
    };
    const location = { href: "https://www.yesprep.org/loading" };

    assert.deepStrictEqual(
      detectPage(documentWithoutBody, location),
      emptyPage({
        documentTitle: "Document still loading",
        url: "https://www.yesprep.org/loading",
      }),
      "Expected a missing body to be handled as a non-Finalsite page",
    );
  });

  test("does not confuse similarly named classes with Finalsite metadata", () => {
    const { document, location } = createPage(`
      <html>
        <head><title>Class matching</title></head>
        <body
          data-pageid="42"
          class="fsLocationMenu fsHasThemeSwitcher fsHasOneColumnLayoutPreview"
        ></body>
      </html>
    `);

    assert.deepStrictEqual(
      detectPage(document, location),
      {
        ...emptyPage({
          documentTitle: "Class matching",
          url: "https://www.yesprep.org/",
        }),
        isFinalsite: true,
        pageId: "42",
      },
      "Expected class parsing to require the complete Finalsite class pattern",
    );
  });
});
