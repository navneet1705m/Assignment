// Import necessary modules and dependencies
const pool = require('../config/db.js');

// Function to fetch a single order by ID from the database
const fetchOrderById = async (orderId) => {
  return await pool.query(`
    SELECT
      OH.ORDER_ID AS orderId,
      OP.PART_NAME AS partName,
      OP.FACILITY_ID AS facilityId,
      OP.SHIPMENT_METHOD_ENUM_ID AS shipmentMethodEnumId,
      P.PARTY_ID AS customerPartyId,
      OI.PRODUCT_ID AS productId,
      OI.ITEM_DESCRIPTION AS itemDescription,
      OI.QUANTITY AS quantity,
      OI.UNIT_AMOUNT AS unitAmount
    FROM Order_Header OH
    JOIN Order_Part OP ON OH.ORDER_ID = OP.ORDER_ID
    JOIN Order_Item OI ON OP.ORDER_ID = OI.ORDER_ID 
    JOIN Person P ON OP.CUSTOMER_PARTY_ID = P.PARTY_ID
    WHERE OH.ORDER_ID = '${orderId}';
  `);
};

// Function to transform data to the specified format for a single order
const transformToSingleOrderJSON = (results) => {
    const rows = results[0];
  
    if (!rows.length) {
      return null; // Or handle the case where the order is not found
    }
  
    const orderDetails = {
      orderId: rows[0].orderId,
      partName: rows[0].partName,
      facilityId: rows[0].facilityId,
      shipmentMethodEnumId: rows[0].shipmentMethodEnumId,
      customerPartyId: rows[0].customerPartyId,
      item_details: rows.map((row) => ({
        productId: row.productId,
        itemDescription: row.itemDescription,
        quantity: row.quantity,
        unitAmount: row.unitAmount,
      })),
    };
  
    return orderDetails;
  };
  

// Define route handler to get a single order by ID
exports.getSingleOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const orderData = await fetchOrderById(orderId);

    if (orderData[0].length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const singleOrder = transformToSingleOrderJSON(orderData);

    res.json(singleOrder);
  } catch (error) {
    console.error('Error getting order by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
