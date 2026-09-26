function errorHandler(err, req, res, next) {
  console.error('⚠️ Server Error:', err);

  const status = err.status || 500;
  const message = err.message || 'An unexpected server error occurred. Please try again.';

  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = errorHandler;

