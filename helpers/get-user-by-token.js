const jwt = require('jsonwebtoken')

const User = require('../models/User')

const getUserBytoken = async(token) =>{

    if (!token){
        return res.status(401).json({message:'acesso negado'})
    }

    const decoded = jwt.verify(token, 'nossosecret')

    const userId = decoded.id

    const user = await User.findOne({_id: userId})

    return user
}

module.exports = getUserBytoken