import { expect } from "chai";
import sinon from "sinon";
import jwt from "jsonwebtoken";
import authmodel from "../../src/middleware/JwtService";


describe('JwtService', ()=> {
    it('create valid jwt', ()=>{
        const token = authmodel.createAccessJWToken(1, "user");
        expect(token).to.be.a("String");
        const decoded = jwt.verify(token)
        expect(decoded.id).to.equal(1)
        expect(decoded.sub).to.equal("user")
    })

    it('create refreshtoken', ()=>{
        const token = authmodel.createRefreshToken(1, "user", "device");
        expect(token).to.be.a("String");
        const decoded = jwt.verify(token)
        expect(decoded.id).to.equal(1)
        expect(decoded.sub).to.equal("user")
    })
})