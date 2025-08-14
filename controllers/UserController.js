const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const createUserToken = require('../helpers/create-user-token')
const getToken = require('../helpers/get-token')
const getUserBytoken = require('../helpers/get-user-by-token')

module.exports = class UserController{
    static async register(req,res){
        const name = req.body.name
        const email = req.body.email
        const phone = req.body.phone
        const password = req.body.password
        const confirmpassword = req.body.confirmpassword

        if(!name){
            res.status(422).json({message:'o nome e obrigatorio'})
            return
        }
        if(!email){
            res.status(422).json({message:'o email e obrigatorio'})
            return
        }
        if(!phone){
            res.status(422).json({message:'o telefone e obrigatorio'})
            return
        }
        if(!password){
            res.status(422).json({message:' a senha e obrigatorio'})
            return
        }
        if(!confirmpassword){
            res.status(422).json({message:'o confirmar e obrigatorio'})
            return
        }

        if(password !== confirmpassword){
        res.status(422).json({message:' obrigatorio as senhas serem iguais'})
        return
        }
        const userExists = await User.findOne({email:email})

        if(userExists){
        res.status(422).json({message:'por favor use outro email'})
        return
        }

        const salt = await bcrypt.genSalt(12)
        const passwordHash = await bcrypt.hash(password,salt)

        const user = new User({
            name: name,
            email:email,
            phone:phone,
            password:passwordHash,
        })

        try{
            const newUser = await user.save()
            await createUserToken(newUser,req,res)
        }catch(err){
            res.status(500).json({message:error})
        }
        
    }

    static async login(req,res){
        const {email,password} = req.body

        if(!email){
            res.status(422).json({message:'o email e obrigatorio'})
            return
        }
        if(!password){
            res.status(422).json({message:' a senha e obrigatorio'})
            return
        }
        const user = await User.findOne({email:email})

        if(!user){
        res.status(422).json({message:'não esta cadastrado'})
        return
        }

        const checkPassword = await bcrypt.compare(password,user.password)

        if(!checkPassword){
            res.status(422).json({
                message:"senha invalida"
            })
            return
        }

        await createUserToken(user,req,res)
    }

    static async checkUser(req,res){

        let currentUser

        console.log(req.headers.authorization)

        if(req.headers.authorization){

            const token = getToken(req)
            const decoded = jwt.verify(token,'nossosecret')
            
            currentUser = await User.findById(decoded.id)
            currentUser.password = undefined

        }else{
            currentUser = null
        }

        res.status(200).send(currentUser)
    }

    static async getUserById(req,res){

        const id = req.params.id
        const user = await User.findById(id).select('-password')

        if(!user){
            res.status(422).json({message:'usuario não encontrado'})
            return
        }

        res.status(200).json({user})
    }

    static async editUser(req,res){

        const id = req.params.id

        const token = getToken(req)
        const user =  await getUserBytoken(token)
       

        const {name,email,phone,password,confirmpassword} = req.body

        

        if(req.file){
            user.image = req.file.filename
        }

        if(!name){
            res.status(422).json({message:'o nome e obrigatorio'})
            return
        }
       
        user.name = name
        if(!email){
            res.status(422).json({message:'o email e obrigatorio'})
            return
        }

        const userExists = await User.findOne({email:email})

        if(user.email !== email && userExists){
            res.status(422).json({message:'utilize outro email'})
            return
        }

       user.email = email
        if(!phone){
            res.status(422).json({message:'o telefone e obrigatorio'})
            return
        }

        user.phone = phone
        
        if(password !=confirmpassword){
            res.status(422).json({message:'senha invalida'})
            return
        }else if(password === confirmpassword && password != null){
            const salt = await bcrypt.genSalt(12)
            const passwordHash = await bcrypt.hash(password,salt)

            user.password = passwordHash
        }

        try{

            await User.findOneAndUpdate(
                {_id:user._id},
                {$set:user},
                {new:true},
            )
            res.status(200).json({message:"usuario atualizado com sucesso"})

        } catch(err){
            res.status(500).json({message:err})
            return
        }
      
    }


}
