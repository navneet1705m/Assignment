const pool = require("../config/db.js");

exports.getOrders = async (req, res) => {
  try {
    const ordersData = await fetchOrdersData();
    const data = transformToNestedJSON(ordersData);
    res.json(data);
  } catch (error) {
    console.error("Error getting orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const transformToNestedJSON = (results) => {
  const orders = [];
  results[0].forEach((row) => {
    const order = orders.find((o) => o.orderId === row.orderId);
    if (!order) {
      const customerDetails = {
        customerPartyId: row.customerPartyId,
        firstName: row.firstName,
        middleName: row.middleName,
        lastName: row.lastName,
      };

      const orderPart = {
        orderPartSeqId: row.orderPartSeqId,
        partName: row.partName,
        facilityId: row.facilityId,
        shipmentMethodEnumId: row.shipmentMethodEnumId,
        partStatusId: row.partStatusId,
        partTotal: row.partTotal,
        itemDetails: [
          {
            orderItemSeqId: row.orderItemSeqId,
            productId: row.productId,
            itemDescription: row.itemDescription,
            quantity: row.quantity,
            unitAmount: row.unitAmount,
          },
        ],
      };

      orders.push({
        orderId: row.orderId,
        orderName: row.orderName,
        currencyUom: row.currencyUom,
        salesChannelEnumId: row.salesChannelEnumId,
        statusId: row.statusId,
        placedDate: row.placedDate,
        grandTotal: row.grandTotal,
        customerDetails,
        order_parts: [orderPart],
      });
    } else {
      const itemDetails = {
        orderItemSeqId: row.orderItemSeqId,
        productId: row.productId,
        itemDescription: row.itemDescription,
        quantity: row.quantity,
        unitAmount: row.unitAmount,
      };

      const existingOrderPart = order.order_parts.find(
        (op) => op.orderPartSeqId === row.orderPartSeqId
      );

      if (existingOrderPart) {
        existingOrderPart.item_details?.push(itemDetails);
      } else {
        const newOrderPart = {
          orderPartSeqId: row.orderPartSeqId,
          partName: row.partName,
          facilityId: row.facilityId,
          shipmentMethodEnumId: row.shipmentMethodEnumId,
          partStatusId: row.partStatusId,
          partTotal: row.partTotal,
          item_details: [itemDetails],
        };

        order.order_parts.push(newOrderPart);
      }
    }
  });
  console.log("Orders", orders);
  return { orders };
};
// Function to fetch orders data from the database
const fetchOrdersData = async () => {
  return await pool.query(`
  SELECT
  OH.ORDER_ID AS orderId,
  OH.ORDER_NAME AS orderName,
  OH.CURRENCY_UOM_ID AS currencyUom,
  OH.SALES_CHANNEL_ENUM_ID AS salesChannelEnumId,
  OH.STATUS_ID AS statusId,
  OH.PLACED_DATE AS placedDate,
  OH.GRAND_TOTAL AS grandTotal,
  P.PARTY_ID AS customerPartyId,
  P.FIRST_NAME AS firstName,
  P.MIDDLE_NAME AS middleName,
  P.LAST_NAME AS lastName,
  OP.ORDER_PART_SEQ_ID AS orderPartSeqId,
  OP.PART_NAME AS partName,
  OP.FACILITY_ID AS facilityId,
  OP.SHIPMENT_METHOD_ENUM_ID AS shipmentMethodEnumId,
  OP.STATUS_ID AS partStatusId,
  OP.PART_TOTAL AS partTotal,
  OI.ORDER_ITEM_SEQ_ID AS orderItemSeqId,
  OI.PRODUCT_ID AS productId,
  OI.ITEM_DESCRIPTION AS itemDescription,
  OI.QUANTITY AS quantity,
  OI.UNIT_AMOUNT AS unitAmount
FROM Order_Header OH
JOIN Order_Part OP ON OH.ORDER_ID = OP.ORDER_ID
JOIN Order_Item OI ON OP.ORDER_ID = OI.ORDER_ID 
JOIN Person P ON OP.CUSTOMER_PARTY_ID = P.PARTY_ID;

 `);
};
