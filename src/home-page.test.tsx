import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SourceSelectionProvider } from "./source-selection";
import { HomePage } from "./pages/HomePage";

function renderHome(route: string) {
  return renderToStaticMarkup(
    <SourceSelectionProvider>
      <MemoryRouter initialEntries={[route]}>
        <HomePage/>
      </MemoryRouter>
    </SourceSelectionProvider>
  );
}

describe("home page module navigation", () => {
  it("opens with two clear, stylish access choices", () => {
    const html = renderHome("/");
    expect(html).toContain("Enter the Shadows");
    expect(html).toContain("Matrix Search");
    expect(html).toContain('href="/charactercreation/priorities"');
    expect(html).toContain('href="/?view=matrix&amp;sector=corerules"');
    expect(html).not.toContain('class="module-grid"');
  });

  it("opens every Core Rules archive button through Matrix Search", () => {
    const html = renderHome("/?view=matrix&sector=corerules");
    expect(html).toContain("<h2 class=\"content-title\">Core Rules</h2>");
    expect(html).toMatch(/href="\/attributes"[^>]*>[\s\S]*?<span class="module-name">Attributes<\/span>/);
    expect(html).toMatch(/href="\/actions"[^>]*>[\s\S]*?<span class="module-name">Actions<\/span>/);
    expect(html).toMatch(/href="\/qualities"[^>]*>[\s\S]*?<span class="module-name">Qualities<\/span>/);
    expect(html).toMatch(/href="\/lifestyles"[^>]*>[\s\S]*?<span class="module-name">Lifestyles<\/span>/);
    expect(html).toMatch(/href="\/priorityarray"[^>]*>[\s\S]*?<span class="module-name">Priority Array<\/span>/);
    expect(html).toMatch(/href="\/charactercreation"[^>]*>[\s\S]*?<span class="module-name">Character Creation<\/span>/);
    expect(html.match(/class="module-button archive-module-button"/g)).toHaveLength(8);
    expect(html).toContain('aria-label="Return to Shadowrun front page"');
    expect(html).toContain('href="/charactercreation/review"');
    expect(html).not.toContain("Return to access gateway");
  });

  it("still honours an explicitly selected home sector", () => {
    const html = renderHome("/?sector=magic");
    expect(html).toContain("<h2 class=\"content-title\">Magic</h2>");
    expect(html).toContain("<span class=\"module-name\">Spells</span>");
    expect(html).not.toContain("href=\"/qualities\"");
  });
});
