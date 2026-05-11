import { expect } from "chai";
import sinon from "sinon";
import request from "supertest";
import { router } from "../../src/service/Routes.js"
import UserModel from "../../src/model/UserModel.js";
import RefreshModel from "../../src/model/RefreshModel.js";
import authmodel from "../../src/middleware/JwtService.js";
import { app } from "../../src/index.js";
import jwt from "jsonwebtoken";

describe('Routes', ()=>{

    afterEach(() => {
        sinon.restore();
        });

    it('succesfull login returns acesstoken', async ()=>{
        const user = {
            username: "fake",
            password: "fake"
        }
        sinon.stub(UserModel, "login").resolves(user);
        sinon.stub(authmodel, "createAccessJWToken").returns("fake-access-token");
        sinon.stub(authmodel, "createRefreshToken").returns("fake-refresh-token");
        sinon.stub(RefreshModel, "addToken").resolves(true);

         const res = await request(app)
         .post("/login")
         .send({
            username: "fake",
            password: "fake"
      });
       expect(res.status).to.equal(200);
       expect(res.body.accessToken).to.equal("fake-access-token");
    })

    it('not successful login returns message', async ()=>{
        const user = {
            username: "invalid",
            password: "invalid"
        }
        
        //sinon.stub(UserModel, "login").throws("error");
        sinon.stub(authmodel, "createAccessJWToken").returns("fake-access-token");
        sinon.stub(authmodel, "createRefreshToken").returns("fake-refresh-token");
        sinon.stub(RefreshModel, "addToken").resolves(true);

         const res = await request(app)
         .post("/login")
         .send({
            username: "fake",
            password: "fake"
      });
       expect(res.status).to.equal(406);
       expect(res.body.message).to.equal("Invalid credentials");
    })

    it('succesfull refresh of access token',async ()=>{
          const decoded = {
            sub: 1,
            role: "user",
            ip: "127.0.0.1"
        };

        sinon.stub(RefreshModel, "getToken").resolves({ token: "fake-refresh-token" });
        sinon.stub(RefreshModel, "revokeToken").resolves(true);
        sinon.stub(jwt, "verify").returns(decoded);

        sinon.stub(authmodel, "createAccessJWToken").returns("fake-access-token");
        sinon.stub(authmodel, "createRefreshToken").returns("new-fake-refresh-token");

        sinon.stub(RefreshModel, "addToken").resolves(true);

         const res = await request(app)
         .post("/refresh")
         .set("Cookie", ["jwt=fake-refresh-token"]);

       expect(res.status).to.equal(200);
    })

   it("successful logging out message", async () => {
        const revokeStub = sinon.stub(RefreshModel, "revokeToken").resolves(true);
        sinon.stub(jwt, "verify").returns(true);

        const res = await request(app)
            .post("/logout")
            .set("Authorization", "Bearer fake-access-token")
            .set("Cookie", ["jwt=fake-refresh-token"]);

        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal("Logged out successfully");
        expect(revokeStub.calledWith("fake-refresh-token")).to.equal(true);
    });


   it("successful signup returns access token", async () => {
        const user = {
            id: 1,
            username: "new",
            type: "user"
        }
        sinon.stub(UserModel, "addUser").resolves(user);
        sinon.stub(authmodel, "createAccessJWToken").returns("fake-access-token")
        sinon.stub(authmodel, "createRefreshToken").returns("fake-refresh-token");
        sinon.stub(RefreshModel, "addToken").resolves(true);
    

        const res = await request(app)
         .post("/signup")
         .send({
            username: "fake",
            password: "fakefakefake"})
        expect(res.status).to.equal(200);
        expect(res.body.accessToken).to.equal("fake-access-token");
    });
})