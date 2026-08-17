import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapStyleUrl,
  nextOverrideTheme,
  parseMapThemePreference,
  resolveMapTheme,
} from "./mapTheme.ts";

describe("parseMapThemePreference", () => {
  it("accepts known values and defaults to system", () => {
    assert.equal(parseMapThemePreference("light"), "light");
    assert.equal(parseMapThemePreference("dark"), "dark");
    assert.equal(parseMapThemePreference("system"), "system");
    assert.equal(parseMapThemePreference(null), "system");
    assert.equal(parseMapThemePreference("nope"), "system");
  });
});

describe("resolveMapTheme", () => {
  it("follows system when preference is system", () => {
    assert.equal(resolveMapTheme("system", true), "dark");
    assert.equal(resolveMapTheme("system", false), "light");
  });

  it("honors explicit overrides", () => {
    assert.equal(resolveMapTheme("light", true), "light");
    assert.equal(resolveMapTheme("dark", false), "dark");
  });
});

describe("mapStyleUrl / nextOverrideTheme", () => {
  it("maps themes to Mapbox style URLs", () => {
    assert.match(mapStyleUrl("light"), /streets-v12/);
    assert.match(mapStyleUrl("dark"), /dark-v11/);
  });

  it("toggles light ↔ dark overrides", () => {
    assert.equal(nextOverrideTheme("light"), "dark");
    assert.equal(nextOverrideTheme("dark"), "light");
  });
});
