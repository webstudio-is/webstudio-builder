import { json, type LoaderFunctionArgs } from "@remix-run/server-runtime";
import type { Data } from "@webstudio-is/http-client";
import { db as projectDb } from "@webstudio-is/project/index.server";
import { loadProductionCanvasData } from "~/shared/db";
import { createContext } from "~/shared/context.server";
import { getUserById, type User } from "~/shared/db/user.server";
import { preventCrossOriginCookie } from "~/services/no-cross-origin-cookie";
import { allowedDestinations } from "~/services/destinations.server";
import { isDashboard } from "~/shared/router-utils";

export const loader = async ({
  params,
  request,
}: LoaderFunctionArgs): Promise<
  Data & { user: { email: User["email"] } | undefined } & {
    projectDomain: string;
    projectTitle: string;
  }
> => {
  preventCrossOriginCookie(request);
  allowedDestinations(request, ["document", "empty"]);
  // CSRF check is not required here as this is a public (CLI) endpoint.

  // Ensure the request is coming from the dashboard origin.
  if (false === isDashboard(request)) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  try {
    const buildId = params.buildId;

    if (buildId === undefined) {
      throw json("Required build id", { status: 400 });
    }

    const context = await createContext(request);

    const pagesCanvasData = await loadProductionCanvasData(buildId, context);

    const project = await projectDb.project.loadById(
      pagesCanvasData.build.projectId,
      context
    );

    const user =
      project === null || project.userId === null
        ? undefined
        : await getUserById(project.userId);

    return {
      ...pagesCanvasData,
      user: user ? { email: user.email } : undefined,
      projectDomain: project.domain,
      projectTitle: project.title,
    };
  } catch (error) {
    // If a Response is thrown, we're rethrowing it for Remix to handle.
    // https://remix.run/docs/en/v1/api/conventions#throwing-responses-in-loaders
    if (error instanceof Response) {
      throw error;
    }

    console.error({ error });

    // We have no idea what happened, so we'll return a 500 error.
    throw json(error instanceof Error ? error.message : String(error), {
      status: 500,
    });
  }
};
