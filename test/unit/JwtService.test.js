import { expect } from "chai";
import sinon from "sinon";
import jwt from "jsonwebtoken";
import authmodel from "../../src/middleware/JwtService.js";


describe('JwtService', ()=> {
    it("create valid jwt", () => {
    const token = authmodel.createAccessJWToken(1, "user");

    expect(token).to.be.a("string");

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    expect(decoded.sub).to.equal(1);
    expect(decoded.role).to.equal("user");
  });

    it('create refreshtoken', ()=>{
        const token = authmodel.createRefreshToken(1, "user", "device");
        expect(token).to.be.a("String");
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        expect(decoded.sub).to.equal(1)
        expect(decoded.role).to.equal("user")
    })
})