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
  it("opens Core Rules by default and renders every Core Rules archive button", () => {
    const html = renderHome("/");
    expect(html).toContain("<h2 class=\"content-title\">Core Rules</h2>");
    expect(html).toMatch(/href="\/attributes"[^>]*>[\s\S]*?<span class="module-name">Attributes<\/span>/);
    expect(html).toMatch(/href="\/actions"[^>]*>[\s\S]*?<span class="module-name">Actions<\/span>/);
    expect(html).toMatch(/href="\/qualities"[^>]*>[\s\S]*?<span class="module-name">Qualities<\/span>/);
    expect(html).toMatch(/href="\/lifestyles"[^>]*>[\s\S]*?<span class="module-name">Lifestyles<\/span>/);
    expect(html).toMatch(/href="\/priorityarray"[^>]*>[\s\S]*?<span class="module-name">Priority Array<\/span>/);
    expect(html.match(/class="module-button archive-module-button"/g)).toHaveLength(7);
  });

  it("still honours an explicitly selected home sector", () => {
    const html = renderHome("/?sector=magic");
    expect(html).toContain("<h2 class=\"content-title\">Magic</h2>");
    expect(html).toContain("<span class=\"module-name\">Spells</span>");
    expect(html).not.toContain("href=\"/qualities\"");
  });
});
