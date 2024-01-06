// Import your pool and any other required modules
const pool = require("../config/db.js");

// Function to fetch a single order by ID from the database
const fetchOrderById = async (orderId) => {
  try {
    return await pool.query(`
    SELECT
      OH.ORDER_ID AS orderId ,
      OH.ORDER_NAME AS orderName,
      OH.CURRENCY_UOM_ID AS currencyUomId,
      OH.SALES_CHANNEL_ENUM_ID AS salesChannelEnumId,
      OH.STATUS_ID AS statusId,
      OH.PRODUCT_STORE_ID AS productStoreId,
      OH.PLACED_DATE AS placedDate,
      OH.APPROVED_DATE AS approvedDate,
      OH.GRAND_TOTAL AS grandTotal
    FROM Order_Header OH
    WHERE OH.ORDER_ID = '${orderId}';
  `);
    return results[0];
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    throw error;
  }
};

// Function to transform data to the specified format for the response
const transformToResponseFormat = (results) => {
  const row = results[0][0];
  console.log("Row", row);
  return {
    orderId: row.orderId,
    orderName: row.orderName,
    currencyUomId: row.currencyUomId,
    salesChannelEnumId: row.salesChannelEnumId,
    statusId: row.statusId,
    productStoreId: row.productStoreId,
    placedDate: row.placedDate,
    approvedDate: row.approvedDate,
    grandTotal: row.grandTotal,
  };
};

// Controller function for updating the order name
exports.updateOrderName = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { orderName } = req.body;

    // Validate that orderName is provided
    if (!orderName) {
      return res
        .status(400)
        .json({ error: "orderName is required in the request body" });
    }

    // Update the order name in the database
    await pool.query(`
      UPDATE Order_Header
      SET ORDER_NAME = '${orderName}'
      WHERE ORDER_ID = '${orderId}';
    `);

    // Fetch the updated order details
    const updatedOrder = await fetchOrderById(orderId);

    // Log the updated order details
    console.log("Updated Order:", updatedOrder);

    if (updatedOrder[0].length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Transform the data to the specified format for the response
    const transformedOrder = transformToResponseFormat(updatedOrder);

    if (!transformedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(transformedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
