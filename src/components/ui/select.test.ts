import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FilterSelect } from "./select";

/**
 * Regression guard for the search/filter page crash.
 *
 * The discovery FilterSelect once rendered `SelectLabel` directly inside
 * `SelectContent` without a wrapping `SelectGroup`. That violates Radix's
 * Select contract and throws at render time with:
 *   `SelectLabel` must be used within `SelectGroup`
 * Because the filter panel sits on the search page render tree, the whole
 * page surfaced as "This page couldn't load" — breaking BOTH search input and
 * the filters (the data-layer searchBooks was already correct).
 *
 * Rendering the component is a true behavioral guard: if anyone reintroduces
 * an unwrapped SelectLabel, this render will throw and fail the test.
 */
describe("FilterSelect (Radix Select label grouping)", () => {
  const options = [
    { value: "en", label: "English" },
    { value: "as", label: "অসমীয়া" },
  ];

  it("renders a labelled select without throwing (label must live in SelectGroup)", () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterSelect, {
        value: "",
        onValueChange: () => {},
        label: "Language",
        placeholder: "Language",
        options,
      })
    );
    // A labelled select whose `SelectLabel` is NOT wrapped in `SelectGroup`
    // throws `SelectLabel must be used within SelectGroup` during this render,
    // so reaching the return value proves the fixed grouping is in place.
    expect(html).toContain("select-trigger");
    expect(html).toMatch(/combobox/);
  });

  it("renders an unlabelled select (no label -> no group required)", () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterSelect, {
        value: "",
        onValueChange: () => {},
        placeholder: "Pick…",
        options: [{ value: "a", label: "Alpha" }],
      })
    );
    expect(html).toContain("combobox");
  });

  it("renders with a preselected value without throwing", () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterSelect, {
        value: "en",
        onValueChange: () => {},
        label: "Lang",
        options,
      })
    );
    expect(html).toContain("combobox");
  });
});
