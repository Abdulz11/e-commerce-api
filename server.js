require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const storeRouter = require("./routes/storeRoutes");
const productRouter = require("./routes/productRoutes");
const userRouter = require("./routes/userRoutes");
const cookieParser = require("cookie-parser");
const { errorHandler } = require("./middleware/errorMiddleware");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/store", storeRouter);
app.use("/products", productRouter);
app.use("/user", userRouter);

app.get("/", (req, res) => {
  res.send("<h1>welcome to Shop and drop</h1>");
});

app.all("/:catchall", (req, res) => {
  res.send(`${req.url} does not exist`);
});

app.use(errorHandler);

app.listen(3000, () => {
  console.log(`server started on port 3000`);
});
