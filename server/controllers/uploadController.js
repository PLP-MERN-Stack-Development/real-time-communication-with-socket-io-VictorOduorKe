const path = require('path')

exports.uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

  // Build absolute URL for the uploaded file
  const host = req.get('host')
  const protocol = req.protocol
  const url = `${protocol}://${host}/uploads/${req.file.filename}`

  res.status(201).json({ url, filename: req.file.filename })
}
