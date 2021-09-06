import { expect } from "chai";
import request from "supertest";
import { BusinessApi } from "./BusinessApi";
import * as fs from "fs";

describe("BusinessApi", () => {
  describe("listen", () => {
    it("Serves blank page at root", async () => {
      return request(makeBusinessApi().listen())
        .get("/")
        .expect(200)
        .then((resp) => expect(resp.text).to.be.empty);
    });

    it("Responds with 404 on not found", async () => {
      return request(makeBusinessApi().listen())
        .get("/nonexistent")
        .expect(404);
    });

    it("Serves JSON schema at /schema", async () => {
      return request(makeBusinessApi().listen())
        .get("/schema")
        .expect(200)
        .then((resp) =>
          expect(resp.body.definitions).to.haveOwnProperty("AllEmployeesSpec")
        );
    });

    describe("Schema compatibility endpoint", () => {
      it("Responds with 400 on missing POST body", async () => {
        return request(makeBusinessApi().listen())
          .post(
            "/schema/is_definition_compatible?definition_name=AllEmployeesSpec"
          )
          .send()
          .expect(400)
          .then((resp) => expect(resp.body.error).to.be.string);
      });

      it("Responds with 400 on missing definition name", async () => {
        const schema = getSchema();
        return request(makeBusinessApi().listen())
          .post("/schema/is_definition_compatible")
          .send(schema)
          .expect(400)
          .then((resp) => expect(resp.body.error).to.be.string);
      });

      it("Responds with 400 on wrong definition", async () => {
        const schema = getSchema();
        return request(makeBusinessApi().listen())
          .post("/schema/is_definition_compatible?definition_name=NonExistent")
          .send(schema)
          .expect(400)
          .then((resp) => expect(resp.body.error).to.be.string);
      });

      it("Responds with 200 when definitions are compatible", async () => {
        const schema = getSchema();
        return request(makeBusinessApi().listen())
          .post(
            "/schema/is_definition_compatible?definition_name=AllEmployeesSpec"
          )
          .send(schema)
          .expect(200)
          .then((resp) => expect(resp.body.ok).to.be.true);
      });

      it("Responds with 409 when definitions are incompatible", async () => {
        const schema = getSchema();
        schema.definitions.AllEmployeesSpec.properties.SchemaVer["$id"] =
          "0.1.0";
        return request(makeBusinessApi().listen())
          .post(
            "/schema/is_definition_compatible?definition_name=AllEmployeesSpec"
          )
          .send(schema)
          .expect(409)
          .then((resp) => expect(resp.body.ok).to.be.true);
      });
    });
  });

  function commonCallTests() {
    it("Throws error when request definition is not found");
    it("Throws error when response definition is not found");
    it("Calls url specified by named env");
    it("Throws error when response body is invalid against schema");
  }

  describe("callPOST", () => {
    commonCallTests();
    it("Throws error when request data is invalid against schema");
  });

  describe("callGET", () => {
    commonCallTests();
  });

  function commonHandleTests() {
    it("Throws error when request definition is not found");
    it("Throws error when response definition is not found");
    it("Responds with 200 when handler is resolved");
    it("Responds with 404 on not found");
    it("Responds with 500 when handler response is invalid against schema");
    it("Responds with 500 when handler throws");
    it("Responds with 500 when handler is rejected");
  }

  describe("handlePOST", () => {
    commonHandleTests();
    it("Responds with 409 when request body is invalid against schema");
  });

  describe("handleGET", () => {
    commonHandleTests();
  });

  /* HELPERS */
  const schemaPath = `${__dirname}/../mock/demo.schema.json`;
  function getSchema() {
    return JSON.parse(fs.readFileSync(schemaPath).toString());
  }
  function makeBusinessApi() {
    return new BusinessApi({
      schemaPath,
    });
  }
});
