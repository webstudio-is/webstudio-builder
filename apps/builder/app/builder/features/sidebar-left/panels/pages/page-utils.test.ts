import { expect, test } from "@jest/globals";
import { toTreeData } from "./page-utils";
import { createDefaultPages } from "@webstudio-is/project-build";

test("initial pages always has home pages and a root folder", () => {
  const pages = createDefaultPages({
    rootInstanceId: "id",
    homePageId: "homePageId",
  });
  const tree = toTreeData(pages);
  expect(tree.root).toEqual({
    id: "root",
    name: "Root",
    slug: "",
    type: "folder",
    children: [
      {
        data: {
          id: "homePageId",
          meta: {},
          name: "Home",
          path: "",
          rootInstanceId: "id",
          title: "Home",
        },
        id: "homePageId",
        type: "page",
      },
    ],
  });
});

test("add empty folder", () => {
  const pages = createDefaultPages({
    rootInstanceId: "id",
    homePageId: "homePageId",
  });
  pages.folders.push({
    id: "folderId",
    name: "Folder",
    slug: "folder",
    children: [],
  });
  pages.rootFolder.children.push("folderId");
  const tree = toTreeData(pages);
  expect(tree.root).toEqual({
    id: "root",
    name: "Root",
    slug: "",
    type: "folder",
    children: [
      {
        data: {
          id: "homePageId",
          meta: {},
          name: "Home",
          path: "",
          rootInstanceId: "id",
          title: "Home",
        },
        id: "homePageId",
        type: "page",
      },
      {
        type: "folder",
        id: "folderId",
        name: "Folder",
        slug: "folder",
        children: [],
      },
    ],
  });
});

test("add a page inside a folder", () => {
  const pages = createDefaultPages({
    rootInstanceId: "id",
    homePageId: "homePageId",
  });
  pages.pages.push({
    id: "pageId",
    meta: {},
    name: "Page",
    path: "/page",
    rootInstanceId: "id",
    title: "Page",
  });
  pages.folders.push({
    id: "folderId",
    name: "Folder",
    slug: "folder",
    children: ["pageId"],
  });
  pages.rootFolder.children.push("folderId");
  const tree = toTreeData(pages);

  expect(tree.root).toEqual({
    id: "root",
    name: "Root",
    slug: "",
    type: "folder",
    children: [
      {
        data: {
          id: "homePageId",
          meta: {},
          name: "Home",
          path: "",
          rootInstanceId: "id",
          title: "Home",
        },
        id: "homePageId",
        type: "page",
      },
      {
        type: "folder",
        id: "folderId",
        name: "Folder",
        slug: "folder",
        children: [
          {
            type: "page",
            id: "pageId",
            data: {
              id: "pageId",
              meta: {},
              name: "Page",
              path: "/page",
              rootInstanceId: "id",
              title: "Page",
            },
          },
        ],
      },
    ],
  });
});

test("nest a folder", () => {
  const pages = createDefaultPages({
    rootInstanceId: "id",
    homePageId: "homePageId",
  });
  pages.rootFolder.children.push("1");
  pages.folders.push({
    id: "1",
    name: "Folder 1",
    slug: "folder-1",
    children: ["1-1"],
  });
  pages.folders.push({
    id: "1-1",
    name: "Folder 1-1",
    slug: "folder-1-1",
    children: [],
  });
  const tree = toTreeData(pages);
  expect(tree.root).toEqual({
    type: "folder",
    id: "root",
    name: "Root",
    slug: "",
    children: [
      {
        type: "page",
        id: "homePageId",
        data: {
          id: "homePageId",
          name: "Home",
          path: "",
          title: "Home",
          meta: {},
          rootInstanceId: "id",
        },
      },
      {
        type: "folder",
        id: "1",
        name: "Folder 1",
        slug: "folder-1",
        children: [
          {
            type: "folder",
            id: "1-1",
            name: "Folder 1-1",
            slug: "folder-1-1",
            children: [],
          },
        ],
      },
    ],
  });
});
