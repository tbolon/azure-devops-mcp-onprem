import assert from "node:assert/strict";
import test from "node:test";
import { BuildQueryOrder, BuildStatus } from "azure-devops-node-api/interfaces/BuildInterfaces.js";
import { registerPipelineTools } from "../dist/tools/pipelines.js";

test("list_builds forwards query order and continuation token", async () => {
  const calls = [];
  const tools = new Map();
  const project = "ExampleProject";
  const definitionId = 12345;
  const builds = [];
  builds.continuationToken = "next-page";

  const server = {
    registerTool(name, config, handler) {
      tools.set(name, { config, handler });
    },
  };
  const provider = {
    async getBuildContext() {
      return {
        project,
        api: {
          async getBuilds(...args) {
            calls.push(args);
            return builds;
          },
        },
      };
    },
  };

  registerPipelineTools(server, provider);
  const result = await tools.get("list_builds").handler({
    definitionId,
    status: "inProgress",
    top: 10,
    continuationToken: "current-page",
    queryOrder: "queueTimeDescending",
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].slice(0, 2), [project, [definitionId]]);
  assert.equal(calls[0][8], BuildStatus.InProgress);
  assert.equal(calls[0][12], 10);
  assert.equal(calls[0][13], "current-page");
  assert.equal(calls[0][16], BuildQueryOrder.QueueTimeDescending);
  assert.equal(result.structuredContent.continuationToken, "next-page");
});
