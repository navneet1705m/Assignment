// routes/personRoutes.js
const express = require('express');
const router = express.Router();
const personController = require('../controllers/personcontroller');

// Define API routes

// Get all persons
router.get('/persons', personController.getAllPersons);

// Get person by ID 
router.get('/persons/:partyId',personController.getPersonById);

// Create a new person 
router.post('/persons',personController.createPerson);

// Update a person by ID 
router.put('/persons/:partyId', personController.updatePersonById);

// Delete a person by ID 
router.delete('/persons/:partyId', personController.deletePersonById);

module.exports = router;
