{
  "name": "Meme",
  "type": "object",
  "properties": {
    "generatedImageUrl": {
      "type": "string",
      "description": "The URL of the final generated meme image"
    },
    "dialect": {
      "type": "string",
      "enum": [
        "Vizag",
        "Nellore",
        "Karimnagar",
        "Rayalaseema",
        "Telangana",
        "Godavari",
        "Other"
      ],
      "description": "The Telugu dialect for the meme"
    },
    "upvotes": {
      "type": "number",
      "default": 0
 