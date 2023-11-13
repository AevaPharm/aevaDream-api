const defaultProfileImage = {
    "image": {
      "mime": "image/jpeg",
      "data": "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"
    }
  }

  module.exports = defaultProfileImage