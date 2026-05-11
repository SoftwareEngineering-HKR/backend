import { expect } from "chai";
import sinon from "sinon";
import { messagehandler } from "../../src/handler/WSHandler.js";

describe('WSHandler', ()=>{

    it('should return error if not admin for get user', async ()=>{
        const result = await messagehandler('get users', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: { statusCode: 403, message: 'Permission denied!' }
                })
            })
    
    it('should return error if not admin create room', async ()=>{
        const result = await messagehandler('create room', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })
    
    it('should return error if not admin create device', async ()=>{
        const result = await messagehandler('create device', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })

    it('should return error if not admin update device', async ()=>{
        const result = await messagehandler('update device', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })

    it('should return error if not admin update room', async ()=>{
        const result = await messagehandler('update room', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })

    it('should return error if not admin delete room', async ()=>{
        const result = await messagehandler('delete room', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })
    
    it('should return error if not admin update device room', async ()=>{
        const result = await messagehandler('update device room', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })
    
    it('should return error if not admin delete device', async ()=>{
        const result = await messagehandler('delete device', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })

    it('should return error if not admin get all device info', async ()=>{
        const result = await messagehandler('get all device info', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })

    it('should return error if not admin get bluetooth devices', async ()=>{
        const result = await messagehandler('get bluetooth devices', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })
    
    it('should return error if not admin connect bluetooth device', async ()=>{
        const result = await messagehandler('connect bluetooth device', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })
    
    it('should return error if not admin update user role', async ()=>{
        const result = await messagehandler('update user role', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })

    it('should return error if not admin delete user', async ()=>{
        const result = await messagehandler('delete user', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })
    
    it('should return error if not admin add user to device', async ()=>{
        const result = await messagehandler('add user to device', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })

    it('should return error if not admin delete user from device', async ()=>{
        const result = await messagehandler('delete user from device', '','', 'user');
        expect(result).to.deep.equal({
            type: 'action response',
            payload: {
                statusCode: 403,
                message: "Permission denied!",
            }})
        })

})