export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(err, req, res, next) {
  console.error('[NOVA Error Handler]:', err.message || err);

  // Handle duplicate key error from MySQL (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY' || err.message?.includes('ER_DUP_ENTRY')) {
    return res.status(409).json({
      success: false,
      message: 'A record with this information already exists.'
    });
  }

  // Handle foreign key constraint error from MySQL (ER_NO_REFERENCED_ROW)
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference: linked entity does not exist.'
    });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred. Please try again.'
  });
}
