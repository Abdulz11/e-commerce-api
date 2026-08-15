export const errorHandler = (err, req, res, next) => {
  console.log(`error occurred when requesting ${req.url}`);
  console.log("error message printed", {
    message: err?.message,
    stack: err.stack,
  });
  res.status(500).json({
    message: `An error occurred while requesting ${req.url} \n ${err?.message}`,
  });
};
