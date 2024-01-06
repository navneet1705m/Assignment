const pool = require('../config/db.js');
const { v4: uuidv4 } = require('uuid');

// Controller to add order items
exports.addOrderItems = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    const {
      orderId,
      orderPartSeqId, // Manually provide ORDER_PART_SEQ_ID
      partName,
      facilityId,
      shipmentMethodEnumId = 'ShMthGround',
      customerPartyId,
      item_details,
    } = req.body;

    // Validate required parameters
    if (!orderId || !orderPartSeqId || !partName || !facilityId || !customerPartyId || !item_details || item_details.length === 0) {
      throw { status: 400, message: 'Validation error - orderId, ORDER_PART_SEQ_ID, partName, facilityId, customerPartyId, and at least one item are required.' };
    }

    // Insert into Order_Part table
    await connection.query(
      'INSERT INTO Order_Part (ORDER_ID, ORDER_PART_SEQ_ID, PART_NAME, FACILITY_ID, SHIPMENT_METHOD_ENUM_ID, CUSTOMER_PARTY_ID) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, orderPartSeqId, partName, facilityId, shipmentMethodEnumId, customerPartyId]
    );

    // Insert into Order_Item table for each item in item_details
    const itemInsertPromises = item_details.map(async (item) => {
      const orderItemSeqId = uuidv4(); // Generate a unique identifier for ORDER_ITEM_SEQ_ID
      await connection.query(
        'INSERT INTO Order_Item (ORDER_ID, ORDER_PART_SEQ_ID, ORDER_ITEM_SEQ_ID, PRODUCT_ID, ITEM_DESCRIPTION, QUANTITY, UNIT_AMOUNT) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, orderPartSeqId, orderItemSeqId, item.productId, item.itemDescription, item.quantity, item.unitAmount]
      );
    });

    // Execute all item insert promises
    await Promise.all(itemInsertPromises);

    await connection.commit();
    connection.release();
    res.status(201).json({ orderId: orderId, orderPartSeqId, orderPartSeqId });
  } catch (error) {
    console.error('Error adding order items:', error);
    if (error.status) {
      res.status(error.status).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};