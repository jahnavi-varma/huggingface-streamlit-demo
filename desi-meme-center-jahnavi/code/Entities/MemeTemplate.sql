{
  "name": "MemeTemplate",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name of the meme template"
    },
    "imageUrl": {
      "type": "string",
      "description": "URL of the template image"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Tags for searching the template"
    }
  },
  "required": [
    "name",
    "imageUrl"
  ]
}