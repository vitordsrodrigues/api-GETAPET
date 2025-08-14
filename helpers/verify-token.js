const jwt = require('jsonwebtoken')
const getToken = require('../helpers/get-token')
const { get } = require('mongoose')

const checkToken = (req,res, next)=>{

    if (!req.headers.authorization){
        return res.status(401).json({message:'acesso negado'})
    }
    const token = getToken(req)

    if (!token){
        return res.status(401).json({message:'acesso negado'})
    }

    try {
        const verified = jwt.verify(token, 'nossosecret')
        req.user = verified
        next()
    } catch (err) {
        return res.status(400).json({message:'Token invalido'})
    }
}

module.exports = checkToken