const fs = require('fs');
const crypto = require('crypto');
const pool = require('../config/db.js');

let secretKey;
let iv;

const keyFilePath = 'secretKey.json';

const loadKeyFromFile = () => {
  try {
    const data = fs.readFileSync(keyFilePath, 'utf-8');
    const { secretKey: loadedSecretKey, iv: loadedIV } = JSON.parse(data);
    secretKey = Buffer.from(loadedSecretKey, 'hex');
    iv = Buffer.from(loadedIV, 'hex');
    // console.log('Loaded key and IV from file.');
    //console.log(secretKey);
  } catch (error) {
    console.log('Error loading key and IV from file. Generating new ones.');
    generateKeyAndIV();
  }
};

const generateKeyAndIV = () => {
  secretKey = crypto.randomBytes(32);
  iv = crypto.randomBytes(16);

  const keyData = {
    secretKey: secretKey.toString('hex'),
    iv: iv.toString('hex'),
  };

  fs.writeFileSync(keyFilePath, JSON.stringify(keyData), 'utf-8');
  console.log('Generated new key and IV, and saved to file.');
};

// Load the key and IV on startup
loadKeyFromFile();

const encrypt = (text) => {
  console.log('Encrypting:', text);
  const cipher = crypto.createCipheriv('aes-256-ctr', secretKey, iv);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (text) => {
  console.log('Decrypting:', text);
  if (!text) {
    console.error('Invalid input for decryption');
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv('aes-256-ctr', secretKey, iv);
    let decrypted = decipher.update(text, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error during decryption:', error.message);
    return null;
  }
};




exports.createOrder = (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    connection.beginTransaction((beginErr) => {
      if (beginErr) {
        console.error('Error starting transaction:', beginErr);
        connection.release();
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      const {
        ORDER_ID,
        ORDERNAME,
        CURRENCY_UOM_ID = 'USD',
        SALES_CHANNEL_ENUM_ID = 'ScWeb',
        STATUS_ID = 'OrderPlaced',
        PRODUCT_STORE_ID = 'OMS_DEFAULT_STORE',
        PLACED_DATE,
        APPROVED_DATE,
        GRAND_TOTAL = null,
        COMPLETED_DATE = null,
        CREDIT_CARD = null,
      } = req.body;

      // Validate required parameters
      if (!ORDER_ID || !ORDERNAME || !PLACED_DATE) {
        connection.rollback(() => {
          console.error('Validation error - ORDER_ID, Order name, and placed date are required parameters.');
          connection.release();
          res.status(400).json({ error: 'ORDER_ID, Order name, and placed date are required parameters.' });
        });
        return;
      }

      // Encrypt credit card before storing it
      const encryptedCreditCard = Buffer.from(encrypt(JSON.stringify(CREDIT_CARD)), 'hex');


      // Insert into Order_Header table
      connection.query(
        'INSERT INTO Order_Header (ORDER_ID, ORDER_NAME, PLACED_DATE, APPROVED_DATE, STATUS_ID, CURRENCY_UOM_ID, PRODUCT_STORE_ID, SALES_CHANNEL_ENUM_ID, GRAND_TOTAL, COMPLETED_DATE, CREDIT_CARD) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [ORDER_ID, ORDERNAME, PLACED_DATE, APPROVED_DATE, STATUS_ID, CURRENCY_UOM_ID, PRODUCT_STORE_ID, SALES_CHANNEL_ENUM_ID, GRAND_TOTAL, COMPLETED_DATE, encryptedCreditCard],
        (insertErr, result) => {
          if (insertErr) {
            connection.rollback(() => {
              console.error('Error inserting into Order_Header table:', insertErr);
              connection.release();
              res.status(500).json({ error: 'Internal Server Error' });
            });
            return;
          }

          connection.commit((commitErr) => {
            if (commitErr) {
              connection.rollback(() => {
                console.error('Error committing transaction:', commitErr);
                connection.release();
                res.status(500).json({ error: 'Internal Server Error' });
              });
              return;
            }

            connection.release();
            res.status(201).json({ orderId: ORDER_ID });
          });
        }
      );
    });
  });
};

// Get all the orders with decrypted credit card
exports.getAllOrders = (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    connection.query('SELECT * FROM Order_Header', (selectErr, results) => {
      connection.release();

      if (selectErr) {
        console.error('Error fetching orders:', selectErr);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      // Decrypt credit card information for each result
      const decryptedOrders = results.map((order) => {
        if (order.CREDIT_CARD) {
          const decryptedCreditCard = decrypt(order.CREDIT_CARD);
          return { ...order, CREDIT_CARD: decryptedCreditCard };
        } else {
          return order;
        }
      });

      res.status(200).json({ orders: decryptedOrders });
    });
  });
};
