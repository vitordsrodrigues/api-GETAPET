const { trusted } = require("mongoose")
const Pet = require("../models/Pet")
const getToken = require("../helpers/get-token")
const getUserBytoken = require("../helpers/get-user-by-token")
const { json } = require("express")
const ObjectId = require('mongoose').Types.ObjectId

module.exports = class PetControllers{
    static async create(req,res){
        const {name, age,weight, color} = req.body

        const images = req.files
        const available = true

        if(!name){
            res.status(422).json({message:"o nome é obrigatorio"})
            return
        }
        if(!age){
            res.status(422).json({message:"a idade é obrigatorio"})
            return
        }
        if(!weight){
            res.status(422).json({message:"o peso é obrigatorio"})
            return
        }
        if(!color){
            res.status(422).json({message:"a cor é obrigatorio"})
            return
        }
        if(images.length ===0){
            res.status(422).json({message:"a imagem é obrigatorio"})
            return
        }
        //dono do pet
        const token = getToken(req)
        const user = await getUserBytoken(token)
        const pet = new Pet({
            name,
            age,
            weight,
            color,
            available,
            images:[],
            user:{
                _id:user._id,
                name:user.name,
                image:user.image,
                phone:user.phone,
            }
        })

        images.map((image)=>{
            pet.images.push(image.filename)
        })
        try{
            const newPet = await pet.save()
            res.status(201).json({
                message:'Pet cadastrado com sucesso!',
                newPet,
            })

        } catch( error){
            res.status(500).json({message:error})
        }
    }

    static async getAll(req,res){

        const pets = await Pet.find().sort('-createat')

        res.status(200).json({
            pets:pets,
        })
    }

    static async getAllUserPets(req,res){
        const token = getToken(req)
        const user = await getUserBytoken(token)

        const pets =  await Pet.find({'user._id':user._id}).sort('-createdAt')

        res.status(200).json({
            pets,
        })
    }
    static async getAllUserAdoptions(req,res){
        const token = getToken(req)
        const user = await getUserBytoken(token)

        const pets =  await Pet.find({'adopter._id':user._id}).sort('-createdAt')

        res.status(200).json({
            pets,
        })
    }

    static async getPetById(req,res){
        
        const id = req.params.id
        if(!ObjectId.isValid(id)){
            res.status(422).json({message:"ID invalido"})
            return
        }

        const pet = await Pet.findOne({_id: id})
        if(!pet){
            res.status(404).json({message:'pet não encontrado'})
            return
        }
        res.status(200).json({
            pet: pet,
          })
    }

    static async removePetById(req,res){

        const id = req.params.id

        //checa se o id é valido
        if(!ObjectId.isValid(id)){
            res.status(422).json({message:"ID invalido"})
            return
        }


        const pet = await Pet.findOne({_id:id})
        if(!pet){
            res.status(404).json({message:'pet não encontrado'})
            return
        }

        //checa se o usuario logado pode deletar o pet

        const token = getToken(req)
        const user = await getUserBytoken(token)



        if(pet.user._id.toString() !== user._id.toString()){
            res.status(422).json({message:'houve um problema em processar a sua solicitação, tente novamente mais tarde'
            })
            return
        }

        await Pet.findByIdAndDelete(id)
        res.status(200).json({message:'pet removido'})
    }
    static async updatePet(req,res){

        const id = req.params.id
        const {name, age,weight, color,available} = req.body

        const images = req.files

        const updatedData = {}

        const pet = await Pet.findOne({_id: id})
        if(!pet){
            res.status(404).json({message:'pet não encontrado'})
            return
        }

        const token = getToken(req)
        const user = await getUserBytoken(token)



        if(pet.user._id.toString() !== user._id.toString()){
            res.status(422).json({message:'houve um problema em processar a sua solicitação, tente novamente mais tarde'
            })
            return
        }

        if(!name){
            res.status(422).json({message:"o nome é obrigatorio"})
            return
        }else{
            updatedData.name = name
        }
        if(!age){
            res.status(422).json({message:"a idade é obrigatorio"})
            return
        }else{
            updatedData.age = age
        }
        if(!weight){
            res.status(422).json({message:"o peso é obrigatorio"})
            return
        }else{
            updatedData.weight = weight
        }
        if(!color){
            res.status(422).json({message:"a cor é obrigatorio"})
            return
        }else{
            updatedData.color = color
        }
        if(images.length ===0){
            res.status(422).json({message:"a imagem é obrigatorio"})
            return
        }else{
            updatedData.images = []
            images.map((image)=>{
                updatedData.images.push(image.filename)
            })
        }

        await Pet.findByIdAndUpdate(id,updatedData)

        res.status(200).json({message:'Pet atualizado com sucesso'})
    }
    static async schedule(req,res){
        
        const id = req.params.id

        //check
        const pet = await Pet.findOne({_id: id})
        if(!pet){
            res.status(404).json({message:'pet não encontrado'})
            return
        }

        //de quem é o pet

        const token = getToken(req)
        const user = await getUserBytoken(token)

        if(pet.user._id.equals(user._id)){
            res.status(422).json({message:'vc não pode agendar uma visita com seu pet'
            })
            return
        }

        if(pet.adopter){
            if(pet.adopter._id.equals(user._id)){
                res.status(422).json({message:'vc ja agendou uma visita para esse pet tente outro'
                })
                return
            }
        }

        //add user to pet

        pet.adopter = {
            _id:user._id,
            name:user.name,
            image:user,image
        }

        await Pet.findByIdAndUpdate(id,pet)

        res.status(200).json({message:`a visita foi agendada entre em contato com ${pet.user.name} pelo telefone ${pet.user.phone}`})
    }

    static async concludeAdoption(req,res){

        const id = req.params.id

           //check
           const pet = await Pet.findOne({_id: id})
           if(!pet){
               res.status(404).json({message:'pet não encontrado'})
               return
           }

           const token = getToken(req)
           const user = await getUserBytoken(token)
   
   
   
           if(pet.user._id.toString() !== user._id.toString()){
               res.status(422).json({message:'houve um problema em processar a sua solicitação, tente novamente mais tarde'
               })
               return
           }
   
           pet.available = false

           await Pet.findByIdAndUpdate(id,pet)

           res.status(200).json({message:'parabens! pela sua adoção'})
           
    }
}