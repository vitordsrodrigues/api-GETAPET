const router = require('express').Router()

const PetControllers = require("../controllers/PetControllers")

const verifyToken = require('../helpers/verify-token')
const {imageUpload} = require("../helpers/image-upload")

router.post('/create',verifyToken,imageUpload.array('images'),PetControllers.create)

router.get("/",PetControllers.getAll)
router.get("/mypets",verifyToken,PetControllers.getAllUserPets)
router.get('/myadoptions', verifyToken, PetControllers.getAllUserAdoptions)
router.get('/:id',PetControllers.getPetById)
router.delete('/:id',verifyToken,PetControllers.removePetById)
router.patch('/:id',verifyToken,imageUpload.array('images'),PetControllers.updatePet)
router.patch('/schedule/:id',verifyToken,PetControllers.schedule)
router.patch('/conlude/:id',verifyToken,PetControllers.concludeAdoption)

module.exports = router