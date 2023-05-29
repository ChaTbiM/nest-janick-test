module.exports = {
    async up(db, client) {
      await db.createCollection('users', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['email', 'password', 'role'],
            properties: {
              email: {
                bsonType: 'string',
                description: 'must be a string and is required',
              },
              password: {
                bsonType: 'string',
                description: 'must be a string and is required',
              },
              role: {
                bsonType: 'string',
                enum: ['user', 'admin'],
                description: 'must be a string and is required',
              },
            },
          },
        },
      });
    },
  
    async down(db, client) {
      await db.collection('users').drop();
    },
  };