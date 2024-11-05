import { atom } from "nanostores";
import type { Page, Pages } from "@webstudio-is/sdk";

export const $pages = atom<undefined | Pages>(undefined);

export const $selectedPageHash = atom<string>("");

export const $editingPageId = atom<undefined | Page["id"]>();
