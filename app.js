require("dotenv").config();
const express = require("express");
const personRouter = require("./routes/personrouter");
const orderHeaderRouter = require("./routes/orderHeaderRouter");
const orderItemsRouter = require("./routes/orderItemRouter");
const orderRouter = require("./routes/orderRouter");
const singleOrderRouter = require("./routes/singleOrderRouter");
const updateOrderRouter = require("./routes/updateOrderRouter");


const app = express();
const PORT = 3000;
app.use(express.json());
//app.use(bodyParser.json());

app.use("/api", personRouter);
app.use("/api/orders", orderRouter);
app.use("/api/order", singleOrderRouter);
app.use("/api", orderItemsRouter);
app.use("/api", orderHeaderRouter);
app.use("/apiorders/updateOrder", updateOrderRouter);

app.listen(process.env.APP_PORT, () => {
  console.log("Server up and running on PORT:", process.env.APP_PORT);
});
