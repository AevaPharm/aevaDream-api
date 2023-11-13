function errorHandler(err, req, res, next) {
    if (err.message) {
        return res.status(400).json({ error: err.message });
    } else if (err.error) {
        return res.status(400).json({ error: err.error });
    }
    return res.status(400).json({ error: 'An unexpected error occurred' });
}

module.exports = errorHandler
