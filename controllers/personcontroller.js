const pool = require('../config/db.js'); // Adjust the path accordingly

// Get all persons
exports.getAllPersons = (req, res) => {
    pool.query('SELECT * FROM Person', (error, results, fields) => {
      if (error) {
        console.error('Error fetching persons:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        console.log('Query Result:', results); // Add this line for debugging
        res.json(results);
      }
    });
  };
  
  // Get person by ID
  exports.getPersonById = (req, res) => {
    const partyId = req.params.partyId;
    pool.query('SELECT * FROM Person WHERE PARTY_ID = ?', [partyId], (error, results, fields) => {
      if (error) {
        console.error('Error fetching person:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        if (results.length > 0) {
          res.json(results[0]);
        } else {
          res.status(404).json({ error: 'Person not found' });
        }
      }
    });
  };
  
  // Create a new person
exports.createPerson = (req, res) => {
      
    const personData = req.body;
    pool.query(
        'INSERT INTO Party (PARTY_ID, PARTY_TYPE_ENUM_ID) VALUES (?, ?) ON DUPLICATE KEY UPDATE PARTY_TYPE_ENUM_ID = PARTY_TYPE_ENUM_ID',
        [personData.PARTY_ID, 'ptyPerson'],
        (partyError, partyResults, partyFields) => {
          if (partyError) {
            console.error('Error creating party:', partyError);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            // Insert into Person table
            pool.query('INSERT INTO Person SET ?', personData, (personError, personResults, personFields) => {
              if (personError) {
                if (personError.code === 'ER_DUP_ENTRY') {
                  // Duplicate entry error handling
                  console.error('Error creating person:', personError);
                  res.status(400).json({ error: 'Duplicate entry for PARTY_ID' });
                } else {
                  // Other errors
                  console.error('Error creating person:', personError);
                  res.status(500).json({ error: 'Internal Server Error' });
                }
              } else {
                res.status(201).json({ insertId: personResults.insertId });
              }
            });
          }
        }
      );
  };
  
  // Update a person by ID
  exports.updatePersonById = (req, res) => {
    const partyId = req.params.partyId;
    const updatedData = req.body;
  
    // Update Party table if PARTY_ID is updated
    if (updatedData.PARTY_ID && updatedData.PARTY_ID !== partyId) {
      pool.query(
        'INSERT INTO Party (PARTY_ID, PARTY_TYPE_ENUM_ID) VALUES (?, ?) ON DUPLICATE KEY UPDATE PARTY_TYPE_ENUM_ID = PARTY_TYPE_ENUM_ID',
        [updatedData.PARTY_ID, 'ptyPerson'],
        (partyError, partyResults, partyFields) => {
          if (partyError) {
            console.error('Error updating party:', partyError);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            // Proceed to update Person table
            updatePerson();
          }
        }
      );
    } else {
      // No change in PARTY_ID, directly update Person table
      updatePerson();
    }
  
    // Function to update Person table
    function updatePerson() {
      pool.query('UPDATE Person SET ? WHERE PARTY_ID = ?', [updatedData, partyId], (error, results, fields) => {
        if (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            // Duplicate entry error handling
            console.error('Error updating person:', error);
            res.status(400).json({ error: 'Duplicate entry for PARTY_ID' });
          } else {
            // Other errors
            console.error('Error updating person:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        } else {
          if (results.affectedRows > 0) {
            res.json({ success: true });
          } else {
            res.status(404).json({ error: 'Person not found' });
          }
        }
      });
    }
  };
  
  // Delete a person by ID
  exports.deletePersonById = (req, res) => {
    const partyId = req.params.partyId;
  
    // Delete from Person table
    pool.query('DELETE FROM Person WHERE PARTY_ID = ?', [partyId], (error, results, fields) => {
      if (error) {
        console.error('Error deleting person:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        if (results.affectedRows > 0) {
          // Delete from Party table if record was deleted from Person table
          pool.query('DELETE FROM Party WHERE PARTY_ID = ?', [partyId], (partyError, partyResults, partyFields) => {
            if (partyError) {
              console.error('Error deleting party:', partyError);
              res.status(500).json({ error: 'Internal Server Error' });
            } else {
              res.json({ success: true });
            }
          });
        } else {
          res.status(404).json({ error: 'Person not found' });
        }
      }
    });
  };