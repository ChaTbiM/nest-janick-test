const bcrypt = require('bcrypt');

module.exports = {
    async up(db, client) {
      const users = [
        {
          email: 'user@email.com',
          password: "password",
          role: 'user',
        },
        {
          email: 'admin@email.com',
          password: "password",
          role: 'admin',
        },
      ];
  
      const hashedUsers = await Promise.all(
        users.map(async (user) => {
          const hashedPassword = await bcrypt.hash(user.password, 10);
          return { ...user, password: hashedPassword };
        })
      );
  
      await db.collection('users').insertMany(hashedUsers);
    },
  
    async down(db, client) {
      await db.collection('users').deleteMany({});
    },
  };