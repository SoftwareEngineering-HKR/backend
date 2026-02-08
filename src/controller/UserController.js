
class UserController{
//This clall has the controller that handles the HTTP request and response to user login

    async userAuth(req,res){
        
        try{
            const {name, password} = req.body
            result = await //Function call to authoris
            //probable the result will be true or false (Token?)
            if (!result){
                //If we do not distinguish between password or email fault.
                return res.status(401).json({message: "Wrong email or password"})
            } else{
            res.status(200).json(result)}
        } catch(e){
            return res.status(500).json({message: 'Server error'})
        }

    }
}